require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const setupSwagger = require('./swagger');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const adminDashboardRoutes = require('./routes/adminDashboard');
const adminReportsRoutes = require('./routes/adminReports');
const adminDoctorRoutes = require('./routes/adminDoctor');
const doctorProfileRoutes = require('./routes/doctorProfile');
const doctorRoutes = require('./routes/doctorRoutes');
const doctorDashboardRoutes = require('./routes/doctorDashboard');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://group6-web-final-project.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (optional - for viewing files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup Swagger UI at /api-docs
setupSwagger(app);

// Routes - matching Flask URL prefixes exactly
app.use('/auth', authRoutes);
app.use('/', profileRoutes);  // /profile endpoints
app.use('/', uploadRoutes);   // /upload-report, /reports, /report/:id, /delete-report/:id, /all-reports
app.use('/admin', adminRoutes);
app.use('/admin', adminDashboardRoutes);
app.use('/admin', adminReportsRoutes);
app.use('/admin', adminDoctorRoutes);    // /admin/create-doctor, /admin/get-doctors, etc.
app.use('/doctor', doctorProfileRoutes); // /doctor/profile/:email, /doctor/update-profile/:email
app.use('/api', doctorDashboardRoutes);  // /api/doctor/dashboard/patients, etc.
app.use('/', doctorRoutes);              // /doctors, /assign-doctor, /send-request, /doctor/patients/:email, etc.

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LabInsight API',
    version: '1.0.0',
    docs: '/api-docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 10MB.' });
  }

  if (err.message === 'Invalid file type. Only PDF and images allowed.') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});
