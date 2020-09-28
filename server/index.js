const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = require('express')();
const data_restau = require('./data/quebec_restaurants.json');
const assert = require('assert');

// Connect to Mongo daemon
mongoose.connect(
    'mongodb://mongo:27017/expressmongo',
    { 
        useNewUrlParser: true 
    }).then(() => console.log('MongoDB Connected')
    ).catch(err => console.log(err));

// Population de MongoDb
const schema = new mongoose.Schema({
    name: String,
    classement: String,
    address: String,
    link: String,
    geometry: String
});
const restaurants = mongoose.model('restaurants', schema);
restaurants.collection.insertMany(data_restau).then(result => {
    console.log(`Successfully inserted ${result.insertedIds.length} items!`);
    return result;
}).catch(err => console.error(`Failed to insert documents: ${err}`));

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

app.listen(3000, () => console.log('Server running...'));