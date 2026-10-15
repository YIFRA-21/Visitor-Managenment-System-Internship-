const db = require('../../../config/db');

class MessageService {
  /**
   * Fetch Active Threads for User / Employee
   */
  async getUserThreads(userId) {
    try {
      const sql = `
        SELECT t.id, t.visitor_id, t.recipient_id, t.recipient_role, t.subject, t.status,
               t.created_at, t.updated_at,
               u_rec.full_name as recipient_name, u_rec.email as recipient_email, u_rec.role as recipient_role_title,
               u_vis.full_name as visitor_name, u_vis.email as visitor_email,
               m.body as last_message_body, m.created_at as last_message_time, m.sender_id as last_sender_id,
               (SELECT COUNT(*) FROM messages m2 WHERE m2.thread_id = t.id AND m2.recipient_id = ? AND m2.is_read = FALSE) as unread_count
        FROM message_threads t
        LEFT JOIN users u_rec ON t.recipient_id = u_rec.id
        LEFT JOIN users u_vis ON t.visitor_id = u_vis.id
        LEFT JOIN messages m ON m.id = (
          SELECT id FROM messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1
        )
        WHERE t.visitor_id = ? OR t.recipient_id = ?
        ORDER BY t.updated_at DESC
      `;

      const rows = await db.query(sql, [userId, userId, userId]);
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.error('Error fetching user threads:', err);
      throw err;
    }
  }

  /**
   * Fetch Active Threads for Visitor
   */
  async getVisitorThreads(visitorId) {
    return this.getUserThreads(visitorId);
  }


  /**
   * Create New Messaging Thread with Authorized Role Check
   */
  async createThread(visitorId, data) {
    try {
      const { recipient_id, recipient_role, subject, body } = data;

      // Security RBAC Check: Ensure recipient is authorized role (employee, receptionist, support)
      const allowedRoles = ['employee', 'staff', 'receptionist', 'support', 'admin'];
      const targetUsers = await db.query(`SELECT id, role, full_name FROM users WHERE id = ? LIMIT 1`, [recipient_id]);
      
      if (!Array.isArray(targetUsers) || !targetUsers[0]) {
        throw new Error('Target recipient user does not exist.');
      }

      const targetUser = targetUsers[0];
      const roleClean = (targetUser.role || '').toLowerCase();
      if (!allowedRoles.includes(roleClean) && recipient_role !== 'support') {
        throw new Error('Security Policy: Visitors are only authorized to communicate with Assigned Hosts, Reception Officers, and Support.');
      }

      // Check if active thread already exists with this recipient
      const existingThreads = await db.query(
        `SELECT id FROM message_threads WHERE visitor_id = ? AND recipient_id = ? AND status = 'active' LIMIT 1`,
        [visitorId, recipient_id]
      );

      let threadId;
      if (Array.isArray(existingThreads) && existingThreads.length > 0) {
        threadId = existingThreads[0].id;
      } else {
        const threadRes = await db.query(
          `INSERT INTO message_threads (visitor_id, recipient_id, recipient_role, subject, status)
           VALUES (?, ?, ?, ?, 'active')`,
          [visitorId, recipient_id, recipient_role || roleClean, subject || 'Visitor Direct Inquiry']
        );
        threadId = threadRes.insertId;
      }

      // Insert Initial Message
      const msgRes = await db.query(
        `INSERT INTO messages (thread_id, sender_id, sender_role, recipient_id, recipient_role, body, is_read)
         VALUES (?, ?, 'visitor', ?, ?, ?, FALSE)`,
        [threadId, visitorId, recipient_id, recipient_role || roleClean, body]
      );

      // Audit Log
      await db.query(
        `INSERT INTO notification_audit_logs (user_id, action, details)
         VALUES (?, 'CREATE_MESSAGE_THREAD', ?)`,
        [visitorId, `Created message thread #${threadId} with user #${recipient_id}`]
      );

      return {
        thread_id: threadId,
        message_id: msgRes.insertId,
        recipient_name: targetUser.full_name,
        created_at: new Date()
      };
    } catch (err) {
      console.error('Error creating thread:', err);
      throw err;
    }
  }

