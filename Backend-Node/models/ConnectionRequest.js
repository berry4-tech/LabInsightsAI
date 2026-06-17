const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  doctorId: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    default: 'Unknown'
  },
  patientEmail: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    default: 'N/A'
  },
  message: {
    type: String,
    default: ''
  },
  reportsCount: {
    type: Number,
    default: 0
  },
  requestDate: {
    type: String,
    default: () => new Date().toISOString()
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  rejectionMessage: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema, 'connection_requests');
