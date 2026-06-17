const express = require('express');
const router = express.Router();
const DoctorProfile = require('../models/DoctorProfile');
const { protect, doctorOnly } = require('../middleware/auth');

// Apply auth to all doctor profile routes
router.use(protect, doctorOnly);

/**
 * @swagger
 * /doctor/profile/{email}:
 *   get:
 *     summary: Get doctor profile
 *     tags: [Doctor Profile]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor profile data
 *       404:
 *         description: Doctor not found
 */
router.get('/profile/:email', async (req, res) => {
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

/**
 * @swagger
 * /doctor/update-profile/{email}:
 *   put:
 *     summary: Update doctor profile
 *     tags: [Doctor Profile]
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Update failed
 */
router.put('/update-profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = req.body;

    const result = await DoctorProfile.updateOne(
      { doctorEmail: email },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'Update failed' });
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ error: 'Server error updating doctor profile' });
  }
});

module.exports = router;
