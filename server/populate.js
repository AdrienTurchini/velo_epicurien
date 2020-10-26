const data_restau = require('./data/quebec_restaurants.json');

// Population de MongoDb
module.exports = async function (Restaurants) {
    await Restaurants.deleteMany({})
    .then(console.log(`Successfully deleted all items!`))
    .catch(err => console.error(`Failed to insert documents: ${err}`));
    
    await Restaurants.insertMany(data_restau)
    .then(result => { console.log(`Successfully inserted ${result.length} items!`);})
    .catch(err => console.error(`Failed to insert documents: ${err}`));
}