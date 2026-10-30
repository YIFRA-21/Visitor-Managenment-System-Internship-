const path = require('path');
const dotenv = require('dotenv');

// Ensure .env is loaded
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
dotenv.config();

/**
 * Enterprise Email Configuration
 */
class EmailConfig {
  constructor() {
    this.refresh();
  }

  refresh() {
    this.enabled = process.env.EMAIL_ENABLED !== 'false';
    this.provider = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase().trim();
    
    // SMTP Settings
    this.smtp = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      service: process.env.SMTP_SERVICE || (process.env.SMTP_HOST === 'smtp.gmail.com' ? 'gmail' : undefined),
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      connectionTimeout: parseInt(process.env.EMAIL_TIMEOUT_MS || '10000', 10),
      greetingTimeout: 8000,
      socketTimeout: 15000,
    };

    // Transactional API Providers Settings
    this.resend = {
      apiKey: (process.env.RESEND_API_KEY || '').trim(),
      apiUrl: 'https://api.resend.com/emails',
    };

    this.brevo = {
      apiKey: (process.env.BREVO_API_KEY || '').trim(),
      apiUrl: 'https://api.brevo.com/v3/smtp/email',
    };

    this.sendgrid = {
      apiKey: (process.env.SENDGRID_API_KEY || '').trim(),
      apiUrl: 'https://api.sendgrid.com/v3/mail/send',
    };

    // Client & Sender Info
    this.clientUrl = (process.env.CLIENT_URL || 'https://visitor-managenment-system-internsh-rho.vercel.app').replace(/\/+$/, '');
    this.organizationName = process.env.ORG_NAME || 'Enterprise Visitor Management System';

    // From Address Formatter
    this.rawFrom = (process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@vms-enterprise.com').trim();

    // OTP Policy Config
    this.otp = {
      expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
      passwordResetExpiryMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES || '15', 10),
      cooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
      maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    };

    // Outbox & Retry Config
    this.outbox = {
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
      baseDelayMs: 2000,
      maxDelayMs: 30000,
    };
  }

  getFromAddress() {
    const raw = this.rawFrom;
    const match = raw.match(/<([^>]+)>/) || raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = match ? match[1].trim() : (this.smtp.user || 'noreply@vms-enterprise.com');
    return `"${this.organizationName}" <${email}>`;
  }

  getFromEmailOnly() {
    const raw = this.rawFrom;
    const match = raw.match(/<([^>]+)>/) || raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].trim() : (this.smtp.user || 'noreply@vms-enterprise.com');
  }

  isProviderConfigured(provider = this.provider) {
    if (!this.enabled) return false;
    switch (provider) {
      case 'smtp':
      case 'gmail':
        return Boolean(this.smtp.user && this.smtp.pass);
      case 'resend':
        return Boolean(this.resend.apiKey);
      case 'brevo':
        return Boolean(this.brevo.apiKey);
      case 'sendgrid':
        return Boolean(this.sendgrid.apiKey);
      default:
        return false;
    }
  }

  getDiagnosticInfo() {
    this.refresh();
    return {
      emailEnabled: this.enabled,
      activeProvider: this.provider,
      providerConfigured: this.isProviderConfigured(this.provider),
      smtp: {
        host: this.smtp.host,
        port: this.smtp.port,
        secure: this.smtp.secure,
        service: this.smtp.service || 'custom',
        hasUser: Boolean(this.smtp.user),
        hasPass: Boolean(this.smtp.pass),
        maskedUser: this.maskEmail(this.smtp.user),
      },
      resend: {
        hasKey: Boolean(this.resend.apiKey),
      },
      brevo: {
        hasKey: Boolean(this.brevo.apiKey),
      },
      sendgrid: {
        hasKey: Boolean(this.sendgrid.apiKey),
      },
      senderAddress: this.getFromAddress(),
      clientUrl: this.clientUrl,
      otpPolicy: this.otp,
    };
  }

  maskEmail(emailStr) {
    if (!emailStr || !emailStr.includes('@')) return 'not_configured';
    const [local, domain] = emailStr.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  }
}

module.exports = new EmailConfig();

