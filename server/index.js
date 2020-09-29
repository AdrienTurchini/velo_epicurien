const app = require('express')();
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');

// Connect to Neo4j daemon
var driver = neo4j.driver(
    'neo4j://localhost:7474',
    neo4j.auth.basic('neo4j', 'neo4j'))

// Connect to Mongo daemon
mongoose.connect(
    'mongodb://mongo:27017/expressmongo', { 
        useNewUrlParser: true 
    })
    .then(() => console.log('MongoDB Connected !'))
    .catch(err => console.log(err));

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