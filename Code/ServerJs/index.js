const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = require('express')();


// connect to Mongo daemon
mongoose
    .connect(
        'mongodb://mongo:27017/expressmongo',
        { useNewUrlParser: true }
    )
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));


// DB schema
const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

//Post route
app.post('/item/add', (req, res) => {
    const newItem = new Item({
        name: req.body.name
    });
    newItem.save().then(item => res.redirect('/'));
});

//Get route
app.get("/", (req, res) => {
    Item.find((err, items) => {
        if (err) throw err;
        res.render("index", { items });
    });
});

Item = mongoose.model('item', ItemSchema);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) =>{
    res.send("it's working !")   
})

const port = 3000;
app.listen(port, () => console.log('Server running...'));