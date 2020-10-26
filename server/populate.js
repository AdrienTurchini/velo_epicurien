const data_restau = require('./data/quebec_restaurants.json');
const data_pistes = require('./data/quebec_pistes_cyclables.json');

// Population de MongoDb
async function mongo(Restaurants) {
    await Restaurants.deleteMany({})
    .then(console.log(`Successfully deleted all items!`))
    .catch(err => console.error(`Failed to insert documents: ${err}`));
    
    await Restaurants.insertMany(data_restau)
    .then(result => { console.log(`Successfully inserted ${result.length} items!`);})
    .catch(err => console.error(`Failed to insert documents: ${err}`));
}

// Population de Neo4j
async function neo4j(Session) {
}

// Export 
module.exports = {
    mongo,
    neo4j
};