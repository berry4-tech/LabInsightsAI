const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, adminOnly } = require('../middleware/auth');

// Apply auth to all admin dashboard routes
router.use(protect, adminOnly);

/**
 * @swagger
 * /admin/dashboard/user-growth:
 *   get:
 *     summary: Get user growth statistics by month
 *     tags: [Admin Dashboard]
 *     responses:
 *       200:
 *         description: User growth data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 growth:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: number
 */
router.get('/dashboard/user-growth', async (req, res) => {
  try {
    const users = await User.find({});
    const monthly = {};

    for (const user of users) {
      const created = user.created_at || new Date();
      const month = created.toISOString().slice(0, 7); // YYYY-MM format
      monthly[month] = (monthly[month] || 0) + 1;
    }

    // Sort by month and format response
    const sortedMonths = Object.keys(monthly).sort();
    const data = sortedMonths.map(m => ({
      month: m,
      count: monthly[m]
    }));

    res.status(200).json({ growth: data });
  } catch (error) {
    console.error('User growth error:', error);
    res.status(500).json({ error: 'Server error fetching user growth' });
  }
});

/**
 * @swagger
 * /admin/dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity (last 5 uploads)
 *     tags: [Admin Dashboard]
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recent:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: string
 *                       action:
 *                         type: string
 *                       time:
 *                         type: string
 */
router.get('/dashboard/recent-activity', async (req, res) => {
  try {
    const reports = await Report.find({})
      .sort({ uploaded_at: -1 })
      .limit(5);

    const result = reports.map(r => ({
      user: r.user_email,
      action: `uploaded ${r.file_name}`,
      time: r.uploaded_at
    }));

    res.status(200).json({ recent: result });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'Server error fetching recent activity' });
  }
});

/**
 * @swagger
 * /admin/dashboard/report-status:
 *   get:
 *     summary: Get report status distribution
 *     tags: [Admin Dashboard]
 *     responses:
 *       200:
 *         description: Report status counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 normal:
 *                   type: number
 *                 abnormal:
 *                   type: number
 *                 critical:
 *                   type: number
 */
router.get('/dashboard/report-status', async (req, res) => {
  try {
    const reports = await Report.find({});
    const statusCount = {
      normal: 0,
      abnormal: 0,
      critical: 0
    };

    for (const report of reports) {
      const severity = report.ai_summary?.severity || 'low';

      if (severity === 'low') {
        statusCount.normal++;
      } else if (severity === 'medium') {
        statusCount.abnormal++;
      } else {
        statusCount.critical++;
      }
    }

    res.status(200).json(statusCount);
  } catch (error) {
    console.error('Report status error:', error);
    res.status(500).json({ error: 'Server error fetching report status' });
  }
});

module.exports = router;
