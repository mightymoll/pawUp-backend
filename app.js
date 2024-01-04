/** IMPORTS **/
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
require('dotenv').config();

/** CONNECTION to MongoDB using mongoose **/
var mongoose = require('mongoose');
const url = process.env.DATABASE_URL;
console.log(url);

mongoose.connect(url)
  .then(console.log("Mongo DB connected 🔗"))
  .catch(err => console.log(err));

/** CORS SETUP 
/* needed for use with JSON Web Token, provide access to frontend
/* localhost:3000 placed on 'whitelist' */
const cors = require('cors');
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

//** PUT et DELETE methods for Express
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//bcrypt : hashage for passwords
const bcrypt = require('bcrypt');

// for use with JSON Web Token, store token in cookies
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// import JWT
const { createTokens, validateToken } = require('./JWT');
// import jwt-decode for decoding token & providing access to frontend
const { jwtDecode } = require('jwt-decode')

/** MODELS **/
const User = require('./models/User');
const Animal = require('./models/Animal');
const Asso = require('./models/Asso');

/** ROUTES **/
const homePage = '/'

/* AUTHORISATION / AUTHENTICATION */
app.post('/api/adduser', function (req, res) {
  const Data = new User({
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
    access: 'public',
  })

  Data.save()
    .then(() => {
      console.log("User created in DB 👤");
      res.redirect(homePage);
    })
    .catch(err => { console.log(err); });
})

app.post('/login', function (req, res) {
  // see if user with email exists in DB
  User.findOne({ username: req.body.username })
    .then(user => {
      // if no user, return error
      if (!user) {
        return res.status(404).send('utilisateur introuvable');
      }
      // show user in console if found
      console.log(user)
      if (!bcrypt.compareSync(req.body.password, user.password)) {      //else password + email is not correct, show error message
        return res.status(404).send('Email ou mot de passe incorrect');
      }
      else {
        res.json('user logged-in, access : ' + user.access);
      }
    })
    .catch(err => console.log(err));
});

app.get('/logout', function (req, res) {
  res.clearCookie('access-token');
  console.log('User is logged out 🔒')
  res.redirect(homePage);
})


// provide access to JSON Web Token to frontend
app.get('/getJWT', (req, res) => {
  res.json(jwtDecode(req.cookies['access-token']));
});

app.get('/api/newest', function (req, res) {
  // render cards of newest 4 animals from DB
  Animal.find().sort({ "datetime": -1 }).limit(4)
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// Manage Animals Page : list of animals with add, edit and delete buttons
app.get('/manageAnimals', function (req, res) {
  Animal.find()
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
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
      res.redirect(homePage);
    })
    .catch(err => console.log(err));
});

// Edit Animal : form to edit an existing animal
app.get('/edit-animal/:id', function (req, res) {
  // get one contact matching id from url w/'params' and render in 'Edit' view
  Animal.findOne({ _id: req.params.id })
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// PUT request to update existing animal in DB
app.put('/api/update-animal/:id', function (req, res) {
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
    })
    .catch(err => console.log(err));
});

// DELETE existing animal from DB
app.delete('/api/delete-animal/:id', function (req, res) {
  Animal.deleteOne({ _id: req.params.id })
    .then(() => {
      console.log('animal deleted from DB 🗑️');
      res.redirect(homePage);
    })
    .catch(err => console.log(err));
});

// POST request to add a new Association to DB
app.post('/api/addAsso', function (req, res) {
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
      res.json('association added to DB ✨');
      res.redirect(homePage);
    })
    .catch(err => console.log(err));
});

// Manage Users Page : list of all users with access change and delete buttons
app.get('/manageUsers', function (req, res) {
  User.find()
    .then((data) => {
      res.json(data);
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
      res.json('user deleted from DB 🗑️');
    })
    .catch(err => console.log(err));
});

// create server on localhost @ port 5001 (5000 is taken by default on mac)
const server = app.listen(5000, function (res, req) {
  console.log("Server is running on port : 5000 / serveur est lancé 🏃");
});