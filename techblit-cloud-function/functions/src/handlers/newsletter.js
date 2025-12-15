// Newsletter handlers

const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');
const logger = require('firebase-functions/logger');

/**
 * Subscribe to newsletter
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function subscribe(req, res) {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      res.status(400).json(formatErrorResponse('Email is required', 400));
      return;
    }
    
    // Check if already subscribed
    const existingQuery = db.collection(CollectionNames.NEWSLETTER_SUBSCRIPTIONS)
      .where('email', '==', email.toLowerCase())
      .limit(1);
    
    const existingSnapshot = await existingQuery.get();
    
    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();
      
      if (existingData.status === 'subscribed') {
        res.status(409).json(formatErrorResponse('Email already subscribed', 409));
        return;
      }
      
      // Re-subscribe
      await existingDoc.ref.update({
        status: 'subscribed',
        name: name || existingData.name,
        subscribedAt: new Date(),
        updatedAt: new Date()
      });
      
      res.json(formatSuccessResponse(
        { id: existingDoc.id, email, status: 'subscribed' },
        'Successfully re-subscribed to newsletter'
      ));
      return;
    }
    
    // New subscription
    const subscriptionData = {
      email: email.toLowerCase(),
      name: name || '',
      status: 'subscribed',
      subscribedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await db.collection(CollectionNames.NEWSLETTER_SUBSCRIPTIONS).add(subscriptionData);
    
    res.status(201).json(formatSuccessResponse(
      { id: docRef.id, ...subscriptionData },
      'Successfully subscribed to newsletter'
    ));
  } catch (error) {
    logger.error('Error subscribing to newsletter:', error);
    res.status(500).json(formatErrorResponse('Error subscribing to newsletter', 500, { error: error.message }));
  }
}

/**
 * Unsubscribe from newsletter
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function unsubscribe(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json(formatErrorResponse('Email is required', 400));
      return;
    }
    
    const query = db.collection(CollectionNames.NEWSLETTER_SUBSCRIPTIONS)
      .where('email', '==', email.toLowerCase())
      .where('status', '==', 'subscribed')
      .limit(1);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      res.status(404).json(formatErrorResponse('Email not found in subscriptions', 404));
      return;
    }
    
    const doc = snapshot.docs[0];
    await doc.ref.update({
      status: 'unsubscribed',
      unsubscribedAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json(formatSuccessResponse(null, 'Successfully unsubscribed from newsletter'));
  } catch (error) {
    logger.error('Error unsubscribing from newsletter:', error);
    res.status(500).json(formatErrorResponse('Error unsubscribing from newsletter', 500, { error: error.message }));
  }
}

/**
 * Get newsletter statistics (Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getNewsletterStats(req, res) {
  try {
    const subscriptionsRef = db.collection(CollectionNames.NEWSLETTER_SUBSCRIPTIONS);
    
    // Get all subscriptions
    const allSnapshot = await subscriptionsRef.get();
    const total = allSnapshot.size;
    
    // Get active subscriptions
    const activeQuery = subscriptionsRef.where('status', '==', 'subscribed');
    const activeSnapshot = await activeQuery.get();
    const active = activeSnapshot.size;
    
    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentQuery = subscriptionsRef
      .where('status', '==', 'subscribed')
      .where('subscribedAt', '>=', thirtyDaysAgo)
      .orderBy('subscribedAt', 'desc');
    
    const recentSnapshot = await recentQuery.get();
    const recent = recentSnapshot.size;
    
    res.json(formatSuccessResponse({
      total,
      active,
      unsubscribed: total - active,
      recent
    }, 'Newsletter statistics retrieved successfully'));
  } catch (error) {
    logger.error('Error getting newsletter stats:', error);
    res.status(500).json(formatErrorResponse('Error getting newsletter statistics', 500, { error: error.message }));
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  getNewsletterStats
};

