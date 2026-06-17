const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, adminOnly } = require('../middleware/auth');

// Apply auth to all admin routes
router.use(protect, adminOnly);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users with report statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       joinDate:
 *                         type: string
 *                       status:
 *                         type: string
 *                       reportsCount:
 *                         type: number
 *                       lastActive:
 *                         type: string
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    const result = [];

    for (const user of users) {
      const email = user.email;

      // Count reports for user
      const reportsCount = await Report.countDocuments({ user_email: email });

      // Find last report
      const lastReport = await Report.findOne({ user_email: email })
        .sort({ uploaded_at: -1 });

      let lastActive = 'Never';
      if (lastReport) {
        try {
          const uploadedAt = lastReport.uploaded_at;
          const uploadedDt = new Date(uploadedAt);
          lastActive = uploadedDt.toISOString().slice(0, 16).replace('T', ' ');
        } catch {
          lastActive = 'Unknown';
        }
      }

      result.push({
        name: user.name || '',
        email: email,
        joinDate: user.created_at ? user.created_at.toISOString().split('T')[0] : '2024-01-01',
        status: user.status || 'active',
        reportsCount: reportsCount,
        lastActive: lastActive
      });
    }

    res.status(200).json({ users: result });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

/**
 * @swagger
 * /admin/users/{email}/status:
 *   put:
 *     summary: Update user status
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
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
 *                 enum: [active, suspended, pending]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 */
router.put('/users/:email/status', async (req, res) => {
  try {
    const { email } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await User.updateOne({ email }, { $set: { status } });

    res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error updating status' });
  }
});

/**
 * @swagger
 * /admin/users/{email}:
 *   delete:
 *     summary: Delete a user and their reports
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:email', async (req, res) => {
  try {
    const { email } = req.params;

    await User.deleteOne({ email });
    await Report.deleteMany({ user_email: email });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

/**
 * @swagger
 * /admin/users/{email}:
 *   put:
 *     summary: Edit user details
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { name } = req.body;

    await User.updateOne({ email }, { $set: { name } });

    res.status(200).json({ message: 'User updated' });
  } catch (error) {
    console.error('Edit user error:', error);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

module.exports = router;
