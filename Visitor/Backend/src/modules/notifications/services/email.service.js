/**
 * Enterprise Centralized Email Service
 * ──────────────────────────────────────
 * Unified email and OTP infrastructure for Visitor Management System.
 * Connects SMTP (Gmail), transactional APIs (Resend, Brevo, SendGrid),
 * cryptographic OTP hashing, transactional outbox logging, and diagnostics.
 */

const crypto = require('crypto');
const config = require('./email/email.config');
const provider = require('./email/email.provider');
const logger = require('./email/email.logger');
const templates = require('./email/email.templates');
const otpService = require('./email/otp.service');
const db = require('../../../config/db');

class EmailService {
  constructor() {
    this.config = config;
    this.provider = provider;
    this.logger = logger;
    this.templates = templates;
    this.otpService = otpService;
  }

  /**
   * Helper to generate a unique tracking ID for every email event
   */
  generateOperationId(prefix = 'eml') {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Safe record to email_outbox table (fails gracefully if table is not yet created)
   */
  async recordOutbox({ operationId, purpose, recipient, subject, text, html, providerName, status, error, messageId }) {
    try {
      await db.query(
        `INSERT INTO email_outbox 
         (operation_id, purpose, recipient, subject, body_text, body_html, provider, status, attempt_count, max_attempts, provider_message_id, error_message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 3, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
           status = VALUES(status), 
           attempt_count = attempt_count + 1, 
           provider_message_id = COALESCE(VALUES(provider_message_id), provider_message_id),
           error_message = VALUES(error_message),
           updated_at = NOW()`,
        [
          operationId,
          purpose || 'GENERAL',
          recipient,
          subject,
          text ? text.slice(0, 1000) : null,
          html ? html.slice(0, 5000) : null,
          providerName || 'smtp',
          status || 'PENDING',
          messageId || null,
          error ? String(error).slice(0, 500) : null,
        ]
      );
    } catch (_) {
      // Outbox table write is non-blocking to prevent database constraints from stopping critical email sends
    }
  }

  /**
   * Core sendMail method
   * Awaits provider response and returns accurate status: ACCEPTED or FAILED.
   */
  async sendMail({ to, subject, text, html, headers = {}, purpose = 'TRANSACTIONAL' }) {
    if (!to || !String(to).trim()) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Recipient email address is required',
        errorCode: 'MISSING_RECIPIENT',
        deliveredToInbox: false,
      };
    }

    const cleanTo = to.trim().toLowerCase();
    const operationId = this.generateOperationId('tx');

    logger.logInfo('EMAIL_DISPATCH_INITIATED', {
      operationId,
      purpose,
      recipient: cleanTo,
      provider: this.config.provider,
    });

    const dispatchResult = await this.provider.dispatch({
      to: cleanTo,
      subject,
      html,
      text,
      headers,
      operationId,
    });

    // Record event to transactional outbox
    await this.recordOutbox({
      operationId,
      purpose,
      recipient: cleanTo,
      subject,
      text,
      html,
      providerName: dispatchResult.provider || this.config.provider,
      status: dispatchResult.status,
      error: dispatchResult.error,
      messageId: dispatchResult.messageId,
    });

