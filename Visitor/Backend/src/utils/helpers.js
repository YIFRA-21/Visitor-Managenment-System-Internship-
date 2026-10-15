const pool = require('../config/db');
const { query } = pool;

async function logAudit(actorId, action, entity, entityId, metadata, ip) {
  await query(
    `INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata_json, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [actorId, action, entity, entityId, metadata ? JSON.stringify(metadata) : null, ip || null]
  );
}

async function createNotification(userId, visitorEmail, type, title, message, channel = 'in_app') {
  await query(
    `INSERT INTO notifications (user_id, visitor_email, type, channel, title, message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, visitorEmail, type, channel, title, message]
  );
}

function generateReferenceCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VMS-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function checkConflict(hostId, roomId, start, end, excludeId) {
  const params = [hostId, start, end, start, end];
  let hostSql = `
    SELECT COUNT(*) as count FROM appointments
    WHERE host_id = ? AND status NOT IN ('rejected', 'cancelled', 'no_show')
    AND ((scheduled_start < ? AND scheduled_end > ?) OR (scheduled_start >= ? AND scheduled_start < ?))
  `;
  if (excludeId) {
    hostSql += ' AND id != ?';
    params.push(excludeId);
  }
  const hostResult = await query(hostSql, params);
  const hostConflict = hostResult[0]?.count > 0;

  let roomConflict = false;
  if (roomId) {
    const roomParams = [roomId, start, end, start, end];
    let roomSql = `
      SELECT COUNT(*) as count FROM appointments
      WHERE room_id = ? AND status NOT IN ('rejected', 'cancelled', 'no_show')
      AND ((scheduled_start < ? AND scheduled_end > ?) OR (scheduled_start >= ? AND scheduled_start < ?))
    `;
    if (excludeId) {
      roomSql += ' AND id != ?';
      roomParams.push(excludeId);
    }
    const roomResult = await query(roomSql, roomParams);
    roomConflict = roomResult[0]?.count > 0;
  }

  return { hostConflict, roomConflict };
}

async function getSuggestedSlots(hostId, date, durationMinutes = 60) {
  const slots = [];
  const baseDate = new Date(date);
  for (let hour = 9; hour < 17; hour++) {
    for (const min of [0, 30]) {
      const start = new Date(baseDate);
      start.setHours(hour, min, 0, 0);
      const end = new Date(start.getTime() + durationMinutes * 60000);
      const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
      const endStr = end.toISOString().slice(0, 19).replace('T', ' ');
      const { hostConflict } = await checkConflict(hostId, null, startStr, endStr);
      if (!hostConflict) {
        slots.push(start.toTimeString().slice(0, 5));
      }
      if (slots.length >= 3) break;
    }
    if (slots.length >= 3) break;
  }
  return slots;
}

module.exports = {
  logAudit,
  createNotification,
  generateReferenceCode,
  checkConflict,
  getSuggestedSlots,
  pool
};
