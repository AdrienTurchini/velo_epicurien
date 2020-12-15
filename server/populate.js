const data_restau = require(`./data/quebec_restaurants.json`);
const data_pistes = require(`./data/quebec_pistes_cyclables.json`).features;


// Population de MongoDb
async function mongo(Restaurants) {
    await Restaurants.deleteMany({})
        .then(console.log(`Successfully deleted all items!`))
        .catch(err => console.error(`Failed to deleted documents: ${err}`));

    await Restaurants.insertMany(data_restau)
        .then(result => { console.log(`Successfully inserted ${result.length} items in mongodb database!`); })
        .catch(err => console.error(`Failed to insert documents into mongodb database: ${err}`));
}

// Population de Neo4j
async function neo4j(session) {
    try {
        await session.run(
            `MATCH (n) DETACH DELETE n`
        ).then(console.log(`Successfully deleted all items!`));
        console.log("PLEASE WAIT FOR NEO4J BEING POPULATED - IT CAN TAKES UP TO 2MIN BUT MIGHT BE SHORTER IF YOU ARE LUCKY ;)")
        var id = 0;
        for (var i in data_pistes) {
            /*
            await session.run(
                `CREATE (p:Piste {id: ${data_pistes[i].properties.ID}}) ` +
                `SET p.longueur = ${data_pistes[i].properties.LONGUEUR} ` +
                `SET p.coords = [${data_pistes[i].geometry.coordinates}]`
            );
            */
            var requete = 'CREATE'
            var link = '-[:LinkedTo]->'
            for (var j in data_pistes[i].geometry.coordinates) {
                requete = requete + `(:Point {coordinates: '${data_pistes[i].geometry.coordinates[j].toString()}', index:${id}})`;
                if (j != data_pistes[i].geometry.coordinates.length - 1) {
                    requete = requete + link;
                }
                id += 1;
            }
            await session.run(requete) 
        }
        requete2 = 'MATCH (a1:Point), (a2:Point) WHERE NOT (a1)-[:LinkedTo]->(a2) AND (a1 <> a2) AND a1.coordinates = a2.coordinates MERGE (a1)-[:LinkedTo]->(a2)' // lie les points aux même coordonnées entre eux
        await session.run(requete2)
        console.log("Successfully inserted items in the neo4j database");
    } catch {
        console.log("error when populating neo4j database");
    }

    finally {
        await session.close()
    }
}

// Export 
module.exports = {
    mongo,
    neo4j
};