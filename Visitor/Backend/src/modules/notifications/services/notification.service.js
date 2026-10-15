const db = require('../../../config/db');
const EmailService = require('./email.service');
const SmsService = require('./sms.service');

class NotificationService {
  /**
   * Core Engine: Dispatch notification for any business event
   */
  async dispatchBusinessNotification(eventKey, recipientUserId, data = {}, visitorEmail = null) {
    try {
      // 1. Fetch Template
      const templates = await db.query(
        `SELECT * FROM notification_templates WHERE event_key = ? LIMIT 1`,
        [eventKey]
      );
      
      let template = Array.isArray(templates) ? templates[0] : null;
      let title = data.title || (template ? template.subject_template : 'System Notification');
      let message = data.message || (template ? template.body_template : '');
      let priority = data.priority || (template ? template.priority : 'medium');
      let category = data.category || (template ? template.category : 'general');
      let channel = data.channel || (template ? template.channel : 'in_app');
      let actionUrl = data.action_url || (template ? template.action_url_template : null);

      // 2. Replace Template Variables {{variable}}
      if (template) {
        Object.keys(data).forEach((key) => {
          const val = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
          const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          title = title.replace(reg, val);
          message = message.replace(reg, val);
          if (actionUrl) actionUrl = actionUrl.replace(reg, val);
        });
      }

      // 3. Check User Preferences (if user_id present)
      let allowInApp = true;
      let allowEmail = true;
      let allowSms = true;

      if (recipientUserId) {
        const prefs = await db.query(
          `SELECT * FROM notification_preferences WHERE user_id = ? LIMIT 1`,
          [recipientUserId]
        );
        const pref = Array.isArray(prefs) ? prefs[0] : null;
        if (pref) {
          allowInApp = Boolean(pref.in_app_enabled);
          allowEmail = Boolean(pref.email_enabled);
          allowSms = Boolean(pref.sms_enabled);

          // Check Quiet Hours
          if (pref.quiet_hours_enabled && pref.quiet_hours_start && pref.quiet_hours_end) {
            const nowTime = new Date().toTimeString().slice(0, 8);
            if (nowTime >= pref.quiet_hours_start || nowTime <= pref.quiet_hours_end) {
              if (priority !== 'urgent') {
                allowInApp = false;
              }
            }
          }
        }
      }

      if (!allowInApp && channel === 'in_app') {
        console.log(`Notification skipped for user ${recipientUserId} due to quiet hours or preference settings.`);
        return { skipped: true };
      }

      // 4. Save to Database
      const refNo = data.reference_number || data.ref_no || `NTF-${Date.now().toString(36).toUpperCase()}`;
      const moduleName = data.module_name || 'GENERAL';
      const recordId = data.record_id || null;
      let targetEmail = data.email || data.recipient_email || visitorEmail || data.visitor_email || null;
      const targetPhone = data.phone || data.visitor_phone || null;

      // If recipientUserId is provided and no email was explicitly passed, lookup the user's email from users table
      if (!targetEmail && recipientUserId) {
        const u = await db.query('SELECT email FROM users WHERE id = ? LIMIT 1', [recipientUserId]);
        if (Array.isArray(u) && u[0]?.email) {
          targetEmail = u[0].email;
        }
      }

      // If notification is for a visitor, store their email in visitor_email column.
      // If notification is for a host/employee, keep visitor_email null so only the recipient user sees it.
      const storedVisitorEmail = data.is_visitor !== false && (visitorEmail || data.visitor_email || (!recipientUserId ? targetEmail : null));

      const result = await db.query(
        `INSERT INTO notifications 
          (user_id, visitor_email, template_id, type, priority, category, channel, title, message, status, reference_number, module_name, record_id, action_url, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?, FALSE)`,
        [
          recipientUserId || null,
          storedVisitorEmail || null,
          template ? template.id : null,
          eventKey,
          priority,
          category,
          channel,
          title,
          message,
          refNo,
          moduleName,
          recordId,
          actionUrl
        ]
      );

      const notificationId = result.insertId;

      // 5. Track In-App Delivery Status
      await db.query(
        `INSERT INTO notification_delivery (notification_id, channel, status, delivered_at)
         VALUES (?, ?, 'delivered', NOW())`,
        [notificationId, 'in_app']
      );

      // 6. Optional Asynchronous Email Dispatch
      if (allowEmail && targetEmail) {
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 24px 28px; border-bottom: 1px solid #3730a3;">
              <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Visitor Management System</h2>
              <p style="margin: 4px 0 0 0; color: #a5b4fc; font-size: 13px;">Notification & Alert Center</p>
            </div>
            <div style="padding: 28px;">
              <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 18px; font-weight: 600;">${title}</h3>
              <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e2e8f0;">${message}</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #94a3b8; margin-top: 16px;">
                <tr>
                  <td style="padding: 6px 0;"><strong>Reference:</strong> ${refNo}</td>
                  <td style="padding: 6px 0; text-align: right;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</td>
                </tr>
              </table>
            </div>
            <div style="background: #090d16; padding: 16px 28px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">Enterprise Security & Visitor Compliance System</p>
            </div>
          </div>
        `;

        EmailService.sendMail({
          to: targetEmail,
          subject: `[VMS] ${title}`,
          text: `${title}\n\n${message}\n\nReference: ${refNo}`,
          html: emailHtml
        }).then(async (emailRes) => {
          const emailStatus = emailRes.status === 'success' ? 'delivered' : 'failed';
          await db.query(
            `INSERT INTO notification_delivery (notification_id, channel, status, provider_message_id, error_message, delivered_at)
             VALUES (?, 'email', ?, ?, ?, NOW())`,
            [notificationId, emailStatus, emailRes.etherealUrl || null, emailRes.error || null]
          );
        }).catch(err => console.warn('[NotificationService] Email dispatch background error:', err.message));
      }

      // 7. Optional Asynchronous SMS Dispatch
      if (allowSms && targetPhone) {
        SmsService.sendSms({
          to: targetPhone,
          message: `${title}: ${message} (Ref: ${refNo})`
        }).then(async (smsRes) => {
          const smsStatus = smsRes.status === 'success' ? 'delivered' : 'failed';
          await db.query(
            `INSERT INTO notification_delivery (notification_id, channel, status, provider_message_id, error_message, delivered_at)
             VALUES (?, 'sms', ?, ?, ?, NOW())`,
            [notificationId, smsStatus, smsRes.providerMessageId || null, smsRes.error || null]
          );
        }).catch(err => console.warn('[NotificationService] SMS dispatch background error:', err.message));
      }

      // 8. Audit Log
      await db.query(
        `INSERT INTO notification_audit_logs (notification_id, user_id, action, details)
         VALUES (?, ?, 'DISPATCH_SUCCESS', ?)`,
        [notificationId, recipientUserId || null, `Dispatched event: ${eventKey} via ${channel}`]
      );

      // 9. Socket.IO Real-time Push (if available)
      try {
        const socketService = require('../../system-admin/services/socket.service');
        if (socketService) {
          const payload = {
            id: notificationId,
            eventKey,
            title,
            message,
            priority,
            category,
            action_url: actionUrl,
            reference_number: refNo,
            created_at: new Date(),
            sent_at: new Date(),
            is_read: false,
            read: false,
            user_id: recipientUserId,
            visitor_email: storedVisitorEmail
          };

          if (recipientUserId) {
            socketService.sendToUser(recipientUserId, 'notification', payload);
            socketService.sendToUser(recipientUserId, 'new_notification', payload);
          }
          if (storedVisitorEmail) {
            socketService.emitToRoom(`email_${storedVisitorEmail}`, 'notification', payload);
            socketService.emitToRoom(`email_${storedVisitorEmail}`, 'new_notification', payload);
          }
          // Role-targeted pushes
          if (category === 'Security' || (eventKey && eventKey.startsWith('SECURITY_'))) {
            socketService.emitToRole('security', 'notification', payload);
            socketService.emitToRole('security_officer', 'notification', payload);
          }
          if (category === 'Reception' || (eventKey && eventKey.startsWith('RECEPTION_'))) {
            socketService.emitToRole('receptionist', 'notification', payload);
          }
          if (category === 'Admin' || (eventKey && (eventKey.startsWith('ORG_') || eventKey.startsWith('SYSTEM_') || eventKey.startsWith('USER_')))) {
            socketService.emitToRole('admin', 'notification', payload);
          }
          socketService.broadcastLiveNotification(payload);
        }
      } catch (err) {
        // Socket optional
      }

      return {
        id: notificationId,
        eventKey,
        title,
        message,
        reference_number: refNo,
        action_url: actionUrl,
        status: 'sent'
      };

    } catch (err) {
      console.error('Error dispatching business notification:', err);
      throw err;
    }
  }

  /**
   * Get User / Employee Notifications List with Advanced Filtering, Search & Counts
   */
  async getUserNotifications(userId, userEmail, queryParams = {}) {
    try {
      const { category, priority, status, search, limit = 50, offset = 0, role } = queryParams;

      let whereClause = `WHERE (user_id = ? OR (visitor_email IS NOT NULL AND visitor_email != '' AND visitor_email = ?))`;
      let params = [userId || 0, userEmail || ''];

      const normRole = String(role || queryParams.role || '').toLowerCase().trim();
      const isAdmin = normRole === 'admin' || normRole === 'sysadmin' || normRole === 'super_admin' || normRole === 'system_admin' || normRole === 'developer' || normRole.includes('admin');

      if (isAdmin) {
        whereClause = `WHERE 1=1`;
        params = [];
      }

      if (category && category !== 'ALL') {
        whereClause += ` AND (category = ? OR type LIKE ?)`;
        params.push(category, `%${category}%`);
      }

      if (priority && priority !== 'ALL') {
        whereClause += ` AND priority = ?`;
        params.push(priority);
      }

      if (status === 'UNREAD') {
        whereClause += ` AND is_read = FALSE`;
      } else if (status === 'READ') {
        whereClause += ` AND is_read = TRUE`;
      }

      if (search) {
        whereClause += ` AND (title LIKE ? OR message LIKE ? OR reference_number LIKE ? OR category LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const sql = `
        SELECT id, user_id, visitor_email, type, priority, category, channel,
               title, message, status, is_read, reference_number, module_name,
               record_id, action_url, sent_at, read_at, created_at
        FROM notifications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rawRows = await db.query(sql, [...params, Number(limit), Number(offset)]);
      const rows = Array.isArray(rawRows?.[0]) ? rawRows[0] : (Array.isArray(rawRows) ? rawRows : []);

      // Calculate detailed counts for Employee Notification Dashboard & Center
      const countSql = `
        SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread,
           SUM(CASE WHEN priority IN ('urgent', 'high') THEN 1 ELSE 0 END) as critical,
           SUM(CASE WHEN category IN ('Approval Workflow', 'APPROVAL') OR type LIKE '%APPROV%' THEN 1 ELSE 0 END) as pending_approvals,
           SUM(CASE WHEN category IN ('Reception', 'VISITOR_ARRIVAL') OR type LIKE '%ARRIV%' THEN 1 ELSE 0 END) as visitor_arrivals,
           SUM(CASE WHEN category IN ('Security', 'SECURITY') OR type LIKE '%SECURITY%' OR priority = 'urgent' THEN 1 ELSE 0 END) as security_alerts,
           SUM(CASE WHEN category IN ('Appointments', 'Meeting') OR type LIKE '%MEETING%' OR type LIKE '%APPT%' THEN 1 ELSE 0 END) as meeting_reminders,
           SUM(CASE WHEN category IN ('System', 'SYSTEM') OR type LIKE '%SYSTEM%' THEN 1 ELSE 0 END) as system_notices
         FROM notifications
         ${whereClause}
      `;

      const rawCounts = await db.query(countSql, params);
      const countList = Array.isArray(rawCounts?.[0]) ? rawCounts[0] : (Array.isArray(rawCounts) ? rawCounts : []);
      const counts = countList[0] || {
        total: 0, unread: 0, critical: 0, pending_approvals: 0,
        visitor_arrivals: 0, security_alerts: 0, meeting_reminders: 0, system_notices: 0
      };

      return {
        notifications: Array.isArray(rows) ? rows : [],
        counts: {
          total: Number(counts.total || 0),
          unread: Number(counts.unread || 0),
          critical: Number(counts.critical || 0),
          pending_approvals: Number(counts.pending_approvals || 0),
          visitor_arrivals: Number(counts.visitor_arrivals || 0),
          security_alerts: Number(counts.security_alerts || 0),
          meeting_reminders: Number(counts.meeting_reminders || 0),
          system_notices: Number(counts.system_notices || 0)
        }
      };

    } catch (err) {
      console.error('Error fetching user notifications:', err);
      throw err;
    }
  }

  /**
   * Get Visitor Notifications List with Filtering, Search & Counts
   */
  async getVisitorNotifications(userId, visitorEmail, queryParams = {}) {
    return this.getUserNotifications(userId, visitorEmail, queryParams);
  }

  /**
   * Get Real-time Database Unread Counts for Authenticated User (Notifications & Messages)
   */
  async getUnreadCounts(userId, userEmail, role, orgId = null) {
    try {
      // 1. Calculate Unread Notifications for authenticated user & scope
      let notifSql = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE is_read = FALSE
          AND (user_id = ? OR (visitor_email IS NOT NULL AND visitor_email != '' AND visitor_email = ?))
      `;
      let notifParams = [userId || 0, userEmail || ''];

      const normRole = String(role || '').toLowerCase().trim();
      const isAdmin = normRole === 'admin' || normRole === 'sysadmin' || normRole === 'super_admin' || normRole === 'system_admin' || normRole === 'developer' || normRole.includes('admin');
      if (isAdmin) {
        notifSql = `SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE`;
        notifParams = [];
      }

      const notifRes = await db.query(notifSql, notifParams);
      const notifRows = Array.isArray(notifRes[0]) ? notifRes[0] : (Array.isArray(notifRes) ? notifRes : []);
      const unreadNotifications = Number(notifRows[0]?.count || 0);

      // 2. Calculate Unread Chat Messages from real MySQL chat system
      let unreadMessages = 0;
      try {
        const chatSql = `
          SELECT COUNT(*) as count
          FROM chat_messages cm
          JOIN chat_participants cp ON cm.conversation_id = cp.conversation_id
          WHERE cp.user_id = ?
            AND cm.sender_id != ?
            AND cm.is_deleted = FALSE
            AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at)
        `;
        const chatRes = await db.query(chatSql, [userId || 0, userId || 0]);
        const chatRows = Array.isArray(chatRes[0]) ? chatRes[0] : (Array.isArray(chatRes) ? chatRes : []);
        unreadMessages = Number(chatRows[0]?.count || 0);
      } catch (e) {
        let msgSql = `
          SELECT COUNT(*) as count 
          FROM messages 
          WHERE is_read = FALSE 
            AND (recipient_id = ? OR (recipient_role = ? AND recipient_role IS NOT NULL))
            AND (sender_id IS NULL OR sender_id != ?)
        `;
        const msgRes = await db.query(msgSql, [userId || 0, role || '', userId || 0]);
        const msgRows = Array.isArray(msgRes[0]) ? msgRes[0] : (Array.isArray(msgRes) ? msgRes : []);
        unreadMessages = Number(msgRows[0]?.count || 0);
      }

      return {
        success: true,
        data: {
          notifications: unreadNotifications,
          messages: unreadMessages
        },
        unreadCount: unreadNotifications,
        unreadMessagesCount: unreadMessages
      };
    } catch (err) {
      console.error('Error in getUnreadCounts:', err);
      return {
        success: false,
        data: { notifications: 0, messages: 0 },
        unreadCount: 0,
        unreadMessagesCount: 0
      };
    }
  }

  /**
   * Mark Single Notification Read
   */
  async markAsRead(notificationId, userId = null, role = null) {
    try {
      let sql = `UPDATE notifications SET is_read = TRUE, read_at = NOW(), status = 'read' WHERE id = ?`;
      const params = [notificationId];

      const normRole = String(role || '').toLowerCase().trim();
      const isAdmin = normRole === 'admin' || normRole === 'sysadmin' || normRole === 'super_admin' || normRole === 'system_admin' || normRole === 'developer' || normRole.includes('admin');

      if (!isAdmin && userId) {
        sql += ` AND (user_id = ? OR user_id IS NULL)`;
        params.push(userId);
      }

      await db.query(sql, params);

      try {
        await db.query(
          `INSERT INTO notification_audit_logs (notification_id, user_id, action, details)
           VALUES (?, ?, 'MARK_READ', 'Notification marked as read by user')`,
          [notificationId, userId || null]
        );
      } catch (auditErr) {
        // Quiet catch for audit log table variations
      }

      return { success: true, message: 'Notification marked as read' };
    } catch (err) {
      console.error('Error marking notification read:', err);
      throw err;
    }
  }

  /**
   * Mark All Notifications Read
   */
  async markAllAsRead(userId = null, userEmail = null, role = null) {
    try {
      const normRole = String(role || '').toLowerCase().trim();
      const isAdmin = normRole === 'admin' || normRole === 'sysadmin' || normRole === 'super_admin' || normRole === 'system_admin' || normRole === 'developer' || normRole.includes('admin');

      let sql;
      let params = [];

      if (isAdmin) {
        sql = `UPDATE notifications SET is_read = TRUE, read_at = NOW(), status = 'read' WHERE is_read = FALSE`;
      } else if (userId && userEmail) {
        sql = `UPDATE notifications SET is_read = TRUE, read_at = NOW(), status = 'read' WHERE (user_id = ? OR (visitor_email IS NOT NULL AND visitor_email != '' AND visitor_email = ?)) AND is_read = FALSE`;
        params = [userId, userEmail];
      } else if (userId) {
        sql = `UPDATE notifications SET is_read = TRUE, read_at = NOW(), status = 'read' WHERE user_id = ? AND is_read = FALSE`;
        params = [userId];
      } else if (userEmail) {
        sql = `UPDATE notifications SET is_read = TRUE, read_at = NOW(), status = 'read' WHERE visitor_email = ? AND is_read = FALSE`;
        params = [userEmail];
      } else {
        sql = `UPDATE notifications SET is_read = TRUE, read_at = NOW(), status = 'read' WHERE is_read = FALSE`;
      }

      await db.query(sql, params);

      try {
        await db.query(
          `INSERT INTO notification_audit_logs (user_id, action, details)
           VALUES (?, 'MARK_ALL_READ', 'All unread notifications marked as read by user')`,
          [userId || null]
        );
      } catch (auditErr) {
        // Quiet catch
      }

      return { success: true, message: 'All notifications marked as read' };
    } catch (err) {
      console.error('Error marking all notifications read:', err);
      throw err;
    }
  }

  /**
   * Get Notification Detail Payload with Audit Info
   */
  async getNotificationDetails(notificationId, userId, role = null) {
    try {
      const normRole = String(role || '').toLowerCase().trim();
      const isAdmin = normRole === 'admin' || normRole === 'sysadmin' || normRole === 'super_admin' || normRole === 'system_admin' || normRole === 'developer' || normRole.includes('admin');

      let whereClause = `WHERE n.id = ?`;
      let params = [notificationId];
      if (!isAdmin && userId) {
        whereClause += ` AND (n.user_id = ? OR n.user_id IS NULL)`;
        params.push(userId);
      }

      const rawRows = await db.query(
        `SELECT n.*, 
                t.name as template_name, t.body_template
         FROM notifications n
         LEFT JOIN notification_templates t ON n.template_id = t.id
         ${whereClause} LIMIT 1`,
        params
      );

      const rows = Array.isArray(rawRows?.[0]) ? rawRows[0] : (Array.isArray(rawRows) ? rawRows : []);

      if (!rows || !rows.length) {
        throw new Error('Notification record not found');
      }

      const notif = rows[0];

      // Fetch delivery tracking info
      const delivery = await db.query(
        `SELECT * FROM notification_delivery WHERE notification_id = ? ORDER BY created_at DESC`,
        [notificationId]
      );

      // Fetch audit logs
      const audits = await db.query(
        `SELECT * FROM notification_audit_logs WHERE notification_id = ? ORDER BY created_at DESC`,
        [notificationId]
      );

      return {
        ...notif,
        delivery_history: Array.isArray(delivery) ? delivery : [],
        audit_history: Array.isArray(audits) ? audits : []
      };
    } catch (err) {
      console.error('Error fetching notification details:', err);
      throw err;
    }
  }

  /**
   * Delete single notification from MySQL database permanently
   */
  async deleteNotification(notificationId, userId = null, role = null) {
    try {
      const normRole = String(role || '').toLowerCase().trim();
      const isAdmin = normRole === 'admin' || normRole.includes('admin');

      let sql = `DELETE FROM notifications WHERE id = ?`;
      let params = [notificationId];

      if (!isAdmin && userId) {
        sql += ` AND (user_id = ? OR visitor_email IS NOT NULL)`;
        params.push(userId);
      }

      await db.query(sql, params);
      return { success: true, message: 'Notification deleted successfully' };
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }

  /**
   * Bulk Delete multiple notifications from MySQL database permanently
   */
  async bulkDeleteNotifications(ids, userId = null, role = null) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return { success: true, count: 0, message: 'No notifications specified' };
      }
      const normRole = String(role || '').toLowerCase().trim();
      const isAdmin = normRole === 'admin' || normRole.includes('admin');

      const cleanIds = ids.map(Number).filter((n) => !isNaN(n) && n > 0);
      if (cleanIds.length === 0) {
        return { success: true, count: 0, message: 'No valid notification IDs' };
      }

      let sql = `DELETE FROM notifications WHERE id IN (${cleanIds.map(() => '?').join(',')})`;
      let params = [...cleanIds];

      if (!isAdmin && userId) {
        sql += ` AND (user_id = ? OR visitor_email IS NOT NULL)`;
        params.push(userId);
      }

      const res = await db.query(sql, params);
      return {
        success: true,
        count: res?.affectedRows || cleanIds.length,
        message: `${cleanIds.length} notifications deleted permanently`
      };
    } catch (err) {
      console.error('Error bulk deleting notifications:', err);
      throw err;
    }
  }

