const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { sendLeaveNotification } = require('../services/emailService');

const router = express.Router();

function calculateDays(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1);
}

router.post('/', authenticate, (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  if (!leave_type || !start_date || !end_date || !reason) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ error: 'End date must be after or equal to start date.' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, leave_type, start_date, end_date, reason);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Leave request submitted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit leave request.' });
  }
});

router.get('/', authenticate, (req, res) => {
  try {
    let leaves;
    if (req.user.role === 'student') {
      leaves = db.prepare(`
        SELECT l.*, u.name AS user_name, u.department, a.name AS approver_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN users a ON l.approved_by = a.id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC
      `).all(req.user.id);
    } else if (req.user.role === 'faculty') {
      leaves = db.prepare(`
        SELECT l.*, u.name AS user_name, u.department, u.student_year, u.total_classes, u.attended_classes, a.name AS approver_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN users a ON l.approved_by = a.id
        WHERE u.department = ? AND u.role = 'student'
        ORDER BY u.student_year, l.created_at DESC
      `).all(req.user.department);
    } else {
      leaves = db.prepare(`
        SELECT l.*, u.name AS user_name, u.department, u.role AS user_role, u.student_year, u.total_classes, u.attended_classes, a.name AS approver_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN users a ON l.approved_by = a.id
        ORDER BY u.department, u.student_year, l.created_at DESC
      `).all();
    }
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaves.' });
  }
});

router.get('/pending', authenticate, authorize('faculty', 'admin'), (req, res) => {
  try {
    let leaves;
    if (req.user.role === 'faculty') {
      leaves = db.prepare(`
        SELECT l.*, u.name AS user_name, u.department, u.student_year, u.total_classes, u.attended_classes
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        WHERE l.status = 'pending' AND u.department = ? AND u.role = 'student'
        ORDER BY l.created_at ASC
      `).all(req.user.department);
    } else {
      leaves = db.prepare(`
        SELECT l.*, u.name AS user_name, u.department, u.role AS user_role, u.student_year, u.total_classes, u.attended_classes
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        WHERE l.status = 'pending'
        ORDER BY l.created_at ASC
      `).all();
    }
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending leaves.' });
  }
});

router.put('/:id/approve', authenticate, authorize('faculty', 'admin'), (req, res) => {
  const { comment } = req.body;
  try {
    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ error: 'Leave already processed.' });
    if (req.user.role === 'faculty') {
      const user = db.prepare('SELECT department FROM users WHERE id = ?').get(leave.user_id);
      if (user.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only approve leaves from your department.' });
      }
    }
    db.prepare(
      'UPDATE leaves SET status = ?, approved_by = ?, faculty_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('approved', req.user.id, comment || null, req.params.id);
    const approver = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
    sendLeaveNotification(leave.user_id, leave, 'approved', comment, approver.name);
    res.json({ message: 'Leave approved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve leave.' });
  }
});

router.put('/:id/reject', authenticate, authorize('faculty', 'admin'), (req, res) => {
  const { comment } = req.body;
  try {
    const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ error: 'Leave already processed.' });
    if (req.user.role === 'faculty') {
      const user = db.prepare('SELECT department FROM users WHERE id = ?').get(leave.user_id);
      if (user.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only reject leaves from your department.' });
      }
    }
    db.prepare(
      'UPDATE leaves SET status = ?, approved_by = ?, faculty_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('rejected', req.user.id, comment || null, req.params.id);
    const approver = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
    sendLeaveNotification(leave.user_id, leave, 'rejected', comment, approver.name);
    res.json({ message: 'Leave rejected.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject leave.' });
  }
});

router.put('/bulk-action', authenticate, authorize('faculty', 'admin'), (req, res) => {
  const { ids, action, comment } = req.body;
  if (!ids || !ids.length || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request. Provide ids array and action.' });
  }
  try {
    const updateStmt = db.prepare(
      'UPDATE leaves SET status = ?, approved_by = ?, faculty_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = \'pending\''
    );
    const checkStmt = db.prepare('SELECT l.id, u.department FROM leaves l JOIN users u ON l.user_id = u.id WHERE l.id = ?');
    const transaction = db.transaction(() => {
      let count = 0;
      for (const id of ids) {
        const leave = checkStmt.get(id);
        if (!leave) continue;
        if (req.user.role === 'faculty' && leave.department !== req.user.department) continue;
        const status = action === 'approve' ? 'approved' : 'rejected';
        updateStmt.run(status, req.user.id, comment || null, id);
        const fullLeave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id);
        const approver = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
        try { sendLeaveNotification(fullLeave.user_id, fullLeave, status, comment, approver.name); } catch (e) {}
        count++;
      }
      return count;
    });
    const updated = transaction();
    res.json({ message: `${updated} leave(s) ${action}d successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Bulk action failed.' });
  }
});

module.exports = router;
