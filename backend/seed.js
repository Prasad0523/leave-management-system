const db = require('./config/database');
const bcrypt = require('bcryptjs');

// Check if already seeded
const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
if (existing.cnt > 0) {
  console.log('Database already seeded. Skipping. (Run with FORCE_SEED=1 to re-seed.)');
  process.exit(0);
}

console.log('Seeding database...');

db.exec('DELETE FROM notifications');
db.exec('DELETE FROM holidays');
db.exec('DELETE FROM leaves');
db.exec('DELETE FROM users');

const password = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(
  'INSERT INTO users (name, email, password, role, department, student_year, total_classes, attended_classes, parent_email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

const insertLeave = db.prepare(
  'INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason, status, approved_by, faculty_comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

const insertHoliday = db.prepare(
  'INSERT OR IGNORE INTO holidays (date, name, type) VALUES (?, ?, ?)'
);

const insertNotification = db.prepare(
  'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)'
);

// ─── ADMIN ───
const adminId = insertUser.run('Admin User', 'admin@adsl.edu.in', password, 'admin', 'Administration', null, 0, 0, null, 'approved').lastInsertRowid;

// ─── FACULTY ───
const facultyComp = insertUser.run('Prof. Sharma', 'sharma@adsl.edu.in', password, 'faculty', 'Computer Engineering', null, 0, 0, null, 'approved').lastInsertRowid;
const facultyMech = insertUser.run('Prof. Patil', 'patil@adsl.edu.in', password, 'faculty', 'Mechanical Engineering', null, 0, 0, null, 'approved').lastInsertRowid;
const facultyElec = insertUser.run('Prof. Kulkarni', 'kulkarni@adsl.edu.in', password, 'faculty', 'Electrical Engineering', null, 0, 0, null, 'approved').lastInsertRowid;
const facultyCivil = insertUser.run('Prof. Desai', 'desai@adsl.edu.in', password, 'faculty', 'Civil Engineering', null, 0, 0, null, 'approved').lastInsertRowid;

// ─── STUDENTS (16 across 4 departments × 4 years) ───
const students = {};
let studentIdx = 0;

function addStudent(key, name, email, dept, year) {
  const total = 180 + Math.floor(Math.random() * 30);
  const attended = total - Math.floor(Math.random() * 25) - 5;
  const pid = insertUser.run(name, email, password, 'student', dept, year, total, attended, `parent.${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`, 'approved').lastInsertRowid;
  students[key] = pid;
}

// Computer Engineering — 40 students per year
const firstNames = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Shivansh','Ayaan','Ishaan','Ananya','Diya','Ishita','Myra','Aadhya','Kavya','Prisha','Sara','Aanya','Saanvi','Rohan','Kunal','Manoj','Suresh','Dinesh','Nitin','Gaurav','Harsh','Ravi','Rajesh','Deepak','Rakesh','Nilesh','Sanjay','Vijay','Ajay','Sachin','Ashok','Pramod','Vikas','Anjali','Neha','Pooja','Sneha','Rina','Komal','Swati','Divya','Shweta','Priya','Manisha','Rupali','Vaishali','Shruti','Nandini','Trupti','Ashwini','Mrunal','Rajashree','Pallavi'];
const lastNames = ['Patil','Shinde','Joshi','Kulkarni','Deshmukh','More','Pawar','Jadhav','Bhosale','Salunkhe','Gaikwad','Nikam','Kale','Aher','Kadam','Ghorpade','Phadke','Apte','Sathe','Bapat','Dixit','Gokhale','Kulkarni','Bhave','Joshi','Kothari','Lad','Mane','Marathe','Nadkarni','Oak','Paranjpe','Pendse','Rajadhyaksha','Sohoni','Thakur','Vaidya','Wagh','Yadav','Zope'];

const years = ['FE', 'SE', 'TE', 'BE'];
for (const year of years) {
  for (let i = 0; i < 40; i++) {
    const idx = studentIdx++;
    const fn = firstNames[idx % firstNames.length];
    const ln = lastNames[idx % lastNames.length];
    const name = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${idx}@comp.adsl.edu.in`;
    addStudent(`comp_${year.toLowerCase()}_${i}`, name, email, 'Computer Engineering', year);
  }
}

addStudent('mech_be', 'Amit Deshmukh', 'amit@adsl.edu.in', 'Mechanical Engineering', 'BE');
addStudent('mech_fe', 'Sneha Joshi', 'sneha@adsl.edu.in', 'Mechanical Engineering', 'FE');
addStudent('mech_se', 'Rohit Shinde', 'rohit@adsl.edu.in', 'Mechanical Engineering', 'SE');
addStudent('mech_te', 'Pooja Gaikwad', 'pooja@adsl.edu.in', 'Mechanical Engineering', 'TE');

addStudent('elec_fe', 'Sagar Jadhav', 'sagar@adsl.edu.in', 'Electrical Engineering', 'FE');
addStudent('elec_se', 'Kiran Bhosale', 'kiran@adsl.edu.in', 'Electrical Engineering', 'SE');
addStudent('elec_te', 'Madhuri Pawar', 'madhuri@adsl.edu.in', 'Electrical Engineering', 'TE');
addStudent('elec_be', 'Vijay Salunkhe', 'vijay@adsl.edu.in', 'Electrical Engineering', 'BE');

addStudent('civil_fe', 'Sonali More', 'sonali@adsl.edu.in', 'Civil Engineering', 'FE');
addStudent('civil_se', 'Akash Nikam', 'akash@adsl.edu.in', 'Civil Engineering', 'SE');
addStudent('civil_te', 'Dipti Kale', 'dipti@adsl.edu.in', 'Civil Engineering', 'TE');
addStudent('civil_be', 'Prashant Aher', 'prashant@adsl.edu.in', 'Civil Engineering', 'BE');

// ─── HOLIDAYS / ACADEMIC CALENDAR ───
const holidays = [
  ['2025-01-26', 'Republic Day', 'national'],
  ['2025-03-14', 'Holi', 'festival'],
  ['2025-03-31', 'Id-ul-Fitr', 'festival'],
  ['2025-04-14', 'Dr. Ambedkar Jayanti', 'national'],
  ['2025-05-01', 'Maharashtra Day', 'state'],
  ['2025-06-15', 'Summer Vacation Start', 'vacation'],
  ['2025-07-01', 'Academic Year Start', 'academic'],
  ['2025-08-15', 'Independence Day', 'national'],
  ['2025-08-27', 'Ganesh Chaturthi', 'festival'],
  ['2025-10-02', 'Gandhi Jayanti', 'national'],
  ['2025-10-22', 'Diwali', 'festival'],
  ['2025-10-23', 'Diwali', 'festival'],
  ['2025-10-24', 'Diwali', 'festival'],
  ['2025-11-15', 'Exam Week 1', 'exam'],
  ['2025-11-22', 'Exam Week 2', 'exam'],
  ['2025-12-25', 'Christmas', 'festival'],
  ['2026-01-26', 'Republic Day', 'national'],
  ['2026-03-04', 'Holi', 'festival'],
  ['2026-07-01', 'Academic Year Start', 'academic'],
  ['2026-08-15', 'Independence Day', 'national'],
  ['2026-09-07', 'Ganesh Chaturthi', 'festival'],
  ['2026-10-02', 'Gandhi Jayanti', 'national'],
  ['2026-10-29', 'Diwali', 'festival'],
  ['2026-10-30', 'Diwali', 'festival'],
  ['2026-10-31', 'Diwali', 'festival'],
  ['2026-11-16', 'Id-ul-Fitr', 'festival'],
  ['2026-11-23', 'Exam Week 1', 'exam'],
  ['2026-11-30', 'Exam Week 2', 'exam'],
  ['2026-12-25', 'Christmas', 'festival'],
  ['2027-01-26', 'Republic Day', 'national'],
];
for (const [date, name, type] of holidays) {
  insertHoliday.run(date, name, type);
}

// ─── LEAVE RECORDS (40+ entries) ───
const reasons = {
  sick: ['High fever and severe cold', 'Stomach infection and weakness', 'Migraine and dizziness', 'Viral fever', 'Food poisoning', 'Eye infection', 'Back pain', 'Chest congestion', 'Allergic reaction', 'Dengue recovery'],
  casual: ['Family wedding to attend', 'Personal appointment', 'Religious ceremony', 'Family function', 'Trip with family', 'Blood donation camp', 'Sports event participation', 'Cousin\'s engagement ceremony'],
  personal: ['Need to visit hometown', 'Bank work', 'Government office work', 'Family medical emergency', 'Sibling school function', 'Medical checkup'],
  emergency: ['Family emergency - urgent matter at home', 'Sudden illness in family', 'Accident at home', 'Relative passed away', 'Urgent court hearing']
};

const statuses = ['approved', 'approved', 'approved', 'approved', 'rejected', 'pending', 'approved', 'approved'];
const now = new Date();
const startDates = [];
for (let i = 0; i < 60; i++) {
  const d = new Date(now);
  d.setDate(d.getDate() - i * 3 - Math.floor(Math.random() * 2));
  startDates.push(d.toISOString().split('T')[0]);
}

const deptKeys = Object.keys(students);
const deptToFaculty = { comp: facultyComp, mech: facultyMech, elec: facultyElec, civil: facultyCivil };

// Group students by department prefix for balanced distribution
const deptGroups = { comp: [], mech: [], elec: [], civil: [] };
for (const key of deptKeys) {
  const prefix = key.split('_')[0];
  if (deptGroups[prefix]) deptGroups[prefix].push(key);
}

let leaveCount = 0;
// Generate 12 leaves per department group (48 total) — distributed across years within each dept
for (const [prefix, groupKeys] of Object.entries(deptGroups)) {
  for (let i = 0; i < 12; i++) {
    const studentKey = groupKeys[i % groupKeys.length];
    const userId = students[studentKey];
    const typeKeys = ['sick', 'sick', 'casual', 'casual', 'personal', 'emergency', 'casual', 'sick'];
    const type = typeKeys[i % typeKeys.length];
    const reasonsList = reasons[type];
    const reason = reasonsList[i % reasonsList.length];
    const start = startDates[leaveCount % startDates.length];
    const s = new Date(start);
    const duration = type === 'sick' ? 2 : type === 'emergency' ? 3 : 1;
    s.setDate(s.getDate() + duration);
    const end = s.toISOString().split('T')[0];
    const status = statuses[i % statuses.length];
    const approvedBy = status === 'approved' ? deptToFaculty[prefix] : null;
    let comment = null;
    if (status === 'approved') {
      comment = 'Approved. Ensure you catch up on missed lectures and assignments.';
    }
    insertLeave.run(userId, type, start, end, reason, status, approvedBy, comment);
    leaveCount++;
  }
}

// ─── NOTIFICATIONS ───
const sampleNotifs = [
  ['Leave Approved', 'Your sick leave (Jan 15-16) has been approved by Prof. Sharma.', 'success'],
  ['Leave Rejected', 'Your casual leave request has been reviewed.', 'error'],
  ['Attendance Warning', 'Your attendance is at 74%. Please be regular to maintain 75%.', 'warning'],
  ['Upcoming Exam', 'Exam week starts Nov 15. Plan your leaves accordingly.', 'info'],
  ['Holiday', 'Republic Day on Jan 26 is a holiday.', 'info'],
];
for (const [title, msg, type] of sampleNotifs) {
  insertNotification.run(students[deptKeys[0]], title, msg, type);
}

console.log(`\n✓ Seed complete!`);
console.log(`  Users: ${Object.keys(students).length + 5}`);
console.log(`  Leaves: ${leaveCount}`);
console.log(`  Holidays: ${holidays.length}`);
console.log(`  Notifications: ${sampleNotifs.length}`);
console.log('');
console.log('Login credentials (password: password123):');
console.log('  Admin:   admin@adsl.edu.in');
console.log('  Faculty: sharma@adsl.edu.in, patil@adsl.edu.in, kulkarni@adsl.edu.in, desai@adsl.edu.in');
console.log('  Students (Computers): 160 students (40 per year), e.g. aarav.patil0@comp.adsl.edu.in');
console.log('  Students (Others):    amit@adsl.edu.in, sneha@adsl.edu.in, rohit@adsl.edu.in, pooja@adsl.edu.in');
console.log('                        sagar@adsl.edu.in, kiran@adsl.edu.in, madhuri@adsl.edu.in, vijay@adsl.edu.in');
console.log('                        sonali@adsl.edu.in, akash@adsl.edu.in, dipti@adsl.edu.in, prashant@adsl.edu.in');
console.log('  Password for all: password123');
