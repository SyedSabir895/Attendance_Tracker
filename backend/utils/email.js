const createTransporter = require('../config/email');

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
    text,
  };
  const info = await transporter.sendMail(mailOptions);
  return info;
};

const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Reset Password</title></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1e40af;padding:30px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">Attendance System</h1>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;padding:30px;border-radius:0 0 8px 8px;">
        <h2 style="color:#111827;">Password Reset Request</h2>
        <p style="color:#6b7280;">Hello <strong>${name}</strong>,</p>
        <p style="color:#6b7280;">You requested a password reset. Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" style="background:#1e40af;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password</a>
        </div>
        <p style="color:#9ca3af;font-size:13px;">If you didn't request this, ignore this email. Your password won't change.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Attendance System. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject: 'Password Reset Request', html });
};

const sendLeaveNotificationEmail = async (adminEmail, adminName, employeeName, leaveType, startDate, endDate) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2>New Leave Request</h2>
      <p>Hello <strong>${adminName}</strong>,</p>
      <p><strong>${employeeName}</strong> has submitted a ${leaveType} leave request.</p>
      <ul>
        <li><strong>Type:</strong> ${leaveType}</li>
        <li><strong>From:</strong> ${new Date(startDate).toDateString()}</li>
        <li><strong>To:</strong> ${new Date(endDate).toDateString()}</li>
      </ul>
      <p>Please login to review and take action.</p>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: `Leave Request from ${employeeName}`, html });
};

const sendLeaveStatusEmail = async (employeeEmail, employeeName, leaveType, status, remarks) => {
  const color = status === 'approved' ? '#16a34a' : '#dc2626';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:${color};">Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
      <p>Hello <strong>${employeeName}</strong>,</p>
      <p>Your <strong>${leaveType}</strong> leave request has been <strong style="color:${color};">${status}</strong>.</p>
      ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
    </div>
  `;
  return sendEmail({ to: employeeEmail, subject: `Leave Request ${status}`, html });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendLeaveNotificationEmail, sendLeaveStatusEmail };
