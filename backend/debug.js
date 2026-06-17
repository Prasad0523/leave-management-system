const db = require('./config/database');

console.log('=== Database Schema Check ===\n');

const cols = db.prepare("PRAGMA table_info(users)").all();
console.log('Users columns:', cols.map(c => c.name).join(', '));

const hasAtt = cols.some(c => c.name === 'total_classes');
console.log('Has attendance columns:', hasAtt);

if (!hasAtt) {
  console.log('MISSING: attendance columns. Run the new seed script.');
  process.exit(1);
}

const holidaysTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='holidays'").get();
console.log('Holidays table exists:', !!holidaysTable);

const notifTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'").get();
console.log('Notifications table exists:', !!notifTable);

console.log('\n=== User Data ===\n');
const users = db.prepare('SELECT id, name, role, student_year, total_classes, attended_classes FROM users').all();
for (const u of users) {
  const pct = u.total_classes > 0 ? Math.round((u.attended_classes / u.total_classes) * 100) : 'N/A';
  console.log(`  ${u.name} (${u.role}) - ${pct}% (${u.attended_classes}/${u.total_classes})`);
}

console.log('\n=== Holidays ===\n');
const holidays = db.prepare("SELECT * FROM holidays WHERE date >= date('now') ORDER BY date ASC LIMIT 10").all();
if (holidays.length === 0) {
  console.log('No upcoming holidays found. Check the seed data dates.');
  const allHolidays = db.prepare('SELECT * FROM holidays ORDER BY date').all();
  console.log(`All holidays in DB (${allHolidays.length}):`);
  for (const h of allHolidays) {
    console.log(`  ${h.date} - ${h.name} (${h.type})`);
  }
} else {
  for (const h of holidays) {
    console.log(`  ${h.date} - ${h.name} (${h.type})`);
  }
}

console.log('\n=== Attendance Predictor Test ===\n');
const predictor = require('./services/aiService').predictAttendanceImpact;
const student = users.find(u => u.role === 'student');
if (student) {
  const result = predictor(student.id, '2026-07-10', '2026-07-12');
  console.log('Test result:', JSON.stringify(result, null, 2));
} else {
  console.log('No student found in DB');
}

console.log('\n=== Done ===');
