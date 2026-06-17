const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const Report = require('../models/Report');
const DoctorProfile = require('../models/DoctorProfile');
const AssignedDoctor = require('../models/AssignedDoctor');
const ConnectionRequest = require('../models/ConnectionRequest');
const { protect, doctorOnly } = require('../middleware/auth');

// Helper function to format date
const formatDate = (dt) => {
  try {
    const d = new Date(dt.replace('Z', ''));
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dt;
  }
};

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Fetch all doctors
 *     tags: [Doctor]
 *     responses:
 *       200:
 *         description: List of all doctors
 */
router.get('/doctors', protect, async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({}, { _id: 0 });
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({ error: 'Server error fetching doctors' });
  }
});

/**
 * @swagger
 * /assign-doctor:
 *   post:
 *     summary: Assign doctor to user (called ONLY when accepted)
 *     tags: [Doctor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *               - doctorEmail
 *             properties:
 *               userEmail:
 *                 type: string
 *               doctorEmail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor assigned successfully
 *       400:
 *         description: Missing details
 */
router.post('/assign-doctor', protect, async (req, res) => {
  try {
    const { userEmail, doctorEmail } = req.body;

    if (!userEmail || !doctorEmail) {
      return res.status(400).json({ error: 'Missing details' });
    }

    await AssignedDoctor.updateOne(
      { userEmail },
      { $set: { doctorEmail } },
      { upsert: true }
    );

    res.status(200).json({ message: 'Doctor assigned successfully' });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ error: 'Server error assigning doctor' });
  }
});

/**
 * @swagger
 * /assigned-doctor/{email}:
 *   get:
 *     summary: Get assigned doctor details for a user
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assigned doctor details
 */
router.get('/assigned-doctor/:email', protect, async (req, res) => {
  try {
    const { email } = req.params;
    const assigned = await AssignedDoctor.findOne({ userEmail: email });

    if (!assigned) {
      return res.json({ doctor: null });
    }

    const doctor = await DoctorProfile.findOne(
      { doctorEmail: assigned.doctorEmail },
      { _id: 0 }
    );

    res.json({ doctor });
  } catch (error) {
    console.error('Get assigned doctor error:', error);
    res.status(500).json({ error: 'Server error fetching assigned doctor' });
  }
});

/**
 * @swagger
 * /send-request:
 *   post:
 *     summary: Send connection request to doctor
 *     tags: [Doctor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientEmail
 *               - doctorEmail
 *             properties:
 *               id:
 *                 type: string
 *               patientEmail:
 *                 type: string
 *               doctorEmail:
 *                 type: string
 *               message:
 *                 type: string
 *               requestDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request sent to doctor
 */
router.post('/send-request', protect, async (req, res) => {
  try {
    const { id, patientEmail, doctorEmail, doctorId, message, requestDate } = req.body;
    const doctorEmailFinal = doctorEmail || doctorId;

    // Fetch patient details
    const patientUser = await User.findOne({ email: patientEmail });
    const patientProfile = await Profile.findOne({ email: patientEmail });
    const reportsCount = await Report.countDocuments({ user_email: patientEmail });

    const requestDoc = {
      id,
      doctorId: doctorEmailFinal,
      patientId: patientEmail,
      patientName: patientProfile?.name || patientUser?.name || 'Unknown',
      patientEmail,
      patientPhone: patientProfile?.phone || 'N/A',
      message: message || '',
      reportsCount,
      requestDate: requestDate || new Date().toISOString(),
      status: 'pending'
    };

    await ConnectionRequest.create(requestDoc);
    res.status(201).json({ message: 'Request sent to doctor' });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: 'Server error sending request' });
  }
});

/**
 * @swagger
 * /doctor/requests/{doctorEmail}:
 *   get:
 *     summary: Get requests for a doctor
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: doctorEmail
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of connection requests
 */
router.get('/doctor/requests/:doctorEmail', protect, doctorOnly, async (req, res) => {
  try {
    const { doctorEmail } = req.params;
    const requests = await ConnectionRequest.find({ doctorId: doctorEmail }, { _id: 0 });
    res.json({ requests });
  } catch (error) {
    console.error('Get doctor requests error:', error);
    res.status(500).json({ error: 'Server error fetching requests' });
  }
});

/**
 * @swagger
 * /profile/{email}:
 *   get:
 *     summary: Get patient profile
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient profile
 *       404:
 *         description: Profile not found
 */
