const nodemailer = require('nodemailer');
const db = require('../config/database');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log(`\n[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${html.replace(/<[^>]+>/g, '').substring(0, 200)}...\n`);
    return Promise.resolve({ messageId: 'dev-mode' });
  }
  return transporter.sendMail({ from: `"Leave Management System" <${process.env.SMTP_USER}>`, to, subject, html });
}

function getStudentEmail(studentId) {
  const user = db.prepare('SELECT email, parent_email, name FROM users WHERE id = ?').get(studentId);
  return user;
}

function sendLeaveNotification(studentId, leave, status, comment, approverName) {
  const user = getStudentEmail(studentId);
  if (!user) return;

  const statusEmoji = status === 'approved' ? 'Approved' : 'Rejected';
  const color = status === 'approved' ? '#16a34a' : '#dc2626';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 1.5rem; background: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width:56px;height:56px;margin:0 auto 0.5rem;background:${color};border-radius:14px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:1.5rem;">${status === 'approved' ? '\u2713' : '\u2717'}</span>
        </div>
        <h2 style="margin:0;color:#0f172a;font-size:1.2rem;">Leave ${statusEmoji}</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.85rem;">Student</td><td style="padding:0.75rem 1rem;font-weight:600;font-size:0.85rem;">${user.name}</td></tr>
        <tr><td style="padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.85rem;">Type</td><td style="padding:0.75rem 1rem;font-weight:600;font-size:0.85rem;">${leave.leave_type}</td></tr>
        <tr><td style="padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.85rem;">Dates</td><td style="padding:0.75rem 1rem;font-weight:600;font-size:0.85rem;">${leave.start_date} - ${leave.end_date}</td></tr>
        <tr><td style="padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.85rem;">Reason</td><td style="padding:0.75rem 1rem;font-size:0.85rem;">${leave.reason}</td></tr>
        <tr><td style="padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.85rem;">Status</td><td style="padding:0.75rem 1rem;"><span style="background:${color}15;color:${color};padding:2px 10px;border-radius:100px;font-weight:600;font-size:0.8rem;">${statusEmoji}</span></td></tr>
        ${comment ? `<tr><td style="padding:0.75rem 1rem;color:#64748b;font-size:0.85rem;">Comment</td><td style="padding:0.75rem 1rem;font-size:0.85rem;">${comment}</td></tr>` : ''}
        <tr><td style="padding:0.75rem 1rem;color:#64748b;font-size:0.85rem;">Reviewed by</td><td style="padding:0.75rem 1rem;font-weight:600;font-size:0.85rem;">${approverName}</td></tr>
      </table>
      <p style="text-align:center;color:#94a3b8;font-size:0.75rem;margin-top:1rem;">Adsul's Technical Campus &middot; Leave Management System</p>
    </div>
  `;

  const subject = `[Leave ${statusEmoji}] ${leave.leave_type} leave - ${user.name}`;

  sendEmail({ to: user.email, subject, html });

  if (user.parent_email) {
    sendEmail({ to: user.parent_email, subject: `[Leave ${statusEmoji}] ${user.name} - ${leave.leave_type}`, html });
  }
}

module.exports = { sendLeaveNotification };
