const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  age: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: ''
  },
  bloodType: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: ''
  },
  weight: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  medicalConditions: {
    type: [String],
    default: []
  },
  allergies: {
    type: [String],
    default: []
  },
  medications: {
    type: [String],
    default: []
  },
  unitPreference: {
    type: String,
    default: 'metric'
  }
});

module.exports = mongoose.model('Profile', profileSchema);
