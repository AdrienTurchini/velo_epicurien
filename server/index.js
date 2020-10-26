const app = require('express')();
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const populate = require('./populate.js');

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

async function mongoQueryAndPop(Restaurants) {
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
mongoQueryAndPop(Restaurants);


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