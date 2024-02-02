const mongoose = require('mongoose');

const animalSchema = mongoose.Schema({
  numICAD: { type: 'string', unique: true },
  name: { type: 'string', required: true },
  sex: { type: 'string', required: true },
  race: { type: 'string' },
  birthDay: { type: 'date' },
  desc_short: { type: 'string' },
  desc_long: { type: 'string' },
});

module.exports = mongoose.model('Animal', animalSchema);