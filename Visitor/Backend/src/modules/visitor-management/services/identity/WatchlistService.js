/**
 * WatchlistService
 * Performs security watchlist check against visitor_watchlist table.
 */

const db = require('../../../../config/db');

class WatchlistService {
  async checkWatchlist(idNumber, fullName) {
    try {
      const rows = await db.query(
        `SELECT * FROM visitor_watchlist WHERE (id_number = ? OR full_name LIKE ?) LIMIT 5`,
        [idNumber || '', `%${fullName || ''}%`]
      );

      const isWatchlisted = rows && rows.length > 0;

      return {
        isWatchlisted,
        matchesCount: rows ? rows.length : 0,
        status: isWatchlisted ? 'WATCHLIST_HIT' : 'PASSED',
        hits: rows || []
      };
    } catch {
      return { isWatchlisted: false, matchesCount: 0, status: 'PASSED', hits: [] };
    }
  }
}

module.exports = new WatchlistService();
