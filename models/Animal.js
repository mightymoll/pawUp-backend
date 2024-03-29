const mongoose = require('mongoose');

const animalSchema = mongoose.Schema({
  numICAD: { type: 'string', unique: true, sparse: true },
  name: { type: 'string', required: true },
  sex: { type: 'string', required: true },
  race: { type: 'string' },
  birthDay: { type: 'date' },
  ageRange: { type: 'string' },
  desc_short: { type: 'string' },
  desc_long: { type: 'string' },
  images: { type: 'array' },
  status: { type: 'string' }
});

module.exports = mongoose.model('Animal', animalSchema);