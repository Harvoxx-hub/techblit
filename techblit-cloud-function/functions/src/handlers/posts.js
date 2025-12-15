// Blog post handlers

const { db } = require('../config/firebase');
const { CollectionNames, PostStatus } = require('../types/constants');
const { generateUniqueSlug, createAuditLog, formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');

/**
 * Get all published posts
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getPublishedPosts(req, res) {
  try {
    const { limit = 10, offset = 0, category, tag } = req.query;
    
    let query = db.collection(CollectionNames.POSTS)
      .where('status', '==', PostStatus.PUBLISHED)
      .orderBy('publishedAt', 'desc')
      .limit(parseInt(limit));
    
    if (category) {
      query = query.where('categories', 'array-contains', category);
    }
    
    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }
    
    const snapshot = await query.get();
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(formatSuccessResponse(posts, 'Posts retrieved successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error retrieving posts', 500, { error: error.message }));
  }
}

/**
 * Get single post by slug
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getPostBySlug(req, res) {
  try {
    const { slug } = req.params;
    
    const snapshot = await db.collection(CollectionNames.POSTS)
      .where('slug', '==', slug)
      .where('status', '==', PostStatus.PUBLISHED)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      res.status(404).json(formatErrorResponse('Post not found', 404));
      return;
    }
    
    const post = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
    
    res.json(formatSuccessResponse(post, 'Post retrieved successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error retrieving post', 500, { error: error.message }));
  }
}

/**
 * Create new post (Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function createPost(req, res) {
  try {
    const { title, content, excerpt, tags = [], categories = [], status = PostStatus.DRAFT } = req.body;
    
    if (!title || !content || !excerpt) {
      res.status(400).json(formatErrorResponse('Title, content, and excerpt are required', 400));
      return;
    }
    
    const slug = await generateUniqueSlug(title);
    
    const postData = {
      title,
      slug,
      content,
      excerpt,
      tags,
      categories,
      status,
      author: {
        uid: req.user.uid,
        name: req.userData.name
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      viewCount: 0,
      likeCount: 0
    };
    
    const docRef = await db.collection(CollectionNames.POSTS).add(postData);
    
    // Create audit log
    const auditLog = createAuditLog('post_created', req.user.uid, docRef.id, {
      title,
      status
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.status(201).json(formatSuccessResponse(
      { id: docRef.id, ...postData },
      'Post created successfully'
    ));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error creating post', 500, { error: error.message }));
  }
}

/**
 * Update post (Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const postRef = db.collection(CollectionNames.POSTS).doc(id);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      res.status(404).json(formatErrorResponse('Post not found', 404));
      return;
    }
    
    // If title is being updated, generate new slug
    if (updateData.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, postDoc.data().slug);
    }
    
    updateData.updatedAt = new Date();
    
    // If status is changing to published, set publishedAt
    if (updateData.status === PostStatus.PUBLISHED && postDoc.data().status !== PostStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }
    
    await postRef.update(updateData);
    
    // Create audit log
    const auditLog = createAuditLog('post_updated', req.user.uid, id, {
      changes: Object.keys(updateData)
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'Post updated successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error updating post', 500, { error: error.message }));
  }
}

/**
 * Increment post view count
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function incrementViewCount(req, res) {
  try {
    const { slug } = req.params;
    
    const snapshot = await db.collection(CollectionNames.POSTS)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      res.status(404).json(formatErrorResponse('Post not found', 404));
      return;
    }
    
    const postRef = snapshot.docs[0].ref;
    const { admin } = require('../config/firebase');
    await postRef.update({
      viewCount: admin.firestore.FieldValue.increment(1)
    });
    
    res.json(formatSuccessResponse(null, 'View count incremented'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error incrementing view count', 500, { error: error.message }));
  }
}

/**
 * Delete post (Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    
    const postRef = db.collection(CollectionNames.POSTS).doc(id);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      res.status(404).json(formatErrorResponse('Post not found', 404));
      return;
    }
    
    await postRef.delete();
    
    // Create audit log
    const auditLog = createAuditLog('post_deleted', req.user.uid, id, {
      title: postDoc.data().title
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'Post deleted successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error deleting post', 500, { error: error.message }));
  }
}

module.exports = {
  getPublishedPosts,
  getPostBySlug,
  createPost,
  updatePost,
  incrementViewCount,
  deletePost
};
