const mongoose = require('mongoose');

const assoSchema = mongoose.Schema({
  name: { type: 'string', required: true },
  tel: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  loc_street: { type: 'string' },
  loc_city: { type: 'string' },
  loc_postal: { type: 'string' },
  soc_fb: { type: 'string' },
  soc_insta: { type: 'string' },
  soc_other: { type: 'string' },
});

module.exports = mongoose.model('Asso', assoSchema);