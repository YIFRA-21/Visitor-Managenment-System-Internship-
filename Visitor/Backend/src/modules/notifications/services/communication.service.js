/**
 * Enterprise Communication & Messaging Service
 * ────────────────────────────────────────────────
 * Service layer for Real-time Messaging, Role-isolated Chat, Persistent Notifications,
 * Real SMTP Email Dispatch, and Administrator Announcements.
 *
 * Enforces:
 * - Strict RBAC & Role Isolation
 * - IDOR prevention on conversation & message access
 * - Real MySQL database persistence (ZERO mock data)
 * - Socket.IO real-time event broadcasting
 */

const db = require('../../../config/db');
const emailService = require('./email.service');
const socketService = require('../../system-admin/services/socket.service');
const { AppError } = require('../../../middleware/errorHandler');

class CommunicationService {
  /**
   * Helper: Normalize user role
   */
  normalizeRole(role) {
    const r = String(role || '').toLowerCase().trim();
    if (r === 'admin' || r === 'administrator' || r === 'super_admin' || r === 'system_admin' || r === 'sysadmin') return 'admin';
    if (r === 'manager' || r === 'department_manager') return 'manager';
    if (r === 'security' || r === 'security_officer') return 'security_officer';
    if (r === 'receptionist' || r === 'front_desk') return 'receptionist';
    if (r === 'employee' || r === 'staff' || r === 'host') return 'employee';
    if (r === 'visitor') return 'visitor';
    return r || 'user';
  }

  /**
   * Check if Sender Role is authorized to communicate with Target Role
   * Business Rules:
   * - Admin can communicate with all staff/system roles (Admin, Manager, Employee, Receptionist, Security)
   * - Staff roles (Manager, Employee, Receptionist, Security) can communicate with each other and Admin
   * - Visitor can ONLY communicate with: Employee/Host, Receptionist, Security Officer, Department Manager
   * - Visitors CANNOT communicate with other Visitors
   */
  isChatAllowed(senderRole, targetRole) {
    const sRole = this.normalizeRole(senderRole);
    const tRole = this.normalizeRole(targetRole);

    // Unrestricted reach for system admins across all users and visitors
    if (sRole === 'admin' || tRole === 'admin') {
      return true;
    }

    // Visitors can reach staff (employee, manager, receptionist, security, admin)
    if (sRole === 'visitor') {
      return ['employee', 'manager', 'receptionist', 'security_officer', 'admin'].includes(tRole);
    }

    if (tRole === 'visitor') {
      return ['employee', 'manager', 'receptionist', 'security_officer', 'admin'].includes(sRole);
    }

    // Staff-to-staff communication (Admin, Manager, Employee, Receptionist, Security)
    return true;
  }

  // ── 1. CONTACTS & RECIPIENTS DISCOVERY ──────────────────────────────────

  /**
   * Get contacts for the authenticated user — returns ALL system users for directory discovery
   */
  async getAvailableContacts(userId, userRole) {
    const normRole = this.normalizeRole(userRole);

    // Fetch all active users across the system excluding self
    const sql = `
      SELECT id, username, email, phone_number, role, full_name, avatar_url, job_title, department_id,
             (SELECT name FROM departments WHERE id = users.department_id) as department_name
      FROM users
      WHERE id != ? AND is_active = TRUE AND status != 'deleted' AND status != 'suspended'
      ORDER BY full_name ASC
    `;
    const rawUsers = await db.query(sql, [userId]);
    const allUsers = Array.isArray(rawUsers[0]) ? rawUsers[0] : (Array.isArray(rawUsers) ? rawUsers : []);

    const contacts = allUsers.map(u => {
      const presence = socketService.getPresence(u.id);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        phone: u.phone_number,
        role: u.role,
        role_label: this.getRoleLabel(u.role),
        full_name: u.full_name || u.username,
        avatar_url: u.avatar_url || null,
        job_title: u.job_title || '',
        department: u.department_name || '',
        is_online: presence?.status === 'online',
        is_chat_allowed: this.isChatAllowed(normRole, u.role)
      };
    });

