const data_restau = require(`./data/quebec_restaurants.json`);
const data_pistes = require(`./data/quebec_pistes_cyclables.json`).features;


// Population de MongoDb
async function mongo(Restaurants) {
    await Restaurants.deleteMany({})
    .then(console.log(`Successfully deleted all items!`))
    .catch(err => console.error(`Failed to deleted documents: ${err}`));
    
    await Restaurants.insertMany(data_restau)
    .then(result => { console.log(`Successfully inserted ${result.length} items in mongodb database!`);})
    .catch(err => console.error(`Failed to insert documents into mongodb database: ${err}`));
}

/*
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }
  */

// Population de Neo4j
async function neo4j(session) {
    try {
        await session.run(
            `MATCH (n) DETACH DELETE n`
        ).then(console.log(`Successfully deleted all items!`));
        
            
        /*
        coord = []
        for(var i in data_pistes){
            for(var j in data_pistes[i].geometry.coordinates){
                coord.push(data_pistes[i].geometry.coordinates[j])
            }
        }
        */

        console.log(data_pistes[0])
        for(var i in data_pistes) {
            /*
            await session.run(
                `CREATE (p:Piste {id: ${data_pistes[i].properties.ID}}) ` +
                `SET p.longueur = ${data_pistes[i].properties.LONGUEUR} ` +
                `SET p.coords = [${data_pistes[i].geometry.coordinates}]`
            );
            */

            var requete = 'CREATE'
            var link = '-[:LinkedTo]->'
            for(var j in data_pistes[i].geometry.coordinates) {
                console.log(data_pistes[i].geometry.coordinates)
                requete = requete + '(:Point {coordinates: \'' + data_pistes[i].geometry.coordinates[j].toString() + '\'})';
                if(j != data_pistes[i].geometry.coordinates.length -1){
                    requete = requete + link;
                }
            }
            await session.run(requete)
        }

        /*
        nbPoints = coord.length;
        for(var i in coord){
            console.log(i/nbPoints)
            for(var j in coord){
                if(coord[i] == coord[j]){
                    requete2 = 'MATCH (p1:Point {coordinates: \'' + coord[i].toString() + '\'}) MATCH (p2:Point {coordinates: \'' + coord[j].toString() + '\'}) MERGE (p1)-[:LinkedTo]->(p2)';
                    await session.run(requete2)
                }
            }
        }

        */
        
/*
        for(var i in coord){
            console.log("-----------------------------" + i + "/" + coord.length)
            for(var j in coord){
                if(i != j){
                    lat1 = coord[i][0];
                    //console.log(lat1)
                    lon1 = coord[i][1];
                    //console.log(lon1)

                    lat2 = coord[j][0];
                    //console.log(lat2)

                    lon2 = coord[j][1];
                    //console.log(lon2)

                    dist = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)
                    if(dist < 0.01 && dist != 0){
                        //console.log(dist)
                        requete2 = 'MATCH (p1:Point {coordinates: \'' + coord[i].toString() + '\'}) MATCH (p2:Point {coordinates: \'' + coord[j].toString() + '\'}) MERGE (p1)-[:LinkedTo]->(p2)';
                        await session.run(requete2)
                    }
                }
            }
        }
        */

        
        
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