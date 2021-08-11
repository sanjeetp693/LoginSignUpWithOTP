const express = require('express');
const bodyParser = require('body-parser');
const dbConfig = require('./config/database.config');
const mongoose = require('mongoose');
require("dotenv").config();


// create express app
const app = express();


// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// Connecting database
// mongoose.Promise = global.Promise;
// mongoose.connect(dbConfig.url, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => {
//     console.log("Successfully connected to the database");    
// }).catch(err => {
//     console.log('Could not connect to the database. Exiting now...', err);
//     process.exit();
// });

// Atlas connection
const url = `mongodb+srv://Sanjeet10:KWT7Rv9Z4VtCjJJc@cluster0.1mqb4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })

    
// define a simple route
app.get('/', (req, res) => {
    res.json({"message": "Welcome to EasyNotes application. Take notes quickly. Organize and keep track of all your notes."});
});

// Require Notes routes
require('./app/routes/user.route.js')(app);

// listen for requests
app.listen(8000, () => {
    console.log("Server is listening on port 8000");
});