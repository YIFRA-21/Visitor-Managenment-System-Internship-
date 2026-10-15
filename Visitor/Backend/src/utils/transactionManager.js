const db = require('../config/db');

class TransactionManager {
  static async executeTransaction(callback) {
    // If Sequelize transaction is available, run managed transaction
    if (db.sequelize && typeof db.sequelize.transaction === 'function') {
      return await db.sequelize.transaction(async (t) => {
        return await callback(t);
      });
    }
    // Fallback if raw query pool
    return await callback(null);
  }
}

module.exports = TransactionManager;
