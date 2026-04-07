const nodemailer = require("nodemailer");
const logger = require("../config/logger");

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendProjectInvitation = async ({ toEmail, inviterName, projectName, inviteToken }) => {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const inviteLink = `${appUrl}/invitations/accept/${inviteToken}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="text-align:center;margin-bottom:30px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#EF4444;margin-bottom:16px;">
          <span style="color:white;font-weight:bold;font-size:18px;">A</span>
        </div>
        <h1 style="margin:0;font-size:24px;color:#111827;">You've been invited!</h1>
      </div>

      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 12px;color:#374151;font-size:16px;">
          <strong>${inviterName}</strong> has invited you to collaborate on the project
          <strong>${projectName}</strong>.
        </p>
        <p style="margin:0;color:#6B7280;font-size:14px;">
          Click the button below to view the project and start collaborating.
        </p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${inviteLink}"
           style="display:inline-block;background:#4F46E5;color:white;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:16px;">
          View Project
        </a>
      </div>

      <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0;">
        This invitation will expire in 7 days. If you didn't expect this invitation, you can ignore this email.
      </p>
    </div>
  `;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Asana App" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${inviterName} invited you to collaborate on ${projectName}`,
    html,
  });

  logger.info({ message: "Project invitation email sent", toEmail, projectName });
};

module.exports = { sendProjectInvitation };
