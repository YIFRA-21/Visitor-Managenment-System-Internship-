/**
 * Enterprise Identity & Lifecycle Routes
 * ───────────────────────────────────────
 * Handles advanced authentication lifecycle, password policies, lockouts,
 * dynamic resource resolution, and administrator security overrides.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const authService = require('../../authentication/services/auth.service');
const userRepository = require('../../user-management/repositories/user.repository');
const { checkPermission } = require('../../../middleware/rbac');

// 1. PUBLIC ENDPOINTS

// POST /api/identity/forgot-password - Trigger password reset token
router.post('/forgot-password', async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.identifier || req.body.userId || req.body.username;
    if (!identifier) return res.status(400).json({ error: 'Email or User ID is required' });
    
    const result = await authService.forgotPassword(identifier);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/identity/reset-password - Process password reset using token
router.post('/reset-password', async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.identifier || req.body.userId || req.body.username;
    const token = req.body.resetToken || req.body.token || req.body.code || req.body.otp;
    const { newPassword } = req.body;
    if (!identifier || !token || !newPassword) {
      return res.status(400).json({ error: 'Identity, verification code, and new password are required' });
    }
    
    const result = await authService.resetPassword(identifier, token, newPassword);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// 2. AUTHENTICATED ENDPOINTS
router.use(authenticate);

// GET /api/identity/resources - Retrieve user dynamic resource menu grid
router.get('/resources', async (req, res, next) => {
  try {
    const payload = await authService.getIdentityPayload(req.user.id);
    res.status(200).json(payload.identity.resources);
  } catch (err) {
    next(err);
  }
});

// GET /api/identity/profile - Full active identity detail
router.get('/profile', async (req, res, next) => {
  try {
    const payload = await authService.getIdentityPayload(req.user.id);
    res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
});

// POST /api/identity/first-login-change - Enforce password update on first login
router.post('/first-login-change', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.status(200).json({
      status: 'success',
      message: 'First login password change completed. Account fully activated.'
    });
  } catch (err) {
    next(err);
  }
});

// 3. ADMIN ONLY ENDPOINTS - Identity Overrides
router.post('/unlock-account', checkPermission('USER_UPDATE'), async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email parameter is required' });
    
    await userRepository.resetFailedAttempts(email);
    res.status(200).json({
      status: 'success',
      message: `Account associated with ${email} has been successfully unlocked.`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
