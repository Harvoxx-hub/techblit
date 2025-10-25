// User management handlers

const { db, auth } = require('../config/firebase');
const { CollectionNames, UserRole } = require('../types/constants');
const { isValidEmail, createAuditLog, formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');

/**
 * Get user profile
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getUserProfile(req, res) {
  try {
    const { uid } = req.params;
    
    const userDoc = await db.collection(CollectionNames.USERS).doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json(formatErrorResponse('User not found', 404));
      return;
    }
    
    const userData = userDoc.data();
    
    // Remove sensitive information
    delete userData.permissions;
    
    res.json(formatSuccessResponse(userData, 'User profile retrieved successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error retrieving user profile', 500, { error: error.message }));
  }
}

/**
 * Update user profile
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function updateUserProfile(req, res) {
  try {
    const { uid } = req.params;
    const { name, bio, avatar } = req.body;
    
    // Users can only update their own profile unless they're admin
    if (uid !== req.user.uid && !req.userData.role === UserRole.SUPER_ADMIN) {
      res.status(403).json(formatErrorResponse('You can only update your own profile', 403));
      return;
    }
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;
    
    await db.collection(CollectionNames.USERS).doc(uid).update(updateData);
    
    // Create audit log
    const auditLog = createAuditLog('profile_updated', req.user.uid, uid, {
      changes: Object.keys(updateData)
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'Profile updated successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error updating profile', 500, { error: error.message }));
  }
}

/**
 * Get all users (Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getAllUsers(req, res) {
  try {
    const { limit = 50, offset = 0, role } = req.query;
    
    let query = db.collection(CollectionNames.USERS)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));
    
    if (role) {
      query = query.where('role', '==', role);
    }
    
    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    res.json(formatSuccessResponse(users, 'Users retrieved successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error retrieving users', 500, { error: error.message }));
  }
}

/**
 * Update user role (Super Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function updateUserRole(req, res) {
  try {
    const { uid } = req.params;
    const { role } = req.body;
    
    if (req.userData.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json(formatErrorResponse('Only super admins can update user roles', 403));
      return;
    }
    
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json(formatErrorResponse('Invalid role', 400));
      return;
    }
    
    await db.collection(CollectionNames.USERS).doc(uid).update({
      role,
      updatedAt: new Date()
    });
    
    // Create audit log
    const auditLog = createAuditLog('role_updated', req.user.uid, uid, {
      newRole: role
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'User role updated successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error updating user role', 500, { error: error.message }));
  }
}

/**
 * Delete user account (Super Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function deleteUser(req, res) {
  try {
    const { uid } = req.params;
    
    if (req.userData.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json(formatErrorResponse('Only super admins can delete users', 403));
      return;
    }
    
    if (uid === req.user.uid) {
      res.status(400).json(formatErrorResponse('You cannot delete your own account', 400));
      return;
    }
    
    // Delete user from Firestore
    await db.collection(CollectionNames.USERS).doc(uid).delete();
    
    // Delete user from Firebase Auth
    await auth.deleteUser(uid);
    
    // Create audit log
    const auditLog = createAuditLog('user_deleted', req.user.uid, uid);
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'User deleted successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error deleting user', 500, { error: error.message }));
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  deleteUser
};