    return {
      success: true,
      contacts
    };
  }

  /**
   * Add a manual contact with custom info & profile, and immediately initialize a direct conversation
   */
  async createManualContact(creatorUserId, contactData) {
    const { full_name, email, phone, role = 'visitor', department, company, notes } = contactData;
    if (!full_name || !full_name.trim()) {
      throw new AppError('Full name is required.', 400);
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    let targetUserId = null;

    if (cleanEmail) {
      const existingUser = await db.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [cleanEmail]);
      const list = Array.isArray(existingUser[0]) ? existingUser[0] : (Array.isArray(existingUser) ? existingUser : []);
      if (list.length > 0) {
        targetUserId = list[0].id;
      }
    }

    if (!targetUserId) {
      const username = cleanEmail ? cleanEmail.split('@')[0] : `ext_${Date.now().toString().slice(-6)}`;
      const res = await db.query(
        `INSERT INTO users (username, full_name, email, phone_number, role, job_title, status, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', TRUE, NOW())`,
        [username, full_name.trim(), cleanEmail || null, (phone || '').trim() || null, role, company || department || 'External Contact']
      );
      targetUserId = res.insertId;
    }

    // Immediately open direct conversation with this contact
    const convResult = await this.createOrGetDirectConversation(creatorUserId, 'admin', targetUserId);

    return {
      success: true,
      contact: {
        id: targetUserId,
        full_name: full_name.trim(),
        email: cleanEmail,
        phone,
        role,
        company,
        notes
      },
      conversationId: convResult.conversationId,
      message: `Contact "${full_name.trim()}" added and conversation initialized.`
    };
  }

  /**
   * Ensure default group channels:
   * 1. "All Personnel & Operations Hub" — all roles EXCEPT visitor
   * 2. "Department Team Channel" — members of user's department
   */
  async ensureDefaultGroupChats(userId, userRole) {
    const normRole = this.normalizeRole(userRole);
    if (normRole === 'visitor') {
      return; // Visitors are strictly excluded from internal staff group chats
    }

    try {
      // 1. All Personnel & Operations Hub
      const staffGroupTitle = 'All Personnel & Operations Hub';
      const staffRows = await db.query(
        `SELECT id FROM chat_conversations WHERE conversation_type = 'group' AND title = ? LIMIT 1`,
        [staffGroupTitle]
      );
      const staffList = Array.isArray(staffRows[0]) ? staffRows[0] : (Array.isArray(staffRows) ? staffRows : []);
      let staffConvId = staffList[0]?.id;

      if (!staffConvId) {
        const createRes = await db.query(
          `INSERT INTO chat_conversations (conversation_type, title, description, created_by, is_active)
           VALUES ('group', ?, 'Live operations & personnel channel for all internal roles: Admin, Manager, Employee, Receptionist, Security (Visitors excluded).', ?, TRUE)`,
          [staffGroupTitle, userId]
        );
        staffConvId = createRes.insertId;

        // Add all active non-visitor users
        const nonVisitorsRes = await db.query(
          `SELECT id FROM users WHERE (role NOT IN ('visitor', 'guest') OR role IS NULL) AND is_active = TRUE`
        );
        const nonVisitors = Array.isArray(nonVisitorsRes[0]) ? nonVisitorsRes[0] : (Array.isArray(nonVisitorsRes) ? nonVisitorsRes : []);
        for (const u of nonVisitors) {
          try {
            await db.query(
              `INSERT IGNORE INTO chat_participants (conversation_id, user_id, role, joined_at)
               VALUES (?, ?, 'member', NOW())`,
              [staffConvId, u.id]
            );
          } catch (e) {}
        }
      }

      // Add current user to staff group
      try {
        await db.query(
          `INSERT IGNORE INTO chat_participants (conversation_id, user_id, role, joined_at)
           VALUES (?, ?, 'member', NOW())`,
          [staffConvId, userId]
        );
      } catch (e) {}

      // 2. Department Team Channel
      const userDeptRes = await db.query(
        `SELECT u.department_id, d.name as department_name
         FROM users u
         JOIN departments d ON u.department_id = d.id
         WHERE u.id = ? LIMIT 1`,
        [userId]
      );
      const userDeptList = Array.isArray(userDeptRes[0]) ? userDeptRes[0] : (Array.isArray(userDeptRes) ? userDeptRes : []);
      const userDept = userDeptList[0];

      if (userDept && userDept.department_id && userDept.department_name) {
        const teamTitle = `${userDept.department_name} Team Channel`;
        const teamRows = await db.query(
          `SELECT id FROM chat_conversations WHERE conversation_type = 'group' AND title = ? LIMIT 1`,
          [teamTitle]
        );
        const teamList = Array.isArray(teamRows[0]) ? teamRows[0] : (Array.isArray(teamRows) ? teamRows : []);
        let teamConvId = teamList[0]?.id;

        if (!teamConvId) {
          const createTeamRes = await db.query(
            `INSERT INTO chat_conversations (conversation_type, title, description, created_by, is_active)
             VALUES ('group', ?, ?, ?, TRUE)`,
            [teamTitle, `Official team collaboration chat for all ${userDept.department_name} personnel.`, userId]
          );
          teamConvId = createTeamRes.insertId;

          const deptUsersRes = await db.query(
            `SELECT id FROM users WHERE department_id = ? AND (role NOT IN ('visitor', 'guest') OR role IS NULL) AND is_active = TRUE`,
            [userDept.department_id]
          );
          const deptUsers = Array.isArray(deptUsersRes[0]) ? deptUsersRes[0] : (Array.isArray(deptUsersRes) ? deptUsersRes : []);
          for (const u of deptUsers) {
            try {
              await db.query(
                `INSERT IGNORE INTO chat_participants (conversation_id, user_id, role, joined_at)
                 VALUES (?, ?, 'member', NOW())`,
                [teamConvId, u.id]
              );
            } catch (e) {}
          }
        }

        try {
          await db.query(
            `INSERT IGNORE INTO chat_participants (conversation_id, user_id, role, joined_at)
             VALUES (?, ?, 'member', NOW())`,
            [teamConvId, userId]
          );
        } catch (e) {}
      }
    } catch (err) {
      console.error('ensureDefaultGroupChats error:', err);
    }
  }

  /**
   * Create custom Group Conversation with selected participants
   */
  async createGroupConversation(creatorUserId, title, participantUserIds = [], description = '') {
    if (!title || !title.trim()) {
      throw new AppError('Group title is required.', 400);
    }
    const createRes = await db.query(
      `INSERT INTO chat_conversations (conversation_type, title, description, created_by, is_active)
       VALUES ('group', ?, ?, ?, TRUE)`,
      [title.trim(), description || null, creatorUserId]
    );
    const convId = createRes.insertId;

    // Add creator as admin
    await db.query(
      `INSERT INTO chat_participants (conversation_id, user_id, role, joined_at)
       VALUES (?, ?, 'admin', NOW())`,
      [convId, creatorUserId]
    );

    // Add other selected participants
    const uniqueIds = Array.from(new Set(participantUserIds)).filter(id => Number(id) !== Number(creatorUserId));
    for (const uid of uniqueIds) {
      try {
        await db.query(
          `INSERT IGNORE INTO chat_participants (conversation_id, user_id, role, joined_at)
           VALUES (?, ?, 'member', NOW())`,
          [convId, uid]
        );
      } catch (e) {}
    }

    return {
      success: true,
      conversationId: convId,
      message: `Group conversation "${title.trim()}" created successfully with ${uniqueIds.length + 1} participants.`
    };
  }

  getRoleLabel(role) {
    const r = this.normalizeRole(role);
    switch (r) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Department Manager';
      case 'employee': return 'Host Employee';
      case 'receptionist': return 'Receptionist';
      case 'security_officer': return 'Security Officer';
      case 'visitor': return 'Visitor';
      default: return 'User';
    }
  }

  // ── 2. SYSTEM CHAT CONVERSATIONS ──────────────────────────────────────────

  /**
   * Get real conversations where the user is an active participant
   */
  async getUserConversations(userId, userRole) {
    const normRole = this.normalizeRole(userRole);

    // Automatically ensure default internal group chats exist for staff roles
    await this.ensureDefaultGroupChats(userId, normRole);

    const sql = `
      SELECT c.id, c.conversation_type, c.title, c.description, c.avatar_url, c.created_by, c.created_at, c.updated_at,
             cp.role as participant_role, cp.last_read_at,
             (SELECT COUNT(*) 
              FROM chat_messages cm 
              WHERE cm.conversation_id = c.id 
                AND cm.sender_id != ? 
                AND cm.is_deleted = FALSE 
                AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at)
             ) as unread_count,
             (SELECT cm.message_text 
              FROM chat_messages cm 
              WHERE cm.conversation_id = c.id AND cm.is_deleted = FALSE 
              ORDER BY cm.created_at DESC LIMIT 1
             ) as last_message,
             (SELECT cm.message_type 
              FROM chat_messages cm 
              WHERE cm.conversation_id = c.id AND cm.is_deleted = FALSE 
              ORDER BY cm.created_at DESC LIMIT 1
             ) as last_message_type,
             (SELECT cm.created_at 
              FROM chat_messages cm 
              WHERE cm.conversation_id = c.id AND cm.is_deleted = FALSE 
              ORDER BY cm.created_at DESC LIMIT 1
             ) as last_message_at
      FROM chat_conversations c
      JOIN chat_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ? AND c.is_active = TRUE
      ORDER BY COALESCE(last_message_at, c.created_at) DESC
    `;
    const rawRows = await db.query(sql, [userId, userId]);
    const conversations = Array.isArray(rawRows[0]) ? rawRows[0] : (Array.isArray(rawRows) ? rawRows : []);

    // For direct conversations, resolve other participant info
    for (const conv of conversations) {
      conv.created_by = conv.created_by ? Number(conv.created_by) : null;
      conv.is_owner = conv.created_by !== null && Number(conv.created_by) === Number(userId);
      const partSql = `
        SELECT u.id, u.username, u.full_name, u.email, u.role, u.avatar_url, u.job_title,
               (SELECT name FROM departments WHERE id = u.department_id) as department_name
        FROM chat_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ? AND cp.user_id != ?
      `;
      const rawParts = await db.query(partSql, [conv.id, userId]);
      const otherParts = Array.isArray(rawParts[0]) ? rawParts[0] : (Array.isArray(rawParts) ? rawParts : []);

      if (conv.conversation_type === 'direct' && otherParts.length > 0) {
        const other = otherParts[0];
        const presence = socketService.getPresence(other.id);
        conv.other_user = {
          id: other.id,
          name: other.full_name || other.username,
          email: other.email,
          role: other.role,
          role_label: this.getRoleLabel(other.role),
          avatar_url: other.avatar_url,
          job_title: other.job_title,
          department: other.department_name,
          is_online: presence?.status === 'online'
        };
        if (!conv.title) {
          conv.title = other.full_name || other.username;
        }
      } else {
        conv.is_group = true;
        // Query all participants for group
        const allPartsSql = `
          SELECT u.id, u.username, u.full_name, u.email, u.role, u.avatar_url, u.job_title,
                 (SELECT name FROM departments WHERE id = u.department_id) as department_name,
                 cp.role as group_role
          FROM chat_participants cp
          JOIN users u ON cp.user_id = u.id
          WHERE cp.conversation_id = ?
          ORDER BY (u.id = ?) DESC, u.full_name ASC
        `;
        const rawAllParts = await db.query(allPartsSql, [conv.id, userId]);
        const allMembers = Array.isArray(rawAllParts[0]) ? rawAllParts[0] : (Array.isArray(rawAllParts) ? rawAllParts : []);

        conv.participants_count = allMembers.length;
        conv.is_staff_hub = Boolean(conv.title?.includes('All Personnel'));
        conv.is_team_channel = Boolean(conv.title?.includes('Team'));
        let onlineCount = 0;
        conv.group_members = allMembers.map(p => {
          const presence = socketService.getPresence(p.id);
          const isOnline = presence?.status === 'online';
          if (isOnline) onlineCount++;
          return {
            id: p.id,
            name: p.full_name || p.username,
            email: p.email,
            role: p.role,
            role_label: this.getRoleLabel(p.role),
            avatar_url: p.avatar_url,
            department: p.department_name,
            group_role: p.group_role,
            is_online: isOnline,
            is_me: Number(p.id) === Number(userId)
          };
        });
        conv.online_count = onlineCount;
        conv.offline_count = Math.max(0, allMembers.length - onlineCount);
      }
    }

    return {
      success: true,
      conversations
    };
  }

  /**
   * Update team/group conversation title, description and avatar_url
   * Strictly restricted to Team Owner / Creator (or Admin)
   */
  async updateConversation(convId, userId, userRole, { title, description, avatar_url }) {
    const checkRows = await db.query(`SELECT created_by FROM chat_conversations WHERE id = ?`, [convId]);
    const checkList = Array.isArray(checkRows[0]) ? checkRows[0] : (Array.isArray(checkRows) ? checkRows : []);
    const conv = checkList[0];
    if (!conv) {
      throw new AppError('Team channel not found.', 404);
    }

    const normRole = this.normalizeRole(userRole);
    const isOwner = conv.created_by !== null && Number(conv.created_by) === Number(userId);
    const isAdmin = normRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('Permission Denied: Only the team owner/creator can update team information or change photo.', 403);
    }

    await db.query(
      `UPDATE chat_conversations 
       SET title = COALESCE(?, title), 
           description = COALESCE(?, description),
           avatar_url = COALESCE(?, avatar_url),
           updated_at = NOW() 
       WHERE id = ?`,
      [
        title !== undefined && title !== null ? title.trim() : null,
        description !== undefined && description !== null ? description : null,
        avatar_url !== undefined && avatar_url !== null ? avatar_url : null,
        convId
      ]
    );
    return { success: true, message: 'Team information updated successfully.' };
  }

  /**
   * Delete / deactivate team/group conversation
   * Strictly restricted to Team Owner / Creator (or Admin)
   */
  async deleteConversation(convId, userId, userRole) {
    const checkRows = await db.query(`SELECT created_by FROM chat_conversations WHERE id = ?`, [convId]);
    const checkList = Array.isArray(checkRows[0]) ? checkRows[0] : (Array.isArray(checkRows) ? checkRows : []);
    const conv = checkList[0];
    if (!conv) {
      throw new AppError('Team channel not found.', 404);
    }

    const normRole = this.normalizeRole(userRole);
    const isOwner = conv.created_by !== null && Number(conv.created_by) === Number(userId);
    const isAdmin = normRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('Permission Denied: Only the team owner/creator can delete this team channel.', 403);
    }

    await db.query(`UPDATE chat_conversations SET is_active = FALSE WHERE id = ?`, [convId]);
    return { success: true, message: 'Team channel deleted successfully.' };
  }

  /**
   * Add participant to team/group conversation
   */
  async addParticipantToConversation(convId, userIdToAdd) {
    await db.query(
      `INSERT IGNORE INTO chat_participants (conversation_id, user_id, role, joined_at)
       VALUES (?, ?, 'member', NOW())`,
      [convId, userIdToAdd]
    );
    return { success: true, message: 'Member added to team successfully.' };
  }

  /**
   * Remove participant from team/group conversation
   */
  async removeParticipantFromConversation(convId, userIdToRemove) {
    await db.query(
      `DELETE FROM chat_participants WHERE conversation_id = ? AND user_id = ?`,
      [convId, userIdToRemove]
    );
    return { success: true, message: 'Member removed from team successfully.' };
  }

  /**
   * Create or retrieve an existing direct conversation with target user
   * Strictly enforces Role-Based Access Rules
   */
  async createOrGetDirectConversation(userId, userRole, targetUserId) {
    if (Number(userId) === Number(targetUserId)) {
      throw new AppError('Cannot start a conversation with yourself.', 400);
    }

    // 1. Fetch Target User
    const targetRows = await db.query(
      `SELECT id, username, email, role, full_name, avatar_url FROM users WHERE id = ? AND is_active = TRUE LIMIT 1`,
      [targetUserId]
    );
    const targetList = Array.isArray(targetRows[0]) ? targetRows[0] : (Array.isArray(targetRows) ? targetRows : []);
    const targetUser = targetList[0];
    if (!targetUser) {
      throw new AppError('Target user does not exist or is inactive.', 404);
    }

    // 2. Validate Role-Based Chat Matrix
    if (!this.isChatAllowed(userRole, targetUser.role)) {
      throw new AppError(`Communication between ${this.getRoleLabel(userRole)} and ${this.getRoleLabel(targetUser.role)} is restricted by enterprise policy.`, 403);
    }

    // 3. Check for existing direct conversation between these 2 users
    const checkSql = `
      SELECT cp1.conversation_id
      FROM chat_participants cp1
      JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      JOIN chat_conversations c ON c.id = cp1.conversation_id
      WHERE cp1.user_id = ? AND cp2.user_id = ? AND c.conversation_type = 'direct' AND c.is_active = TRUE
      LIMIT 1
    `;
    const checkRows = await db.query(checkSql, [userId, targetUserId]);
    const checkList = Array.isArray(checkRows[0]) ? checkRows[0] : (Array.isArray(checkRows) ? checkRows : []);

    if (checkList.length > 0) {
      return {
        success: true,
        conversationId: checkList[0].conversation_id,
        isExisting: true
      };
    }

    // 4. Create new direct conversation
    const createRes = await db.query(
      `INSERT INTO chat_conversations (conversation_type, title, created_by, is_active) VALUES ('direct', ?, ?, TRUE)`,
      [`${targetUser.full_name || targetUser.username}`, userId]
    );
    const convId = createRes.insertId;

    // Add both participants
    await db.query(
      `INSERT INTO chat_participants (conversation_id, user_id, role, joined_at) VALUES (?, ?, 'admin', NOW()), (?, ?, 'member', NOW())`,
      [convId, userId, convId, targetUserId]
    );

    return {
      success: true,
      conversationId: convId,
      isExisting: false
    };
  }

  // ── 3. CHAT MESSAGES WITH IDOR PROTECTION ─────────────────────────────────

  /**
   * Get messages for conversation with IDOR verification
   */
  async getChatMessages(conversationId, userId, userRole) {
    // IDOR Check: Ensure user is a participant of this conversation (or superadmin)
    const normRole = this.normalizeRole(userRole);
    if (normRole !== 'admin') {
      const partCheck = await db.query(
        `SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1`,
        [conversationId, userId]
      );
      const isPart = Array.isArray(partCheck[0]) ? partCheck[0].length > 0 : (Array.isArray(partCheck) ? partCheck.length > 0 : false);
      if (!isPart) {
        throw new AppError('Access Denied: You are not authorized to view this private conversation.', 403);
      }
    }

    const sql = `
      SELECT cm.id, cm.conversation_id, cm.sender_id, cm.message_type, cm.message_text,
             cm.attachments_json, cm.is_edited, cm.is_deleted, cm.created_at,
             u.full_name as sender_name, u.username as sender_username, u.email as sender_email,
             u.avatar_url as sender_avatar, u.role as sender_role
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.conversation_id = ? AND cm.is_deleted = FALSE
      ORDER BY cm.created_at ASC
    `;
    const rawRows = await db.query(sql, [conversationId]);
    const messages = Array.isArray(rawRows[0]) ? rawRows[0] : (Array.isArray(rawRows) ? rawRows : []);

    // Fetch other participants to determine delivery & seen status
    const partRows = await db.query(
      `SELECT cp.user_id, cp.last_read_at
       FROM chat_participants cp
       WHERE cp.conversation_id = ? AND cp.user_id != ?`,
      [conversationId, userId]
    );
    const otherParticipants = Array.isArray(partRows[0]) ? partRows[0] : (Array.isArray(partRows) ? partRows : []);

    let isAnyReceiverOnline = false;
    let maxOtherReadAt = null;

    for (const p of otherParticipants) {
      const presence = socketService.getPresence(p.user_id);
      if (presence?.status === 'online') {
        isAnyReceiverOnline = true;
      }
      if (p.last_read_at) {
        const t = new Date(p.last_read_at).getTime();
        if (!maxOtherReadAt || t > maxOtherReadAt) {
          maxOtherReadAt = t;
        }
      }
    }

    // Format attachments & assign real-time delivery_status
    const formatted = messages.map(m => {
      let attachments = [];
      if (m.attachments_json) {
        try {
          attachments = typeof m.attachments_json === 'string' ? JSON.parse(m.attachments_json) : m.attachments_json;
        } catch (e) {
          attachments = [];
        }
      }

      const isMine = Number(m.sender_id) === Number(userId);
      let deliveryStatus = 'sent';
      if (isMine) {
        const msgTime = new Date(m.created_at).getTime();
        if (maxOtherReadAt && maxOtherReadAt >= msgTime) {
          deliveryStatus = 'seen'; // Circle: receiver completely seen the text
        } else if (isAnyReceiverOnline) {
          deliveryStatus = 'delivered'; // 2 marks: receiver is online/on page
        } else {
          deliveryStatus = 'sent'; // 1 mark: receiver is offline/away
        }
      }

      return {
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        sender_name: m.sender_name || m.sender_username,
        sender_email: m.sender_email,
        sender_avatar: m.sender_avatar,
        sender_role: m.sender_role,
        role_label: this.getRoleLabel(m.sender_role),
        message_type: m.message_type || 'text',
        message_text: m.message_text,
        attachments: Array.isArray(attachments) ? attachments : [],
        is_edited: Boolean(m.is_edited),
        is_mine: isMine,
        delivery_status: deliveryStatus,
        created_at: m.created_at
      };
    });

    // Mark messages as read by updating last_read_at for this participant
    await db.query(
      `UPDATE chat_participants SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );

    // Broadcast to conversation room so sender sees real-time circle "seen" mark
    socketService.emitToRoom(`conv:${conversationId}`, 'messages_read', {
      conversationId: Number(conversationId),
      readByUserId: Number(userId),
      readAt: new Date().toISOString()
    });

    try {
      const uRes = await db.query(
        `SELECT COUNT(*) as count
         FROM chat_messages cm
         JOIN chat_participants cp ON cm.conversation_id = cp.conversation_id
         WHERE cp.user_id = ?
           AND cm.sender_id != ?
           AND cm.is_deleted = FALSE
           AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at)`,
        [userId, userId]
      );
      const uRows = Array.isArray(uRes[0]) ? uRes[0] : (Array.isArray(uRes) ? uRes : []);
      const newCount = Number(uRows[0]?.count || 0);
      socketService.sendToUser(userId, 'chat_unread_updated', {
        conversationId: Number(conversationId),
        unreadCount: newCount
      });
      socketService.sendToUser(userId, 'chat_unread_count', {
        unreadCount: newCount
      });
    } catch (cntErr) {}

    return {
      success: true,
      messages: formatted
    };
  }

  /**
   * Send a chat message with IDOR check, media support, and Socket.IO emission
   */
  async sendChatMessage(conversationId, senderId, senderRole, messageText, messageType = 'text', attachments = null) {
    // 1. IDOR Check: Ensure sender belongs to this conversation
    const partCheck = await db.query(
      `SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1`,
      [conversationId, senderId]
    );
    const isPart = Array.isArray(partCheck[0]) ? partCheck[0].length > 0 : (Array.isArray(partCheck) ? partCheck.length > 0 : false);
    if (!isPart) {
      throw new AppError('Access Denied: You cannot post messages to a conversation you do not belong to.', 403);
    }

    if (!messageText && (!attachments || attachments.length === 0)) {
      throw new AppError('Message text or attachment is required.', 400);
    }

    const attachmentsJson = attachments && attachments.length > 0 ? JSON.stringify(attachments) : null;
    const finalType = messageType || (attachments && attachments.length > 0 ? attachments[0].type || 'file' : 'text');

    // 2. Insert Message into MySQL
    const insertRes = await db.query(
      `INSERT INTO chat_messages (conversation_id, sender_id, message_type, message_text, attachments_json, is_edited, is_deleted)
       VALUES (?, ?, ?, ?, ?, FALSE, FALSE)`,
      [conversationId, senderId, finalType, messageText || '', attachmentsJson]
    );
    const messageId = insertRes.insertId;

    // 3. Update Conversation updated_at
    await db.query(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?`, [conversationId]);

    // 4. Update Sender's last_read_at
    await db.query(
      `UPDATE chat_participants SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, senderId]
    );

    // 5. Fetch other participants & sender profile for real-time broadcast
    const otherParts = await db.query(
      `SELECT user_id FROM chat_participants WHERE conversation_id = ? AND user_id != ?`,
      [conversationId, senderId]
    );
    const partList = Array.isArray(otherParts[0]) ? otherParts[0] : (Array.isArray(otherParts) ? otherParts : []);
    const isAnyReceiverOnline = partList.some(p => socketService.getPresence(p.user_id)?.status === 'online');

    const userRes = await db.query(`SELECT full_name, username, email, avatar_url, role FROM users WHERE id = ?`, [senderId]);
    const userList = Array.isArray(userRes[0]) ? userRes[0] : (Array.isArray(userRes) ? userRes : []);
    const sender = userList[0] || {};

    const messagePayload = {
      id: messageId,
      conversation_id: Number(conversationId),
      sender_id: Number(senderId),
      sender_name: sender.full_name || sender.username || 'User',
      sender_email: sender.email || '',
      sender_avatar: sender.avatar_url || null,
      sender_role: sender.role || senderRole,
      role_label: this.getRoleLabel(sender.role || senderRole),
      message_type: finalType,
      message_text: messageText || '',
      attachments: attachments || [],
      is_edited: false,
      is_mine: false,
      delivery_status: isAnyReceiverOnline ? 'delivered' : 'sent',
      created_at: new Date().toISOString()
    };

    // 6. Broadcast via Socket.IO
    // Emit to conversation room
    socketService.emitToRoom(`conv:${conversationId}`, 'chat_message', messagePayload);
    for (const p of partList) {
      let recipientUnread = 1;
      try {
        const uRes = await db.query(
          `SELECT COUNT(*) as count
           FROM chat_messages cm
           JOIN chat_participants cp ON cm.conversation_id = cp.conversation_id
           WHERE cp.user_id = ?
             AND cm.sender_id != ?
             AND cm.is_deleted = FALSE
             AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at)`,
          [p.user_id, p.user_id]
        );
        const uRows = Array.isArray(uRes[0]) ? uRes[0] : (Array.isArray(uRes) ? uRes : []);
        recipientUnread = Number(uRows[0]?.count || 1);
      } catch (cntErr) {}

      socketService.sendToUser(p.user_id, 'new_chat_message', {
        conversationId: Number(conversationId),
        message: messagePayload,
        unreadCount: recipientUnread
      });
      socketService.sendToUser(p.user_id, 'chat_unread_updated', {
        conversationId: Number(conversationId),
        unreadCount: recipientUnread
      });
      socketService.sendToUser(p.user_id, 'chat_unread_count', {
        unreadCount: recipientUnread
      });
    }

    return {
      success: true,
      messageId,
      message: messagePayload
    };
  }

  /**
   * Edit message text (Ownership enforced)
   */
  async editChatMessage(conversationId, messageId, userId, newText) {
    if (!newText || !newText.trim()) {
      throw new AppError('Message text cannot be empty.', 400);
    }

    // Verify ownership
    const checkRows = await db.query(
      `SELECT sender_id FROM chat_messages WHERE id = ? AND conversation_id = ? AND is_deleted = FALSE LIMIT 1`,
      [messageId, conversationId]
    );
    const msgList = Array.isArray(checkRows[0]) ? checkRows[0] : (Array.isArray(checkRows) ? checkRows : []);
    const msg = msgList[0];
    if (!msg) {
      throw new AppError('Message not found.', 404);
    }

    if (Number(msg.sender_id) !== Number(userId)) {
      throw new AppError('Unauthorized: You can only edit your own messages.', 403);
    }

    await db.query(
      `UPDATE chat_messages SET message_text = ?, is_edited = TRUE WHERE id = ?`,
      [newText.trim(), messageId]
    );

    // Broadcast edit event
    socketService.emitToRoom(`conv:${conversationId}`, 'message_edited', {
      conversation_id: Number(conversationId),
      message_id: Number(messageId),
      message_text: newText.trim()
    });

    return {
      success: true,
      message: 'Message edited successfully'
    };
  }

  /**
   * Delete message (Soft-delete, ownership or admin enforced)
   */
  async deleteChatMessage(conversationId, messageId, userId, userRole) {
    const normRole = this.normalizeRole(userRole);
    const parsedMsgId = Number(messageId);
    const parsedConvId = Number(conversationId || 0);

    const checkRows = await db.query(
      parsedConvId > 0
        ? `SELECT id, conversation_id, sender_id FROM chat_messages WHERE id = ? AND conversation_id = ? AND is_deleted = FALSE LIMIT 1`
        : `SELECT id, conversation_id, sender_id FROM chat_messages WHERE id = ? AND is_deleted = FALSE LIMIT 1`,
      parsedConvId > 0 ? [parsedMsgId, parsedConvId] : [parsedMsgId]
    );
    const msgList = Array.isArray(checkRows[0]) ? checkRows[0] : (Array.isArray(checkRows) ? checkRows : []);
    const msg = msgList[0];
    if (!msg) {
      throw new AppError('Message not found or already deleted.', 404);
    }

    const isSender = Number(msg.sender_id) === Number(userId);
    const isAdmin = normRole === 'admin';

    if (!isSender && !isAdmin) {
      throw new AppError('Unauthorized: You can only delete your own messages.', 403);
    }

    await db.query(
      `UPDATE chat_messages SET is_deleted = TRUE WHERE id = ?`,
      [parsedMsgId]
    );

    const finalConvId = Number(msg.conversation_id || parsedConvId);

    // Broadcast delete event
    socketService.emitToRoom(`conv:${finalConvId}`, 'message_deleted', {
      conversation_id: finalConvId,
      message_id: parsedMsgId
    });

    return {
      success: true,
      messageId: parsedMsgId,
      conversationId: finalConvId,
      message: 'Message deleted successfully'
    };
  }

  /**
   * Delete specific media attachment from a chat message
   */
  async deleteChatMessageAttachment(conversationId, messageId, attachmentUrl, userId, userRole) {
    const normRole = this.normalizeRole(userRole);
    const parsedMsgId = Number(messageId);
    const parsedConvId = Number(conversationId || 0);

    const checkRows = await db.query(
      `SELECT id, conversation_id, sender_id, message_text, attachments_json FROM chat_messages WHERE id = ? AND is_deleted = FALSE LIMIT 1`,
      [parsedMsgId]
    );
    const msgList = Array.isArray(checkRows[0]) ? checkRows[0] : (Array.isArray(checkRows) ? checkRows : []);
    const msg = msgList[0];
    if (!msg) {
      throw new AppError('Message not found.', 404);
    }

    const isSender = Number(msg.sender_id) === Number(userId);
    const isAdmin = normRole === 'admin';
    if (!isSender && !isAdmin) {
      throw new AppError('Unauthorized: You can only delete your own attachments.', 403);
    }

    let attachments = [];
    try {
      attachments = typeof msg.attachments_json === 'string' ? JSON.parse(msg.attachments_json) : (msg.attachments_json || []);
    } catch {}

    const remaining = attachments.filter(a => a.url !== attachmentUrl && a.filename !== attachmentUrl && a.name !== attachmentUrl);
    const finalConvId = Number(msg.conversation_id || parsedConvId);

    // If no text left and no attachments left, soft-delete entire message
    if ((!msg.message_text || !msg.message_text.trim()) && remaining.length === 0) {
      await db.query(`UPDATE chat_messages SET is_deleted = TRUE WHERE id = ?`, [parsedMsgId]);
      socketService.emitToRoom(`conv:${finalConvId}`, 'message_deleted', {
        conversation_id: finalConvId,
        message_id: parsedMsgId
      });
      return { success: true, deletedMessage: true, messageId: parsedMsgId, conversationId: finalConvId };
    }

    // Otherwise update remaining attachments
    const newJson = remaining.length > 0 ? JSON.stringify(remaining) : null;
    await db.query(`UPDATE chat_messages SET attachments_json = ? WHERE id = ?`, [newJson, parsedMsgId]);

    socketService.emitToRoom(`conv:${finalConvId}`, 'message_edited', {
      conversation_id: finalConvId,
      message_id: parsedMsgId,
      message_text: msg.message_text,
      attachments: remaining
    });

    return {
      success: true,
      deletedMessage: false,
      messageId: parsedMsgId,
      conversationId: finalConvId,
      attachments: remaining
    };
  }

  // ── 4. REAL EMAIL DISPATCH ────────────────────────────────────────────────

  /**
   * Send real email through SMTP service without exposing credentials
   */
  async sendDirectEmail(senderUserId, payload) {
    const { to, subject, body, attachments = [] } = payload;

    if (!to || !to.includes('@')) {
      throw new AppError('A valid recipient email address is required.', 400);
    }
    if (!subject || !subject.trim()) {
      throw new AppError('Email subject is required.', 400);
    }
    if (!body || !body.trim()) {
      throw new AppError('Email body content is required.', 400);
    }

    // Lookup sender details
    const senderRes = await db.query(`SELECT full_name, email FROM users WHERE id = ?`, [senderUserId]);
    const senderList = Array.isArray(senderRes[0]) ? senderRes[0] : (Array.isArray(senderRes) ? senderRes : []);
    const sender = senderList[0] || {};
    const senderName = sender.full_name || 'VMS Staff';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 24px 28px; border-bottom: 1px solid #3730a3;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">Visitor Management System</h2>
          <p style="margin: 4px 0 0 0; color: #a5b4fc; font-size: 13px;">Direct Communication from ${senderName}</p>
        </div>
        <div style="padding: 28px;">
          <h3 style="margin: 0 0 16px 0; color: #60a5fa; font-size: 18px; font-weight: 600;">${subject}</h3>
          <div style="background: #1e293b; border-radius: 8px; padding: 18px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${body}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #94a3b8; margin-top: 16px;">
            <tr>
              <td style="padding: 6px 0;"><strong>Sender:</strong> ${senderName} (${sender.email || 'System'})</td>
              <td style="padding: 6px 0; text-align: right;"><strong>Date:</strong> ${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        <div style="background: #090d16; padding: 16px 28px; text-align: center; border-top: 1px solid #1e293b;">
          <p style="margin: 0; font-size: 11px; color: #64748b;">Enterprise Security & Visitor Compliance System</p>
        </div>
      </div>
    `;

    let plainText = `${subject}\n\n${body}\n\nSent by ${senderName}`;
    if (attachments && attachments.length > 0) {
      const attNames = attachments.map(a => a.name).join(', ');
      plainText += `\n\n[Security Notice: ${attachments.length} attachment(s) (${attNames}) were recorded in the system. Files are omitted from external email transmission to ensure enterprise data privacy.]`;
    }

    const mailOptions = {
      to: to.trim(),
      subject: `[VMS] ${subject.trim()}`,
      text: plainText,
      html: emailHtml
      // Per system requirement: file/doc attachments are omitted from email delivery so receiver email sees ONLY text
    };

    // Call real EmailService
    const result = await emailService.sendMail(mailOptions);

    // Record in MySQL notifications table
    await db.query(
      `INSERT INTO notifications (user_id, visitor_email, type, priority, category, channel, title, message, status, sent_at, is_read)
       VALUES (?, ?, 'DIRECT_EMAIL', 'normal', 'Email Communication', 'email', ?, ?, ?, NOW(), TRUE)`,
      [senderUserId, to.trim(), subject.trim(), body.trim(), result.status === 'success' ? 'sent' : 'failed']
    );

    if (result.status !== 'success') {
      throw new Error(`Email delivery failed: ${result.error || 'SMTP server error'}`);
    }

    return {
      success: true,
      messageId: result.messageId,
      previewUrl: result.etherealUrl || null,
      message: 'Email delivered successfully to recipient inbox.'
    };
  }

  // ── 5. ANNOUNCEMENTS (ADMINISTRATOR ONLY) ──────────────────────────────────

  /**
   * Get persistent announcements from MySQL according to user role scope
   * ZERO mock data
   */
  async getAnnouncements(userRole, orgId = null, query = {}) {
    const normRole = this.normalizeRole(userRole);
    const { search = '', limit = 50, offset = 0 } = query;

    let sql = `
      SELECT a.id, a.title, a.content_body, a.banner_url, a.priority, a.category,
             a.status, a.publish_at, a.expires_at, a.created_by, a.target_audience_json,
             a.allow_comments, a.allow_reactions, a.views_count, a.likes_count, a.created_at,
             u.full_name as author_name, u.email as author_email, u.avatar_url as author_avatar
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.status = 'published' AND (a.expires_at IS NULL OR a.expires_at > NOW())
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ` AND (a.title LIKE ? OR a.content_body LIKE ? OR a.category LIKE ?)`;
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY a.publish_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rawRows = await db.query(sql, params);
    const allAnnouncements = Array.isArray(rawRows[0]) ? rawRows[0] : (Array.isArray(rawRows) ? rawRows : []);

    // Filter by target audience scope
    const filtered = allAnnouncements.filter(ann => {
      if (normRole === 'admin') return true; // Admins see everything
      if (!ann.target_audience_json) return true; // Public/All if not specified

      let audience = [];
      try {
        audience = typeof ann.target_audience_json === 'string' ? JSON.parse(ann.target_audience_json) : ann.target_audience_json;
      } catch (e) {
        audience = [];
      }

      if (!Array.isArray(audience) || audience.length === 0) return true;

      const audLower = audience.map(a => String(a).toLowerCase());
      if (audLower.includes('all') || audLower.includes('all users') || audLower.includes('all roles')) return true;

      if (normRole === 'visitor' && (audLower.includes('visitors') || audLower.includes('all visitors'))) return true;
      if (normRole === 'employee' && (audLower.includes('employees') || audLower.includes('staff') || audLower.includes('all employees'))) return true;
      if (normRole === 'manager' && (audLower.includes('managers') || audLower.includes('management') || audLower.includes('employees'))) return true;
      if (normRole === 'receptionist' && (audLower.includes('reception') || audLower.includes('receptionists') || audLower.includes('staff'))) return true;
      if (normRole === 'security_officer' && (audLower.includes('security') || audLower.includes('security officers') || audLower.includes('staff'))) return true;

      return false;
    });

    return {
      success: true,
      announcements: filtered
    };
  }

  /**
   * Create announcement (Strictly Administrator Only)
   */
  async createAnnouncement(userId, userRole, payload) {
    const normRole = this.normalizeRole(userRole);
    if (normRole !== 'admin') {
      throw new AppError('Access Denied: Only System Administrators are permitted to publish organization announcements.', 403);
    }

    const { title, content_body, banner_url, priority = 'medium', category = 'General Notice', target_audience } = payload;

    if (!title || !title.trim()) {
      throw new AppError('Announcement title is required.', 400);
    }
    if (!content_body || !content_body.trim()) {
      throw new AppError('Announcement content is required.', 400);
    }

    const audienceJson = target_audience && Array.isArray(target_audience)
      ? JSON.stringify(target_audience)
      : JSON.stringify(['All Users']);

    const res = await db.query(
      `INSERT INTO announcements
        (title, content_body, banner_url, priority, category, status, publish_at, created_by, target_audience_json, allow_comments, allow_reactions)
       VALUES (?, ?, ?, ?, ?, 'published', NOW(), ?, ?, TRUE, TRUE)`,
      [title.trim(), content_body.trim(), banner_url || null, priority, category, userId, audienceJson]
    );

    const announcementId = res.insertId;

    // Broadcast to live sockets
    socketService.broadcastLiveNotification({
      type: 'ANNOUNCEMENT',
      title: `[Announcement] ${title.trim()}`,
      message: content_body.trim().slice(0, 150) + '...',
      priority,
      announcement_id: announcementId,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      announcementId,
      message: 'Announcement published permanently in system database.'
    };
  }

  /**
   * Mark announcement as read
   */
  async markAnnouncementRead(announcementId, userId) {
    await db.query(
      `INSERT INTO announcement_recipients (announcement_id, user_id, is_read, read_at)
       VALUES (?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE is_read = TRUE, read_at = NOW()`,
      [announcementId, userId]
    );
    return { success: true };
  }

  /**
   * Update Announcement (Administrator Only)
   */
  async updateAnnouncement(announcementId, userId, userRole, payload) {
    const normRole = this.normalizeRole(userRole);
    if (!normRole.includes('admin') && normRole !== 'system_admin') {
      throw new AppError('Access Denied: Only Administrators can update announcements.', 403);
    }

    const { title, content, contentBody, category, priority, targetRoles } = payload || {};
    const body = content || contentBody || '';
    const rolesJson = Array.isArray(targetRoles) ? JSON.stringify(targetRoles) : null;

    await db.query(
      `UPDATE announcements 
       SET title = COALESCE(?, title),
           content_body = COALESCE(?, content_body),
           category = COALESCE(?, category),
           priority = COALESCE(?, priority),
           target_roles = COALESCE(?, target_roles),
           updated_at = NOW()
       WHERE id = ?`,
      [title || null, body || null, category || null, priority || null, rolesJson, announcementId]
    );

    return { success: true, message: 'Announcement updated successfully' };
  }

  /**
   * Delete Announcement (Administrator Only)
   */
  async deleteAnnouncement(announcementId, userId, userRole) {
    const normRole = this.normalizeRole(userRole);
    if (!normRole.includes('admin') && normRole !== 'system_admin') {
      throw new AppError('Access Denied: Only Administrators can delete announcements.', 403);
    }

    await db.query(`DELETE FROM announcement_recipients WHERE announcement_id = ?`, [announcementId]);
    await db.query(`DELETE FROM announcements WHERE id = ?`, [announcementId]);

    return { success: true, message: 'Announcement deleted successfully' };
  }

  // ── 6. REAL DATABASE UNREAD COUNTS ────────────────────────────────────────

  /**
   * Centralized real-time unread counts from MySQL
   */
  async getUnreadCounts(userId, userRole, userEmail = '') {
    const normRole = this.normalizeRole(userRole);

    // 1. Unread notifications count
    let notifSql = `SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE AND user_id = ?`;
    let notifParams = [userId];

    if (userEmail) {
      notifSql = `SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE AND (user_id = ? OR visitor_email = ?)`;
      notifParams = [userId, userEmail];
    }

    const rawNotifs = await db.query(notifSql, notifParams);
    const notifRows = Array.isArray(rawNotifs[0]) ? rawNotifs[0] : (Array.isArray(rawNotifs) ? rawNotifs : []);
    const unreadNotifications = Number(notifRows[0]?.count || 0);

    // 2. Unread chat messages count across all conversations user belongs to
    const chatSql = `
      SELECT COUNT(*) as count
      FROM chat_messages cm
      JOIN chat_participants cp ON cm.conversation_id = cp.conversation_id
      WHERE cp.user_id = ?
        AND cm.sender_id != ?
        AND cm.is_deleted = FALSE
        AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at)
    `;
    const rawChat = await db.query(chatSql, [userId, userId]);
    const chatRows = Array.isArray(rawChat[0]) ? rawChat[0] : (Array.isArray(rawChat) ? rawChat : []);
    const unreadMessages = Number(chatRows[0]?.count || 0);

    return {
      success: true,
      unreadNotifications,
      unreadMessages,
      totalUnread: unreadNotifications + unreadMessages
    };
  }
}

module.exports = new CommunicationService();