  /**
   * Mark single notification as Unread
   */
  async markAsUnread(notificationId, userId = null, role = null) {
    try {
      const normRole = String(role || '').toLowerCase().trim();
      const isAdmin = normRole === 'admin' || normRole.includes('admin');

      let sql = `UPDATE notifications SET is_read = FALSE, read_at = NULL, status = 'delivered' WHERE id = ?`;
      let params = [notificationId];

      if (!isAdmin && userId) {
        sql += ` AND (user_id = ? OR user_id IS NULL)`;
        params.push(userId);
      }

      await db.query(sql, params);
      return { success: true, message: 'Notification marked as unread' };
    } catch (err) {
      console.error('Error marking notification unread:', err);
      throw err;
    }
  }

  /**
   * Forward notification to specified email or target user
   */
  async forwardNotification(notificationId, targetEmail = '', targetUserId = null, senderUserId = null) {
    try {
      const notifRes = await db.query(`SELECT * FROM notifications WHERE id = ? LIMIT 1`, [notificationId]);
      const notifList = Array.isArray(notifRes[0]) ? notifRes[0] : (Array.isArray(notifRes) ? notifRes : []);
      const notif = notifList[0];
      if (!notif) throw new Error('Notification not found');

      const title = `[Fwd] ${notif.title}`;
      const message = `Forwarded message:\n${notif.message}`;

      await db.query(
        `INSERT INTO notifications (user_id, visitor_email, type, priority, category, channel, title, message, status, sent_at, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent', NOW(), FALSE)`,
        [targetUserId || null, targetEmail || null, notif.type || 'GENERAL', notif.priority || 'normal', 'Forwarded', 'in_app', title, message]
      );

      return { success: true, message: 'Notification forwarded successfully' };
    } catch (err) {
      console.error('Error forwarding notification:', err);
      throw err;
    }
  }

