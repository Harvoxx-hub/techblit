const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const logger = require('firebase-functions/logger');

/**
 * Get audit logs with filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated audit logs
 */
async function getAuditLogs(options = {}) {
  try {
    const {
      limit: limitCount = 50,
      offset = 0,
      action = null,
      actor = null,
      target = null,
      startDate = null,
      endDate = null,
      orderBy = 'timestamp',
      orderDirection = 'desc'
    } = options;

    let query = db.collection(CollectionNames.AUDIT_LOGS);

    // Apply filters
    if (action) {
      query = query.where('action', '==', action);
    }
    if (actor) {
      query = query.where('actor', '==', actor);
    }
    if (target) {
      query = query.where('target', '==', target);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    // Apply ordering
    query = query.orderBy(orderBy, orderDirection);

    // Apply pagination
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      query = query.startAfter(lastDoc);
    }

    query = query.limit(limitCount);

    const snapshot = await query.get();
    
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date()
    }));

    // Get total count for pagination
    const totalSnapshot = await db.collection(CollectionNames.AUDIT_LOGS).get();
    const total = totalSnapshot.size;

    return {
      logs,
      pagination: {
        total,
        limit: limitCount,
        offset,
        hasMore: offset + limitCount < total
      }
    };

  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    throw error;
  }
}

/**
 * Get audit log statistics
 * @returns {Promise<Object>} - Audit log statistics
 */
async function getAuditLogStats() {
  try {
    const snapshot = await db.collection(CollectionNames.AUDIT_LOGS).get();
    const logs = snapshot.docs.map(doc => doc.data());

    // Count by action
    const actionCounts = {};
    const actorCounts = {};
    const recentActions = [];

    logs.forEach(log => {
      // Count actions
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      // Count actors
      actorCounts[log.actor] = (actorCounts[log.actor] || 0) + 1;
      
      // Recent actions (last 24 hours)
      const logDate = log.timestamp?.toDate?.() || new Date();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (logDate > oneDayAgo) {
        recentActions.push(log);
      }
    });

    // Get top actions
    const topActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Get top actors
    const topActors = Object.entries(actorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([actor, count]) => ({ actor, count }));

    return {
      total: logs.length,
      recent24h: recentActions.length,
      topActions,
      topActors,
      lastUpdated: new Date()
    };

  } catch (error) {
    logger.error('Error getting audit log stats:', error);
    throw error;
  }
}

/**
 * Get unique values for filters
 * @returns {Promise<Object>} - Unique filter values
 */
async function getAuditLogFilters() {
  try {
    const snapshot = await db.collection(CollectionNames.AUDIT_LOGS).get();
    const logs = snapshot.docs.map(doc => doc.data());

    const actions = [...new Set(logs.map(log => log.action))].sort();
    const actors = [...new Set(logs.map(log => log.actor))].sort();
    const targets = [...new Set(logs.map(log => log.target))].sort();

    return {
      actions,
      actors,
      targets
    };

  } catch (error) {
    logger.error('Error getting audit log filters:', error);
    throw error;
  }
}

/**
 * Get audit log by ID
 * @param {string} logId - The audit log ID
 * @returns {Promise<Object>} - Audit log details
 */
async function getAuditLogById(logId) {
  try {
    const doc = await db.collection(CollectionNames.AUDIT_LOGS).doc(logId).get();
    
    if (!doc.exists) {
      throw new Error('Audit log not found');
    }

    return {
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date()
    };

  } catch (error) {
    logger.error(`Error getting audit log ${logId}:`, error);
    throw error;
  }
}

module.exports = {
  getAuditLogs,
  getAuditLogStats,
  getAuditLogFilters,
  getAuditLogById,
  
  // HTTP handlers
  getAuditLogsHandler: async (req, res) => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const {
        limit = 50,
        offset = 0,
        action,
        actor,
        target,
        startDate,
        endDate,
        orderBy = 'timestamp',
        orderDirection = 'desc'
      } = req.query;
      
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        action,
        actor,
        target,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        orderBy,
        orderDirection
      };
      
      const result = await getAuditLogs(options);
      
      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error in getAuditLogs handler', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  getAuditLogStatsHandler: async (req, res) => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const stats = await getAuditLogStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error in getAuditLogStats handler', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  getAuditLogFiltersHandler: async (req, res) => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const filters = await getAuditLogFilters();
      
      res.status(200).json({
        success: true,
        data: filters
      });
      
    } catch (error) {
      logger.error('Error in getAuditLogFilters handler', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  getAuditLogByIdHandler: async (req, res) => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const { logId } = req.params;
      
      if (!logId) {
        return res.status(400).json({ error: 'Log ID is required' });
      }
      
      const log = await getAuditLogById(logId);
      
      res.status(200).json({
        success: true,
        data: log
      });
      
    } catch (error) {
      logger.error('Error in getAuditLogById handler', {
        error: error.message,
        logId: req.params?.logId
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};
