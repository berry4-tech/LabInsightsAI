const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, adminOnly } = require('../middleware/auth');

// Apply auth to all admin reports routes
router.use(protect, adminOnly);

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Get all reports with user details
 *     tags: [Admin Reports]
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       userEmail:
 *                         type: string
 *                       reportName:
 *                         type: string
 *                       uploadDate:
 *                         type: string
 *                       type:
 *                         type: string
 *                       totalTests:
 *                         type: number
 *                       abnormalCount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       file_path:
 *                         type: string
 */
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find({});
    const result = [];

    for (const report of reports) {
      const user = await User.findOne({ email: report.user_email });

      const severity = report.ai_summary?.severity || 'low';
      let uiStatus = 'normal';
      if (severity === 'medium') {
        uiStatus = 'abnormal';
      } else if (severity === 'high') {
        uiStatus = 'critical';
      }

      // Count abnormal tests
      const testResults = report.testResults || [];
      const abnormalCount = testResults.filter(t => t.status !== 'normal').length;

      result.push({
        _id: report._id.toString(),
        userName: user?.name || 'Unknown',
        userEmail: report.user_email,
        reportName: report.file_name,
        uploadDate: report.uploaded_at,
        type: 'Lab Report',
        totalTests: testResults.length,
        abnormalCount: abnormalCount,
        status: uiStatus,
        file_path: report.file_path
      });
    }

    res.status(200).json({ reports: result });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ error: 'Server error fetching reports' });
  }
});

/**
 * @swagger
 * /admin/reports/{report_id}:
 *   delete:
 *     summary: Delete a report by MongoDB _id
 *     tags: [Admin Reports]
 *     parameters:
 *       - in: path
 *         name: report_id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the report
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 */
router.delete('/reports/:report_id', async (req, res) => {
  try {
    const { report_id } = req.params;

    const report = await Report.findById(report_id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete file from disk if it exists
    const filePath = report.file_path;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Report.deleteOne({ _id: report_id });

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Server error deleting report' });
  }
});

/**
 * @swagger
 * /admin/download/{report_id}:
 *   get:
 *     summary: Download a report file
 *     tags: [Admin Reports]
 *     parameters:
 *       - in: path
 *         name: report_id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the report
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Report not found
 */
router.get('/download/:report_id', async (req, res) => {
  try {
    const { report_id } = req.params;

    const report = await Report.findById(report_id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const filePath = report.file_path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, report.file_name);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Server error downloading report' });
  }
});

/**
 * @swagger
 * /admin/view/{report_id}:
 *   get:
 *     summary: View a report file inline
 *     tags: [Admin Reports]
 *     parameters:
 *       - in: path
 *         name: report_id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the report
 *     responses:
 *       200:
 *         description: File served successfully
 *       404:
 *         description: Report not found
 */
router.get('/view/:report_id', async (req, res) => {
  try {
    const { report_id } = req.params;

    const report = await Report.findById(report_id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const filePath = report.file_path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('View report error:', error);
    res.status(500).json({ error: 'Server error viewing report' });
  }
});

module.exports = router;
