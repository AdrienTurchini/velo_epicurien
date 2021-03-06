const app = require('express')();
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const populate = require('./populate.js');

// Connect to Neo4j daemon
var driver = neo4j.driver(
    'bolt://neo4j:7687'
);

// Connect to Mongo daemon
mongoose.connect(
    'mongodb://mongo:27017', {
    useNewUrlParser: true
})
    .then(() => console.log('MongoDB Connected !'))
    .catch(err => console.log(err));

////// MONGO ///////
const schema = new mongoose.Schema({}, { strict: false, versionKey: false, id: false }, 'restaurants');
const Restaurants = mongoose.model('restaurants', schema, 'restaurants');

// populate
async function mongoPopulate() {
    await populate.mongo(Restaurants);
};

// get nb of restaurants
var nbRestaurants;
async function mongoNbRestaurants() {
    await Restaurants.find({}).count()
        .then(result => {
            nbRestaurants = result;
        });
}

// get nb of restaurants for types
var restaurant_types = {};
async function mongoNbRestaurantsForTypes() {
    var types = await Restaurants.aggregate([
        { $unwind: "$type" },
        { $group: { "_id": "$type", "total": { "$sum": 1 } } },
        { $sort: { "total": -1, posts: 1 } }
    ]);
    for (var i in types) {
        restaurant_types[types[i]._id] = types[i].total;
    }
}

// get restaurants for types
var types = [];
async function mongoRestaurantsTypes() {
    var type = await Restaurants.aggregate([
        { $unwind: "$type" },
        { $group: { "_id": "$type" } },
    ]);
    for (var i in type) {
        types.push(type[i]._id);
    }
}

var trajet = [];
async function mongoStartingPoint() {
    var restau = await Restaurants.aggregate([{ $sample: { size: 1 } }]);
    trajet.push(restau[0])
    long = restau[0].geometry.coordinates[0].toString()
    lat = restau[0].geometry.coordinates[1].toString()

    //geo = restau.geometry
    console.log(trajet[0].geometry.coordinates)
}

////// NEO4J //////
//populate
async function neo4jPopulate() {
    var session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    await populate.neo4j(session);
    session.close();
};

// get nb of roads and total length
var nbSegments;
var longueurCyclable = 0;

async function neo4jNbSegments() {
    const nbSeg = 'MATCH (a1)-[]->(a2) RETURN count(*)'

    var session = driver.session({ defaultAccessMode: neo4j.session.READ });
    await session.readTransaction(txc => {
        var result = txc.run(nbSeg);
        return result;
    }).then(result => {
        nbSegments = result.records[0]._fields[0].low;
    }).catch(err => {
        console.log(err);
    }).then(() => {
        session.close();
    })
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

async function neo4jLongueurPistes() {
    const get_coord = 'match (n1)-[]->(n2) return n1.coordinates, n2.coordinates';

    var session = driver.session({ defaultAccessMode: neo4j.session.READ });
    await session.readTransaction(txc => {
        var result = txc.run(get_coord);
        return result;
    }).then(result => {
        longueurCyclable = 0
        nbSegments = result.records.length
        for (var i = 0; i < nbSegments; i++) {
            point_a = result.records[i]._fields[0].split(",");
            point_b = result.records[i]._fields[1].split(",");
            var lon1 = parseFloat(point_a[0]);
            var lat1 = parseFloat(point_a[1]);
            var lon2 = parseFloat(point_b[0]);
            var lat2 = parseFloat(point_b[1]);
            var dist = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
            longueurCyclable = longueurCyclable + dist;
        }
    }).catch(err => {
        console.log(err);
    }).then(() => {
        session.close();
    })
}

var startingPoints = [];
async function neo4jGetAllStartingPoints() {
    const getStartP = 'MATCH (n:Point) WHERE size((n)--()) = 1 RETURN n';
    var session = driver.session({ defaultAccessMode: neo4j.session.READ });
    await session.readTransaction(txc => {
        var result = txc.run(getStartP);
        return result;
    }).then(result => {

        for (var i = 0; i < result.records.length; i++) {
            startingPoints.push(result.records[i]._fields[0].identity.low)
        }
    }).catch(err => {
        console.log(err);
    }).then(() => {
        session.close();
    })
}

var parcours = []
async function neo4jGetAllParcours(){
    await neo4jGetAllStartingPoints()
    console.log(startingPoints)
    var requetes = []
    for (var i = 0; i < 1; i++) // startingPoints.length
    {
        for (var j = i + 1; j < startingPoints.length; j++){ 
            var req =  "MATCH (a:Point),(b:Point), p = shortestPath((a)-[*]-(b)) where id(a) = " + startingPoints[i] + " and id(b) = " + startingPoints[j] + " RETURN p"
            requetes.push(req)
        }
    }
    console.log(requetes);
    var session = driver.session({ defaultAccessMode: neo4j.session.READ });
    const reqLength = requetes.length;
    for(var i = 0; i < reqLength; i++){
        console.log(i / reqLength);
        un_parcours = []
        await session.readTransaction(txc => {
            var result = txc.run(requetes[i]);
            return result;
        }).then(result => {
            startPoint = result.records[0]._fields[0].start.properties.coordinates
            un_parcours.push(startPoint);
            stopPoint = result.records[0]._fields[0].end.properties.coordinates
            for(var i = 0; i < result.records[0]._fields[0].segments.length; i++){
                un_parcours.push(result.records[0]._fields[0].segments[i].start.properties.coordinates);
            }
            un_parcours.push(stopPoint)
            parcours.push(un_parcours)    
        }).catch(err => {
            console.log(err);
        })
    }
    session.close()
    console.log(parcours.length)
}


// add 10sec to let neo4j start
function delayAll() {
    setTimeout(() => {
        Restaurants.count().then(result => {
            if (result == 0) {
                pop();
            }
        });
    }, 10000)
};
delayAll();

async function pop() {
    await neo4jPopulate();
    await mongoPopulate();
};

// Get index.html route
app.get('/', function (req, res) {
    res.sendFile('/index.html', {
        root: './views'
    });
});

// Get Readme.md route
const md = require('markdown-it')();
const fs = require('fs');
app.get('/readme', function (req, res) {
    fs.readFile('./markdown/README.md', 'utf8', (err, data) => {
        var result = md.render(data);
        res.send(result);
    });
});

// Get heartbeat route
app.get("/heartbeat", function (req, res) {
    res.json({
        villeChoisie: "Quebec"
    });
});

// Get extracted_data route
app.get("/extracted_data", async function (req, res) {
    await neo4jNbSegments();
    await mongoNbRestaurants();
    res.json({
        nbRestaurants: nbRestaurants,
        nbSegments: nbSegments
    });
});

// Get transformed_data route
app.get("/transformed_data", async (req, res) => {
    await neo4jLongueurPistes();
    await mongoNbRestaurantsForTypes();
    res.json({
        restaurants: restaurant_types,
        longueurCyclable: longueurCyclable
    });
});

// Get transformed_data route
app.get("/type", async function (req, res) {
    await mongoRestaurantsTypes();
    res.json(
        types
    );
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.get('/starting_point', (req, res) => {
    var type = red.body.type;
    var maximumLength = req.body.maximumLength;
    res.json(
        req.body
    );
})

app.get('/parcour', (req, res) => {
    res.json({});
})

app.listen(3000, () => console.log('Express server running...'));