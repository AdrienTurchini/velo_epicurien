const data_restau = require(`./data/quebec_restaurants.json`);
const data_pistes = require(`./data/quebec_pistes_cyclables.json`).features;

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
    await Session.run(
        `CALL apoc.load.json(${data_pistes}) ` +
        `YIELD value ` +
        `CREATE (p:Piste {properties: value.properties}) ` +
        `SET p.type = value.type ` +
        `SET p.geometry = value.geometry `
    );
    await Session.close();
}

// Export 
module.exports = {
    mongo,
    neo4j
};