  /**
   * Fetch Announcements List
   */
  async getAnnouncements() {
    try {
      const rows = await db.query(
        `SELECT * FROM system_announcements ORDER BY created_at DESC LIMIT 20`
      );
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.error('Error fetching announcements:', err);
      return [];
    }
  }

  /**
   * Admin Delivery Logs with Advanced Filtering & Search
   */
  async getDeliveryLogs(params = {}) {
    try {
      const { status, channel, search, limit = 50, offset = 0 } = params;
      let whereClause = `WHERE 1=1`;
      const queryArgs = [];

      if (status && status !== 'ALL') {
        whereClause += ` AND nd.status = ?`;
        queryArgs.push(status);
      }

      if (channel && channel !== 'ALL') {
        whereClause += ` AND nd.channel = ?`;
        queryArgs.push(channel);
      }

      if (search) {
        whereClause += ` AND (n.title LIKE ? OR n.reference_number LIKE ? OR nd.recipient_address LIKE ? OR nd.error_message LIKE ?)`;
        const q = `%${search}%`;
        queryArgs.push(q, q, q, q);
      }

      const sql = `
        SELECT nd.*,
               n.title as notification_title,
               n.type as notification_type,
               n.priority,
               n.category,
               n.reference_number,
               n.user_id,
               n.visitor_email,
               u.full_name as user_full_name,
               u.email as user_email
        FROM notification_delivery nd
        JOIN notifications n ON nd.notification_id = n.id
        LEFT JOIN users u ON n.user_id = u.id
        ${whereClause}
        ORDER BY nd.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rows = await db.query(sql, [...queryArgs, Number(limit), Number(offset)]);

      const countSql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued
        FROM notification_delivery nd
        JOIN notifications n ON nd.notification_id = n.id
        ${whereClause}
      `;
      const countRows = await db.query(countSql, queryArgs);

      return {
        deliveries: Array.isArray(rows) ? rows : [],
        stats: (Array.isArray(countRows) && countRows[0]) || { total: 0, delivered: 0, failed: 0, queued: 0 }
      };
    } catch (err) {
      console.error('Error fetching delivery logs:', err);
      return { deliveries: [], stats: { total: 0, delivered: 0, failed: 0, queued: 0 } };
    }
  }

