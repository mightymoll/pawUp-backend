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
const Animal = require('./models/Animal');
const Asso = require('./models/Asso');

/** ROUTES **/
app.get('/', function (req, res) {
  // render cards of newest 4 animals from DB
  Animal.find().sort({ "datetime": -1 }).limit(4)
    .then((data) => {
      res.render('Home', { animalData: data });
    })
    .catch(err => console.log(err));
});

// Inscription Page : form for user inscription
app.get('/inscription', function (req, res) {
  res.render('Inscription');
});

// POST request to add a new user to DB
app.post('/api/signup', function (req, res) {
  // create a new instance of 'User' model
  const Data = new User({
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    email: req.body.email,
    // use bcrypt to encode passwords 10x before saving them to DB
    password: bcrypt.hashSync(req.body.password, 10),
    access: 'public',
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

// Login Page : form for user connection
app.get('/login', function (req, res) {
  res.render('Connection');
});

app.post('/login', function (req, res) {
  // see if user with email exists in DB
  User.findOne({ email: req.body.email })
    .then(user => {
      // if no user, return error
      if (!user) {
        return res.status(404).send('utilisateur introuvable');
      }
      // show user in console if found
      console.log(user)
      // login if password is correct, show AddAnimal if user is admin
      if (!bcrypt.compareSync(req.body.password, user.password)) {      //else password + email is not correct, show error message
        return res.status(404).send('Email ou mot de passe incorrect');
      }
      else {
        if (user.admin == true) {
          // TO DO : create admin dashboard page
          res.redirect('/manageAnimals');
        }
        // TO DO : show user's saved animals list
        res.render('Home');
      }
    })
    //catch errors
    .catch(err => console.log(err));
});

// Manage Animals Page : list of animals with add, edit and delete buttons
app.get('/manageAnimals', function (req, res) {
  Animal.find()
    .then((data) => {
      res.render('ManageAnimals', { animalData: data });
    })
    .catch(err => console.log(err));
});

// AddAnimal Page : form to add a new animal to DB
app.get('/addAnimal', function (req, res) {
  res.render('AddAnimal');
});

// POST request to add a new animal to DB
app.post('/api/addAnimal', function (req, res) {
  const Data = new Animal({
    numICAD: req.body.numICAD,
    name: req.body.name,
    desc: req.body.desc,
    sex: req.body.sex,
    race: req.body.race,
    birthDay: req.body.birthDay,
  })
  // save/add animal data to DB
  Data.save()
    .then(() => {
      console.log('animal added to DB 🐾');
      res.redirect('/');
    })
    .catch(err => console.log(err));
});

// Edit Animal : form to edit an existing animal
app.get('/editAnimal/:id', function (req, res) {
  // get one contact matching id from url w/'params' and render in 'Edit' view
  Animal.findOne({ _id: req.params.id })
    .then((data) => {
      res.render('EditAnimal', { animal: data });
    })
    .catch(err => console.log(err));
});

// PUT request to update existing animal in DB
app.put('/update-animal/:id', function (req, res) {
  const Data = {
    numICAD: req.body.numICAD,
    name: req.body.name,
    desc: req.body.desc,
    sex: req.body.sex,
    race: req.body.race,
    birthDay: req.body.birthDay,
  }
  console.log(Data);

  Animal.updateOne({ _id: req.params.id }, { $set: Data })
    .then((result) => {
      console.log('animal updated in DB');
      res.redirect('/ManageAnimals');
    })
    .catch(err => console.log(err));
});

// DELETE existing animal from DB
app.delete('/delete-animal/:id', function (req, res) {
  Animal.deleteOne({ _id: req.params.id })
    .then(() => {
      console.log('animal deleted from DB 🗑️');
      res.redirect('/ManageAnimals');
    })
    .catch(err => console.log(err));
});

// AddAsso Page : form to add a new association to DB
app.get('/addAsso', function (req, res) {
  res.render('AddAsso');
});

// POST request to add a new Association to DB
app.post('/api/newAsso', function (req, res) {
  const Data = new Asso({
    name: req.body.name,
    tel: req.body.tel,
    email: req.body.email,
    loc_street: req.body.loc_street,
    loc_city: req.body.loc_city,
    loc_postal: req.body.loc_postal,
    soc_fb: req.body.soc_fb,
    soc_insta: req.body.soc_insta,
    soc_other: req.body.soc_other
  })
  // save/add animal data to DB
  Data.save()
    .then(() => {
      console.log('association added to DB ✨');
      res.redirect('/');
    })
    .catch(err => console.log(err));
});

// Manage Users Page : list of all users with access change and delete buttons
app.get('/manageUsers', function (req, res) {
  User.find()
    .then((data) => {
      res.render('ManageUsers', { userData: data });
    })
    .catch(err => console.log(err));
});

// update User access on ManageUsers page
app.put('/update-user/:id', function (req, res) {
  const Data = {
    access: req.body.access,
  }
  console.log(Data);

  User.updateOne({ _id: req.params.id }, { $set: Data })
    .then((result) => {
      console.log("user's access updated in DB");
      res.redirect('/ManageUsers');
    })
    .catch(err => console.log(err));
});

app.delete('/delete-user/:id', function (req, res) {
  User.deleteOne({ _id: req.params.id })
    .then(() => {
      console.log('user deleted from DB 🗑️');
      res.redirect('/ManageUsers');
    })
    .catch(err => console.log(err));
});

// create server on localhost @ port 5001 (5000 is taken by default on mac)
const server = app.listen(5001, function (res, req) {
  console.log("Server is running on port : 5001 / serveur est lancé 🏃");
});