/** IMPORTS **/
const express = require('express');
const app = express();
app.use(express.json())

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())


/** CORS SETUP 
/* needed for use with JSON Web Token, provide access to frontend
/* localhost:3000 placed on 'whitelist' */
const cors = require('cors');
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL }));

// for use with JSON Web Token, store token in cookies
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// import JWT
const { createToken, validateToken } = require('./JWT');

//Import jwt decode
const { jwtDecode } = require('jwt-decode');

//bcrypt : hashage for passwords
const bcrypt = require('bcrypt');

//** PUT et DELETE methods for Express
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

require('dotenv').config();

/** CONNECTION to MongoDB using mongoose **/
var mongoose = require('mongoose');
const url = process.env.DATABASE_URL;
console.log(url);

// async connection to MongoDB
mongoose.set('strictQuery', false)

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Mongo DB connected 🔗: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}


/** MODELS **/
const User = require('./models/User');
const Animal = require('./models/Animal');
const Asso = require('./models/Asso');

/** ROUTES **/
const homePage = process.env.FRONTEND_URL

app.get('/', function (req, res) {
  // get all user data for testing
  User.find()
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
})

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
      res.status(201).json({ result: 'success' })
    })
    .catch((err) => {
      res.status(500).json({ err: err });
    })
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
  User.findOne({ username: req.body.username })
    .then(user => {
      if(!user){
        return res.status(404).send("No user found");
      }

      if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.status(403).send("Invalid password or username");
      }

      const accessToken = createToken(user)
      res.cookie("access-token", accessToken, {
          maxAge: 1000 * 60 * 60 * 24 * 30, //30 jours en ms
          httpOnly: true
      })

      res.redirect(process.env.FRONTEND_URL);
    })
    .catch(err =>{console.log(err);});
});

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
app.get('/animal/:id', function (req, res) {
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


connectDB().then(() => {
  app.listen(5000, function (res, req) {
    console.log("Server is ready for requests / serveur est lancé 🏃");
  })
})

module.exports = app;