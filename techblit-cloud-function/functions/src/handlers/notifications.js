const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { createAuditLog } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const logger = require('firebase-functions/logger');

/**
 * Send notification to reviewers when a post is submitted for review
 */
async function notifyReviewers(postId, postData, authorData) {
  try {
    logger.info(`Sending review notification for post: ${postId}`);

    // Get all users with reviewer or editor role
    const reviewersSnapshot = await db.collection(CollectionNames.USERS)
      .where('role', 'in', ['reviewer', 'editor', 'super_admin'])
      .where('isActive', '==', true)
      .get();

    if (reviewersSnapshot.empty) {
      logger.warn('No reviewers found to notify');
      return;
    }

    const notificationPromises = [];

    for (const reviewerDoc of reviewersSnapshot.docs) {
      const reviewerData = reviewerDoc.data();
      
      // Create in-app notification
      const notificationPromise = createInAppNotification({
        userId: reviewerData.uid,
        type: 'review_requested',
        title: 'New Post Review Request',
        message: `"${postData.title}" by ${authorData.name} needs review`,
        data: {
          postId,
          postTitle: postData.title,
          authorName: authorData.name,
          authorUid: authorData.uid
        },
        actionUrl: `/admin/posts/${postData.slug}/edit`
      });

      notificationPromises.push(notificationPromise);

      // Send email notification (optional)
      if (reviewerData.email && reviewerData.notifications?.email?.reviewRequests !== false) {
        const emailPromise = sendReviewRequestEmail({
          to: reviewerData.email,
          reviewerName: reviewerData.name,
          postTitle: postData.title,
          authorName: authorData.name,
          postUrl: `https://techblit.com/admin/posts/${postData.slug}/edit`,
          excerpt: postData.excerpt
        });

        notificationPromises.push(emailPromise);
      }
    }

    await Promise.all(notificationPromises);

    logger.info(`Review notifications sent for post: ${postId}`);

  } catch (error) {
    logger.error(`Error sending review notifications for ${postId}:`, error);
  }
}

/**
 * Send notification to author when post is approved/rejected
 */
async function notifyAuthor(postId, postData, reviewerData, action) {
  try {
    logger.info(`Sending author notification for post: ${postId}, action: ${action}`);

    const authorUid = postData.author?.uid;
    if (!authorUid) {
      logger.warn('No author UID found for post');
      return;
    }

    // Get author data
    const authorDoc = await db.collection(CollectionNames.USERS).doc(authorUid).get();
    if (!authorDoc.exists) {
      logger.warn('Author not found');
      return;
    }

    const authorData = authorDoc.data();

    // Create in-app notification
    await createInAppNotification({
      userId: authorUid,
      type: action === 'approved' ? 'post_approved' : 'post_rejected',
      title: action === 'approved' ? 'Post Approved' : 'Post Needs Changes',
      message: action === 'approved' 
        ? `"${postData.title}" has been approved by ${reviewerData.name}`
        : `"${postData.title}" needs changes from ${reviewerData.name}`,
      data: {
        postId,
        postTitle: postData.title,
        reviewerName: reviewerData.name,
        reviewerUid: reviewerData.uid,
        action
      },
      actionUrl: `/admin/posts/${postData.slug}/edit`
    });

    // Send email notification (optional)
    if (authorData.email && authorData.notifications?.email?.postUpdates !== false) {
      await sendPostUpdateEmail({
        to: authorData.email,
        authorName: authorData.name,
        postTitle: postData.title,
        reviewerName: reviewerData.name,
        action,
        postUrl: `https://techblit.com/admin/posts/${postData.slug}/edit`
      });
    }

    logger.info(`Author notification sent for post: ${postId}`);

  } catch (error) {
    logger.error(`Error sending author notification for ${postId}:`, error);
  }
}

/**
 * Create in-app notification
 */
async function createInAppNotification(notificationData) {
  try {
    const notification = {
      ...notificationData,
      createdAt: new Date(),
      read: false,
      id: `${notificationData.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    await db.collection(CollectionNames.NOTIFICATIONS).add(notification);
    logger.info(`In-app notification created for user: ${notificationData.userId}`);

  } catch (error) {
    logger.error('Error creating in-app notification:', error);
  }
}

/**
 * Send review request email
 */
async function sendReviewRequestEmail({ to, reviewerName, postTitle, authorName, postUrl, excerpt }) {
  try {
    const subject = `Review Request: ${postTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Post Review Request</h2>
        
        <p>Hi ${reviewerName},</p>
        
        <p><strong>${authorName}</strong> has submitted a new post for review:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">${postTitle}</h3>
          <p style="color: #64748b; margin-bottom: 0;">${excerpt}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${postUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Post
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          This is an automated notification from TechBlit Admin.
        </p>
      </div>
    `;

    await sendEmail({ to, subject, html });
    logger.info(`Review request email sent to: ${to}`);

  } catch (error) {
    logger.error(`Error sending review request email to ${to}:`, error);
  }
}

/**
 * Send post update email
 */
async function sendPostUpdateEmail({ to, authorName, postTitle, reviewerName, action, postUrl }) {
  try {
    const subject = action === 'approved' 
      ? `Post Approved: ${postTitle}` 
      : `Post Needs Changes: ${postTitle}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${action === 'approved' ? '#059669' : '#dc2626'};">
          ${action === 'approved' ? 'Post Approved!' : 'Post Needs Changes'}
        </h2>
        
        <p>Hi ${authorName},</p>
        
        <p>Your post <strong>"${postTitle}"</strong> has been ${action === 'approved' ? 'approved' : 'returned for changes'} by <strong>${reviewerName}</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${postUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${action === 'approved' ? 'View Published Post' : 'Edit Post'}
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          This is an automated notification from TechBlit Admin.
        </p>
      </div>
    `;

    await sendEmail({ to, subject, html });
    logger.info(`Post update email sent to: ${to}`);

  } catch (error) {
    logger.error(`Error sending post update email to ${to}:`, error);
  }
}

/**
 * Get notifications for a user
 */
async function getUserNotifications(userId, limit = 50) {
  try {
    const snapshot = await db.collection(CollectionNames.NOTIFICATIONS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    logger.error(`Error getting notifications for user ${userId}:`, error);
    return [];
  }
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(notificationId, userId) {
  try {
    const notificationRef = db.collection(CollectionNames.NOTIFICATIONS).doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new Error('Notification not found');
    }

    const notificationData = notificationDoc.data();
    if (notificationData.userId !== userId) {
      throw new Error('Unauthorized to update this notification');
    }

    await notificationRef.update({ read: true, readAt: new Date() });
    logger.info(`Notification marked as read: ${notificationId}`);

  } catch (error) {
    logger.error(`Error marking notification as read ${notificationId}:`, error);
    throw error;
  }
}

module.exports = {
  notifyReviewers,
  notifyAuthor,
  createInAppNotification,
  getUserNotifications,
  markNotificationAsRead
};
