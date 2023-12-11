const mongoose = require('mongoose');

const animalSchema = mongoose.Schema({
  numICAD: { type: 'string' },
  name: { type: 'string', required: true },
  desc: { type: 'string' },
  sex: { type: 'string' },
  race: { type: 'string' },
  birthDay: { type: 'date' },
});

module.exports = mongoose.model('Animal', animalSchema);