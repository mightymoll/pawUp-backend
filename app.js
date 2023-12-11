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


/** ROUTES **/
app.get('/', function (req, res) {
  res.render('Home');
});

// create server on localhost @ port 5001 (5000 is taken by default on mac)
const server = app.listen(5001, function (res, req) {
  console.log("Server is running on port : 5001 / serveur est lancé 🏃");
});