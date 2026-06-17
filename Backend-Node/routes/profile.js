const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *         age:
 *           type: string
 *         gender:
 *           type: string
 *         bloodType:
 *           type: string
 *         height:
 *           type: string
 *         weight:
 *           type: string
 *         address:
 *           type: string
 *         medicalConditions:
 *           type: array
 *           items:
 *             type: string
 *         allergies:
 *           type: array
 *           items:
 *             type: string
 *         medications:
 *           type: array
 *           items:
 *             type: string
 *         unitPreference:
 *           type: string
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const { email } = req.query;

    const profile = await Profile.findOne({ email });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Convert to plain object and stringify _id
    const profileObj = profile.toObject();
    profileObj._id = profileObj._id.toString();

    res.status(200).json(profileObj);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Email required
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const data = req.body;
    const { email } = data;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Remove _id if present to avoid update errors
    delete data._id;

    await Profile.updateOne(
      { email },
      { $set: data },
      { upsert: true }
    );

    res.status(200).json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;