  /**
   * Fetch Messages within a Thread
   */
  async getThreadMessages(threadId, userId) {
    try {
      // Validate user belongs to thread
      const threadRows = await db.query(
        `SELECT * FROM message_threads WHERE id = ? AND (visitor_id = ? OR recipient_id = ?) LIMIT 1`,
        [threadId, userId, userId]
      );

      if (!Array.isArray(threadRows) || !threadRows.length) {
        throw new Error('Access denied: You do not have access to this conversation.');
      }

      const sql = `
        SELECT m.id, m.thread_id, m.sender_id, m.sender_role, m.recipient_id, m.recipient_role,
               m.body, m.is_read, m.read_at, m.created_at,
               u.full_name as sender_name, u.avatar_url as sender_avatar
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.thread_id = ?
        ORDER BY m.created_at ASC
      `;

      const messages = await db.query(sql, [threadId]);
      const messageList = Array.isArray(messages) ? messages : [];

      // Fetch attachments for these messages
      const msgIds = messageList.map(m => m.id);
      let attachmentsMap = {};

      if (msgIds.length > 0) {
        const attachments = await db.query(
          `SELECT * FROM message_attachments WHERE message_id IN (?)`,
          [msgIds]
        );
        const attachList = Array.isArray(attachments) ? attachments : [];
        attachList.forEach(att => {
          if (!attachmentsMap[att.message_id]) attachmentsMap[att.message_id] = [];
          attachmentsMap[att.message_id].push(att);
        });
      }

      const formattedMessages = messageList.map(m => ({
        ...m,
        attachments: attachmentsMap[m.id] || []
      }));

      // Mark unread messages sent to this user as read
      await db.query(
        `UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE thread_id = ? AND recipient_id = ? AND is_read = FALSE`,
        [threadId, userId]
      );

      return {
        thread: threadRows[0],
        messages: formattedMessages
      };
    } catch (err) {
      console.error('Error fetching thread messages:', err);
      throw err;
    }
  }

  /**
   * Send Reply Message in Thread
   */
  async sendMessage(threadId, senderId, senderRole, body, attachments = []) {
    try {
      const threadRows = await db.query(
        `SELECT * FROM message_threads WHERE id = ? LIMIT 1`,
        [threadId]
      );

      if (!Array.isArray(threadRows) || !threadRows.length) {
        throw new Error('Conversation thread not found');
      }

      const t = threadRows[0];
      const recipientId = (t.visitor_id === senderId) ? t.recipient_id : t.visitor_id;
      const recipientRole = (t.visitor_id === senderId) ? t.recipient_role : 'visitor';

      const res = await db.query(
        `INSERT INTO messages (thread_id, sender_id, sender_role, recipient_id, recipient_role, body, is_read)
         VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
        [threadId, senderId, senderRole || 'visitor', recipientId, recipientRole, body]
      );

      const messageId = res.insertId;

      // Save attachments if provided
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          await db.query(
            `INSERT INTO message_attachments (message_id, attachment_type, file_name, file_path, file_size)
             VALUES (?, ?, ?, ?, ?)`,
            [messageId, att.type || 'document', att.name || 'Attachment', att.path || '#', att.size || 0]
          );
        }
      }

      // Update thread timestamp
      await db.query(`UPDATE message_threads SET updated_at = NOW() WHERE id = ?`, [threadId]);

      return {
        message_id: messageId,
        thread_id: threadId,
        sender_id: senderId,
        recipient_id: recipientId,
        body,
        created_at: new Date()
      };
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }

  /**
   * Fetch Available Authorized Contact Recipients for Visitor (Assigned Host, Reception, Support)
   */
  async getAuthorizedContacts(visitorId) {
    try {
      // 1. Assigned Hosts from recent appointments
      const hosts = await db.query(
        `SELECT DISTINCT u.id, u.full_name, u.email, 'employee' as role_type, 'Assigned Host' as role_label
         FROM appointments a
         JOIN users u ON a.host_id = u.id
         WHERE a.visitor_id = ?
         LIMIT 10`,
        [visitorId]
      );

      // 2. Reception Officers
      const receptionists = await db.query(
        `SELECT id, full_name, email, 'receptionist' as role_type, 'Reception Officer' as role_label
         FROM users WHERE role = 'receptionist' LIMIT 5`
      );

      // 3. System Support Desk
      const support = await db.query(
        `SELECT id, full_name, email, 'support' as role_type, 'Help & Support Desk' as role_label
         FROM users WHERE role IN ('admin', 'staff') LIMIT 3`
      );

      return [
        ...(Array.isArray(hosts) ? hosts : []),
        ...(Array.isArray(receptionists) ? receptionists : []),
        ...(Array.isArray(support) ? support : [])
      ];
    } catch (err) {
      console.error('Error fetching authorized contacts:', err);
      return [];
    }
  }
}

module.exports = new MessageService();
