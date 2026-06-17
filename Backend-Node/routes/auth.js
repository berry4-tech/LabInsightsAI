const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { generateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (min 6 characters)
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
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
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists or validation error
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user (password is hashed by pre-save middleware)
    const user = await User.create({ name, email, password });

    // Create profile
    await Profile.create({
      name,
      email,
      phone: '',
      dateOfBirth: '',
      age: '',
      gender: '',
      bloodType: '',
      height: '',
      weight: '',
      address: '',
      medicalConditions: [],
      allergies: [],
      medications: [],
      unitPreference: 'metric'
    });

    // Generate token so user is automatically logged in
    const token = generateToken(user._id, user.email);

    res.status(201).json({ 
      message: 'User created, profile initialized',
      token,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: User does not exist
 *       401:
 *         description: Incorrect password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User does not exist' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Generate token
    const token = generateToken(user._id, user.email);

    res.status(200).json({
      message: 'Login successful',
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Current password is incorrect
 *       404:
 *         description: User not found
 */
/**
 * @swagger
 * /auth/doctor-login:
 *   post:
 *     summary: Login as doctor
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor login successful
 *       401:
 *         description: Invalid credentials or not a doctor account
 */
router.post('/doctor-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with doctor role
    const user = await User.findOne({ email, role: 'doctor' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or not a doctor account' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Generate token
    const token = generateToken(user._id, user.email);

    res.status(200).json({
      message: 'Doctor login successful',
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ error: 'Server error during doctor login' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error during password change' });
  }
});

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Login or register with Google OAuth
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google auth successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *                 token:
 *                   type: string
 */
router.post('/google', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user for Google OAuth
      user = await User.create({
        name,
        email,
        password: 'google-oauth-' + Math.random().toString(36).slice(-8),
        role: 'user'
      });

      // Create profile
      await Profile.create({
        name,
        email,
        phone: '',
        dateOfBirth: '',
        age: '',
        gender: '',
        bloodType: '',
        height: '',
        weight: '',
        address: '',
        medicalConditions: [],
        allergies: [],
        medications: [],
        unitPreference: 'metric'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.email);

    res.status(200).json({
      message: 'Google auth successful',
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      token
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Server error during Google auth' });
  }
});

/**
 * @swagger
 * /auth/delete-account:
 *   delete:
 *     summary: Delete user account and all associated data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Invalid password
 *       404:
 *         description: User not found
 */
router.delete('/delete-account', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password (skip for Google OAuth users)
    const isGoogleUser = user.password && user.password.startsWith('google-oauth');
    if (!isGoogleUser) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
    }

    // Delete user's profile
    await Profile.deleteOne({ email });

    // Delete user's reports (if Report model exists)
    try {
      const Report = require('../models/Report');
      await Report.deleteMany({ user_email: email });
    } catch (e) {
      // Report model may not exist, continue
    }

    // Delete any assigned doctor relationships
    try {
      const AssignedDoctor = require('../models/AssignedDoctor');
      await AssignedDoctor.deleteMany({ userEmail: email });
    } catch (e) {
      // Model may not exist, continue
    }

    // Delete any connection requests
    try {
      const ConnectionRequest = require('../models/ConnectionRequest');
      await ConnectionRequest.deleteMany({ patientId: email });
    } catch (e) {
      // Model may not exist, continue
    }

    // Finally, delete the user
    await User.deleteOne({ email });

    res.status(200).json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error during account deletion' });
  }
});

module.exports = router;