    return {
      success: dispatchResult.success,
      status: dispatchResult.status, // 'ACCEPTED' | 'FAILED'
      operationId,
      provider: dispatchResult.provider,
      messageId: dispatchResult.messageId,
      message: dispatchResult.success
        ? 'Email accepted by configured provider for delivery.'
        : (dispatchResult.error || 'Failed to submit email to provider.'),
      deliveredToInbox: dispatchResult.success, // Preserved for backward compatibility
      error: dispatchResult.error || undefined,
      errorCode: dispatchResult.errorCode || undefined,
    };
  }

  /**
   * Generate and send 6-digit verification OTP (Visitor Signup / Email Verification)
   */
  async sendOtp(email, userId = null, options = {}) {
    if (!email || !String(email).trim()) {
      throw new Error('Email address is required to send verification code');
    }

    const cleanEmail = email.trim().toLowerCase();
    const operationId = this.generateOperationId('otp');

    // Resolve user details if available for template personalization
    let fullName = options.fullName || null;
    let resolvedUserId = userId;

    if (!fullName || !resolvedUserId) {
      try {
        const rows = await db.query('SELECT id, full_name FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
        const userRow = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0][0] : (Array.isArray(rows) ? rows[0] : null);
        if (userRow) {
          if (!resolvedUserId) resolvedUserId = userRow.id;
          if (!fullName) fullName = userRow.full_name;
        }
      } catch (_) {}
    }

    // 1. Issue cryptographically secure hashed OTP via OtpService (enforces cooldown & single active record)
    const { otpCode, expiryMinutes } = await this.otpService.createOtp({
      email: cleanEmail,
      userId: resolvedUserId,
      purpose: 'EMAIL_VERIFY',
    });

    // 2. Render branded HTML & Text templates
    const templateData = this.templates.templateVisitorOtp({
      fullName,
      otpCode,
      expiresMinutes: expiryMinutes,
    });

    // 3. Await provider dispatch
    const sendResult = await this.sendMail({
      to: cleanEmail,
      subject: templateData.subject,
      html: templateData.html,
      text: templateData.text,
      purpose: 'EMAIL_VERIFY',
    });

    logger.logInfo('OTP_EMAIL_DISPATCHED', {
      operationId,
      purpose: 'EMAIL_VERIFY',
      recipient: cleanEmail,
      status: sendResult.status,
      provider: sendResult.provider,
    });

    return {
      status: sendResult.success ? 'success' : 'error',
      emailStatus: sendResult.status,
      deliveredToInbox: sendResult.success,
      operationId,
      message: sendResult.success
        ? `Verification email accepted by provider for ${cleanEmail}.`
        : `Email delivery to ${cleanEmail} failed: ${sendResult.error}`,
      email: cleanEmail,
      error: sendResult.error || undefined,
      errorCode: sendResult.errorCode || undefined,
    };
  }

  /**
   * Send Employee / Staff Registration Credentials (User ID & Temporary Password)
   */
  async sendRegistrationCredentials({ to, fullName, userCode, temporaryPassword, loginUrl, accountType, role }) {
    if (!to || !userCode || !temporaryPassword) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Recipient email, User ID, and temporary password are required',
        deliveredToInbox: false,
      };
    }

    const cleanTo = to.trim().toLowerCase();
    const roleName = accountType || role || 'Staff';

    // 1. Render template
    const templateData = this.templates.templateNewAccount({
      fullName,
      userCode,
      temporaryPassword,
      role: roleName,
      loginUrl: loginUrl || `${this.config.clientUrl}/login`,
    });

    // 2. Await provider dispatch
    const sendResult = await this.sendMail({
      to: cleanTo,
      subject: templateData.subject,
      html: templateData.html,
      text: templateData.text,
      purpose: 'ACCOUNT_PROVISIONING',
    });

    return {
      success: sendResult.success,
      status: sendResult.status,
      deliveredToInbox: sendResult.success,
      message: sendResult.success
        ? `Credential email accepted by provider for ${cleanTo}.`
        : `Failed to deliver credentials email: ${sendResult.error}`,
      operationId: sendResult.operationId,
      error: sendResult.error || undefined,
      errorCode: sendResult.errorCode || undefined,
    };
  }

  /**
   * Send Password Reset OTP
   */
  async sendPasswordResetOtp({ to, fullName, userCode, otpCode, expiresMinutes = 15 }) {
    if (!to || !otpCode) {
      throw new Error('Recipient email and OTP code are required');
    }

    const cleanTo = to.trim().toLowerCase();
    const templateData = this.templates.templatePasswordResetOtp({
      fullName,
      userCode,
      otpCode,
      expiresMinutes,
    });

    return this.sendMail({
      to: cleanTo,
      subject: templateData.subject,
      html: templateData.html,
      text: templateData.text,
      purpose: 'PASSWORD_RESET',
    });
  }

  /**
   * Send Password Changed Confirmation
   */
  async sendPasswordChangedConfirmation({ to, fullName, ipAddress }) {
    if (!to) return;
    const cleanTo = to.trim().toLowerCase();
    const templateData = this.templates.templatePasswordChanged({
      fullName,
      changeTime: new Date().toUTCString(),
      ipAddress,
    });

    return this.sendMail({
      to: cleanTo,
      subject: templateData.subject,
      html: templateData.html,
      text: templateData.text,
      purpose: 'PASSWORD_CHANGED',
    }).catch(err => {
      logger.logWarn('PASSWORD_CHANGED_EMAIL_FAILED', { recipient: cleanTo, error: err.message });
    });
  }

  /**
   * Verify an OTP (Delegates to OtpService timing-safe hash comparison)
   */
  async verifyOtp(email, code, purpose = 'EMAIL_VERIFY') {
    return this.otpService.verifyOtp({ email, code, purpose });
  }

  /**
   * Active Health & Diagnostics Check
   */
  async getDiagnostics() {
    const configDiag = this.config.getDiagnosticInfo();
    const connectionTest = await this.provider.verifyConnection();

    // Query outbox statistics if available
    let outboxStats = { total: 0, accepted: 0, failed: 0, pending: 0 };
    try {
      const rows = await db.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
          SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
        FROM email_outbox
      `);
      if (rows && rows[0]) {
        outboxStats = {
          total: parseInt(rows[0].total || 0, 10),
          accepted: parseInt(rows[0].accepted || 0, 10),
          failed: parseInt(rows[0].failed || 0, 10),
          pending: parseInt(rows[0].pending || 0, 10),
        };
      }
    } catch (_) {}

    return {
      timestamp: new Date().toISOString(),
      ...configDiag,
      connectivity: connectionTest,
      outboxStats,
    };
  }

  /**
   * Safe Admin Test Email Sender
   */
  async sendTestEmail(targetEmail, adminUser = 'Administrator') {
    if (!targetEmail || !targetEmail.includes('@')) {
      throw new Error('Valid target email address is required');
    }

    const cleanTo = targetEmail.trim().toLowerCase();
    const subject = `[VMS Test] Email Infrastructure Verification`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0f172a; color: #fff; border-radius: 12px; border: 1px solid #334155;">
        <h2 style="color: #38bdf8; margin-top: 0;">Email System Operational</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          This test message confirms that the Enterprise Visitor Management System email infrastructure is operational.
        </p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 4px 0; color: #94a3b8;">Active Provider: <strong style="color: #fff;">${this.config.provider.toUpperCase()}</strong></p>
          <p style="margin: 4px 0; color: #94a3b8;">Triggered By: <strong style="color: #fff;">${adminUser}</strong></p>
          <p style="margin: 4px 0; color: #94a3b8;">Server Time: <strong style="color: #fff;">${new Date().toUTCString()}</strong></p>
        </div>
      </div>
    `;
    const text = `VMS Test Email: Operational at ${new Date().toUTCString()} via ${this.config.provider.toUpperCase()}`;

    return this.sendMail({
      to: cleanTo,
      subject,
      html,
      text,
      purpose: 'SYSTEM_TEST',
    });
  }
}

module.exports = new EmailService();
