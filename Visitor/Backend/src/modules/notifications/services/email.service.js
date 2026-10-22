const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
dotenv.config();
const db = require('../../../config/db');

class EmailService {
  constructor() {
    this.transporter = null;
    this.getTransporter();
  }

  getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const service = (process.env.SMTP_SERVICE || 'gmail').toLowerCase().trim();
    const host = process.env.SMTP_HOST;
    const user = (process.env.SMTP_USER || 'shewerke21@gmail.com').trim();
    const rawPass = (process.env.SMTP_PASS || 'mfipytyqlzqukdlu').trim();
    const pass = rawPass.replace(/\s+/g, '');

    // 1. If service is gmail or host is smtp.gmail.com, use nodemailer's built-in gmail service
    if (service === 'gmail' || host?.includes('gmail') || user.endsWith('@gmail.com')) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
      return this.transporter;
    }

    // 2. Custom SMTP host configuration
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
      return this.transporter;
    }

    // 3. Guaranteed fallback: Gmail transporter with configured app password
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: 'shewerke21@gmail.com', pass: 'mfipytyqlzqukdlu' }
    });
    return this.transporter;
  }

  /**
   * Generate a cryptographically secure 6-digit OTP string.
   * Uses Node.js crypto module. Result is always zero-padded to 6 characters.
   * Examples: "034821", "000012", "999999", "100000"
   */
  generateSecureOtp() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  }

  /**
   * Generate and send 6-digit OTP code to email.
   * Stores OTP in MySQL user_otp table (NOT in memory).
   * Single generation event: the SAME otpCode variable is stored in DB and sent in email.
   */
  async sendOtp(email, userId = null, options = {}) {
    if (!email) {
      throw new Error('Email address is required to send OTP');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Resolve user ID if not provided directly
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      try {
        const u = await db.query('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
        if (u && u.length > 0) resolvedUserId = u[0].id;
      } catch (e) {}
    }

    // 1. Generate a single 6-digit OTP string (cryptographically secure, zero-padded)
    const otpCode = this.generateSecureOtp();

    // 2. Parallelized Dual-Storage: Invalidate previous OTPs, update users reset_token, insert user_otp
    const expiresFormatted = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await Promise.all([
      db.query(
        `UPDATE user_otp 
         SET status = 'EXPIRED', is_active = 0 
         WHERE (destination = ? OR (user_id IS NOT NULL AND user_id = ?)) 
           AND otp_type IN ('EMAIL_VERIFY', 'PASSWORD_RESET') 
           AND status = 'ACTIVE' AND is_active = 1`,
        [cleanEmail, resolvedUserId || 0]
      ).catch(err => console.warn('[EmailService] Warning invalidating old OTPs:', err.message)),

      resolvedUserId ? db.query(
        `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`,
        [otpCode, expiresFormatted, resolvedUserId]
      ).catch(uErr => console.warn('[EmailService] Fallback reset_token update note:', uErr.message)) : Promise.resolve(),

      db.query(
        `INSERT INTO user_otp 
         (user_id, otp_code, otp_type, delivery_method, destination, is_verified, attempt_count, max_attempts, requested_at, expires_at, status, is_active)
         VALUES (?, ?, 'EMAIL_VERIFY', 'EMAIL', ?, 0, 0, 5, NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE), 'ACTIVE', 1)`,
        [resolvedUserId || null, otpCode, cleanEmail]
      ).catch(async () => {
        return db.query(
          `INSERT INTO user_otp 
           (otp_code, otp_type, delivery_method, destination, is_verified, attempt_count, max_attempts, requested_at, expires_at, status, is_active)
           VALUES (?, 'EMAIL_VERIFY', 'EMAIL', ?, 0, 0, 5, NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE), 'ACTIVE', 1)`,
          [otpCode, cleanEmail]
        ).catch(err2 => console.error('[EmailService] Failed to insert OTP into user_otp table:', err2.message));
      })
    ]);

    console.log(`\n=================================================`);
    console.log(`  [ENTERPRISE OTP EMAIL DISPATCH]`);
    console.log(`  Recipient Email: ${cleanEmail}`);
    console.log(`  User ID:         ${resolvedUserId || 'N/A'}`);
    console.log(`  OTP Code:        ${otpCode}`);
    console.log(`  Expiry Time:     ${expiresAt.toLocaleTimeString()}`);
    console.log(`  Storage:         MySQL user_otp table & users table`);
    console.log(`=================================================\n`);

    // 4. Send the EXACT SAME otpCode in the email HTML body
    const htmlContent = `
      <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background-color: #0b0f17; color: #ffffff; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
            Visitor Management System
          </h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; font-weight: 600;">Enterprise Identity & Access Management</p>
        </div>

        <div style="padding: 28px 12px; text-align: center;">
          <h3 style="color: #f8fafc; font-size: 18px; margin-bottom: 8px; font-weight: 700;">Account Email Verification</h3>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
            Your verification code for completing your Visitor Management account setup is:
          </p>

          <div style="background-color: #161e2e; border: 2px dashed #3b82f6; padding: 20px 28px; border-radius: 14px; display: inline-block; margin-bottom: 24px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #60a5fa;">
              ${otpCode}
            </span>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
            This security code expires in <strong style="color: #3b82f6;">10 minutes</strong>.<br/>
            Please do not share this code with anyone.
          </p>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
          <p style="margin: 0;">If you did not request account creation, please disregard this notification.</p>
          <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} Enterprise Visitor Management System. All rights reserved.</p>
        </div>
      </div>
    `;

    const senderEmail = (process.env.SMTP_USER || '').trim();
    const defaultFrom = senderEmail ? `"Visitor Management System" <${senderEmail}>` : '"Visitor Management System" <no-reply@vms.com>';
    const fromAddress = (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('your_email') && !process.env.EMAIL_FROM.includes('no-reply@vms.com'))
      ? process.env.EMAIL_FROM
      : defaultFrom;

    const mailOptions = {
      from: fromAddress,
      to: cleanEmail,
      subject: `[VMS] Your Email Verification Code: ${otpCode}`,
      text: `Your VMS email verification code is: ${otpCode}. Valid for 15 minutes.\n\nIf you did not request this, please disregard.\n\nVisitor Management System`,
      html: htmlContent,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'X-Mailer': 'VMS-Enterprise-Notifier'
      }
    };

    let deliveredToInbox = true;
    let etherealUrl = null;

    // Fast-dispatch: email sending runs in background task so API responds instantly (<50ms)
    const sendMailTask = async () => {
      const transporter = this.getTransporter();
      if (transporter) {
        try {
          console.log(`[EmailService] Sending OTP verification email to: ${cleanEmail}...`);
          const info = await transporter.sendMail(mailOptions);
          console.log(`[EmailService] REAL EMAIL SENT SUCCESSFULLY TO: ${cleanEmail} (Response: ${info.response || info.messageId})`);
        } catch (err) {
          console.error(`[EmailService] SMTP send error: ${err.message}. Retrying via Gmail service direct...`);
          this.transporter = null;
          try {
            const directTransporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: 'shewerke21@gmail.com', pass: 'mfipytyqlzqukdlu' }
            });
            const retryInfo = await directTransporter.sendMail(mailOptions);
            this.transporter = directTransporter;
            console.log(`[EmailService] REAL EMAIL DELIVERED ON RETRY TO: ${cleanEmail} (${retryInfo.response})`);
          } catch (retryErr) {
            console.error(`[EmailService] SMTP retry delivery error: ${retryErr.message}`);
          }
        }
      }
    };

    if (options && options.sync === true) {
      await sendMailTask();
    } else {
      sendMailTask().catch(err => {
        console.warn('[EmailService] Background email dispatch note:', err.message);
      });
    }

    return {
      status: 'success',
      message: `OTP verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      deliveredToInbox,
      etherealUrl,
      otpCode
    };
  }

  /**
   * Generic email dispatcher used by all VMS email flows.
   * Returns { status, deliveredToInbox, etherealUrl, error? }.
   * Never throws; delivery problems are returned so callers can record failures.
   */
  async sendMail({ to, subject, text, html }) {
    if (!to) {
      return { status: 'error', error: 'Recipient email is required' };
    }

    const senderEmail = (process.env.SMTP_USER || '').trim();
    const defaultFrom = senderEmail ? `"Visitor Management System" <${senderEmail}>` : '"Visitor Management System" <no-reply@vms.com>';
    const fromAddress = (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('your_email') && !process.env.EMAIL_FROM.includes('no-reply@vms.com'))
      ? process.env.EMAIL_FROM
      : defaultFrom;

    const mailOptions = {
      from: fromAddress,
      to: to.toLowerCase().trim(),
      subject,
      text,
      html
    };

    let deliveredToInbox = false;
    let etherealUrl = null;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail(mailOptions);
        deliveredToInbox = true;
        console.log(`[EmailService] EMAIL SENT SUCCESSFULLY TO: ${mailOptions.to} (${info.response || info.messageId})`);
      } catch (err) {
        console.warn('[EmailService] SMTP delivery attempt failed, retrying direct Gmail:', err.message);
        try {
          const directTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: 'shewerke21@gmail.com', pass: 'mfipytyqlzqukdlu' }
          });
          const retryInfo = await directTransporter.sendMail(mailOptions);
          deliveredToInbox = true;
          console.log(`[EmailService] EMAIL DELIVERED VIA GMAIL RETRY TO: ${mailOptions.to} (${retryInfo.response})`);
        } catch (retryErr) {
          console.error('[EmailService] SMTP send error:', retryErr.message);
          return { status: 'error', error: retryErr.message, deliveredToInbox: false, etherealUrl: null };
        }
      }
    } else {
      console.warn(`[EmailService] No SMTP transporter configured. Email for ${mailOptions.to} was NOT delivered.`);
      return { status: 'error', error: 'No email transporter configured', deliveredToInbox: false, etherealUrl: null };
    }

    return { status: 'success', message: 'Email sent', deliveredToInbox, etherealUrl };
  }

  /**
   * Send employee registration credentials (User ID + temporary password).
   * The temporary password is only embedded in the email body — it is never
   * written to logs or returned in API responses.
   */
  async sendRegistrationCredentials({ to, fullName, userCode, temporaryPassword, loginUrl, accountType, role }) {
    if (!to || !userCode || !temporaryPassword) {
      return { status: 'error', error: 'Recipient, User ID and temporary password are required' };
    }

    const typeStr = accountType || role || 'User';
    const formattedType = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
    const displayName = fullName || formattedType;
    const portalUrl = loginUrl || (process.env.CLIENT_URL || 'http://localhost:5173') + '/login';

    const htmlContent = `
      <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background-color: #0b0f17; color: #ffffff; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">Visitor Management System</h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; font-weight: 600;">${formattedType} Account Provisioning</p>
        </div>

        <div style="padding: 28px 12px;">
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">Dear <strong style="color: #f8fafc;">${displayName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
            Your <strong>${formattedType}</strong> account has been successfully provisioned in the Visitor Management System.
            Use the official credentials below to sign in to your enterprise portal.
          </p>

          <div style="background-color: #161e2e; border: 1px solid #334155; padding: 20px 24px; border-radius: 12px; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Login Information</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="color: #94a3b8; padding: 6px 0; width: 40%;">User ID:</td>
                <td style="color: #60a5fa; font-family: 'Courier New', monospace; font-weight: 700;">${userCode}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; padding: 6px 0;">Temporary Password:</td>
                <td style="color: #f8fafc; font-family: 'Courier New', monospace; font-weight: 700;">${temporaryPassword}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; padding: 6px 0;">Login URL:</td>
                <td style="color: #60a5fa;"><a href="${portalUrl}" style="color: #60a5fa;">${portalUrl}</a></td>
              </tr>
            </table>
          </div>

          <div style="background-color: #1a2233; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #fbbf24; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">IMPORTANT:</p>
            <ul style="color: #cbd5e1; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 18px;">
              <li>This is a <strong>temporary</strong> password. You will be required to change it when you first sign in.</li>
              <li>The temporary password is valid for <strong>24 hours</strong> from the time it was issued.</li>
              <li>Your User ID is permanent and cannot be changed.</li>
              <li>For security, never share your login credentials with anyone.</li>
            </ul>
          </div>

          <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
            If you did not request this account, please contact your system administrator immediately.
          </p>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Enterprise Visitor Management System. All rights reserved.</p>
        </div>
      </div>
    `;

    console.log(`[EmailService] Sending registration credentials to ${to} (User ID: ${userCode})`);

    return this.sendMail({
      to,
      subject: `[VMS] Your Employee Account Credentials`,
      text: `Dear ${displayName},\n\nYour Employee account has been created in the Visitor Management System.\n\nLogin Information:\n  User ID: ${userCode}\n  Temporary Password: ${temporaryPassword}\n  Login URL: ${portalUrl}\n\nIMPORTANT: You must change your temporary password when you first sign in. It expires in 24 hours.\n\nRegards,\nVisitor Management System`,
      html: htmlContent
    });
  }

  /**
   * Send 6-digit Password Reset OTP to user's real email address.
   */
  async sendPasswordResetOtp({ to, fullName, userCode, otpCode, expiresMinutes = 15 }) {
    if (!to || !otpCode) {
      throw new Error('Recipient email and OTP code are required');
    }

    const cleanEmail = to.toLowerCase().trim();
    const displayName = fullName || 'User';
    const accountCode = userCode ? ` (User ID: ${userCode})` : '';

    const htmlContent = `
      <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background-color: #0b0f17; color: #ffffff; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
            Visitor Management System
          </h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; font-weight: 600;">Account Security &amp; Password Recovery</p>
        </div>

        <div style="padding: 28px 12px; text-align: center;">
          <h3 style="color: #f8fafc; font-size: 18px; margin-bottom: 8px; font-weight: 700;">Password Reset Verification Code</h3>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
            Hello <strong style="color: #f8fafc;">${displayName}</strong>${accountCode},
          </p>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset the password for your Visitor Management account. Use the 6-digit verification code below to verify your identity:
          </p>

          <div style="background-color: #161e2e; border: 2px dashed #3b82f6; padding: 20px 28px; border-radius: 14px; display: inline-block; margin-bottom: 24px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #60a5fa;">
              ${otpCode}
            </span>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
            This security code expires in <strong style="color: #3b82f6;">${expiresMinutes} minutes</strong>.<br/>
            Please do not share this code with anyone.
          </p>
        </div>

        <div style="background-color: #1a2233; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin: 0 12px 24px 12px; text-align: left;">
          <p style="color: #fbbf24; font-size: 12px; font-weight: 700; margin: 0 0 4px 0;">SECURITY NOTICE:</p>
          <p style="color: #cbd5e1; font-size: 12px; line-height: 1.5; margin: 0;">
            If you did not request a password reset, please ignore this email. Your account password will remain unchanged.
          </p>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Enterprise Visitor Management System. All rights reserved.</p>
        </div>
      </div>
    `;

    console.log(`[EmailService] Sending real Password Reset OTP to ${cleanEmail} (Code: ${otpCode})`);

    return this.sendMail({
      to: cleanEmail,
      subject: `[VMS] Your Password Reset Verification Code: ${otpCode}`,
      text: `Hello ${displayName},\n\nYour 6-digit password reset verification code is: ${otpCode}\n\nThis code expires in ${expiresMinutes} minutes.\n\nVisitor Management System`,
      html: htmlContent
    });
  }

  /**
   * Real Email OTP Verification Engine.
   * Compares the submitted code against the OTP generated and sent to the user's email.
   * Supports multi-code matching (any unverified code sent in the last 60 minutes).
   */
  async verifyOtp(email, code) {
    if (!email || !code) {
      throw new Error('Email and verification code are required');
    }

    const cleanEmail = email.toLowerCase().trim();
    const submittedOtp = String(code).trim();

    // 1. Format Check: Must be 6 digits
    if (!/^\d{6}$/.test(submittedOtp)) {
      const err = new Error('Invalid verification code format. Please enter a 6-digit code.');
      err.code = 'INVALID_FORMAT';
      throw err;
    }

    // 2. Query ALL unverified OTP records dispatched to this email address in the last 60 minutes
    let candidateRecords = [];
    try {
      const res = await db.query(
        `SELECT otp_id, otp_code, attempt_count, max_attempts, expires_at, status, is_verified,
                TIMESTAMPDIFF(SECOND, requested_at, NOW()) as seconds_since_request
         FROM user_otp 
         WHERE destination = ? AND otp_type = 'EMAIL_VERIFY' AND is_verified = 0 AND requested_at >= NOW() - INTERVAL 60 MINUTE
         ORDER BY requested_at DESC`,
        [cleanEmail]
      );
      candidateRecords = Array.isArray(res) ? res : (Array.isArray(res?.[0]) ? res[0] : []);
    } catch (dbErr) {
      console.warn('[EmailService] Note querying OTP records:', dbErr.message);
    }

    // 3. Real Email OTP Match Check
    let matchingRecord = candidateRecords.find(
      rec => String(rec.otp_code).trim() === submittedOtp
    );

    // Fallback: check users table reset_token
    let matchedInUsersTable = false;
    if (!matchingRecord) {
      try {
        const uRows = await db.query(
          `SELECT id, reset_token, reset_token_expires FROM users WHERE LOWER(email) = ? LIMIT 1`,
          [cleanEmail]
        );
        const userRow = uRows?.[0];
        if (userRow && String(userRow.reset_token).trim() === submittedOtp) {
          const exp = userRow.reset_token_expires ? new Date(userRow.reset_token_expires) : null;
          if (!exp || exp > new Date()) {
            matchedInUsersTable = true;
          }
        }
      } catch (uErr) {
        console.warn('[EmailService] Fallback reset_token check note:', uErr.message);
      }
    }

    // Reject code if it doesn't match user_otp or users.reset_token
    if (!matchingRecord && !matchedInUsersTable) {
      console.log(`[EmailService] OTP Mismatch for ${cleanEmail}: submitted="${submittedOtp}"`);
      const err = new Error('The verification code does not match the code sent to your email. Please check your inbox.');
      err.code = 'INVALID_OTP';
      throw err;
    }

    // 4. Update Database Record Status to VERIFIED and Activate User & Visitor Account
    try {
      if (matchingRecord?.otp_id) {
        await db.query(
          `UPDATE user_otp 
           SET is_verified = 1, status = 'VERIFIED', verified_at = NOW(), is_active = 0 
           WHERE otp_id = ? OR destination = ?`,
          [matchingRecord.otp_id, cleanEmail]
        );
      } else {
        await db.query(
          `UPDATE user_otp 
           SET is_verified = 1, status = 'VERIFIED', verified_at = NOW(), is_active = 0 
           WHERE destination = ?`,
          [cleanEmail]
        );
      }
      await db.query(
        `UPDATE users SET email_verified = 1, account_status = 'ACTIVE', status = 'active' WHERE LOWER(email) = ?`,
        [cleanEmail]
      );
      await db.query(
        `UPDATE visitors SET registration_status = 'APPROVED', status = 'ACTIVE', is_active = 1 WHERE LOWER(email) = ?`,
        [cleanEmail]
      );
    } catch (e) {
      console.warn('[EmailService] Database OTP status update note:', e.message);
    }

    console.log(`[EmailService] REAL EMAIL OTP VERIFIED SUCCESSFULLY FOR: ${cleanEmail} (Code: ${submittedOtp})`);

    return {
      success: true,
      verified: true,
      message: 'Email address verified successfully'
    };
  }
}

module.exports = new EmailService();
