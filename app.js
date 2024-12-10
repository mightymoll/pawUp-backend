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

// Upload images
const multer = require('multer');
app.use(express.static('uploads'));

// Configure multer storage and file name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const filename = file.originalname.replace(/\s/g, '')
    cb(null, filename);
  }
});
// Create multer upload instance
const upload = multer({ storage })

/** Security **/

// toobusy : send message if server cannot handle # of requests being sent
const toobusy = require('toobusy-js');

app.use(function (req, res, next) {
  if (toobusy()) {
    res.status(503).send('Server is too busy')
  }
  else {
    next();
  }
})

// captcha: limit brute-force attacks by implementing capcha
const session = require('express-session')
const svgCaptcha = require('svg-captcha')

// initialize a session
app.use(session({
  secret: process.env.CAPTCHA_KEY,
  resave: false,
  saveUninitialized: true,
}))

// generate captcha @/captcha route
app.get('/captcha', (req, res) => {
  // define display options for captcha
  const options = {
    size: 6,
    noise: 1,
  }

  // generate a captcha image with svg-captcha
  const captcha = svgCaptcha.create(options);
  // store captcha value in session
  req.session.captcha = captcha.text;
  // send the captcha in response
  res.type('svg')
  res.status(200).send(captcha.data)
})

// block pollution of http parameters with hpp *remove if causing problems
const hpp = require('hpp');
app.use(hpp());

// modifying headers w/helmet *remove if causing problems
const helmet = require('helmet');
app.use(helmet());

// control/limit caching of data from DB with nocache
const nocache = require('nocache')
app.use(nocache())

// Documentation w/Swagger
const swaggerUI = require('swagger-ui-express');
const swaggerDocs = require('./swagger-output.json');
// create location/route to display docs
app.use('/apiDocumentation', swaggerUI.serve, swaggerUI.setup(swaggerDocs))

/** MODELS **/
const User = require('./models/User');
const Animal = require('./models/Animal');
const Asso = require('./models/Asso');

/** ROUTES **/
const homePage = process.env.FRONTEND_URL

/* UER AUTHORISATION / AUTHENTICATION */

app.post('/verifyCaptcha', function (req, res) {
  // verify captcha -> compare value in req.body to captcha value stored in req.session
  if (req.body.captcha !== req.session.captcha) {
    res.status(400).send('captcha incorrect')
  }
  else {
    res.status(200).send('captcha verified')
  }
})

app.post('/signup', function (req, res) {
  // hash password with bcrypt
  const hashedPwd = bcrypt.hashSync(req.body.password, 10);

  // create new instance of user
  const user = new User({
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    email: req.body.email,
    // hash password with bcrypt before saving
    password: hashedPwd,
    access: 'public',
  })
    // save new user in DB
    user.save()
      .then(() => {
        console.log("User created in DB 👤");
        res.status(200).send('User created');
      })
      .catch(err => {
        console.log(err)
        res.status(500).send('une erreur est servenue, veuillez essayer plus tard')
      });
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
  res.status(200);
  res.send('User is logged out');
})

// file uploading
app.post('/uploadimage', upload.single('image'), function (req, res) {
  if (!req.file) {
    res.status(400).send("No file uploaded!");
  }
  else {
    res.send("File uploaded!");
  }
})

app.post('/uploadmultiple', upload.array('images', 10), function (req, res) {
  if (!req.files || req.files.length === 0) {
    res.status(400).send("No files uploaded");
  }
  else {
    res.status(200).send("Files uploaded");
  }
});

// delete an image
app.delete('/delete-image/:name', function (req, res) {
  const fs = require("fs");
  const fileName = req.params.name;

  fs.unlink(`./uploads/` + fileName, (err) => {
    if (err) {
      res.status(500).send({ message: "Could not delete the file. " + err, });
    }
    res.status(200).send({ message: "File is deleted.", });
  });
});

// provide access to JSON Web Token to frontend
app.get('/getJwt', validateToken, (req, res) =>{
  res.json(jwtDecode(req.cookies["access-token"]))
});