router.get('/profile/:email', protect, async (req, res) => {
  try {
    const { email } = req.params;
    const user = await Profile.findOne({ email }, { _id: 0 });

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

/**
 * @swagger
 * /doctor/request/update/{requestId}:
 *   put:
 *     summary: Accept or reject connection request
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/doctor/request/update/:requestId', protect, doctorOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    // Update request document
    await ConnectionRequest.updateOne(
      { id: requestId },
      { $set: { status } }
    );

    // Get updated request
    const request = await ConnectionRequest.findOne({ id: requestId });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // If ACCEPTED → Assign doctor
    if (status === 'accepted') {
      await AssignedDoctor.updateOne(
        { userEmail: request.patientId },
        { $set: { doctorEmail: request.doctorId } },
        { upsert: true }
      );
    }

    // If REJECTED → Remove assignment + send rejection message
    if (status === 'rejected') {
      await AssignedDoctor.deleteOne({ userEmail: request.patientId });

      const doctor = await DoctorProfile.findOne({ doctorEmail: request.doctorId });
      const doctorName = doctor?.name || request.doctorId;

      await ConnectionRequest.updateOne(
        { id: requestId },
        { $set: { rejectionMessage: `Your request was rejected by Dr. ${doctorName}` } }
      );
    }

    res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Server error updating request' });
  }
});

/**
 * @swagger
 * /patient/connection-status/{email}:
 *   get:
 *     summary: Get patient's connection status with doctor
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Connection status
 */
router.get('/patient/connection-status/:email', protect, async (req, res) => {
  try {
    const { email } = req.params;

    // Get latest request
    const request = await ConnectionRequest.findOne(
      { patientId: email },
      { _id: 0 }
    ).sort({ _id: -1 });

    if (!request) {
      return res.json({ hasRequest: false });
    }

    const doctor = await DoctorProfile.findOne(
      { doctorEmail: request.doctorId },
      { _id: 0, name: 1 }
    );

    res.status(200).json({
      hasRequest: true,
      status: request.status,
      doctorId: request.doctorId,
      doctorName: doctor?.name || 'Unknown Doctor',
      rejectionMessage: request.rejectionMessage || ''
    });
  } catch (error) {
    console.error('Get connection status error:', error);
    res.status(500).json({ error: 'Server error fetching connection status' });
  }
});

/**
 * @swagger
 * /doctor/patients/{doctorEmail}:
 *   get:
 *     summary: Get all patients assigned to a doctor
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: doctorEmail
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of patients with their details
 */
router.get('/doctor/patients/:doctorEmail', protect, doctorOnly, async (req, res) => {
  try {
    const { doctorEmail } = req.params;

    const assignedDocs = await AssignedDoctor.find(
      { doctorEmail },
      { _id: 0, userEmail: 1 }
    );

    const patientEmails = assignedDocs.map(p => p.userEmail);

    if (patientEmails.length === 0) {
      return res.json([]);
    }

    const patients = await Profile.find(
      { email: { $in: patientEmails } },
      { _id: 0 }
    );

    const finalData = [];

    for (const p of patients) {
      const reports = await Report.find(
        { user_email: p.email },
        { _id: 0 }
      );

      const latest = reports.length > 0 ? reports[reports.length - 1] : null;

      finalData.push({
        id: p.email,
        name: p.name,
        email: p.email,
        phone: p.phone || 'N/A',
        dob: p.dateOfBirth,
        gender: p.gender,
        assignedDate: 'N/A',
        reportsCount: reports.length,
        lastReport: latest ? formatDate(latest.uploaded_at) : null,
        lastReportType: latest?.testResults?.[0]?.name || null,
        severity: latest?.testResults?.[0]?.status || null,
        conditions: p.medicalConditions || [],
        status: latest ? 'under-review' : 'stable'
      });
    }

    res.json(finalData);
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({ error: 'Server error fetching patients' });
  }
});

/**
 * @swagger
 * /doctor/patient-detail/{email}:
 *   get:
 *     summary: Get detailed patient information including reports
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient details with reports
 *       404:
 *         description: Patient not found
 */
router.get('/doctor/patient-detail/:email', protect, doctorOnly, async (req, res) => {
  try {
    const { email } = req.params;

    const profile = await Profile.findOne({ email }, { _id: 0 });
    if (!profile) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const reports = await Report.find({ user_email: email }, { _id: 0 });
    const latest = reports.length > 0 ? reports[reports.length - 1] : null;

    res.json({
      profile,
      reports,
      latestReport: latest,
      doctorComment: latest?.doctor_comment || null
    });
  } catch (error) {
    console.error('Get patient detail error:', error);
    res.status(500).json({ error: 'Server error fetching patient detail' });
  }
});

/**
 * @swagger
 * /doctor/add-comment:
 *   post:
 *     summary: Add doctor comment to a report
 *     tags: [Doctor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - file_id
 *               - comment
 *             properties:
 *               email:
 *                 type: string
 *               file_id:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment saved successfully
 *       400:
 *         description: Missing data
 */
router.post('/doctor/add-comment', protect, doctorOnly, async (req, res) => {
  try {
    const { email, file_id, comment } = req.body;

    if (!email || !file_id || !comment) {
      return res.status(400).json({ error: 'Missing data' });
    }

    await Report.updateOne(
      { file_id },
      { $set: { doctor_comment: comment } }
    );

    res.json({ message: 'Comment saved successfully', success: true });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error saving comment' });
  }
});

module.exports = router;
