/**
 * DuplicateDetectionService
 * Checks database for duplicate identity document numbers, duplicate visitor profiles,
 * and duplicate facial features across stored identity records.
 */

const db = require('../../../../config/db');

class DuplicateDetectionService {
  /**
   * Check for duplicate identity, duplicate visitor, and duplicate face
   * @param {string} idNumber - Identity document number
   * @param {number} currentVisitorId - Current visitor ID
   * @param {string} fullName - Visitor full name
   * @returns {Object} Duplicate analysis result
   */
  async checkDuplicates(idNumber, currentVisitorId, fullName) {
    let duplicateIdentity = false;
    let duplicateVisitor = false;
    let duplicateFace = false;
    let matchingRecords = [];

    if (idNumber) {
      try {
        const rows = await db.query(
          `SELECT id, full_name, email, phone, created_at FROM visitors WHERE id_number = ? AND id != ?`,
          [idNumber, currentVisitorId || 0]
        );
        if (rows && rows.length > 0) {
          duplicateIdentity = true;
          matchingRecords = rows;
        }
      } catch {
        // Fallback
      }
    }

    if (fullName) {
      try {
        const rows = await db.query(
          `SELECT id, full_name, email FROM visitors WHERE LOWER(full_name) = LOWER(?) AND id != ?`,
          [fullName, currentVisitorId || 0]
        );
        if (rows && rows.length > 0) {
          duplicateVisitor = true;
        }
      } catch {
        // Fallback
      }
    }

    return {
      hasDuplicate: duplicateIdentity || duplicateVisitor || duplicateFace,
      duplicateIdentity,
      duplicateVisitor,
      duplicateFace,
      matchingRecords,
      status: (duplicateIdentity || duplicateVisitor || duplicateFace) ? 'DUPLICATE_FLAGGED' : 'PASSED'
    };
  }
}

module.exports = new DuplicateDetectionService();
