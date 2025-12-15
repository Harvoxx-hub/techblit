/**
 * Invitations API Routes
 * 
 * All invitation-related endpoints:
 * - POST /api/v1/invitations - Invite new user (admin)
 * - POST /api/v1/invitations/:uid/resend - Resend invitation (admin)
 * - GET /api/v1/invitations/stats - Get invitation statistics (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const invitationHandlers = require('../handlers/invitations');

// All invitation routes require admin access
router.use(authMiddleware);
router.use(adminMiddleware);

router.post('/', invitationHandlers.inviteUser);
router.post('/:uid/resend', invitationHandlers.resendInvitation);
router.get('/stats', invitationHandlers.getInvitationStats);

module.exports = router;

