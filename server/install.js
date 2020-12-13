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

////// NEO4J //////
async function neo4jPopulate() {
    var session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    await populate.neo4j(session);
    session.close();
};

// add 10sec to let neo4j start
function delayAll() {
    setTimeout(() => {popAll()}, 10000)};
delayAll();

async function popAll() {
    await populate.mongo(Restaurants)();
    await neo4jPopulate();
}