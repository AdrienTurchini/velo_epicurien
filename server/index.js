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
const schema = new mongoose.Schema({}, {strict: false, versionKey: false, id: false}, 'restaurants');
const Restaurants = mongoose.model('restaurants', schema,'restaurants');

// populate
async function mongoPopulate() {
    await populate.mongo(Restaurants);
};

async function isMongoNotPopulate() {
    if (Restaurants.find({}).count() == 0) return true;
    return false;
}

// get nb of restaurants
var nbRestaurants;
async function mongoNbRestaurants() {
    await Restaurants.find({}).count()
    .then(result =>  {
        nbRestaurants = result;
    });
}

// get nb of restaurants for types
var restaurant_types = {};
async function mongoNbRestaurantsForTypes() {
    var types = await Restaurants.aggregate([
        {$unwind:"$type"},
        {$group: {"_id": "$type", "total": {"$sum": 1}}},
        {$sort: {"total": -1, posts: 1}}
    ]);
    for(var i in types) {
        restaurant_types[types[i]._id] = types[i].total;
    }
}

// get restaurants for types
var types = [];
async function mongoRestaurantsTypes() {
    var type = await Restaurants.aggregate([
        {$unwind:"$type"},
        {$group: {"_id": "$type"}},
    ]);
    for(var i in type) {
        types.push(type[i]._id);
    }
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
var longueurCyclable;
async function neo4jLongueurPistes() {
    var session = driver.session({ defaultAccessMode: neo4j.session.READ });
    const requete = 'MATCH (p:Piste) RETURN p.longueur';
    await session.readTransaction(txc => {
        var result = txc.run(requete);
        return result;
    }).then(result => {
        nbSegments = result.records.length;
        longueurCyclable = 0;
        for(var i in result.records){
            longueurCyclable += parseFloat(result.records[i]._fields[0]);
        }
    }).catch(err => {
        console.log(err);
    }).then(() => {
        session.close();
    })
};

// add 10sec to let neo4j start
function delayAll() {
    setTimeout(() => {
        if (isMongoNotPopulate()) {
            pop();
        };
    }, 10000)};
delayAll();

async function pop() {
    await neo4jPopulate();
    await mongoPopulate();

};

// Get index.html route
app.get('/',function(req,res) {
    res.sendFile('/index.html', {
        root: './views'
    });
});

// Get index.html route
app.get('/readme',function(req,res) {
    res.sendFile('../README.md');
});

// Get heartbeat route
app.get("/heartbeat", (req, res) => {
    res.json({
        villeChoisie: "Quebec"
    });
});

// Get extracted_data route
app.get("/extracted_data", async (req, res) => {
    await mongoNbRestaurants();
    await neo4jLongueurPistes();
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
app.get("/type", async (req, res) => {
    await mongoRestaurantsTypes();
    res.json(
        types
    );
});

app.listen(3000, () => console.log('Express server running...'));