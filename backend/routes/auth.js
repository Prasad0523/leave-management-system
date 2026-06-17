const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, role, department, student_year, parent_email } = req.body;
  if (!name || !email || !password || !role || !department) {
    return res.status(400).json({ error: 'All required fields must be filled.' });
  }
  if (!['student', 'faculty'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password, role, department, student_year, parent_email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(name, email, hashedPassword, role, department, student_year || null, parent_email || null, 'pending');
    res.status(201).json({ message: 'Registration submitted for approval. You will be able to login once approved.' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Your account is pending approval. Please wait for an administrator or faculty to approve your registration.' });
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, department, student_year, parent_email, total_classes, attended_classes, status, approved_by, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

router.get('/users', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(decoded.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const users = db.prepare(`
      SELECT id, name, email, role, department, student_year, total_classes, attended_classes, status, approved_by, created_at
      FROM users WHERE role IN ('student', 'faculty')
      ORDER BY
        CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
        department, student_year, name
    `).all();
    res.json(users);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

router.get('/pending-registrations', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });
    if (!['faculty', 'admin'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    let users;
    if (currentUser.role === 'admin') {
      users = db.prepare(`
        SELECT id, name, email, role, department, student_year, created_at
        FROM users WHERE status = 'pending' AND role IN ('student', 'faculty')
        ORDER BY created_at DESC
      `).all();
    } else {
      users = db.prepare(`
        SELECT id, name, email, role, department, student_year, created_at
        FROM users WHERE status = 'pending' AND role = 'student' AND department = ?
        ORDER BY created_at DESC
      `).all(currentUser.department);
    }
    res.json(users);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

router.put('/approve-registration/:id', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });
    if (!['faculty', 'admin'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.status !== 'pending') return res.status(400).json({ error: 'Registration is not pending.' });

    if (currentUser.role === 'faculty' && target.role !== 'student') {
      return res.status(403).json({ error: 'Faculty can only approve student registrations.' });
    }
    if (currentUser.role === 'faculty' && target.department !== currentUser.department) {
      return res.status(403).json({ error: 'You can only approve students from your department.' });
    }

    db.prepare('UPDATE users SET status = ?, approved_by = ? WHERE id = ?').run('approved', currentUser.id, req.params.id);
    res.json({ message: 'Registration approved.' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

router.put('/reject-registration/:id', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });
    if (!['faculty', 'admin'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.status !== 'pending') return res.status(400).json({ error: 'Registration is not pending.' });

    if (currentUser.role === 'faculty' && target.role !== 'student') {
      return res.status(403).json({ error: 'Faculty can only manage student registrations.' });
    }
    if (currentUser.role === 'faculty' && target.department !== currentUser.department) {
      return res.status(403).json({ error: 'You can only manage students from your department.' });
    }

    db.prepare('UPDATE users SET status = ?, approved_by = ? WHERE id = ?').run('rejected', currentUser.id, req.params.id);
    res.json({ message: 'Registration rejected.' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

router.delete('/users/:id', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(decoded.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin accounts.' });
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User removed.' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

module.exports = router;
