const { sign, verify } = require('jsonwebtoken');
// import dotenv from 'dotenv'
require('dotenv').config();

const createToken = (user) => {
  const accessToken = sign(
    // can put whatever user data you want to store in the token
    {
      // ._id because we're using mongoDB and it generates id as such
      id: user._id,
      email: user.email,
      // keep track of access on frontend
      access: user.access
    },
    //change to a real secret key w/dotenv (process.env.SECRET_KEY)
    process.env.SECRET_KEY
  )
  return accessToken;
}

// have to be in that order : req, res, next
const validateToken = (req, res, next) => {
  const accessToken = req.cookies["access-token"];
  if (!accessToken)
    return res.status(400).json({ error: "User not Authenticated!" });

  try {
    // add real secret key (stored in .env file)
    const validToken = verify(accessToken, process.env.SECRET_KEY);
    if (validToken) {
      req.authenticated = true;
      return next();
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

module.exports = { createToken, validateToken };