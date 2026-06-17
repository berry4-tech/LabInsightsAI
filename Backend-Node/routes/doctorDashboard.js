const express = require('express');
const router = express.Router();
const AssignedDoctor = require('../models/AssignedDoctor');
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, doctorOnly } = require('../middleware/auth');

// Apply auth to all doctor dashboard routes
router.use(protect, doctorOnly);

/**
 * @swagger
 * /doctor/dashboard/patients:
 *   get:
 *     summary: Get all patients assigned to this doctor
 *     tags: [Doctor Dashboard]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor's email
 *     responses:
 *       200:
 *         description: List of assigned patients
 */
router.get('/doctor/dashboard/patients', async (req, res) => {
  try {
    const doctorEmail = req.query.email;

    if (!doctorEmail) {
      return res.status(400).json({ error: 'Doctor email is required' });
    }

    // Get assigned patient emails
    const assigned = await AssignedDoctor.find({ doctorEmail });
    const patientEmails = assigned.map(a => a.userEmail);

    // Get patient details from users collection
    const patients = await User.find(
      { email: { $in: patientEmails } },
      { _id: 0 }
    );

    const result = patients.map(p => ({
      name: p.name,
      email: p.email,
      age: p.age,
      gender: p.gender
    }));

    res.json({ patients: result });
  } catch (error) {
    console.error('Doctor dashboard patients error:', error);
    res.status(500).json({ error: 'Server error fetching patients' });
  }
});

/**
 * @swagger
 * /doctor/dashboard/report-status:
 *   get:
 *     summary: Get report status counts for this doctor's patients
 *     tags: [Doctor Dashboard]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor's email
 *     responses:
 *       200:
 *         description: Report status counts (normal, abnormal, critical)
 */
router.get('/doctor/dashboard/report-status', async (req, res) => {
  try {
    const doctorEmail = req.query.email;

    if (!doctorEmail) {
      return res.status(400).json({ error: 'Doctor email is required' });
    }

    // Get assigned patient emails
    const assigned = await AssignedDoctor.find({ doctorEmail });
    const patientEmails = assigned.map(a => a.userEmail);

    // Get reports for these patients
    const reports = await Report.find({ user_email: { $in: patientEmails } });

    const status = { normal: 0, abnormal: 0, critical: 0 };

    for (const r of reports) {
      const severity = r.ai_summary?.severity || 'low';

      if (severity === 'low') {
        status.normal += 1;
      } else if (severity === 'medium') {
        status.abnormal += 1;
      } else {
        status.critical += 1;
      }
    }

    res.json(status);
  } catch (error) {
    console.error('Doctor dashboard report status error:', error);
    res.status(500).json({ error: 'Server error fetching report status' });
  }
});

/**
 * @swagger
 * /doctor/dashboard/high-priority:
 *   get:
 *     summary: Get recent high priority reports for this doctor's patients
 *     tags: [Doctor Dashboard]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor's email
 *     responses:
 *       200:
 *         description: List of recent high priority reports
 */
router.get('/doctor/dashboard/high-priority', async (req, res) => {
  try {
    const doctorEmail = req.query.email;

    if (!doctorEmail) {
      return res.status(400).json({ error: 'Doctor email is required' });
    }

    // Get assigned patient emails
    const assigned = await AssignedDoctor.find({ doctorEmail });
    const patientEmails = assigned.map(a => a.userEmail);

    // Get recent reports sorted by upload date, limit to 5
    const reports = await Report.find({ user_email: { $in: patientEmails } })
      .sort({ uploaded_at: -1 })
      .limit(5);

    const result = reports.map(r => ({
      patientEmail: r.user_email,
      patientName: r.user_email.split('@')[0],
      reportType: r.file_name,
      uploadDate: r.uploaded_at,
      severity: r.ai_summary?.severity || 'low',
      id: r._id.toString()
    }));

    res.json({ reports: result });
  } catch (error) {
    console.error('Doctor dashboard high priority error:', error);
    res.status(500).json({ error: 'Server error fetching high priority reports' });
  }
});

module.exports = router;
