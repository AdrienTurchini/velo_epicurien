const app = require('express')();
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const populate = require('./populate.js');

// Connect to Neo4j daemon
const driver = neo4j.driver(
    'neo4j://localhost:7474',
    neo4j.auth.basic('neo4j', 'neo4j'))
const ne4jSession = driver.session();

// Connect to Mongo daemon
mongoose.connect(
    'mongodb://mongo:27017/expressmongo', { 
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
var restaurant_types;
const schema = new mongoose.Schema({}, {strict: false, versionKey: false, id: false}, 'movies');
const Restaurants = mongoose.model('restaurants', schema,'restaurants');

async function queryAndPop(Restaurants) {
    await populate.mongo(Restaurants);
    
    await Restaurants.find({})
    .then(restaurants =>  {
        nbRestaurants = restaurants.length;
    });

    await Restaurants.find({})
    .then(restaurants =>  {
        restaurant_types = restaurants;
    });
}
queryAndPop(Restaurants);

// Neo4j population && querys


// Get extracted_data route
app.get("/extracted_data", (req, res) => {
    res.send({
        nbRestaurants: nbRestaurants,
        nbSegments: 'a finir'
    });
});

// Get transformed_data route
app.get("/transformed_data", (req, res) => {
    res.send({
        restaurants: restaurant_types,
        longueurCyclable:'a finir'
    });
});

app.listen(3000, () => console.log('Express server running...'));