const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  doctorEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  licenseNumber: {
    type: String,
    default: ''
  },
  patientsCount: {
    type: Number,
    default: 0
  },
  reportsReviewed: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  joinDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema, 'doctor_profiles');
