/** IMPORTS **/
const express = require("express");
const bodyParser = require("body-parser");
//bcrypt : hashage for passwords
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
// import variables from .env file
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT;

// Add Access Control Allow Origin headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});


// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/** CONNECTION to MongoDB using mongoose **/
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

// async connection to MongoDB
const connectDB = async () => {
  try {
    mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Mongo DB connected 🔗');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

//** PUT et DELETE methods for Express
const methodOverride = require('method-override');
app.use(methodOverride('_method'));


// for use with JSON Web Token, store token in cookies
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// import JWT
const { createToken, validateToken } = require('./JWT');

//Import jwt decode
const { jwtDecode } = require('jwt-decode');


/** MODELS **/
const User = require('./models/User');
const Animal = require('./models/Animal');
const Asso = require('./models/Asso');

/** ROUTES **/
const homePage = process.env.FRONTEND_URL

app.get('/', validateToken, function (req, res) {
  // get all user data for testing
  User.find()
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
})

/* AUTHORISATION / AUTHENTICATION */
app.post('/signup', function (req, res) {
    // create new instance of user
  const user = new User({
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    email: req.body.email,
    // hash password with bcrypt before saving
    password: bcrypt.hashSync(req.body.password, 10),
    access: 'public',
  })


  console.log(user);
  // save new user in DB
  user.save()
    .then(() => {
      console.log("User created in DB 👤");
      res.redirect(homePage);
    })
    .catch(err => console.log(err));
})

// User : data for a single user
app.get('/user/:id', function (req, res) {
  // get one contact matching id from url w/'params' and render in 'Edit' view
  User.findOne({ _id: req.params.id })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      res.status(404).json({ err: err });
    });
});

app.post('/login', function (req, res) {
  // see if user with email exists in DB
  User.findOne({ email: req.body.email })
    .then((user) => {
      // if no user, return not found
      if (!user) return res.status(400).send("User not found");

      //Check if password entered is correct
      if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.status(400).send("User's email / password does not match");
      }

      // USER IS VERIFIED : 
      //create the jwt token 
      const token = createToken(user);

      // send the token as browser cookie
      res.cookie("access-token", token, {
        httpOnly: false,
        secure: true,
        // sameSite : none needed to store cookie in dev over http
        sameSite: "none",
      })
      // status 200 = success, and message to show user is logged in 
      res.status(200);
      res.send('user logged in');
    })
})

app.get('/logout', function (req, res) {
  res.clearCookie('access-token');
  console.log('User is logged out 🔒')
  res.redirect(homePage);
})

// provide access to JSON Web Token to frontend
app.get('/getJwt', validateToken, (req, res) =>{
  res.json(jwtDecode(req.cookies["access-token"]))
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
app.get('/allAnimals', function (req, res) {
  Animal.find()
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// POST request to add a new animal to DB
app.post('/addAnimal', function (req, res) {
  const Data = new Animal({
    numICAD: req.body.numICAD,
    name: req.body.name,
    sex: req.body.sex,
    race: req.body.race,
    birthDay: req.body.birthDay,
    desc_short: req.body.desc_short,
    desc_long: req.body.desc_long,
  })
  // save/add animal data to DB
  Data.save()
    .then(() => {
      console.log('animal added to DB 🐾');
      res.redirect(homePage + '/admin');
    })
    .catch(err => console.log(err));
});

// Edit Animal : form to edit an existing animal
app.get('/animal/:id', function (req, res) {
  // get one contact matching id from url w/'params' and render in 'Edit' view
  Animal.findOne({ _id: req.params.id })
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// PUT request to update existing animal in DB
app.put('/update-animal/:id', function (req, res) {
  const Data = {
    _id: req.params.id,
    numICAD: req.body.numICAD,
    name: req.body.name,
    sex: req.body.sex,
    race: req.body.race,
    birthDay: req.body.birthDay,
    desc_short: req.body.desc_short,
    desc_long: req.body.desc_long,
  }
  console.log(Data);

  Animal.updateOne({ _id: req.params.id }, { $set: Data })
    .then((result) => {
      console.log('animal updated in DB');
    })
    .catch(err => console.log(err));
});

// DELETE existing animal from DB
app.delete('/delete-animal/:id', function (req, res) {
  Animal.deleteOne({ _id: req.params.id })
    .then(() => {
      console.log('animal deleted from DB 🗑️');
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

connectDB().then(() => {
  app.listen(port, function (res, req) {
    console.log("Server is running @ port : " + port + " / serveur est lancé 🏃");
  })
})

module.exports = app;