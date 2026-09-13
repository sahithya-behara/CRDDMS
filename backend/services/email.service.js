// services/email.service.js — Official JNTU-GV real-time institutional email delivery service
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let transporterPromise = null;

/**
 * Initializes or reuses the SMTP transporter.
 * If credentials are missing, automatically provisions live Ethereal test credentials.
 */
async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    let host = process.env.SMTP_HOST;
    let port = parseInt(process.env.SMTP_PORT || '587', 10);
    let user = process.env.SMTP_USER;
    let pass = process.env.SMTP_PASS;
    let secure = process.env.SMTP_SECURE === 'true';

    // Auto-generate real Ethereal SMTP test account if unconfigured
    if (!host || !user || !pass) {
      try {
        console.log('⚡ No SMTP credentials configured. Generating live sample test account via Ethereal Email…');
        const testAccount = await nodemailer.createTestAccount();
        host = testAccount.smtp.host;
        port = testAccount.smtp.port;
        user = testAccount.user;
        pass = testAccount.pass;
        secure = testAccount.smtp.secure;
        console.log(`✅ Sample SMTP Account Ready: ${user}`);
      } catch (err) {
        console.error('⚠️ Could not generate sample test account:', err.message);
      }
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  })();

  return transporterPromise;
}

/**
 * Helper to dispatch and log email delivery with real-time web inbox preview URL.
 */
async function dispatchMail(mailOptions, emailType) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`📧 REAL-TIME EMAIL DISPATCHED via SMTP [${emailType}]`);
    console.log(`✉️  Recipient: ${mailOptions.to}`);
    console.log(`✉️  Subject:   ${mailOptions.subject}`);
    console.log(`🆔 Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log('');
      console.log(`🔗 LIVE WEB INBOX LINK:`);
      console.log(`   ${previewUrl}`);
      console.log('   👉 Click or open the link above in your browser to view the rendered email!');
    }
    console.log('─────────────────────────────────────────────────────────────────');

    return { success: true, mode: 'smtp', messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`❌ SMTP delivery failed (${emailType}):`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches an official password recovery email.
 */
export async function sendPasswordResetEmail({ toEmail, userName, resetUrl, expiresInMinutes = 15 }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"JNTU-GV CRDDMS Portal" <support.crddms@jntugv.edu.in>',
    to: toEmail,
    subject: 'JNTU-GV CRDDMS — Password Reset Request',
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #0B3D91;">
          <h1 style="color:#0B3D91;font-size:22px;margin:0;letter-spacing:-0.5px;">JNTU-GV CRDDMS</h1>
          <p style="color:#8B6D10;font-size:12px;font-weight:700;text-transform:uppercase;margin:4px 0 0 0;">Institutional Records &amp; Document Management System</p>
        </div>
        <div style="padding:24px 0;">
          <p style="color:#1e293b;font-size:14px;line-height:1.6;">Dear <strong>${userName || 'User'}</strong>,</p>
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            A request has been initiated to reset the password for your JNTU-GV CRDDMS account (<code>${toEmail}</code>).
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            Click the button below to establish a new password. For institutional security, this link is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background-color:#0B3D91;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;display:inline-block;box-shadow:0 4px 12px rgba(11,61,145,0.2);">
              Reset Portal Password
            </a>
          </div>
          <p style="color:#64748b;font-size:12px;line-height:1.6;">
            If the button above does not work, copy and paste the following link into your web browser:<br/>
            <a href="${resetUrl}" style="color:#0B3D91;word-break:break-all;">${resetUrl}</a>
          </p>
          <div style="margin-top:24px;padding:12px 16px;background:#f8fafc;border-left:4px solid #d97706;border-radius:4px;">
            <p style="color:#92400e;font-size:12px;margin:0;font-weight:600;">
              If you did not make this request, please disregard this email or contact the JNTU-GV Department of IT security desk immediately.
            </p>
          </div>
        </div>
        <div style="text-align:center;padding-top:16px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:11px;">
          <p style="margin:0;">Jawaharlal Nehru Technological University Gurajada Vizianagaram · Vizianagaram, AP 535003</p>
          <p style="margin:4px 0 0 0;">Department of Information Technology · Automated Institutional Service</p>
        </div>
      </div>
    `,
  };

  return dispatchMail(mailOptions, 'PASSWORD RESET');
}

/**
 * Dispatches an official email verification link to a newly registered user.
 */