app.get('/animals/newest', function (req, res) {
  // render cards of newest 4 animals from DB
  Animal.find().sort({ "datetime": -1 }).limit(4)
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// Manage Animals Page : list of animals with add, edit and delete buttons
app.get('/animals/all', function (req, res) {
  Animal.find()
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// POST request to add a new animal to DB
app.post('/addAnimal', function (req, res) {

  const Data = new Animal({
    numICAD: req.body.animal.numICAD,
    name: req.body.animal.name,
    sex: req.body.animal.sex,
    race: req.body.animal.race,
    birthDay: req.body.animal.birthDay,
    ageRange: req.body.animal.ageRange,
    desc_short: req.body.animal.desc_short,
    desc_long: req.body.animal.desc_long,
    images: req.body.images,
    status: req.body.animal.status
  })
  // save/add animal data to DB
  Data.save()
    .then(() => {
      console.log('animal added to DB 🐾');
      // status 200 = success, and message to show animal was updated
      res.status(200);
      res.send('animal modified');
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
  console.log(req.params.id);

  const Data = {
    numICAD: req.body.animal.numICAD,
    name: req.body.animal.name,
    sex: req.body.animal.sex,
    race: req.body.animal.race,
    birthDay: req.body.animal.birthDay,
    ageRange: req.body.animal.ageRange,
    desc_short: req.body.animal.desc_short,
    desc_long: req.body.animal.desc_long,
    images: req.body.images,
    status: req.body.animal.status
  }
  console.log(Data);

  Animal.updateOne({ _id: req.params.id }, { $set: Data })
    .then((result) => {
      console.log('animal updated in DB');
      // status 200 = success, and message to show animal was updated
      res.status(200);
      res.send('animal modified');
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
app.post('/addAsso', function (req, res) {
  const Data = new Asso({
    siret: req.body.siret,
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
  // save/add asso data to DB
  Data.save()
    .then(() => {
      console.log('association added to DB ✨');
      res.status(200);
      res.send('association registered');
    })
    .catch(err => console.log(err));
});

//get association data
app.get('/asso/:id', function (req, res) {
  // get one contact matching id from url w/'params' and render in 'Edit' view
  Asso.findOne({ _id: req.params.id })
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// PUT request to update existing association in DB
app.put('/update-asso/:id', function (req, res) {
  console.log(req.params.id);

  const Data = {
    siret: req.body.siret,
    name: req.body.name,
    tel: req.body.tel,
    email: req.body.email,
    loc_street: req.body.loc_street,
    loc_city: req.body.loc_city,
    loc_postal: req.body.loc_postal,
    soc_fb: req.body.soc_fb,
    soc_insta: req.body.soc_insta,
    soc_other: req.body.soc_other
  }
  console.log(Data);

  Asso.updateOne({ _id: req.params.id }, { $set: Data })
    .then((result) => {
      console.log('association updated in DB');
      // status 200 = success, and message to show association was updated
      res.status(200);
      res.send('association modified');
    })
    .catch(err => console.log(err));
});

// get all users 
app.get('/allUsers', function (req, res) {
  User.find()
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// get one user
app.get('/user/:id', function (req, res) {
  User.findOne({ _id: req.body.id })
    .then((data) => {
      res.json(data);
    })
    .catch(err => console.log(err));
});

// update User access on ManageUsers page
app.put('/update-user/:id', function (req, res) {
  console.log(req.body)
  const Data = {
    ...req.body,
    access: req.body.access,
  }
  console.log(Data);

  User.updateOne({ _id: req.params.id }, { $set: Data })
    .then((result) => {
      res.status(200);
      res.send('use access modified');
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


// send email from contact form
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  //authentication for sending email.
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use TLS
  // use env variables as credentials for the email server.
  auth: {
    user: process.env.SMTP_TO_EMAIL,
    pass: process.env.SMTP_TO_PASSWORD,
  },
});

// route to send an email
app.post("/sendMail", (req, res) => {
  mail = {
    sender: req.body.email,
    to: process.env.SMTP_TO_EMAIL,
    subject: req.body.subject,
    text: `
      from: ${req.body.name}
      email: ${req.body.email}
      message: ${req.body.message}`,
  }

  async function sendMail() {
    const info = await transporter.sendMail(mail)
    return info;
  };

  sendMail().then((info => {
    console.log(info)
    // message to use @frontend on success
    res.send('Votre message a été envoyé! Merci')
  })
  )
    .catch(err => {
      console.log(err)
      // message to use @frontend on failure/error
      res.send('Un erreur est survenue, veuillez réessayer plus tard')
    });
})

connectDB().then(() => {
  app.listen(port, function (res, req) {
    console.log("Server is running @ port : " + port + " / serveur est lancé 🏃");
  })
})

module.exports = app;