const db = require('../../../config/db');

class RecipientResolverService {
  /**
   * Resolve exact array of user records for a given notification dispatch context
   */
  async resolveRecipients(eventKey, payload = {}) {
    try {
      const recipients = [];

      // 1. Direct Recipient User ID provided in payload
      if (payload.recipient_id || payload.userId || payload.recipientUserId) {
        const targetId = payload.recipient_id || payload.userId || payload.recipientUserId;
        const users = await db.query(
          `SELECT id, full_name, email, phone, role, department_id FROM users WHERE id = ? LIMIT 1`,
          [targetId]
        );
        if (Array.isArray(users) && users[0]) {
          recipients.push(users[0]);
        }
      }

      // 2. Direct Visitor Email or Visitor ID (Check both users and visitors tables)
      if (payload.visitor_email || payload.visitorId) {
        const vEmail = payload.visitor_email;
        const vId = payload.visitorId;

        const users = await db.query(
          `SELECT id, full_name, email, phone, 'visitor' as role FROM users WHERE email = ? OR id = ? LIMIT 1`,
          [vEmail || 0, vId || 0]
        );
        if (Array.isArray(users) && users[0]) {
          recipients.push(users[0]);
        } else {
          const vRows = await db.query(
            `SELECT id, full_name, email, phone, 'visitor' as role FROM visitors WHERE email = ? OR id = ? LIMIT 1`,
            [vEmail || 0, vId || 0]
          );
          if (Array.isArray(vRows) && vRows[0]) {
            recipients.push(vRows[0]);
          } else if (vEmail) {
            recipients.push({ id: null, full_name: payload.visitor_name || 'Guest Visitor', email: vEmail, role: 'visitor' });
          }
        }
      }

      // 3. Host Employee Resolution (for Visitor Arrival, Appointment Requests)
      if (payload.host_employee_id || payload.host_id) {
        const hostId = payload.host_employee_id || payload.host_id;
        const hosts = await db.query(
          `SELECT id, full_name, email, phone, role, department_id FROM users WHERE id = ? LIMIT 1`,
          [hostId]
        );
        if (Array.isArray(hosts) && hosts[0]) {
          recipients.push(hosts[0]);
        }
      }

      // 4. Role-Based Resolution (e.g. Reception, Security, Manager, Admin)
      if (payload.target_role || payload.recipient_role) {
        const roleClean = (payload.target_role || payload.recipient_role).toLowerCase();
        const roleUsers = await db.query(
          `SELECT id, full_name, email, phone, role, department_id FROM users WHERE LOWER(role) = ? LIMIT 10`,
          [roleClean]
        );
        if (Array.isArray(roleUsers)) {
          recipients.push(...roleUsers);
        }
      }

      // 5. Automatic Event-Driven Role Inferences
      if (recipients.length === 0) {
        if (eventKey.startsWith('RECEPTION_') || eventKey.startsWith('VISITOR_ARRIVED')) {
          const receptionists = await db.query(
            `SELECT id, full_name, email, phone, role FROM users WHERE LOWER(role) IN ('receptionist', 'reception') LIMIT 5`
          );
          if (Array.isArray(receptionists)) recipients.push(...receptionists);
        } else if (eventKey.startsWith('SECURITY_') || eventKey.includes('BLACKLIST') || eventKey.includes('ALERT')) {
          const securityOfficers = await db.query(
            `SELECT id, full_name, email, phone, role FROM users WHERE LOWER(role) IN ('security', 'security_officer', 'admin') LIMIT 5`
          );
          if (Array.isArray(securityOfficers)) recipients.push(...securityOfficers);
        } else if (eventKey.startsWith('APPROVAL_') || eventKey.includes('ESCALAT')) {
          const managers = await db.query(
            `SELECT id, full_name, email, phone, role FROM users WHERE LOWER(role) IN ('manager', 'admin') LIMIT 5`
          );
          if (Array.isArray(managers)) recipients.push(...managers);
        }
      }

      // Deduplicate recipients by User ID / Email
      const uniqueMap = new Map();
      recipients.forEach(r => {
        const key = r.id ? `user_${r.id}` : `email_${r.email}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, r);
        }
      });

      return Array.from(uniqueMap.values());
    } catch (err) {
      console.error('Error in RecipientResolverService:', err);
      return [];
    }
  }
}

module.exports = new RecipientResolverService();
