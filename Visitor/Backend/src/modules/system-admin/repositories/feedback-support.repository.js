const db = require('../../../config/db');
const isMock = () => db?.useMock || (typeof db?.getUseMock === 'function' && db.getUseMock());

// In-memory fallback dataset for seamless offline / demo resilience
let mockFeedbacks = [
  {
    id: 1,
    user_id: 2,
    user_name: 'David Miller',
    user_email: 'emily.d@visitor.com',
    user_code: 'MGR000001',
    avatar_url: null,
    phone_number: '+1 555-0104',
    role_name: 'DEPARTMENT_MANAGER',
    department_name: 'Engineering',
    category: 'FEATURE_REQUEST',
    rating: 5,
    subject: 'Batch approval option for visiting engineering contractors',
    message: 'It would be fantastic to have a multi-select batch approval button on the manager dashboard so we can approve multiple team visitors in one click.',
    status: 'ACCEPTED',
    admin_notes: 'Great operational optimization proposal. Approved for next release sprint.',
    admin_response: 'Thank you David! Our engineering team has accepted your request and queued it for the next scheduled sprint release.',
    responded_by: 1,
    responded_by_name: 'System Admin',
    responded_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 2,
    user_id: 3,
    user_name: 'Lisa Thompson',
    user_email: 'lisa.t@visitor.com',
    user_code: 'REC000001',
    avatar_url: null,
    phone_number: '+1 555-0106',
    role_name: 'RECEPTIONIST',
    department_name: 'Front Desk Operations',
    category: 'UI_UX_DESIGN',
    rating: 4,
    subject: 'QR Scanner Auto-Focus Speed on Check-in Kiosk',
    message: 'The check-in camera sometimes takes 2-3 seconds to focus when visitors hold up mobile phones at an angle. The new high-contrast UI is amazing though!',
    status: 'UNDER_REVIEW',
    admin_notes: 'Testing camera ISO adjustments in kiosk settings.',
    admin_response: 'Under active testing with our device hardware lab.',
    responded_by: 1,
    responded_by_name: 'System Admin',
    responded_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 3,
    user_id: 4,
    user_name: 'Robert Garcia',
    user_email: 'robert.g@visitor.com',
    user_code: 'SEC000001',
    avatar_url: null,
    phone_number: '+1 555-0107',
    role_name: 'SECURITY',
    department_name: 'Corporate Security',
    category: 'SECURITY_POLICY',
    rating: 5,
    subject: 'Watchlist immediate acoustic tone notification',
    message: 'The live alert sound when a flagged visitor scans at Gate 2 helped our officers react in under 15 seconds. Outstanding security feature!',
    status: 'ACCEPTED',
    admin_notes: 'Security validation confirmed.',
    admin_response: 'Glad to hear the emergency audio alert worked effectively during perimeter verification.',
    responded_by: 1,
    responded_by_name: 'System Admin',
    responded_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 4,
    user_id: 5,
    user_name: 'Sarah Johnson',
    user_email: 'sarah.j@visitor.com',
    user_code: 'EMP000001',
    avatar_url: null,
    phone_number: '+1 555-0102',
    role_name: 'EMPLOYEE',
    department_name: 'Human Resources',
    category: 'GENERAL_FEEDBACK',
    rating: 5,
    subject: 'Host notification via SMS arrived instantly',
    message: 'My interview candidates checked in at reception and I received the SMS notice before I even opened my laptop. Saved 10 minutes of wait time!',
    status: 'ACCEPTED',
    admin_notes: 'Positive feedback recorded.',
    admin_response: 'Thank you Sarah, we are optimizing carrier route latency across all employee notification channels.',
    responded_by: 1,
    responded_by_name: 'System Admin',
    responded_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 5,
    user_id: 12,
    user_name: 'John Smith',
    user_email: 'john.smith@email.com',
    user_code: 'VIS000001',
    avatar_url: null,
    phone_number: '+1 555-0199',
    role_name: 'VISITOR',
    department_name: 'Guest Services',
    category: 'UI_UX_DESIGN',
    rating: 5,
    subject: 'Self-Service Pass with Dynamic QR made entry effortless',
    message: 'I generated my visitor pass from the email link on my smartphone before arriving. The receptionist scanned the QR code in 2 seconds and printed my badge!',
    status: 'ACCEPTED',
    admin_notes: 'Visitor digital journey verified.',
    admin_response: 'Thank you John! We are glad the contactless pre-registration experience made your arrival effortless.',
    responded_by: 1,
    responded_by_name: 'System Admin',
    responded_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 6,
    user_id: 1,
    user_name: 'System Administrator',
    user_email: 'admin@visitor.com',
    user_code: 'ADM000001',
    avatar_url: null,
    phone_number: '+1 555-0101',
    role_name: 'ADMIN',
    department_name: 'Executive & IT Operations',
    category: 'SYSTEM_PERFORMANCE',
    rating: 5,
    subject: 'LAN and WebSocket telemetry performance is outstanding',
    message: 'High availability connection pooling and sub-50ms query response times under high-concurrency check-in volume verified.',
    status: 'ACCEPTED',
    admin_notes: 'System benchmarks verified.',
    admin_response: 'Telemetry confirmed optimal across all LAN and multi-branch nodes.',
    responded_by: 1,
    responded_by_name: 'System Admin',
    responded_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let mockTickets = [
  {
    id: 1,
    ticket_number: 'TKT-2026-1001',
    user_id: 3,
    user_name: 'Sarah Jenkins',
    user_email: 'reception@vms.com',
    role_name: 'RECEPTIONIST',
    department_name: 'Front Desk Operations',
    category: 'HARDWARE_KIOSK',
    priority: 'HIGH',
    subject: 'Thermal badge printer ribbon Jam at Desk 2',
    description: 'Printer at Desk 2 is blinking red with paper jam error code P-03 after printing visitor pass.',
    status: 'IN_PROGRESS',
    assigned_to: 'IT Support Team',
    assigned_to_name: 'Alex Rivera (Technician)',
    resolution_notes: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    messages: [
      {
        id: 1,
        ticket_id: 1,
        sender_id: 3,
        sender_name: 'Sarah Jenkins',
        sender_role: 'RECEPTIONIST',
        message: 'Printer at Desk 2 is blinking red with paper jam error code P-03. Have cleared loose paper but error persists.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 2,
        ticket_id: 1,
        sender_id: 1,
        sender_name: 'Alex Rivera',
        sender_role: 'ADMIN',
        message: 'Hello Sarah, dispatched technician with replacement thermal head ribbon. Will reach Desk 2 in 10 minutes.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ]
  },
  {
    id: 2,
    ticket_number: 'TKT-2026-1002',
    user_id: 2,
    user_name: 'David Miller',
    user_email: 'manager@vms.com',
    role_name: 'DEPARTMENT_MANAGER',
    department_name: 'Engineering',
    category: 'PERMISSION_REQUEST',
    priority: 'MEDIUM',
    subject: 'Requesting Temporary Access Policy for International Auditor',
    description: 'We need permission to grant temporary Level-3 Server Room escort pass for auditor arriving tomorrow.',
    status: 'OPEN',
    assigned_to: 'Security Administrator',
    assigned_to_name: null,
    resolution_notes: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    messages: [
      {
        id: 3,
        ticket_id: 2,
        sender_id: 2,
        sender_name: 'David Miller',
        sender_role: 'DEPARTMENT_MANAGER',
        message: 'Auditor Mr. Robert Sterling will arrive tomorrow at 10 AM. Requesting Level-3 building escort approval.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    ]
  },
  {
    id: 3,
    ticket_number: 'TKT-2026-1003',
    user_id: 4,
    user_name: 'Marcus Vance',
    user_email: 'security@vms.com',
    role_name: 'SECURITY',
    department_name: 'Corporate Security',
    category: 'ACCESS_ISSUE',
    priority: 'CRITICAL',
    subject: 'Turnstile gate sensor intermittently timing out',
    description: 'Turnstile gate #4 QR optic barcode reader shows 400 Bad Request on specific encrypted badges.',
    status: 'RESOLVED',
    assigned_to: 'Network Operations',
    assigned_to_name: 'Chief Network Admin',
    resolution_notes: 'Updated firmware and flushed TLS session cache. Gate 4 tested successfully with 50 consecutive scans.',
    resolved_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    messages: [
      {
        id: 4,
        ticket_id: 3,
        sender_id: 4,
        sender_name: 'Marcus Vance',
        sender_role: 'SECURITY',
        message: 'Turnstile gate 4 QR barcode reader fails with TLS handshake error.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
      },
      {
        id: 5,
        ticket_id: 3,
        sender_id: 1,
        sender_name: 'Chief Network Admin',
        sender_role: 'ADMIN',
        message: 'Resolved: SSL Certificate renew was pushed to gate subnet gateway. Tested operational.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      }
    ]
  }
];

const toRows = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && !('insertId' in res) && !('affectedRows' in res)) return [res];
  return [];
};

const getInsertId = (res) => {
  if (!res) return null;
  if (res.insertId) return res.insertId;
  if (Array.isArray(res) && res[0]?.insertId) return res[0].insertId;
  return null;
};

class FeedbackSupportRepository {
  async ensureTables() {
    const pool = db;
    if (!pool || isMock()) return;

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_feedbacks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NULL,
          user_code VARCHAR(50) NULL,
          avatar_url LONGTEXT NULL,
          phone_number VARCHAR(50) NULL,
          user_name VARCHAR(150) NOT NULL,
          user_email VARCHAR(150) NOT NULL,
          role_name VARCHAR(100) NOT NULL DEFAULT 'USER',
          department_name VARCHAR(150) NULL,
          category VARCHAR(100) NOT NULL DEFAULT 'GENERAL_FEEDBACK',
          rating INT NOT NULL DEFAULT 5,
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status ENUM('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING',
          admin_notes TEXT NULL,
          admin_response TEXT NULL,
          responded_by BIGINT UNSIGNED NULL,
          responded_by_name VARCHAR(150) NULL,
          responded_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Safe column migration for existing user_feedbacks tables
      try {
        const fCols = await pool.query(`SHOW COLUMNS FROM user_feedbacks LIKE 'user_code'`);
        if (!toRows(fCols).length) {
          await pool.query(`ALTER TABLE user_feedbacks ADD COLUMN user_code VARCHAR(50) NULL AFTER user_id`);
        }
      } catch (colErr) {}
      try {
        const aCols = await pool.query(`SHOW COLUMNS FROM user_feedbacks LIKE 'avatar_url'`);
        if (!toRows(aCols).length) {
          await pool.query(`ALTER TABLE user_feedbacks ADD COLUMN avatar_url LONGTEXT NULL AFTER user_code`);
        }
      } catch (colErr) {}
      try {
        const pCols = await pool.query(`SHOW COLUMNS FROM user_feedbacks LIKE 'phone_number'`);
        if (!toRows(pCols).length) {
          await pool.query(`ALTER TABLE user_feedbacks ADD COLUMN phone_number VARCHAR(50) NULL AFTER avatar_url`);
        }
      } catch (colErr) {}

      await pool.query(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_number VARCHAR(50) NOT NULL UNIQUE,
          user_id INT UNSIGNED NULL,
          user_code VARCHAR(50) NULL,
          avatar_url LONGTEXT NULL,
          phone_number VARCHAR(50) NULL,
          user_name VARCHAR(150) NOT NULL,
          user_email VARCHAR(150) NOT NULL,
          role_name VARCHAR(100) NOT NULL DEFAULT 'USER',
          department_name VARCHAR(150) NULL,
          category VARCHAR(100) NOT NULL DEFAULT 'GENERAL_SUPPORT',
          priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
          subject VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
          assigned_to VARCHAR(150) NULL,
          assigned_to_name VARCHAR(150) NULL,
          resolution_notes TEXT NULL,
          resolved_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Safe column migration for existing support_tickets tables
      try {
        const tCols = await pool.query(`SHOW COLUMNS FROM support_tickets LIKE 'user_code'`);
        if (!toRows(tCols).length) {
          await pool.query(`ALTER TABLE support_tickets ADD COLUMN user_code VARCHAR(50) NULL AFTER user_id`);
        }
      } catch (colErr) {}
      try {
        const tACols = await pool.query(`SHOW COLUMNS FROM support_tickets LIKE 'avatar_url'`);
        if (!toRows(tACols).length) {
          await pool.query(`ALTER TABLE support_tickets ADD COLUMN avatar_url LONGTEXT NULL AFTER user_code`);
        }
      } catch (colErr) {}
      try {
        const tPCols = await pool.query(`SHOW COLUMNS FROM support_tickets LIKE 'phone_number'`);
        if (!toRows(tPCols).length) {
          await pool.query(`ALTER TABLE support_tickets ADD COLUMN phone_number VARCHAR(50) NULL AFTER avatar_url`);
        }
      } catch (colErr) {}

      await pool.query(`
        CREATE TABLE IF NOT EXISTS support_ticket_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          sender_id INT UNSIGNED NULL,
          sender_name VARCHAR(150) NOT NULL,
          sender_role VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          is_internal_note BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_ticket (ticket_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Seed mock feedbacks if not yet present in user_feedbacks
      for (const item of mockFeedbacks) {
        const existing = await pool.query(
          `SELECT id FROM user_feedbacks WHERE subject = ? OR (role_name = ? AND user_name = ?) LIMIT 1`,
          [item.subject, item.role_name, item.user_name]
        );
        if (toRows(existing).length === 0) {
          await pool.query(`
            INSERT INTO user_feedbacks 
            (user_id, user_code, avatar_url, phone_number, user_name, user_email, role_name, department_name, category, rating, subject, message, status, admin_notes, admin_response, responded_by, responded_by_name, responded_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            item.user_id, item.user_code || null, item.avatar_url || null, item.phone_number || null,
            item.user_name, item.user_email, item.role_name, item.department_name, item.category, item.rating,
            item.subject, item.message, item.status, item.admin_notes, item.admin_response, item.responded_by,
            item.responded_by_name, item.responded_at, item.created_at
          ]);
        }
      }

      // Seed mock tickets if not yet present in support_tickets
      for (const t of mockTickets) {
        const existing = await pool.query(`SELECT id FROM support_tickets WHERE ticket_number = ? LIMIT 1`, [t.ticket_number]);
        if (toRows(existing).length === 0) {
          const insertRes = await pool.query(`
            INSERT INTO support_tickets 
            (ticket_number, user_id, user_code, avatar_url, phone_number, user_name, user_email, role_name, department_name, category, priority, subject, description, status, assigned_to, assigned_to_name, resolution_notes, resolved_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            t.ticket_number, t.user_id, t.user_code || null, t.avatar_url || null, t.phone_number || null,
            t.user_name, t.user_email, t.role_name, t.department_name, t.category, t.priority, t.subject,
            t.description, t.status, t.assigned_to, t.assigned_to_name, t.resolution_notes, t.resolved_at, t.created_at
          ]);
          const newId = getInsertId(insertRes);
          if (newId && t.messages && t.messages.length > 0) {
            for (const m of t.messages) {
              await pool.query(`
                INSERT INTO support_ticket_messages
                (ticket_id, sender_id, sender_name, sender_role, message, is_internal_note, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [newId, m.sender_id, m.sender_name, m.sender_role, m.message, m.is_internal_note, m.created_at]);
            }
          }
        }
      }
    } catch (err) {
      console.warn('FeedbackSupportRepository table check warning:', err.message);
    }
  }

  // ─── Feedbacks ─────────────────────────────────────────────────────────────
  async createFeedback(data) {
    await this.ensureTables();
    const pool = db;
    if (pool && !isMock()) {
      try {
        const result = await pool.query(`
          INSERT INTO user_feedbacks 
          (user_id, user_code, avatar_url, phone_number, user_name, user_email, role_name, department_name, category, rating, subject, message, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          data.user_id || null,
          data.user_code || null,
          data.avatar_url || null,
          data.phone_number || null,
          data.user_name || 'Anonymous User',
          data.user_email || 'user@vms.com',
          data.role_name || 'USER',
          data.department_name || null,
          data.category || 'GENERAL_FEEDBACK',
          data.rating || 5,
          data.subject,
          data.message,
          'PENDING'
        ]);
        const insertId = getInsertId(result);
        if (insertId) return this.getFeedbackById(insertId);
      } catch (err) {
        console.error('MySQL createFeedback error, fallback to mock:', err.message);
      }
    }

    const newFeedback = {
      id: mockFeedbacks.length + 1,
      user_id: data.user_id || null,
      user_code: data.user_code || null,
      avatar_url: data.avatar_url || null,
      phone_number: data.phone_number || null,
      user_name: data.user_name || 'Anonymous User',
      user_email: data.user_email || 'user@vms.com',
      role_name: data.role_name || 'USER',
      department_name: data.department_name || null,
      category: data.category || 'GENERAL_FEEDBACK',
      rating: data.rating || 5,
      subject: data.subject,
      message: data.message,
      status: 'PENDING',
      admin_notes: null,
      admin_response: null,
      responded_by: null,
      responded_by_name: null,
      responded_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockFeedbacks.unshift(newFeedback);
    return newFeedback;
  }

  async getFeedbackById(id) {
    const pool = db;
    if (pool && !isMock()) {
      try {
        const rows = await pool.query(`SELECT * FROM user_feedbacks WHERE id = ?`, [id]);
        const list = toRows(rows);
        if (list[0]) return list[0];
      } catch (err) {
        console.error('MySQL getFeedbackById error:', err.message);
      }
    }
    return mockFeedbacks.find(f => f.id === Number(id)) || null;
  }

  async listFeedbacks({ role, status, category, search, page = 1, limit = 50 }) {
    await this.ensureTables();
    const pool = db;
    if (pool && !isMock()) {
      try {
        let whereClauses = ['1=1'];
        let params = [];

        if (role && role !== 'ALL') {
          whereClauses.push('role_name = ?');
          params.push(role);
        }
        if (status && status !== 'ALL') {
          whereClauses.push('status = ?');
          params.push(status);
        }
        if (category && category !== 'ALL') {
          whereClauses.push('category = ?');
          params.push(category);
        }
        if (search) {
          whereClauses.push('(subject LIKE ? OR message LIKE ? OR user_name LIKE ? OR user_email LIKE ?)');
          const s = `%${search}%`;
          params.push(s, s, s, s);
        }

        const whereSql = whereClauses.join(' AND ');
        const countRes = await pool.query(`SELECT COUNT(*) as total FROM user_feedbacks WHERE ${whereSql}`, params);
        const countList = toRows(countRes);
        const total = Number(countList[0]?.total) || 0;

        const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
        const safeOffset = Math.max(0, (Number(page) - 1) * safeLimit);
        const rows = await pool.query(`
          SELECT * FROM user_feedbacks 
          WHERE ${whereSql} 
          ORDER BY created_at DESC 
          LIMIT ${safeLimit} OFFSET ${safeOffset}
        `, params);

        const data = toRows(rows);
        return { data, total: total || data.length, page: Number(page), limit: safeLimit };
      } catch (err) {
        console.error('MySQL listFeedbacks error, fallback to mock:', err.message);
      }
    }

    let items = [...mockFeedbacks];
    if (role && role !== 'ALL') items = items.filter(i => i.role_name.toLowerCase() === role.toLowerCase());
    if (status && status !== 'ALL') items = items.filter(i => i.status === status);
    if (category && category !== 'ALL') items = items.filter(i => i.category === category);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => 
        (i.subject && i.subject.toLowerCase().includes(q)) || 
        (i.message && i.message.toLowerCase().includes(q)) ||
        (i.user_name && i.user_name.toLowerCase().includes(q))
      );
    }
    return { data: items, total: items.length, page: 1, limit };
  }

  async getFeedbackStats() {
    await this.ensureTables();
    const pool = db;
    if (pool && !isMock()) {
      try {
        const rows = await pool.query(`SELECT * FROM user_feedbacks`);
        const list = toRows(rows);
        return this._calcFeedbackStats(list);
      } catch (err) {
        console.error('MySQL getFeedbackStats error, fallback to mock:', err.message);
      }
    }
    return this._calcFeedbackStats(mockFeedbacks);
  }

  _calcFeedbackStats(list) {
    const total = list.length;
    const accepted = list.filter(f => f.status === 'ACCEPTED').length;
    const pending = list.filter(f => f.status === 'PENDING').length;
    const underReview = list.filter(f => f.status === 'UNDER_REVIEW').length;
    const resolved = list.filter(f => f.status === 'RESOLVED').length;
    const avgRating = total > 0 ? (list.reduce((acc, f) => acc + (f.rating || 5), 0) / total).toFixed(1) : '5.0';

    const byRole = {};
    for (const f of list) {
      const r = f.role_name || 'OTHER';
      byRole[r] = (byRole[r] || 0) + 1;
    }

    return {
      totalFeedback: total,
      acceptedFeedback: accepted,
      pendingFeedback: pending,
      underReviewFeedback: underReview,
      resolvedFeedback: resolved,
      averageRating: Number(avgRating),
      acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 100,
      byRole
    };
  }

  async updateFeedbackStatus(id, { status, admin_notes, admin_response, responder_id, responder_name }) {
    await this.ensureTables();
    const pool = db;
    const now = new Date();

    const idx = mockFeedbacks.findIndex(f => f.id === Number(id));
    if (idx !== -1) {
      mockFeedbacks[idx] = {
        ...mockFeedbacks[idx],
        status,
        admin_notes: admin_notes || mockFeedbacks[idx].admin_notes,
        admin_response: admin_response || mockFeedbacks[idx].admin_response,
        responded_by: responder_id || mockFeedbacks[idx].responded_by,
        responded_by_name: responder_name || mockFeedbacks[idx].responded_by_name,
        responded_at: now.toISOString(),
        updated_at: now.toISOString()
      };
    }

    if (pool && !isMock()) {
      try {
        const res = await pool.query(`
          UPDATE user_feedbacks 
          SET status = ?, admin_notes = COALESCE(?, admin_notes), admin_response = COALESCE(?, admin_response),
              responded_by = COALESCE(?, responded_by), responded_by_name = COALESCE(?, responded_by_name),
              responded_at = ?
          WHERE id = ?
        `, [
          status, admin_notes || null, admin_response || null,
          responder_id || null, responder_name || null, now, id
        ]);
        const affected = res?.affectedRows ?? (Array.isArray(res) ? res[0]?.affectedRows : 0);
        if (affected > 0 || res) {
          const fresh = await this.getFeedbackById(id);
          if (fresh) return fresh;
        }
      } catch (err) {
        console.error('MySQL updateFeedbackStatus error:', err.message);
      }
    }

    return idx !== -1 ? mockFeedbacks[idx] : null;
  }

  // ─── Support Tickets ───────────────────────────────────────────────────────
  async createTicket(data) {
    await this.ensureTables();
    const pool = db;
    const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (pool && !isMock()) {
      try {
        const result = await pool.query(`
          INSERT INTO support_tickets 
          (ticket_number, user_id, user_code, avatar_url, phone_number, user_name, user_email, role_name, department_name, category, priority, subject, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ticketNumber,
          data.user_id || null,
          data.user_code || null,
          data.avatar_url || null,
          data.phone_number || null,
          data.user_name || 'System User',
          data.user_email || 'user@vms.com',
          data.role_name || 'USER',
          data.department_name || null,
          data.category || 'GENERAL_SUPPORT',
          data.priority || 'MEDIUM',
          data.subject,
          data.description,
          'OPEN'
        ]);

        const insertId = getInsertId(result);

        // Add initial message
        if (insertId) {
          await pool.query(`
            INSERT INTO support_ticket_messages 
            (ticket_id, sender_id, sender_name, sender_role, message)
            VALUES (?, ?, ?, ?, ?)
          `, [
            insertId,
            data.user_id || null,
            data.user_name || 'System User',
            data.role_name || 'USER',
            data.description
          ]);

          return this.getTicketById(insertId);
        }
      } catch (err) {
        console.error('MySQL createTicket error, fallback to mock:', err.message);
      }
    }

    const newTicket = {
      id: mockTickets.length + 1,
      ticket_number: ticketNumber,
      user_id: data.user_id || null,
      user_code: data.user_code || null,
      avatar_url: data.avatar_url || null,
      phone_number: data.phone_number || null,
      user_name: data.user_name || 'System User',
      user_email: data.user_email || 'user@vms.com',
      role_name: data.role_name || 'USER',
      department_name: data.department_name || null,
      category: data.category || 'GENERAL_SUPPORT',
      priority: data.priority || 'MEDIUM',
      subject: data.subject,
      description: data.description,
      status: 'OPEN',
      assigned_to: 'Support Desk',
      assigned_to_name: null,
      resolution_notes: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: Date.now(),
          ticket_id: mockTickets.length + 1,
          sender_id: data.user_id || null,
          sender_name: data.user_name || 'System User',
          sender_role: data.role_name || 'USER',
          message: data.description,
          is_internal_note: false,
          created_at: new Date().toISOString()
        }
      ]
    };
    mockTickets.unshift(newTicket);
    return newTicket;
  }

  async getTicketById(id) {
    const pool = db;
    if (pool && !isMock()) {
      try {
        const rows = await pool.query(`SELECT * FROM support_tickets WHERE id = ?`, [id]);
        const list = toRows(rows);
        if (list[0]) {
          const messages = await pool.query(`
            SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC
          `, [id]);
          return { ...list[0], messages: toRows(messages) };
        }
      } catch (err) {
        console.error('MySQL getTicketById error:', err.message);
      }
    }
    return mockTickets.find(t => t.id === Number(id)) || null;
  }

  async listTickets({ role, status, priority, search, page = 1, limit = 50 }) {
    await this.ensureTables();
    const pool = db;
    if (pool && !isMock()) {
      try {
        let whereClauses = ['1=1'];
        let params = [];

        if (role && role !== 'ALL') {
          whereClauses.push('role_name = ?');
          params.push(role);
        }
        if (status && status !== 'ALL') {
          whereClauses.push('status = ?');
          params.push(status);
        }
        if (priority && priority !== 'ALL') {
          whereClauses.push('priority = ?');
          params.push(priority);
        }
        if (search) {
          whereClauses.push('(subject LIKE ? OR description LIKE ? OR ticket_number LIKE ? OR user_name LIKE ?)');
          const s = `%${search}%`;
          params.push(s, s, s, s);
        }

        const whereSql = whereClauses.join(' AND ');
        const countRes = await pool.query(`SELECT COUNT(*) as total FROM support_tickets WHERE ${whereSql}`, params);
        const countList = toRows(countRes);
        const total = Number(countList[0]?.total) || 0;

        const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
        const safeOffset = Math.max(0, (Number(page) - 1) * safeLimit);
        const rows = await pool.query(`
          SELECT * FROM support_tickets 
          WHERE ${whereSql} 
          ORDER BY created_at DESC 
          LIMIT ${safeLimit} OFFSET ${safeOffset}
        `, params);

        const data = toRows(rows);
        return { data, total: total || data.length, page: Number(page), limit: safeLimit };
      } catch (err) {
        console.error('MySQL listTickets error, fallback to mock:', err.message);
      }
    }

    let items = [...mockTickets];
    if (role && role !== 'ALL') items = items.filter(i => i.role_name.toLowerCase() === role.toLowerCase());
    if (status && status !== 'ALL') items = items.filter(i => i.status === status);
    if (priority && priority !== 'ALL') items = items.filter(i => i.priority === priority);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => 
        (i.subject && i.subject.toLowerCase().includes(q)) || 
        (i.ticket_number && i.ticket_number.toLowerCase().includes(q)) ||
        (i.user_name && i.user_name.toLowerCase().includes(q))
      );
    }
    return { data: items, total: items.length, page: 1, limit };
  }

  async getTicketStats() {
    await this.ensureTables();
    const pool = db;
    if (pool && !isMock()) {
      try {
        const rows = await pool.query(`SELECT * FROM support_tickets`);
        const list = toRows(rows);
        return this._calcTicketStats(list);
      } catch (err) {
        console.error('MySQL getTicketStats error:', err.message);
      }
    }
    return this._calcTicketStats(mockTickets);
  }

  _calcTicketStats(list) {
    const total = list.length;
    const open = list.filter(t => t.status === 'OPEN').length;
    const inProgress = list.filter(t => t.status === 'IN_PROGRESS').length;
    const resolved = list.filter(t => t.status === 'RESOLVED').length;
    const critical = list.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH').length;

    const byRole = {};
    for (const t of list) {
      const r = t.role_name || 'OTHER';
      byRole[r] = (byRole[r] || 0) + 1;
    }

    return {
      totalTickets: total,
      openTickets: open,
      inProgressTickets: inProgress,
      resolvedTickets: resolved,
      criticalTickets: critical,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 100,
      byRole
    };
  }

  async addTicketMessage(ticketId, { sender_id, sender_name, sender_role, message, is_internal_note = false }) {
    await this.ensureTables();
    const pool = db;
    if (pool && !isMock()) {
      try {
        await pool.query(`
          INSERT INTO support_ticket_messages 
          (ticket_id, sender_id, sender_name, sender_role, message, is_internal_note)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [ticketId, sender_id || null, sender_name || 'User', sender_role || 'USER', message, is_internal_note]);

        await pool.query(`UPDATE support_tickets SET updated_at = NOW() WHERE id = ?`, [ticketId]);
        return this.getTicketById(ticketId);
      } catch (err) {
        console.error('MySQL addTicketMessage error:', err.message);
      }
    }

    const ticket = mockTickets.find(t => t.id === Number(ticketId));
    if (ticket) {
      ticket.messages = ticket.messages || [];
      ticket.messages.push({
        id: Date.now(),
        ticket_id: Number(ticketId),
        sender_id,
        sender_name,
        sender_role,
        message,
        is_internal_note,
        created_at: new Date().toISOString()
      });
      ticket.updated_at = new Date().toISOString();
      return ticket;
    }
    return null;
  }

  async updateTicketStatus(id, { status, assigned_to_name, resolution_notes }) {
    await this.ensureTables();
    const pool = db;
    const now = new Date();

    const idx = mockTickets.findIndex(t => t.id === Number(id));
    if (idx !== -1) {
      mockTickets[idx] = {
        ...mockTickets[idx],
        status,
        assigned_to_name: assigned_to_name || mockTickets[idx].assigned_to_name,
        resolution_notes: resolution_notes || mockTickets[idx].resolution_notes,
        resolved_at: (status === 'RESOLVED' || status === 'CLOSED') ? now.toISOString() : mockTickets[idx].resolved_at,
        updated_at: now.toISOString()
      };
    }

    if (pool && !isMock()) {
      try {
        const resolvedAt = status === 'RESOLVED' || status === 'CLOSED' ? now : null;
        const res = await pool.query(`
          UPDATE support_tickets 
          SET status = ?, 
              assigned_to_name = COALESCE(?, assigned_to_name),
              resolution_notes = COALESCE(?, resolution_notes),
              resolved_at = COALESCE(?, resolved_at)
          WHERE id = ?
        `, [status, assigned_to_name || null, resolution_notes || null, resolvedAt, id]);
        const affected = res?.affectedRows ?? (Array.isArray(res) ? res[0]?.affectedRows : 0);
        if (affected > 0 || res) {
          const fresh = await this.getTicketById(id);
          if (fresh) return fresh;
        }
      } catch (err) {
        console.error('MySQL updateTicketStatus error:', err.message);
      }
    }

    return idx !== -1 ? mockTickets[idx] : null;
  }
}

module.exports = new FeedbackSupportRepository();
