const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { protect, adminOnly } = require('../middleware/auth');

// Apply auth to all admin doctor routes
router.use(protect, adminOnly);

/**
 * @swagger
 * /admin/create-doctor:
 *   post:
 *     summary: Create a new doctor
 *     tags: [Admin - Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               specialization:
 *                 type: string
 *               phone:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Missing required fields or doctor already exists
 */
router.post('/create-doctor', async (req, res) => {
  try {
    const { name, email, password, specialization, phone, licenseNumber } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if doctor already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Doctor already exists' });
    }

    // Create user with doctor role
    await User.create({
      name,
      email,
      password,
      role: 'doctor',
      status: 'active'
    });

    // Create doctor profile
    await DoctorProfile.create({
      doctorEmail: email,
      name,
      specialization: specialization || '',
      phone: phone || '',
      licenseNumber: licenseNumber || '',
      patientsCount: 0,
      reportsReviewed: 0,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    });

    res.status(201).json({ message: 'Doctor created successfully' });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ error: 'Server error creating doctor' });
  }
});

/**
 * @swagger
 * /admin/get-doctors:
 *   get:
 *     summary: Fetch all doctors
 *     tags: [Admin - Doctors]
 *     responses:
 *       200:
 *         description: List of all doctors
 */
router.get('/get-doctors', async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({}, { _id: 0 });
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Server error fetching doctors' });
  }
});

/**
 * @swagger
 * /admin/update-doctor/{email}:
 *   put:
 *     summary: Update doctor information
 *     tags: [Admin - Doctors]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               specialization:
 *                 type: string
 *               phone:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       400:
 *         description: Doctor not found or no changes made
 */
router.put('/update-doctor/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { name, specialization, phone, licenseNumber, status } = req.body;

    // Build update object with non-null values
    const updateData = {};
    if (name !== undefined && name !== null) updateData.name = name;
    if (specialization !== undefined && specialization !== null) updateData.specialization = specialization;
    if (phone !== undefined && phone !== null) updateData.phone = phone;
    if (licenseNumber !== undefined && licenseNumber !== null) updateData.licenseNumber = licenseNumber;
    if (status !== undefined && status !== null) updateData.status = status;

    const result = await DoctorProfile.updateOne(
      { doctorEmail: email },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'Doctor not found or no changes made' });
    }

    res.status(200).json({ message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ error: 'Server error updating doctor' });
  }
});

/**
 * @swagger
 * /admin/delete-doctor/{email}:
 *   delete:
 *     summary: Delete a doctor
 *     tags: [Admin - Doctors]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 */
router.delete('/delete-doctor/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Delete doctor profile
    await DoctorProfile.deleteOne({ doctorEmail: email });

    // Delete login entry from users collection
    await User.deleteOne({ email });

    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ error: 'Server error deleting doctor' });
  }
});

/**
 * @swagger
 * /admin/doctor/profile/{email}:
 *   get:
 *     summary: Get doctor profile by email
 *     tags: [Admin - Doctors]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor profile
 *       404:
 *         description: Doctor not found
 */
router.get('/doctor/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const doctor = await DoctorProfile.findOne({ doctorEmail: email }, { _id: 0 });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.status(200).json(doctor);
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ error: 'Server error fetching doctor profile' });
  }
});

module.exports = router;
