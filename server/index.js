const app = require('express')();
const mongoose = require('mongoose');
const { Client } = require("@elastic/elasticsearch");

// Connect to Elasticsearch daemon
const elasticUrl = process.env.ELASTIC_URL || "http://localhost:9200";
const esclient   = new Client({ node: elasticUrl });

// Connect to Mongo daemon
mongoose.connect(
    'mongodb://mongo:27017/expressmongo',
    { 
        useNewUrlParser: true 
    }).then(() => console.log('MongoDB Connected')
).catch(err => console.log(err));

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