/**
 * Audit Logs API Routes
 * 
 * All audit log-related endpoints:
 * - GET /api/v1/audit-logs - Get audit logs (admin)
 * - GET /api/v1/audit-logs/stats - Get audit log statistics (admin)
 * - GET /api/v1/audit-logs/filters - Get available filters (admin)
 * - GET /api/v1/audit-logs/:id - Get audit log by ID (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const auditLogHandlers = require('../handlers/auditLogs');

// All audit log routes require admin access
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', auditLogHandlers.getAuditLogsHandler);
router.get('/stats', auditLogHandlers.getAuditLogStatsHandler);
router.get('/filters', auditLogHandlers.getAuditLogFiltersHandler);
router.get('/:id', auditLogHandlers.getAuditLogByIdHandler);

module.exports = router;

