const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  name: String,           // AI returns "name" not "testName"
  testName: String,       // Keep for backward compatibility
  value: mongoose.Schema.Types.Mixed,
  unit: String,
  normalRange: String,    // AI returns "normalRange" not "referenceRange"
  referenceRange: String, // Keep for backward compatibility
  status: {
    type: String,
    enum: ['low', 'normal', 'high', 'abnormal', 'critical'], // Accept all possible values
    default: 'normal'
  },
  interpretation: String  // AI also returns this
}, { _id: false });

const aiSummarySchema = new mongoose.Schema({
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  summary: String,
  overall: String,        // AI returns "overall" for summary
  recommendations: [String],
  keyFindings: [String]
}, { _id: false });

const reportSchema = new mongoose.Schema({
  file_id: {
    type: String,
    required: true,
    unique: true
  },
  user_email: {
    type: String,
    required: true,
    index: true
  },
  file_name: {
    type: String,
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  embedding_path: {
    type: String,
    default: ''
  },
  ai_summary: {
    type: aiSummarySchema,
    default: {}
  },
  testResults: {
    type: [testResultSchema],
    default: []
  },
  uploaded_at: {
    type: String,
    default: () => new Date().toISOString()
  },
  doctor_comment: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('Report', reportSchema);
