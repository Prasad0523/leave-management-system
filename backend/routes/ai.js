const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  predictAttendanceImpact,
  getFacultyWorkload,
  getTodaysAbsentees,
  getUpcomingHolidays,
  getNotifications,
  getReasonTemplates
} = require('../services/aiService');
const db = require('../config/database');

const router = express.Router();

router.post('/attendance-impact', authenticate, (req, res) => {
  const { start_date, end_date } = req.body;
  if (!start_date) return res.status(400).json({ error: 'Start date required.' });
  const result = predictAttendanceImpact(req.user.id, start_date, end_date || start_date);
  if (!result) {
    return res.json({ message: 'Attendance tracking is only available for students.', unavailable: true });
  }
  res.json(result);
});

router.get('/faculty-workload', authenticate, (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only faculty and admin can view workload.' });
  }
  const dept = req.user.role === 'admin' ? null : req.user.department;
  const result = getFacultyWorkload(req.user.id, dept);
  res.json(result);
});

router.get('/todays-absentees', authenticate, (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const dept = req.user.role === 'admin' ? null : req.user.department;
  const result = getTodaysAbsentees(dept);
  res.json(result);
});

router.get('/holidays', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const result = getUpcomingHolidays(limit);
  res.json(result);
});

router.get('/notifications', authenticate, (req, res) => {
  const result = getNotifications(req.user.id);
  res.json(result);
});

router.get('/reason-templates', authenticate, (req, res) => {
  res.json(getReasonTemplates());
});

router.get('/department-stats', authenticate, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        u.department,
        COUNT(l.id) AS total_leaves,
        SUM(CASE WHEN l.status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN l.status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END) AS pending,
        ROUND(AVG(CASE WHEN l.status = 'approved' THEN (julianday(l.end_date) - julianday(l.start_date) + 1) ELSE NULL END), 1) AS avg_days,
        (SELECT COUNT(*) FROM users WHERE department = u.department AND role = 'student') AS total_students,
        (SELECT ROUND(CAST(SUM(attended_classes) AS REAL) / CAST(SUM(total_classes) AS REAL) * 100) FROM users WHERE department = u.department AND role = 'student' AND total_classes > 0) AS avg_attendance
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      GROUP BY u.department
    `).all();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

router.get('/year-stats', authenticate, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COALESCE(u.student_year, 'N/A') AS year,
        COUNT(l.id) AS total_leaves,
        SUM(CASE WHEN l.status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN l.status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END) AS pending
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.student_year
      ORDER BY u.student_year
    `).all();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch year stats.' });
  }
});

module.exports = router;
