/**
 * Enterprise Production Email Provider Abstraction
 * ─────────────────────────────────────────────────
 * Seamlessly supports:
 * 1. SMTP / Gmail (Nodemailer with STARTTLS, connection timeouts, auth verification)
 * 2. Resend REST API (Cloud fallback if cloud host restricts outbound SMTP)
 * 3. Brevo REST API
 * 4. SendGrid REST API
 */

const nodemailer = require('nodemailer');
const config = require('./email.config');
const logger = require('./email.logger');

class EmailProviderService {
  constructor() {
    this.smtpTransporter = null;
  }

  /**
   * Initializes or returns the cached SMTP transporter with STARTTLS / TLS options
   */
  getSmtpTransporter() {
    if (this.smtpTransporter) {
      return this.smtpTransporter;
    }

    const { host, port, secure, service, user, pass, connectionTimeout, greetingTimeout, socketTimeout } = config.smtp;

    const timeoutOpts = {
      connectionTimeout,
      greetingTimeout,
      socketTimeout,
    };

    // If configured for Gmail: force family: 4 (IPv4) to avoid ENETUNREACH on IPv6-only resolution
    if (service === 'gmail' || host === 'smtp.gmail.com') {
      this.smtpTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: port || 587,
        secure: port === 465,
        auth: { user, pass },
        family: 4,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
        ...timeoutOpts,
      });
      return this.smtpTransporter;
    }

    // Generic SMTP transport
    this.smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      family: 4,
      tls: {
        rejectUnauthorized: false, // Prevents self-signed or proxy TLS handshakes from crashing on cloud relays
        minVersion: 'TLSv1.2',
      },
      ...timeoutOpts,
    });

    return this.smtpTransporter;
  }

  /**
   * Reset transporter cache (used on credential update or network reset)
   */
  resetTransporter() {
    this.smtpTransporter = null;
  }

  /**
   * Verify provider connectivity
   */
  async verifyConnection(provider = config.provider) {
    if (!config.enabled) {
      return { ok: false, reason: 'Email system disabled (EMAIL_ENABLED=false)' };
    }

    const selected = (provider || 'smtp').toLowerCase();

    if (selected === 'smtp' || selected === 'gmail') {
      if (!config.smtp.user || !config.smtp.pass) {
        return { ok: false, reason: 'SMTP credentials missing (SMTP_USER or SMTP_PASS not set)' };
      }
      try {
        const transporter = this.getSmtpTransporter();
        await transporter.verify();
        return { ok: true, provider: 'smtp', message: 'SMTP connection and authentication verified' };
      } catch (err) {
        logger.logError('SMTP_VERIFY_FAILED', { provider: 'smtp', error: err.message, errorCode: err.code });
        return { ok: false, provider: 'smtp', error: err.message, code: err.code || 'SMTP_AUTH_FAILED' };
      }
    }

    if (selected === 'resend') {
      if (!config.resend.apiKey) {
        return { ok: false, reason: 'Resend API key missing (RESEND_API_KEY not set)' };
      }
      return { ok: true, provider: 'resend', message: 'Resend API key configured' };
    }

    if (selected === 'brevo') {
      if (!config.brevo.apiKey) {
        return { ok: false, reason: 'Brevo API key missing (BREVO_API_KEY not set)' };
      }
      return { ok: true, provider: 'brevo', message: 'Brevo API key configured' };
    }

    if (selected === 'sendgrid') {
      if (!config.sendgrid.apiKey) {
        return { ok: false, reason: 'SendGrid API key missing (SENDGRID_API_KEY not set)' };
      }
      return { ok: true, provider: 'sendgrid', message: 'SendGrid API key configured' };
    }

    return { ok: false, reason: `Unknown provider: ${selected}` };
  }

  /**
   * Dispatch email via configured provider
   */
  async dispatch({ to, subject, html, text, headers = {}, operationId = 'op-default' }) {
    if (!to) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Recipient email is required',
        errorCode: 'MISSING_RECIPIENT',
      };
    }

    if (!config.enabled) {
      logger.logWarn('EMAIL_MOCK_DISPATCH', { operationId, to, reason: 'EMAIL_ENABLED is false' });
      return {
        success: true,
        status: 'ACCEPTED',
        message: 'Email simulated (EMAIL_ENABLED=false)',
        messageId: `sim-${Date.now()}`,
        provider: 'mock',
      };
    }

    const provider = config.provider;

    switch (provider) {
      case 'resend':
        return this.sendViaResend({ to, subject, html, text, operationId });
      case 'brevo':
        return this.sendViaBrevo({ to, subject, html, text, operationId });
      case 'sendgrid':
        return this.sendViaSendGrid({ to, subject, html, text, operationId });
      case 'smtp':
      case 'gmail':
      default:
        return this.sendViaSmtp({ to, subject, html, text, headers, operationId });
    }
  }

  /**
   * Send via SMTP / Nodemailer
   */
  async sendViaSmtp({ to, subject, html, text, headers, operationId }) {
    const startTime = Date.now();
    const cleanTo = to.trim().toLowerCase();
    const mailOptions = {
      from: config.getFromAddress(),
      to: cleanTo,
      subject,
      text,
      html,
      headers: {
        'X-VMS-Operation-ID': operationId,
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        ...headers,
      },
    };

    try {
      const transporter = this.getSmtpTransporter();
      const info = await transporter.sendMail(mailOptions);
      const durationMs = Date.now() - startTime;

      logger.logInfo('EMAIL_ACCEPTED_BY_SMTP', {
        operationId,
        recipient: cleanTo,
        provider: 'smtp',
        status: 'ACCEPTED',
        messageId: info.messageId,
        durationMs,
      });

      return {
        success: true,
        status: 'ACCEPTED',
        provider: 'smtp',
        messageId: info.messageId,
        providerResponse: info.response || 'Message accepted for delivery',
        durationMs,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.logError('SMTP_SEND_FAILED', {
        operationId,
        recipient: cleanTo,
        provider: 'smtp',
        error: err.message,
        errorCode: err.code || 'SMTP_ERROR',
        durationMs,
      });

      // Clear cached transporter if connection was broken or rejected
      this.resetTransporter();

      let clientMessage = 'Email provider failed to accept message. Please verify provider settings.';
      if (err.code === 'EAUTH') {
        clientMessage = 'Email provider authentication failed. Please verify the Gmail App Password.';
      } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
        clientMessage = 'Connection to email provider timed out. Cloud network may restrict SMTP ports.';
      } else if (err.code === 'EENVELOPE') {
        clientMessage = 'Email recipient address was rejected by the provider.';
      }

      return {
        success: false,
        status: 'FAILED',
        provider: 'smtp',
        error: clientMessage,
        errorCode: err.code || 'SMTP_DISPATCH_FAILED',
        rawError: err.message,
        durationMs,
      };
    }
  }

  /**
   * Send via Resend REST API
   */
  async sendViaResend({ to, subject, html, text, operationId }) {
    const startTime = Date.now();
    const cleanTo = to.trim().toLowerCase();

    if (!config.resend.apiKey) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'resend',
        error: 'Resend API key is not configured in backend environment.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    try {
      const response = await fetch(config.resend.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resend.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.getFromAddress(),
          to: [cleanTo],
          subject,
          html,
          text,
          tags: [{ name: 'operation_id', value: operationId }],
        }),
      });

      const data = await response.json().catch(() => ({}));
      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(data.message || `Resend HTTP error ${response.status}`);
      }

      logger.logInfo('EMAIL_ACCEPTED_BY_RESEND', {
        operationId,
        recipient: cleanTo,
        provider: 'resend',
        status: 'ACCEPTED',
        messageId: data.id,
        durationMs,
      });

      return {
        success: true,
        status: 'ACCEPTED',
        provider: 'resend',
        messageId: data.id,
        durationMs,
      };
    } catch (err) {
      logger.logError('RESEND_SEND_FAILED', {
        operationId,
        recipient: cleanTo,
        provider: 'resend',
        error: err.message,
      });

      return {
        success: false,
        status: 'FAILED',
        provider: 'resend',
        error: err.message,
        errorCode: 'RESEND_DISPATCH_FAILED',
      };
    }
  }

  /**
   * Send via Brevo REST API
   */
  async sendViaBrevo({ to, subject, html, text, operationId }) {
    const startTime = Date.now();
    const cleanTo = to.trim().toLowerCase();

    if (!config.brevo.apiKey) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'brevo',
        error: 'Brevo API key is not configured.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    try {
      const response = await fetch(config.brevo.apiUrl, {
        method: 'POST',
        headers: {
          'api-key': config.brevo.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: config.organizationName, email: config.getFromEmailOnly() },
          to: [{ email: cleanTo }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(data.message || `Brevo HTTP error ${response.status}`);
      }

      logger.logInfo('EMAIL_ACCEPTED_BY_BREVO', {
        operationId,
        recipient: cleanTo,
        provider: 'brevo',
        status: 'ACCEPTED',
        messageId: data.messageId,
        durationMs,
      });

      return {
        success: true,
        status: 'ACCEPTED',
        provider: 'brevo',
        messageId: data.messageId,
        durationMs,
      };
    } catch (err) {
      logger.logError('BREVO_SEND_FAILED', {
        operationId,
        recipient: cleanTo,
        provider: 'brevo',
        error: err.message,
      });

      return {
        success: false,
        status: 'FAILED',
        provider: 'brevo',
        error: err.message,
        errorCode: 'BREVO_DISPATCH_FAILED',
      };
    }
  }

  /**
   * Send via SendGrid REST API
   */
  async sendViaSendGrid({ to, subject, html, text, operationId }) {
    const startTime = Date.now();
    const cleanTo = to.trim().toLowerCase();

    if (!config.sendgrid.apiKey) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'sendgrid',
        error: 'SendGrid API key is not configured.',
        errorCode: 'CONFIG_ERROR',
      };
    }

    try {
      const response = await fetch(config.sendgrid.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.sendgrid.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: cleanTo }] }],
          from: { email: config.getFromEmailOnly(), name: config.organizationName },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });

      const durationMs = Date.now() - startTime;
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.errors?.[0]?.message || `SendGrid error ${response.status}`);
      }

      const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
      logger.logInfo('EMAIL_ACCEPTED_BY_SENDGRID', {
        operationId,
        recipient: cleanTo,
        provider: 'sendgrid',
        status: 'ACCEPTED',
        messageId,
        durationMs,
      });

      return {
        success: true,
        status: 'ACCEPTED',
        provider: 'sendgrid',
        messageId,
        durationMs,
      };
    } catch (err) {
      logger.logError('SENDGRID_SEND_FAILED', {
        operationId,
        recipient: cleanTo,
        provider: 'sendgrid',
        error: err.message,
      });

      return {
        success: false,
        status: 'FAILED',
        provider: 'sendgrid',
        error: err.message,
        errorCode: 'SENDGRID_DISPATCH_FAILED',
      };
    }
  }
}

module.exports = new EmailProviderService();

