const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  lastName: { type: 'string', required: true },
  firstName: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true },
  // control access rights of the user
  access: { type: 'string', required: true },
});

module.exports = mongoose.model('User', userSchema);