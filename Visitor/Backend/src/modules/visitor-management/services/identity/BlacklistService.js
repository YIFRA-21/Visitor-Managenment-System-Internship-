/**
 * BlacklistService
 * Performs security blacklist check on visitor record.
 */

const db = require('../../../../config/db');

class BlacklistService {
  async checkBlacklist(visitorId, idNumber) {
    try {
      const rows = await db.query(
        `SELECT id, full_name, is_blacklisted, status FROM visitors WHERE (id = ? OR id_number = ?) AND is_blacklisted = TRUE`,
        [visitorId || 0, idNumber || '']
      );

      const isBlacklisted = rows && rows.length > 0;

      return {
        isBlacklisted,
        status: isBlacklisted ? 'BLACKLISTED' : 'PASSED',
        details: isBlacklisted ? rows[0] : null
      };
    } catch {
      return { isBlacklisted: false, status: 'PASSED', details: null };
    }
  }
}

module.exports = new BlacklistService();
