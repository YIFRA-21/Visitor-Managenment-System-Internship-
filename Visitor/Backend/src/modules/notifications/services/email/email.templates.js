/**
 * Enterprise Email Templates
 * ────────────────────────────
 * Professional, branded, responsive HTML & plain-text templates for all 9 VMS flows.
 */

const baseStyles = {
  container: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0b1120; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);",
  header: "background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #334155;",
  brandTitle: "color: #38bdf8; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;",
  brandSubtitle: "color: #94a3b8; font-size: 13px; margin-top: 6px; font-weight: 500; letter-spacing: 0.2px;",
  content: "padding: 32px 28px;",
  footer: "padding: 24px 28px; background-color: #070d19; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;",
  button: "display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px; margin: 20px 0; text-align: center;",
  otpBox: "background-color: #111c33; border: 2px dashed #38bdf8; border-radius: 12px; padding: 20px 32px; display: inline-block; margin: 24px auto; text-align: center;",
  otpCode: "font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #38bdf8;",
  infoCard: "background-color: #131d31; border: 1px solid #243553; border-radius: 12px; padding: 20px; margin: 20px 0;",
  warningBox: "background-color: #271d11; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 24px 0;",
};

function renderLayout(title, subtitle, bodyHtml) {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #020617;">
  <div style="${baseStyles.container}">
    <div style="${baseStyles.header}">
      <h1 style="${baseStyles.brandTitle}">Visitor Management System</h1>
      <p style="${baseStyles.brandSubtitle}">${subtitle || 'Enterprise Access & Security Management'}</p>
    </div>
    <div style="${baseStyles.content}">
      ${bodyHtml}
    </div>
    <div style="${baseStyles.footer}">
      <p style="margin: 0 0 8px 0;">This is an automated system notification. Please do not reply directly to this email.</p>
      <p style="margin: 0;">&copy; ${year} Enterprise Visitor Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 1. Template: New Staff / Employee Account Provisioning
 */
function templateNewAccount({ fullName, userCode, temporaryPassword, role, loginUrl }) {
  const roleName = (role || 'Staff').charAt(0).toUpperCase() + (role || 'Staff').slice(1);
  const portalUrl = loginUrl || 'https://visitor-managenment-system-internsh-rho.vercel.app/login';
  
  const html = renderLayout(
    `${roleName} Account Credentials`,
    `${roleName} Account Provisioning`,
    `
      <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0; font-weight: 700;">Account Provisioned Successfully</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
        Hello <strong style="color: #f8fafc;">${fullName || 'Team Member'}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
        Your <strong>${roleName}</strong> account has been configured in the Visitor Management System. Below are your official sign-in credentials:
      </p>

      <div style="${baseStyles.infoCard}">
        <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin: 0 0 12px 0;">Authorized Credentials</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #94a3b8; padding: 6px 0; width: 40%;">User ID:</td>
            <td style="color: #38bdf8; font-family: 'Courier New', monospace; font-weight: 700;">${userCode}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 6px 0;">Temporary Password:</td>
            <td style="color: #f8fafc; font-family: 'Courier New', monospace; font-weight: 700;">${temporaryPassword}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 6px 0;">Assigned Role:</td>
            <td style="color: #10b981; font-weight: 600;">${roleName}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="${portalUrl}" style="${baseStyles.button}">Sign In to Portal</a>
      </div>

      <div style="${baseStyles.warningBox}">
        <p style="color: #fbbf24; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">MANDATORY SECURITY NOTICE:</p>
        <ul style="color: #cbd5e1; font-size: 13px; line-height: 1.7; margin: 0; padding-left: 18px;">
          <li>This is a single-use temporary password. You will be required to create a new password on your first sign-in.</li>
          <li>The temporary password expires in <strong>48 hours</strong>.</li>
          <li>Never share your credentials with anyone. VMS administrators will never ask for your password.</li>
        </ul>
      </div>
    `
  );

  const text = `
Dear ${fullName || 'Team Member'},

Your ${roleName} account has been created in the Enterprise Visitor Management System.

LOGIN CREDENTIALS:
  User ID: ${userCode}
  Temporary Password: ${temporaryPassword}
  Assigned Role: ${roleName}
  Login URL: ${portalUrl}

SECURITY NOTICE:
- You must change this temporary password upon your first sign in.
- This temporary credential expires in 48 hours.
- Keep your User ID permanent and secure.

Visitor Management System
  `.trim();

  return { html, text, subject: `[VMS] Your ${roleName} Account Credentials (User ID: ${userCode})` };
}

/**
 * 2. Template: Department Manager Account
 */
function templateManagerAccount(params) {
  return templateNewAccount({ ...params, role: 'Department Manager' });
}

/**
 * 3. Template: Receptionist Account
 */
function templateReceptionistAccount(params) {
  return templateNewAccount({ ...params, role: 'Receptionist' });
}

/**
 * 4. Template: Security Officer Account
 */
function templateSecurityOfficerAccount(params) {
  return templateNewAccount({ ...params, role: 'Security Officer' });
}

/**
 * 5. Template: Visitor Email Verification OTP
 */
function templateVisitorOtp({ fullName, otpCode, expiresMinutes = 5 }) {
  const html = renderLayout(
    'Email Verification Code',
    'Visitor Account Email Verification',
    `
      <div style="text-align: center;">
        <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0; font-weight: 700;">Account Verification Code</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Hello <strong style="color: #f8fafc;">${fullName || 'Visitor'}</strong>,<br/>
          Use the 6-digit verification code below to confirm your email and complete your Visitor account registration:
        </p>

        <div style="${baseStyles.otpBox}">
          <span style="${baseStyles.otpCode}">${otpCode}</span>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-top: 16px;">
          This verification code is valid for <strong style="color: #38bdf8;">${expiresMinutes} minutes</strong>.<br/>
          For your protection, never share this code with anyone.
        </p>
      </div>

      <div style="${baseStyles.infoCard}; margin-top: 24px;">
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
          If you did not initiate this registration, no further action is required. This code will expire automatically.
        </p>
      </div>
    `
  );

  const text = `
Hello ${fullName || 'Visitor'},

Your 6-digit Visitor Management System verification code is: ${otpCode}

This code expires in ${expiresMinutes} minutes. Please enter it to complete your registration.
Do not share this code with anyone.

Visitor Management System
  `.trim();

  return { html, text, subject: `[VMS] Your Email Verification Code: ${otpCode}` };
}

/**
 * 6. Template: Forgot Password OTP
 */
function templatePasswordResetOtp({ fullName, userCode, otpCode, expiresMinutes = 15 }) {
  const userRef = userCode ? ` (User ID: ${userCode})` : '';
  const html = renderLayout(
    'Password Reset Request',
    'Account Security & Password Recovery',
    `
      <div style="text-align: center;">
        <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0; font-weight: 700;">Password Reset Code</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Hello <strong style="color: #f8fafc;">${fullName || 'User'}</strong>${userRef},<br/>
          We received a request to reset the password for your Visitor Management account. Use the code below to proceed:
        </p>

        <div style="${baseStyles.otpBox}">
          <span style="${baseStyles.otpCode}">${otpCode}</span>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-top: 16px;">
          This security code expires in <strong style="color: #38bdf8;">${expiresMinutes} minutes</strong>.
        </p>
      </div>

      <div style="${baseStyles.warningBox}">
        <p style="color: #fbbf24; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">DIDN'T REQUEST THIS?</p>
        <p style="color: #cbd5e1; font-size: 12px; line-height: 1.6; margin: 0;">
          If you did not request a password reset, you can safely ignore this email. Your current password remains active and secure.
        </p>
      </div>
    `
  );

  const text = `
Hello ${fullName || 'User'}${userRef},

We received a request to reset your password.
Your 6-digit verification code is: ${otpCode}

This code expires in ${expiresMinutes} minutes.
If you did not request this, please ignore this email.

Visitor Management System
  `.trim();

  return { html, text, subject: `[VMS] Password Reset Code: ${otpCode}` };
}

/**
 * 7. Template: Password Changed Confirmation
 */
function templatePasswordChanged({ fullName, changeTime, ipAddress }) {
  const html = renderLayout(
    'Password Successfully Changed',
    'Account Security Notice',
    `
      <h2 style="color: #10b981; font-size: 18px; margin-top: 0; font-weight: 700;">Password Changed Successfully</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
        Hello <strong style="color: #f8fafc;">${fullName || 'User'}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
        The password for your Visitor Management System account was successfully updated on <strong>${changeTime || new Date().toUTCString()}</strong>.
      </p>

      <div style="${baseStyles.infoCard}">
        <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0 0 8px 0;">Security Event Details</p>
        <p style="color: #cbd5e1; font-size: 13px; margin: 4px 0;">Action: Password Reset / Change</p>
        <p style="color: #cbd5e1; font-size: 13px; margin: 4px 0;">Origin IP: ${ipAddress || 'Verified session'}</p>
        <p style="color: #cbd5e1; font-size: 13px; margin: 4px 0;">Status: Completed</p>
      </div>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-top: 20px;">
        If you did not make this change, please immediately contact your system administrator or access the emergency lock feature.
      </p>
    `
  );

  const text = `
Hello ${fullName || 'User'},

The password for your Visitor Management System account was successfully changed at ${changeTime || new Date().toUTCString()}.

If you did not perform this change, please contact your administrator immediately.

Visitor Management System
  `.trim();

  return { html, text, subject: '[VMS] Security Alert: Account Password Changed' };
}

/**
 * 8. Template: Account Activation
 */
function templateAccountActivated({ fullName, loginUrl }) {
  const portalUrl = loginUrl || 'https://visitor-managenment-system-internsh-rho.vercel.app/login';
  const html = renderLayout(
    'Account Activated',
    'Welcome to Visitor Management System',
    `
      <h2 style="color: #10b981; font-size: 18px; margin-top: 0; font-weight: 700;">Account Activated!</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
        Hello <strong style="color: #f8fafc;">${fullName || 'User'}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
        Your email address has been verified and your account is now fully active. You can now access appointments, digital visitor passes, and campus entry verification.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${portalUrl}" style="${baseStyles.button}">Go to Sign In</a>
      </div>
    `
  );

  const text = `
Hello ${fullName || 'User'},

Your email has been verified and your Visitor Management account is now active.
Login at: ${portalUrl}

Visitor Management System
  `.trim();

  return { html, text, subject: '[VMS] Your Account Has Been Activated' };
}

/**
 * 9. Template: Account Security Notification
 */
function templateSecurityAlert({ fullName, alertType, description, actionUrl }) {
  const html = renderLayout(
    'Security Alert',
    'Account Security Notification',
    `
      <h2 style="color: #ef4444; font-size: 18px; margin-top: 0; font-weight: 700;">Security Notification</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
        Hello <strong style="color: #f8fafc;">${fullName || 'User'}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7;">
        We detected a security event related to your Visitor Management System account:
      </p>

      <div style="${baseStyles.warningBox}">
        <p style="color: #f87171; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">${alertType || 'Security Notice'}</p>
        <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin: 0;">${description || 'Suspicious access pattern or credential change detected.'}</p>
      </div>

      ${actionUrl ? `
        <div style="text-align: center;">
          <a href="${actionUrl}" style="${baseStyles.button}">Review Security Settings</a>
        </div>
      ` : ''}
    `
  );

  const text = `
Security Alert: ${alertType || 'Account Security Event'}

Hello ${fullName || 'User'},
${description || 'Suspicious access pattern detected on your account.'}

Visitor Management System
  `.trim();

  return { html, text, subject: `[VMS Security Alert] ${alertType || 'Security Notification'}` };
}

module.exports = {
  templateNewAccount,
  templateManagerAccount,
  templateReceptionistAccount,
  templateSecurityOfficerAccount,
  templateVisitorOtp,
  templatePasswordResetOtp,
  templatePasswordChanged,
  templateAccountActivated,
  templateSecurityAlert,
};

