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

// Get index.html route
app.get('/',function(req,res) {
    res.sendFile('/index.html', {
        root: './views'
    });
});

// Get heartbeat route
app.get("/heartbeat", (req, res) => {
    res.send({
        villeChoisie: "Quebec"
    });
});

////// MONGO ///////
const schema = new mongoose.Schema({}, {strict: false, versionKey: false, id: false}, 'movies');
const Restaurants = mongoose.model('restaurants', schema,'restaurants');

// populate
async function mongoPopulate() {
    await populate.mongo(Restaurants);
};
mongoPopulate();

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


////// NEO4J //////

//populate
async function neo4jPopulate() {
    var session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    await populate.neo4j(session);
    session.close();
};

// add 7sec to let neo4j start
function delayNeo4jPopulation() {
    setTimeout(() => {neo4jPopulate()}, 10000)};
    delayNeo4jPopulation();

// get nb of roads and total length
var nbSegments;
var longueurCyclable;
async function neo4jLongueurPistes(extracted_data) {
    var session = driver.session({ defaultAccessMode: neo4j.session.READ });
    const requete = 'MATCH (p:Piste) RETURN p.longueur';
    var readResultPromise = session.readTransaction(txc => {
        var result = txc.run(requete);
        return result;
    });
    readResultPromise.then(result => {
        if(extracted_data == true){
            nbSegments = result.records.length;
        }
        else {
            longueurCyclable = 0;
            for(var i in result.records){
                longueurCyclable += parseFloat(result.records[i]._fields[0]);
            }
            
        }
    }).catch(err => {
        console.log(err);
    }).then(() => {
        session.close();
    })
};

// Get extracted_data route
app.get("/extracted_data", (req, res) => {
    neo4jLongueurPistes(true).then(() => {
        mongoNbRestaurants().then(() => {
            res.send({
                nbRestaurants: nbRestaurants,
                nbSegments: nbSegments
            });
        })
    });
    
    
        
});

// Get transformed_data route
app.get("/transformed_data", (req, res) => {
    neo4jLongueurPistes(false).then(() => {
        mongoNbRestaurantsForTypes().then(() => {
            res.send({
        restaurants: restaurant_types,
        longueurCyclable: longueurCyclable
        });
    })
});
        

    
});

app.listen(3000, () => console.log('Express server running...'));