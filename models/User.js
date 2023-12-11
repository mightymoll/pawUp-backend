const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  lastName: { type: 'string', required: true },
  firstName: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true },
  admin: { type: 'boolean' },
});

module.exports = mongoose.model('User', userSchema);