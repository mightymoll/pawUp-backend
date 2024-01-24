const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  lastName: { type: 'string', required: true },
  firstName: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true },
  // control access rights of the user ('public', 'admin', or 'member')
  access: { type: 'string', required: true },
  // for 'member' or 'admin' profiles only
  phone: { type: 'string'}
});

module.exports = mongoose.model('User', userSchema);