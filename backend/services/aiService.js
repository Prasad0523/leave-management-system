const db = require('../config/database');

function predictAttendanceImpact(userId, startDate, endDate) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || user.role !== 'student') return null;
  const s = new Date(startDate);
  const e = new Date(endDate);
  const days = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
  const estimatedClassesPerDay = Math.round(user.total_classes / 180) || 1;
  const missedClasses = days * estimatedClassesPerDay;
  const currentPct = user.total_classes > 0
    ? Math.round((user.attended_classes / user.total_classes) * 100)
    : 100;
  const newTotal = user.total_classes + missedClasses;
  const newAttended = user.attended_classes;
  const newPct = newTotal > 0 ? Math.round((newAttended / newTotal) * 100) : 100;
  const drop = currentPct - newPct;
  return {
    current_attendance: currentPct,
    predicted_attendance: newPct,
    drop,
    missed_classes: missedClasses,
    estimated_days: days,
    below_75: newPct < 75,
    message: newPct < 75
      ? `Warning: Taking this ${days}-day leave will drop your attendance to ${newPct}% (below 75% threshold).`
      : `Taking this ${days}-day leave will drop your attendance from ${currentPct}% to ${newPct}%.`
  };
}

function getFacultyWorkload(facultyId, department) {
  const deptFilter = department ? 'u.department = ? AND' : '';
  const deptFilterSub = department ? 'department = ? AND' : '';
  const params = department ? [department] : [];
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total_leaves,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved
    FROM leaves l
    JOIN users u ON l.user_id = u.id
    WHERE ${deptFilter} u.role = 'student'
  `).get(...params);
  const today = new Date().toISOString().split('T')[0];
  const todayAbsent = db.prepare(`
    SELECT COUNT(DISTINCT l.user_id) AS count
    FROM leaves l
    WHERE l.status = 'approved'
      AND l.start_date <= ? AND l.end_date >= ?
      AND l.user_id IN (SELECT id FROM users WHERE ${deptFilterSub} role = 'student')
  `).get(today, today, ...params);
  const students = db.prepare(`
    SELECT id, name, student_year, total_classes, attended_classes
    FROM users WHERE ${deptFilterSub} role = 'student'
  `).all(...params);
  const lowAttendance = students.filter(s => {
    return s.total_classes > 0 && ((s.attended_classes / s.total_classes) * 100) < 75;
  }).length;
  const totalAttended = students.reduce((sum, s) => sum + s.attended_classes, 0);
  const totalClasses = students.reduce((sum, s) => sum + s.total_classes, 0);
  const avgAttendance = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
  const yearStats = ['FE', 'SE', 'TE', 'BE'].map(year => {
    const yrStudents = students.filter(s => s.student_year === year);
    const yrAttended = yrStudents.reduce((sum, s) => sum + s.attended_classes, 0);
    const yrTotal = yrStudents.reduce((sum, s) => sum + s.total_classes, 0);
    return {
      year,
      total_students: yrStudents.length,
      avg_attendance: yrTotal > 0 ? Math.round((yrAttended / yrTotal) * 100) : 0
    };
  });
  return {
    pending_count: stats.pending || 0,
    total_leaves: stats.total_leaves || 0,
    today_absent: todayAbsent.count || 0,
    low_attendance_students: lowAttendance,
    total_students: students.length,
    avg_attendance: avgAttendance,
    year_stats: yearStats
  };
}

function getTodaysAbsentees(department) {
  const today = new Date().toISOString().split('T')[0];
  const sql = department
    ? `SELECT u.name, u.student_year, l.leave_type, l.reason
       FROM leaves l
       JOIN users u ON l.user_id = u.id
       WHERE l.status = 'approved'
         AND l.start_date <= ? AND l.end_date >= ?
         AND u.department = ? AND u.role = 'student'
       ORDER BY u.name`
    : `SELECT u.name, u.student_year, l.leave_type, l.reason, u.department
       FROM leaves l
       JOIN users u ON l.user_id = u.id
       WHERE l.status = 'approved'
         AND l.start_date <= ? AND l.end_date >= ?
         AND u.role = 'student'
       ORDER BY u.department, u.name`;
  const params = department ? [today, today, department] : [today, today];
  return db.prepare(sql).all(...params);
}

function getUpcomingHolidays(limit = 5) {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT * FROM holidays WHERE date >= ? ORDER BY date ASC LIMIT ?
  `).all(today, limit);
}

function getNotifications(userId) {
  return db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(userId);
}

function getReasonTemplates() {
  return {
    sick: [
      'High fever and severe cold - unable to attend classes',
      'Stomach infection and food poisoning',
      'Viral fever with body aches',
      'Migraine and severe headache',
      'Medical appointment with doctor',
    ],
    casual: [
      'Family wedding/engagement ceremony',
      'Religious ceremony at home',
      'Sports event/tournament participation',
      'Blood donation camp',
      'Family function - out of station',
    ],
    personal: [
      'Need to visit hometown for urgent family work',
      'Bank/government office appointment',
      'Family medical emergency',
      'Sibling school/college function',
      'Personal health checkup',
    ],
    emergency: [
      'Family emergency - urgent matter at home',
      'Sudden illness of family member',
      'Accident at home requiring presence',
      'Relative passed away - funeral',
      'Urgent court hearing',
    ]
  };
}

module.exports = {
  predictAttendanceImpact,
  getFacultyWorkload,
  getTodaysAbsentees,
  getUpcomingHolidays,
  getNotifications,
  getReasonTemplates
};