  /**
   * Retry Failed Channel Delivery
   */
  async retryDelivery(notificationId, targetChannel = 'email') {
    try {
      const notifRows = await db.query(`SELECT * FROM notifications WHERE id = ? LIMIT 1`, [notificationId]);
      if (!Array.isArray(notifRows) || !notifRows.length) {
        throw new Error('Notification record not found');
      }

      const notif = notifRows[0];
      let userObj = null;

      if (notif.user_id) {
        const uRows = await db.query(`SELECT email, phone, mobile_number FROM users WHERE id = ? LIMIT 1`, [notif.user_id]);
        userObj = Array.isArray(uRows) ? uRows[0] : null;
      }

      const targetEmail = notif.visitor_email || (userObj ? userObj.email : null);
      const targetPhone = userObj ? (userObj.phone || userObj.mobile_number) : null;

      let resultStatus = 'failed';
      let errorMsg = null;
      let providerMsgId = null;

      if (targetChannel === 'email') {
        if (!targetEmail) {
          throw new Error('Email unavailable: No verified email address found for recipient');
        }
        const emailRes = await EmailService.sendMail({
          to: targetEmail,
          subject: `[RETRY] ${notif.title}`,
          text: notif.message,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 10px;">
                  <h3 style="color: #60a5fa; font-weight: bold;">${notif.title}</h3>
                  <p style="font-size: 14px; line-height: 1.6;">${notif.message}</p>
                  <p style="font-size: 12px; color: #94a3b8;">Reference: ${notif.reference_number || 'N/A'}</p>
                 </div>`
        });
        resultStatus = emailRes.status === 'success' ? 'delivered' : 'failed';
        errorMsg = emailRes.error || null;
        providerMsgId = emailRes.etherealUrl || null;
      } else if (targetChannel === 'sms') {
        if (!targetPhone) {
          throw new Error('SMS unavailable: No verified phone number found for recipient');
        }
        const smsRes = await SmsService.sendSms({
          to: targetPhone,
          message: `${notif.title}: ${notif.message} (Ref: ${notif.reference_number || 'N/A'})`
        });
        resultStatus = smsRes.status === 'success' ? 'delivered' : 'failed';
        errorMsg = smsRes.error || null;
        providerMsgId = smsRes.providerMessageId || null;
      }

      // Update delivery record
      await db.query(
        `UPDATE notification_delivery 
         SET status = ?, 
             retry_count = retry_count + 1, 
             last_retry_at = NOW(), 
             error_message = ?, 
             provider_message_id = ?,
             delivered_at = IF(? = 'delivered', NOW(), delivered_at),
             failed_at = IF(? = 'failed', NOW(), failed_at)
         WHERE notification_id = ? AND channel = ?`,
        [resultStatus, errorMsg, providerMsgId, resultStatus, resultStatus, notificationId, targetChannel]
      );

      // Audit Log
      await db.query(
        `INSERT INTO notification_audit_logs (notification_id, user_id, action, details)
         VALUES (?, ?, 'RETRY_DELIVERY', ?)`,
        [notificationId, notif.user_id || null, `Manual retry executed for channel ${targetChannel}: ${resultStatus}`]
      );

      return {
        success: resultStatus === 'delivered',
        status: resultStatus,
        channel: targetChannel,
        errorMessage: errorMsg
      };
    } catch (err) {
      console.error('Error retrying notification delivery:', err);
      throw err;
    }
  }

  /**
   * Create Manual Notification (Admin Broadcast / Direct Send)
   */
  async createManualNotification(payload, senderUserId = null) {
    try {
      const {
        recipient_type = 'individual',
        recipient_id,
        recipient_email,
        recipient_phone,
        title,
        message,
        priority = 'medium',
        category = 'General',
        channels = ['in_app'],
        scheduled_at
      } = payload;

      if (!title || !message) {
        throw new Error('Notification title and message content are required');
      }

      const RecipientResolverService = require('./recipient-resolver.service');
      const resolvedRecipients = await RecipientResolverService.resolveRecipients(recipient_type, {
        recipient_id,
        recipient_email,
        role_code: payload.role_code,
        department_id: payload.department_id,
        branch_id: payload.branch_id
      });

      const channelWarnings = [];
      const createdNotifications = [];

      for (const rec of resolvedRecipients) {
        const userId = rec.id || null;
        const email = rec.email || recipient_email || null;
        const phone = rec.phone || rec.mobile_number || recipient_phone || null;

        // Verify channel availability
        const activeChannels = [...channels];
        if (activeChannels.includes('email') && !email) {
          channelWarnings.push(`Email delivery skipped for user ${rec.full_name || 'Recipient'}: No verified email address.`);
        }
        if (activeChannels.includes('sms') && !phone) {
          channelWarnings.push(`SMS delivery skipped for user ${rec.full_name || 'Recipient'}: No verified phone number.`);
        }

        const res = await this.dispatchBusinessNotification(
          'MANUAL_NOTIFICATION',
          userId,
          {
            title,
            message,
            priority,
            category,
            channel: activeChannels[0] || 'in_app',
            reference_number: `MNTF-${Date.now().toString(36).toUpperCase()}`,
            phone
          },
          email
        );
        createdNotifications.push(res);
      }

      // Log Audit Entry
      await db.query(
        `INSERT INTO notification_audit_logs (user_id, action, details, metadata)
         VALUES (?, 'MANUAL_SEND', ?, ?)`,
        [
          senderUserId || null,
          `Manual notification dispatched to ${resolvedRecipients.length} recipients`,
          JSON.stringify({ recipient_type, channels, count: resolvedRecipients.length })
        ]
      );

      return {
        success: true,
        recipientsCount: resolvedRecipients.length,
        createdNotifications,
        warnings: channelWarnings
      };
    } catch (err) {
      console.error('Error creating manual notification:', err);
      throw err;
    }
  }

  /**
   * Universal Notification Dispatch Wrapper
   */
  async sendNotification(options = {}) {
    const eventKey = options.eventKey || options.type || options.event_type || 'SYSTEM_NOTIFICATION';
    const userId = options.userId || options.user_id || null;
    const email = options.email || options.visitor_email || options.recipient_email || null;
    return this.dispatchBusinessNotification(eventKey, userId, options, email);
  }

  /**
   * Notify the Host Employee when a new appointment is requested by a visitor.
   * Creates an in-app notification + email for the host user.
   */
  async notifyHostNewAppointment(appointmentId, hostUserId, visitorName, visitorEmail, referenceCode, purpose) {
    try {
      const title = '📅 New Visitor Appointment Request';
      const message = `${visitorName || 'A visitor'}${visitorEmail ? ` (${visitorEmail})` : ''} has requested an appointment.${purpose ? ` Purpose: ${purpose}` : ''} Reference: ${referenceCode || 'N/A'}. Please review and approve or reject.`;

      await this.dispatchBusinessNotification(
        'APPT_REQUESTED',
        hostUserId,
        {
          title,
          message,
          priority: 'high',
          category: 'Approval Workflow',
          channel: 'in_app',
          action_url: '/employee/requests',
          reference_number: referenceCode || `APPT-${Date.now().toString(36).toUpperCase()}`,
          module_name: 'APPOINTMENTS',
          record_id: appointmentId,
          is_visitor: false, // This notification is for the host, not the visitor
          visitor_name: visitorName,
          visitor_email: visitorEmail,
        },
        null // visitorEmail param is null because this notification is FOR the host
      );

      console.log(`[NotificationService] Host ${hostUserId} notified of new appointment request from ${visitorName} (${referenceCode})`);
    } catch (err) {
      console.error('[NotificationService] Error notifying host of new appointment:', err.message);
    }
  }

  /**
   * Notify the Visitor when their appointment status changes (APPROVED / REJECTED / CANCELLED / RESCHEDULED).
   * Looks up the appointment to find the visitor's user_id and email, then dispatches notification.
   */
  async notifyVisitorStatus(appointmentId, statusDecision, details = {}) {
    try {
      // Fetch appointment details with visitor info
      const rows = await db.query(
        `SELECT a.id, a.reference_code, a.visitor_id, a.visitor_user_id, a.purpose,
                a.host_id, a.host_user_id, a.scheduled_start, a.scheduled_end,
                v.full_name as visitor_name, v.email as visitor_email, v.phone as visitor_phone,
                h.full_name as host_name
         FROM appointments a
         LEFT JOIN visitors v ON a.visitor_id = v.id
         LEFT JOIN users h ON a.host_user_id = h.id OR a.host_id = h.id
         WHERE a.id = ?
         LIMIT 1`,
        [appointmentId]
      );

      const appt = Array.isArray(rows) ? rows[0] : null;
      if (!appt) {
        console.warn(`[NotificationService] notifyVisitorStatus: Appointment #${appointmentId} not found`);
        return;
      }

      const decision = (statusDecision || 'APPROVED').toUpperCase();
      let eventKey = 'APPT_APPROVED';
      let title = '✅ Appointment Approved!';
      let message = `Your appointment (Ref: ${appt.reference_code || 'N/A'}) with ${appt.host_name || 'host'} has been approved. You may proceed on the scheduled date.`;

      if (decision === 'REJECTED') {
        eventKey = 'APPT_REJECTED';
        title = '❌ Appointment Rejected';
        message = `Your appointment (Ref: ${appt.reference_code || 'N/A'}) with ${appt.host_name || 'host'} has been rejected.${details.comment ? ` Reason: ${details.comment}` : ' Please contact the host for more information.'}`;
      } else if (decision === 'CANCELLED') {
        eventKey = 'APPT_CANCELLED';
        title = '⚠️ Appointment Cancelled';
        message = `Your appointment (Ref: ${appt.reference_code || 'N/A'}) with ${appt.host_name || 'host'} has been cancelled.${details.comment ? ` Reason: ${details.comment}` : ''}`;
      } else if (decision === 'RESCHEDULED') {
        eventKey = 'APPT_RESCHEDULED';
        title = '📅 Appointment Rescheduled';
        message = `Your appointment (Ref: ${appt.reference_code || 'N/A'}) with ${appt.host_name || 'host'} has been rescheduled. New time: ${appt.scheduled_start || details.newStart || 'Updated schedule'}.`;
      }

      // Determine the visitor's user ID (could be in visitor_user_id or we look it up from users table by email)
      let visitorUserId = appt.visitor_user_id || null;
      if (!visitorUserId && appt.visitor_email) {
        const uRows = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [appt.visitor_email]);
        if (Array.isArray(uRows) && uRows[0]) {
          visitorUserId = uRows[0].id;
        }
      }

      await this.dispatchBusinessNotification(
        eventKey,
        visitorUserId,
        {
          title,
          message,
          priority: 'high',
          category: 'Appointments',
          channel: 'in_app',
          action_url: '/visitor/appointments',
          reference_number: appt.reference_code || `APPT-${Date.now().toString(36).toUpperCase()}`,
          module_name: 'APPOINTMENTS',
          record_id: appointmentId,
          is_visitor: true,
          visitor_name: appt.visitor_name,
          visitor_email: appt.visitor_email,
        },
        appt.visitor_email // Pass visitor email for the visitor_email column + email dispatch
      );

      console.log(`[NotificationService] Visitor ${appt.visitor_name || appt.visitor_email} notified: appointment #${appointmentId} ${decision}`);
    } catch (err) {
      console.error(`[NotificationService] Error notifying visitor of status change:`, err.message);
    }
  }

  /**
   * Notify the Host Employee when a visitor cancels or updates their appointment.
   */
  async notifyHostStatus(appointmentId, statusDecision, details = {}) {
    try {
      const rows = await db.query(
        `SELECT a.id, a.reference_code, a.visitor_id, a.visitor_user_id, a.purpose,
                a.host_id, a.host_user_id, a.scheduled_start,
                v.full_name as visitor_name, v.email as visitor_email, v.phone as visitor_phone,
                h.id as host_user_id_resolved, h.email as host_email
         FROM appointments a
         LEFT JOIN visitors v ON a.visitor_id = v.id
         LEFT JOIN users h ON a.host_user_id = h.id OR a.host_id = h.id
         WHERE a.id = ?
         LIMIT 1`,
        [appointmentId]
      );

      const appt = Array.isArray(rows) ? rows[0] : null;
      if (!appt) return;

      const hostUserId = appt.host_user_id || appt.host_user_id_resolved || appt.host_id;
      const decision = (statusDecision || 'CANCELLED').toUpperCase();

      let eventKey = 'APPT_CANCELLED';
      let title = '⚠️ Visitor Appointment Cancelled';
      let message = `Visitor ${appt.visitor_name || 'Visitor'} has cancelled their appointment (Ref: ${appt.reference_code || 'N/A'}).${details.reason ? ` Reason: ${details.reason}` : ''}`;

      if (decision === 'RESCHEDULED') {
        eventKey = 'APPT_RESCHEDULED';
        title = '📅 Visitor Appointment Rescheduled';
        message = `Visitor ${appt.visitor_name || 'Visitor'} has rescheduled their appointment (Ref: ${appt.reference_code || 'N/A'}).`;
      }

      await this.dispatchBusinessNotification(
        eventKey,
        hostUserId,
        {
          title,
          message,
          priority: 'high',
          category: 'Appointments',
          channel: 'in_app',
          action_url: '/employee/requests',
          reference_number: appt.reference_code || `APPT-${Date.now().toString(36).toUpperCase()}`,
          module_name: 'APPOINTMENTS',
          record_id: appointmentId,
          is_visitor: false,
          visitor_name: appt.visitor_name,
          visitor_email: appt.visitor_email,
        },
        null // Host notification, so visitor_email column is null
      );

      console.log(`[NotificationService] Host ${hostUserId} notified: visitor ${decision} appointment #${appointmentId}`);
    } catch (err) {
      console.error(`[NotificationService] Error notifying host of visitor action:`, err.message);
    }
  }

  /**
   * Enterprise Health & Diagnostics Check
   */
  async getHealthStatus() {
    let dbStatus = 'ERROR';
    try {
      await db.query('SELECT 1');
      dbStatus = 'OK';
    } catch (e) {}

    const socketService = require('../../system-admin/services/socket.service');
    const socketStatus = socketService.io ? 'READY' : 'OFFLINE';

    const emailStatus = (process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_SERVICE) ? 'CONFIGURED' : 'DEV_ETHEREAL_FALLBACK';
    const smsStatus = process.env.SMS_ENABLED === 'true' ? 'CONFIGURED' : 'DISABLED';

    return {
      systemNotification: 'OK',
      database: dbStatus,
      socketIO: socketStatus,
      activeSocketsCount: socketService.getActiveSessionsCount(),
      email: emailStatus,
      sms: smsStatus,
      queue: 'OK',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new NotificationService();
