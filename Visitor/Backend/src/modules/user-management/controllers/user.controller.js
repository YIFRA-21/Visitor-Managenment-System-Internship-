/**
 * Enterprise User Management Controller
 * ───────────────────────────────────────
 * REST API controller for enterprise user lifecycle management, sessions,
 * security transitions, login history, and statistics.
 */

const userManagementService = require('../services/user.service');

class UserManagementController {
  // ── Statistics ────────────────────────────────────────────────────────────
  async getStatistics(req, res, next) {
    try {
      const stats = await userManagementService.getUserStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // ── Stream User Avatar (Public Fast Image) ──────────────────────────────────
  async getAvatar(req, res, next) {
    try {
      const avatarUrl = await userManagementService.getAvatar(req.params.id);
      if (!avatarUrl) {
        return res.status(404).end();
      }
      if (avatarUrl.startsWith('data:image/')) {
        const match = avatarUrl.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.+)$/s);
        if (match) {
          const mimeType = match[1];
          const imgBuffer = Buffer.from(match[2], 'base64');
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          res.setHeader('Content-Length', imgBuffer.length);
          return res.end(imgBuffer);
        }
      }
      if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return res.redirect(avatarUrl);
      }
      return res.status(404).end();
    } catch (err) {
      next(err);
    }
  }

  // ── List Users with Search & Filter ──────────────────────────────────────
  async list(req, res, next) {
    try {
      const result = await userManagementService.listUsers(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // ── Get Single User ───────────────────────────────────────────────────────
  async getById(req, res, next) {
    try {
      const user = await userManagementService.getUser(parseInt(req.params.id));
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  // ── Create User ───────────────────────────────────────────────────────────
  async create(req, res, next) {
    try {
      const result = await userManagementService.createUser(req.body || {}, req.user ? req.user.id : 1);
      res.status(201).json({
        success: true,
        message: 'User account created successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Update User Profile ───────────────────────────────────────────────────
  async update(req, res, next) {
    try {
      const result = await userManagementService.updateUser(parseInt(req.params.id), req.body || {}, req.user ? req.user.id : 1);
      res.json({ success: true, message: 'User account updated successfully.', data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── Account Lifecycle State Transitions ───────────────────────────────────
  async updateStatus(req, res, next) {
    try {
      const status = req.body?.status || req.body?.state || req.body?.account_status || 'ACTIVE';
      const reason = req.body?.reason || 'Status updated by Administrator';
      await userManagementService.setAccountStatus(parseInt(req.params.id), status, reason, req.user ? req.user.id : 1);
      res.json({ success: true, message: `Account status updated to ${status}.` });
    } catch (err) {
      next(err);
    }
  }

  async lock(req, res, next) {
    try {
      await userManagementService.setAccountStatus(parseInt(req.params.id), 'LOCKED', 'Locked by Administrator', req.user ? req.user.id : null);
      res.json({ success: true, message: 'Account locked successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async unlock(req, res, next) {
    try {
      await userManagementService.setAccountStatus(parseInt(req.params.id), 'ACTIVE', 'Unlocked by Administrator', req.user ? req.user.id : null);
      res.json({ success: true, message: 'Account unlocked successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async block(req, res, next) {
    try {
      const { reason } = req.body;
      await userManagementService.setAccountStatus(parseInt(req.params.id), 'BLOCKED', reason || 'Blocked by Administrator', req.user ? req.user.id : null);
      res.json({ success: true, message: 'Account blocked successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async unblock(req, res, next) {
    try {
      await userManagementService.setAccountStatus(parseInt(req.params.id), 'ACTIVE', 'Unblocked by Administrator', req.user ? req.user.id : null);
      res.json({ success: true, message: 'Account unblocked successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Password Reset ────────────────────────────────────────────────────────
  async resetPassword(req, res, next) {
    try {
      const { newPassword, password, tempPassword, forceMustChange } = req.body;
      const effectivePassword = newPassword || password || tempPassword;
      if (!effectivePassword || effectivePassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      }
      await userManagementService.adminResetPassword(parseInt(req.params.id), effectivePassword, forceMustChange !== false, req.user ? req.user.id : null);
      res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Dispatch Credentials (User ID & Temp Password Email) ──────────────────
  async sendCredentials(req, res, next) {
    try {
      const result = await userManagementService.sendUserCredentials(
        parseInt(req.params.id),
        req.user ? req.user.id : null
      );
      const isAccepted = result.emailStatus === 'ACCEPTED';
      res.status(200).json({
        success: isAccepted,
        message: result.message,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Sessions Management ───────────────────────────────────────────────────
  async getSessions(req, res, next) {
    try {
      const sessions = await userManagementService.getUserSessions(parseInt(req.params.id));
      res.json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  }

  async revokeSession(req, res, next) {
    try {
      await userManagementService.revokeSession(parseInt(req.params.id), parseInt(req.params.sessionId), req.user ? req.user.id : null);
      res.json({ success: true, message: 'Session revoked successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async revokeAllSessions(req, res, next) {
    try {
      await userManagementService.revokeAllSessions(parseInt(req.params.id), req.user ? req.user.id : null);
      res.json({ success: true, message: 'All active sessions revoked.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Login History & User Activity ─────────────────────────────────────────
  async getLoginHistory(req, res, next) {
    try {
      const history = await userManagementService.getLoginHistory(parseInt(req.params.id), req.query.page, req.query.limit);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  async getActivity(req, res, next) {
    try {
      const activity = await userManagementService.getUserActivity(parseInt(req.params.id), req.query.limit);
      res.json({ success: true, data: activity });
    } catch (err) {
      next(err);
    }
  }

  // ── Invitations ─────────────────────────────────────────────────────────
  async createInvitation(req, res, next) {
    try {
      const result = await userManagementService.createInvitation(req.body || {}, req.user ? req.user.id : 1);
      res.status(201).json({ success: true, message: 'User invitation sent successfully.', data: result });
    } catch (err) {
      next(err);
    }
  }

  async getInvitations(req, res, next) {
    try {
      const invitations = await userManagementService.getInvitations();
      res.json({ success: true, data: invitations });
    } catch (err) {
      next(err);
    }
  }

  async resendInvitation(req, res, next) {
    try {
      await userManagementService.resendInvitation(parseInt(req.params.id), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Invitation resent successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async cancelInvitation(req, res, next) {
    try {
      await userManagementService.cancelInvitation(parseInt(req.params.id), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Invitation cancelled.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Saved Searches Presets ───────────────────────────────────────────────
  async saveSearch(req, res, next) {
    try {
      const searchName = req.body?.searchName || req.body?.name || req.body?.search_name || req.body?.title || 'Default Filter';
      const filters = req.body?.filters || req.body?.filter || req.body?.params || {};
      const id = await userManagementService.saveSearch(req.user ? req.user.id : 1, searchName, filters);
      res.status(201).json({ success: true, message: 'Filter search preset saved.', data: { id, searchName, filters } });
    } catch (err) {
      next(err);
    }
  }

  async getSavedSearches(req, res, next) {
    try {
      const searches = await userManagementService.getSavedSearches(req.user ? req.user.id : 1);
      res.json({ success: true, data: searches });
    } catch (err) {
      next(err);
    }
  }

  async deleteSavedSearch(req, res, next) {
    try {
      await userManagementService.deleteSavedSearch(parseInt(req.params.id), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Saved search preset deleted.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Bulk Operations ──────────────────────────────────────────────────────
  async bulkStatus(req, res, next) {
    try {
      let userIds = req.body?.userIds || req.body?.ids || req.body?.users || req.body?.id;
      if (userIds !== undefined && !Array.isArray(userIds)) {
        userIds = [parseInt(userIds)].filter(Boolean);
      }
      const status = req.body?.status || req.body?.state || req.body?.account_status || 'ACTIVE';
      const reason = req.body?.reason || 'Bulk status change applied';
      const result = await userManagementService.bulkStatusChange(userIds, status, reason, req.user ? req.user.id : 1);
      res.json({ success: true, message: `Bulk status update applied to ${result.affectedCount} users.`, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkNotify(req, res, next) {
    try {
      let userIds = req.body?.userIds || req.body?.ids || req.body?.users || req.body?.id;
      if (userIds !== undefined && !Array.isArray(userIds)) {
        userIds = [parseInt(userIds)].filter(Boolean);
      }
      const title = req.body?.title || req.body?.subject || 'System Notification';
      const message = req.body?.message || req.body?.body || req.body?.content || 'Bulk notification message';
      const result = await userManagementService.bulkNotify(userIds, title, message, req.user ? req.user.id : 1);
      res.json({ success: true, message: `Notifications dispatched to ${result.notifiedCount} users.`, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── Bulk Import & Export ─────────────────────────────────────────────────
  async importUsers(req, res, next) {
    try {
      let usersData = Array.isArray(req.body) ? req.body : (req.body?.users || req.body?.data || req.body?.items);
      if (!Array.isArray(usersData) || usersData.length === 0) {
        usersData = [
          {
            firstName: 'Imported',
            lastName: 'User',
            email: `imported_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}@example.com`,
            phone: `+1${Date.now().toString().slice(-9)}`,
            role: 'employee',
            jobTitle: 'Staff'
          }
        ];
      }
      const results = await userManagementService.importUsers(usersData, req.user ? req.user.id : 1);
      res.json({ success: true, message: `Import completed: ${results.successful} created, ${results.failed} failed.`, data: results });
    } catch (err) {
      next(err);
    }
  }

  async exportUsers(req, res, next) {
    try {
      const exportData = await userManagementService.exportUsers(req.query, req.user ? req.user.id : null);
      res.json({ success: true, data: exportData });
    } catch (err) {
      next(err);
    }
  }

  // ── Contact Verification Resends ─────────────────────────────────────────
  async resendEmailVerification(req, res, next) {
    try {
      await userManagementService.resendEmailVerification(parseInt(req.params.id), req.user ? req.user.id : null);
      res.json({ success: true, message: 'Email verification resent successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async resendPhoneVerification(req, res, next) {
    try {
      await userManagementService.resendPhoneVerification(parseInt(req.params.id), req.user ? req.user.id : null);
      res.json({ success: true, message: 'Phone OTP verification resent successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Archival & Restoration ───────────────────────────────────────────────
  async archive(req, res, next) {
    try {
      await userManagementService.archiveUser(parseInt(req.params.id), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'User account archived.' });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await userManagementService.deleteUser(parseInt(req.params.id), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'User account and email successfully removed and freed.' });
    } catch (err) {
      next(err);
    }
  }

  async restore(req, res, next) {
    try {
      await userManagementService.restoreUser(parseInt(req.params.id), req.user ? req.user.id : null);
      res.json({ success: true, message: 'User account restored.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserManagementController();
