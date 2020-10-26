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
async function neo4j(session) {
    const personName = 'Alice'

    try {
        const result = await session.run(
            'CREATE (a:Person {name: $name}) RETURN a',
            { name: personName }
        )
        const singleRecord = result.records[0]
        const node = singleRecord.get(0)   
        console.log(node.properties.name)
    } finally {
        await session.close()
    }
}

// Export 
module.exports = {
    mongo,
    neo4j
};