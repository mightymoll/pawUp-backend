/** IMPORTS **/
const express = require('express');
const app = express();
// use body-parser middleware for POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
// use path module from express to create full path for file
const path = require('path');
// use ejs to render ejs files as 'views'
app.set('view engine', 'ejs');
// use methodOverride middleware for delete & update (PUT) requests
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
// use Bcrypt middleware for password encryption
const bcrypt = require('bcrypt');
// use dotenv to read .env file
require('dotenv').config();


/** CONNECTION to MongoDB using mongoose **/
const url = process.env.DATABASE_URL;
const mongoose = require('mongoose');
mongoose.connect(url)
  .then(console.log("MongoDB is connected 🔗"))
  .catch(err => console.log(err));

/** MODELS **/
const User = require('./models/User');

/** ROUTES **/
app.get('/', function (req, res) {
  res.render('Home');
});

// Inscription Page : form for user inscription
app.get('/inscription', function (req, res) {
  res.render('Inscription');
});

// POST request to add a new contact to DB
app.post('/api/signup', function (req, res) {
  // create a new instance of 'Contact' model
  const Data = new User({
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    email: req.body.email,
    // use bcrypt to encode passwords 10x before saving them to DB
    password: bcrypt.hashSync(req.body.password, 10),
  });
  // save User data to DB
  Data.save()
    // success
    .then(() => {
      console.log('user created 👤');
      res.redirect('/');
    })
    //error
    .catch(err => console.log(err));
});


// create server on localhost @ port 5001 (5000 is taken by default on mac)
const server = app.listen(5001, function (res, req) {
  console.log("Server is running on port : 5001 / serveur est lancé 🏃");
});