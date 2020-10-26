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

// Mongo population && querys
var nbRestaurants;
var restaurant_types = {};
const schema = new mongoose.Schema({}, {strict: false, versionKey: false, id: false}, 'movies');
const Restaurants = mongoose.model('restaurants', schema,'restaurants');

async function mongoQueryAndPop() {
    await populate.mongo(Restaurants);
    
    await Restaurants.find({})
    .then(restaurants =>  {
        nbRestaurants = restaurants.length;
    });

    var types = await Restaurants.aggregate([
        {$unwind:"$type"},
        {$group: {"_id": "$type", "total": {"$sum": 1}}},
        {$sort: {"total": -1, posts: 1}}
    ]);

    for(var i in types) {
        restaurant_types[types[i]._id] = types[i].total;
    }
};
mongoQueryAndPop();

// Mongo population && querys
var nbSegments;
var longueurCyclable;
async function neo4jQueryAndPop() {
    var session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    await populate.neo4j(session);

    session = driver.session({ defaultAccessMode: neo4j.session.READ });
    var readTxResultPromise = session.readTransaction(txc => {
        var result = txc.run(`MATCH (p:Piste) RETURN p.longueur`);
        return result;
    });
    readTxResultPromise.then(result => {
        longueurCyclable = 0;
        for(var i in result.records) {
            longueurCyclable += parseFloat(result.records[i]._fields[0]);
        }
        nbSegments = result.records.length;
    }).catch(error => {
        console.log(error);
    }).then(() => {
        session.close();
    });
}
neo4jQueryAndPop();

// Get extracted_data route
app.get("/extracted_data", (req, res) => {
    res.send({
        nbRestaurants: nbRestaurants,
        nbSegments: nbSegments
    });
});

// Get transformed_data route
app.get("/transformed_data", (req, res) => {
    res.send({
        restaurants: restaurant_types,
        longueurCyclable: longueurCyclable
    });
});

app.listen(3000, () => console.log('Express server running...'));