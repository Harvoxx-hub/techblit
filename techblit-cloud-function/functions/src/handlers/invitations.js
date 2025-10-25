// User invitation handlers

const { db, auth } = require('../config/firebase');
const { CollectionNames, UserRole } = require('../types/constants');
const { isValidEmail, createAuditLog, formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');
const { generateTemporaryPassword, hashPassword } = require('../utils/password');
const { sendWelcomeEmail } = require('../utils/email');

/**
 * Invite a new user to the platform
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function inviteUser(req, res) {
  try {
    const { email, name, role = UserRole.AUTHOR } = req.body;
    
    // Validate input
    if (!email || !name) {
      res.status(400).json(formatErrorResponse('Email and name are required', 400));
      return;
    }
    
    if (!isValidEmail(email)) {
      res.status(400).json(formatErrorResponse('Invalid email format', 400));
      return;
    }
    
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json(formatErrorResponse('Invalid role', 400));
      return;
    }
    
    // Check if user already exists
    const existingUserDoc = await db.collection(CollectionNames.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!existingUserDoc.empty) {
      res.status(409).json(formatErrorResponse('User with this email already exists', 409));
      return;
    }
    
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);
    
    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email: email,
        password: temporaryPassword,
        displayName: name,
        emailVerified: false
      });
    } catch (authError) {
      console.error('Error creating Firebase Auth user:', authError);
      res.status(500).json(formatErrorResponse('Failed to create user account', 500));
      return;
    }
    
    // Create user document in Firestore
    const userData = {
      uid: firebaseUser.uid,
      email: email,
      name: name,
      role: role,
      avatar: null,
      bio: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: new Date(),
      isActive: true,
      isInvited: true,
      invitedBy: req.user.uid,
      invitedAt: new Date(),
      temporaryPassword: hashedPassword, // Store hashed version
      passwordChanged: false,
      permissions: getRolePermissions(role)
    };
    
    await db.collection(CollectionNames.USERS).doc(firebaseUser.uid).set(userData);
    
    // Send welcome email
    const emailSent = await sendWelcomeEmail(
      email,
      name,
      temporaryPassword,
      req.userData.name
    );
    
    if (!emailSent) {
      console.warn('Failed to send welcome email, but user was created successfully');
    }
    
    // Create audit log
    const auditLog = createAuditLog('user_invited', req.user.uid, firebaseUser.uid, {
      email,
      name,
      role,
      emailSent
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    // Return success response (don't include password)
    const responseData = {
      uid: firebaseUser.uid,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      invitedAt: userData.invitedAt,
      emailSent
    };
    
    res.status(201).json(formatSuccessResponse(
      responseData,
      'User invited successfully'
    ));
    
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json(formatErrorResponse('Error inviting user', 500, { error: error.message }));
  }
}

/**
 * Get role-based permissions
 * @param {string} role - User role
 * @returns {Array<string>} - Array of permissions
 */
function getRolePermissions(role) {
  const permissions = {
    [UserRole.SUPER_ADMIN]: [
      'create_post', 'edit_any_post', 'delete_post', 'publish_post',
      'upload_media', 'manage_media', 'delete_media',
      'manage_users', 'invite_users', 'manage_settings',
      'manage_redirects', 'view_audit_logs', 'view_analytics', 'export_data'
    ],
    [UserRole.EDITOR]: [
      'create_post', 'edit_any_post', 'publish_post',
      'upload_media', 'manage_media', 'view_analytics'
    ],
    [UserRole.AUTHOR]: [
      'create_post', 'edit_own_post', 'upload_media'
    ],
    [UserRole.REVIEWER]: [
      'edit_any_post', 'publish_post', 'view_analytics'
    ],
    [UserRole.VIEWER]: [
      'view_analytics'
    ]
  };
  
  return permissions[role] || [];
}

/**
 * Resend invitation email
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function resendInvitation(req, res) {
  try {
    const { uid } = req.params;
    
    // Get user data
    const userDoc = await db.collection(CollectionNames.USERS).doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json(formatErrorResponse('User not found', 404));
      return;
    }
    
    const userData = userDoc.data();
    
    if (!userData.isInvited) {
      res.status(400).json(formatErrorResponse('User was not invited', 400));
      return;
    }
    
    // Generate new temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);
    
    // Update Firebase Auth password
    try {
      await auth.updateUser(uid, {
        password: temporaryPassword
      });
    } catch (authError) {
      console.error('Error updating Firebase Auth password:', authError);
      res.status(500).json(formatErrorResponse('Failed to update user password', 500));
      return;
    }
    
    // Update user document
    await db.collection(CollectionNames.USERS).doc(uid).update({
      temporaryPassword: hashedPassword,
      passwordChanged: false,
      updatedAt: new Date()
    });
    
    // Send welcome email
    const emailSent = await sendWelcomeEmail(
      userData.email,
      userData.name,
      temporaryPassword,
      req.userData.name
    );
    
    // Create audit log
    const auditLog = createAuditLog('invitation_resent', req.user.uid, uid, {
      email: userData.email,
      emailSent
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(
      { emailSent },
      'Invitation resent successfully'
    ));
    
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json(formatErrorResponse('Error resending invitation', 500, { error: error.message }));
  }
}

/**
 * Get invitation statistics
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getInvitationStats(req, res) {
  try {
    const { invitedBy } = req.query;
    
    let query = db.collection(CollectionNames.USERS)
      .where('isInvited', '==', true);
    
    if (invitedBy) {
      query = query.where('invitedBy', '==', invitedBy);
    }
    
    const snapshot = await query.get();
    
    const stats = {
      totalInvited: snapshot.size,
      pendingActivation: 0,
      activated: 0,
      byRole: {}
    };
    
    snapshot.docs.forEach(doc => {
      const userData = doc.data();
      
      if (userData.passwordChanged) {
        stats.activated++;
      } else {
        stats.pendingActivation++;
      }
      
      if (!stats.byRole[userData.role]) {
        stats.byRole[userData.role] = 0;
      }
      stats.byRole[userData.role]++;
    });
    
    res.json(formatSuccessResponse(stats, 'Invitation statistics retrieved'));
    
  } catch (error) {
    console.error('Error getting invitation stats:', error);
    res.status(500).json(formatErrorResponse('Error getting invitation statistics', 500, { error: error.message }));
  }
}

module.exports = {
  inviteUser,
  resendInvitation,
  getInvitationStats
};
