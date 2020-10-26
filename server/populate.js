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
    try {
        await session.run(
            `MATCH (n) DETACH DELETE n`
        );
        for(var i in data_pistes) {
            await session.run(
                `CREATE (p:Piste {id: ${data_pistes[i].properties.ID}}) ` +
                `SET p.longueur = ${data_pistes[i].properties.LONGUEUR} ` +
                `SET p.coords = [${data_pistes[i].geometry.coordinates}]`
            );
        }
    } finally {
        await session.close()
    }
}

// Export 
module.exports = {
    mongo,
    neo4j
};