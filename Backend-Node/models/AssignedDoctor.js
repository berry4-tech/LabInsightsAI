const mongoose = require('mongoose');

const assignedDoctorSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  doctorEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  }
});

module.exports = mongoose.model('AssignedDoctor', assignedDoctorSchema, 'assigned_doctors');
