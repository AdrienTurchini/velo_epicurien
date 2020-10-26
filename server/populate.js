const data_restau = require('./data/quebec_restaurants.json');

// Population de MongoDb
const schema = new mongoose.Schema({
    name: String,
    classement: String,
    address: String,
    link: String,
    geometry: {
        type: String,
        coordinates: [
            Number,
            Number
        ]
    }
});
const restaurants = mongoose.model('restaurants', schema);
restaurants.collection.insert(data_restau)
.then(result => {
    console.log(`Successfully inserted ${result} items!`);
    return result;
}).catch(err => console.error(`Failed to insert documents: ${err}`));