export async function sendVerificationEmail({ toEmail, userName, verifyUrl, expiresInHours = 24 }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"JNTU-GV CRDDMS Portal" <support.crddms@jntugv.edu.in>',
    to: toEmail,
    subject: 'JNTU-GV CRDDMS — Verify Your Institutional Email Address',
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #0B3D91;">
          <h1 style="color:#0B3D91;font-size:22px;margin:0;letter-spacing:-0.5px;">JNTU-GV CRDDMS</h1>
          <p style="color:#8B6D10;font-size:12px;font-weight:700;text-transform:uppercase;margin:4px 0 0 0;">Institutional Registration Verification</p>
        </div>
        <div style="padding:24px 0;">
          <p style="color:#1e293b;font-size:14px;line-height:1.6;">Dear <strong>${userName || 'User'}</strong>,</p>
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            Thank you for registering on the <strong>JNTU-GV College Records Digitalization &amp; Document Management System (CRDDMS)</strong>.
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            In accordance with institutional security policies, you must verify your email address to confirm your registration. Once verified, your account will be queued for <strong>Super Admin Review &amp; Approval</strong> before access is granted.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyUrl}" style="background-color:#0B3D91;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;display:inline-block;box-shadow:0 4px 12px rgba(11,61,145,0.2);">
              Verify My Email
            </a>
          </div>
          <p style="color:#64748b;font-size:12px;line-height:1.6;">
            If the button above does not work, copy and paste the following link into your browser:<br/>
            <a href="${verifyUrl}" style="color:#0B3D91;word-break:break-all;">${verifyUrl}</a>
          </p>
          <div style="margin-top:24px;padding:12px 16px;background:#f8fafc;border-left:4px solid #0B3D91;border-radius:4px;">
            <p style="color:#1e293b;font-size:12px;margin:0;line-height:1.5;">
              <strong>Note:</strong> This single-use verification link will expire in <strong>${expiresInHours} hours</strong>. If you did not register for a JNTU-GV account, please ignore this email.
            </p>
          </div>
        </div>
        <div style="text-align:center;padding-top:16px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:11px;">
          <p style="margin:0;">Jawaharlal Nehru Technological University Gurajada Vizianagaram · Vizianagaram, AP 535003</p>
          <p style="margin:4px 0 0 0;">Department of Information Technology · Automated Institutional Service</p>
        </div>
      </div>
    `,
  };

  return dispatchMail(mailOptions, 'EMAIL VERIFICATION');
}

/**
 * Dispatches an account approval confirmation email to the user.
 */
export async function sendAccountApprovedEmail({ toEmail, userName, loginUrl }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"JNTU-GV CRDDMS Portal" <support.crddms@jntugv.edu.in>',
    to: toEmail,
    subject: 'JNTU-GV CRDDMS — Account Approved & Activated',
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #16a34a;">
          <h1 style="color:#0B3D91;font-size:22px;margin:0;">JNTU-GV CRDDMS</h1>
          <p style="color:#16a34a;font-size:12px;font-weight:700;text-transform:uppercase;margin:4px 0 0 0;">Account Approval Notification</p>
        </div>
        <div style="padding:24px 0;">
          <p style="color:#1e293b;font-size:14px;line-height:1.6;">Dear <strong>${userName || 'User'}</strong>,</p>
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            We are pleased to inform you that your registration for the <strong>JNTU-GV CRDDMS Portal</strong> has been reviewed and <strong>approved by the Super Administrator</strong>.
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            Your account is now <strong>ACTIVE</strong>. You can now log in using your registered credentials.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}" style="background-color:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;display:inline-block;box-shadow:0 4px 12px rgba(22,163,74,0.2);">
              Sign In to CRDDMS Portal
            </a>
          </div>
          <p style="color:#64748b;font-size:12px;line-height:1.6;">
            Login URL: <a href="${loginUrl}" style="color:#0B3D91;">${loginUrl}</a>
          </p>
        </div>
        <div style="text-align:center;padding-top:16px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:11px;">
          <p style="margin:0;">JNTU-GV Vizianagaram · Department of Information Technology</p>
        </div>
      </div>
    `,
  };

  return dispatchMail(mailOptions, 'REGISTRATION APPROVED');
}

/**
 * Dispatches an account rejection notification to the user.
 */
export async function sendAccountRejectedEmail({ toEmail, userName, reason }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"JNTU-GV CRDDMS Portal" <support.crddms@jntugv.edu.in>',
    to: toEmail,
    subject: 'JNTU-GV CRDDMS — Registration Status Update',
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #dc2626;">
          <h1 style="color:#0B3D91;font-size:22px;margin:0;">JNTU-GV CRDDMS</h1>
          <p style="color:#dc2626;font-size:12px;font-weight:700;text-transform:uppercase;margin:4px 0 0 0;">Registration Status Notice</p>
        </div>
        <div style="padding:24px 0;">
          <p style="color:#1e293b;font-size:14px;line-height:1.6;">Dear <strong>${userName || 'User'}</strong>,</p>
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            Thank you for your interest in the JNTU-GV CRDDMS platform. Following administrative review, we regret to inform you that your registration request was not approved at this time.
          </p>
          ${reason ? `
            <div style="margin:20px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
              <p style="color:#991b1b;font-size:13px;margin:0;"><strong>Administrative Note:</strong> ${reason}</p>
            </div>
          ` : ''}
          <p style="color:#475569;font-size:14px;line-height:1.6;">
            If you believe this decision was in error or require further assistance, please reach out directly to the JNTU-GV Department of IT Administrative Desk.
          </p>
        </div>
        <div style="text-align:center;padding-top:16px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:11px;">
          <p style="margin:0;">JNTU-GV Vizianagaram · Department of Information Technology</p>
        </div>
      </div>
    `,
  };

  return dispatchMail(mailOptions, 'REGISTRATION REJECTED');
}
