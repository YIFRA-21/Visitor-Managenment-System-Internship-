const logger = require('../../../utils/logger');

class SmsService {
  constructor() {
    this.enabled = process.env.SMS_ENABLED === 'true';
    this.provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();
    this.senderId = process.env.SMS_SENDER_ID || 'VMS';
  }

  /**
   * Send SMS notification to recipient phone number
   * Returns { status: 'success'|'failed'|'disabled', messageId?, error? }
   */
  async sendSms({ to, message, templateVariables = {} }) {
    if (!this.enabled) {
      console.log(`[SmsService] SMS delivery disabled (SMS_ENABLED=false). Mock SMS to ${to}: "${message}"`);
      return {
        status: 'disabled',
        message: 'SMS delivery is disabled in environment settings',
        mock: true
      };
    }

    if (!to) {
      return {
        status: 'failed',
        error: 'Recipient phone number is required for SMS dispatch'
      };
    }

    const normalizedPhone = this.normalizePhoneNumber(to);
    if (!normalizedPhone) {
      return {
        status: 'failed',
        error: `Invalid phone number format: ${to}`
      };
    }

    console.log(`\n=================================================`);
    console.log(`  [ENTERPRISE SMS DISPATCH]`);
    console.log(`  Provider:        ${this.provider.toUpperCase()}`);
    console.log(`  Recipient Phone: ${normalizedPhone}`);
    console.log(`  Sender ID:       ${this.senderId}`);
    console.log(`  Message Text:    ${message}`);
    console.log(`=================================================\n`);

    try {
      if (this.provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER || this.senderId;

        if (accountSid && authToken && !accountSid.includes('your_')) {
          const twilio = require('twilio')(accountSid, authToken);
          const res = await twilio.messages.create({
            body: message,
            from: fromNumber,
            to: normalizedPhone
          });
          logger.info(`[SmsService] Twilio SMS dispatched successfully. SID: ${res.sid}`);
          return {
            status: 'success',
            provider: 'twilio',
            providerMessageId: res.sid,
            normalizedPhone
          };
        }
      }

      // Simulated SMS Gateway Dispatch for dev/test environments
      const mockMessageId = `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      logger.info(`[SmsService] Simulated SMS gateway dispatch to ${normalizedPhone}. ID: ${mockMessageId}`);
      return {
        status: 'success',
        provider: this.provider || 'simulator',
        providerMessageId: mockMessageId,
        normalizedPhone,
        simulated: true
      };
    } catch (err) {
      console.error(`[SmsService] Error delivering SMS to ${normalizedPhone}:`, err);
      return {
        status: 'failed',
        provider: this.provider,
        error: err.message || 'SMS delivery failed'
      };
    }
  }

  /**
   * Helper to normalize phone number to E.164 standard (+1XXXXXXXXXX, +251XXXXXXXXX)
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null;
    const clean = String(phone).trim().replace(/[^\d+]/g, '');
    if (!clean) return null;
    if (clean.startsWith('+')) return clean;
    if (clean.length === 10) return `+1${clean}`;
    if (clean.length >= 11) return `+${clean}`;
    return `+${clean}`;
  }
}

module.exports = new SmsService();
