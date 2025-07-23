const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification
 * @param {Array} targetUserIds - Array of specific user IDs to receive this notification
 * @param {Array} targetRoles - Array of roles that should see this notification (optional)
 * @param {String} message - Notification message
 * @param {String} byUserId - ID of the user who triggered the notification (optional)
 * @param {String} link - Optional URL to include in the notification
 * @returns {Promise<Object>} - The created notification
 */
const createNotification = async (targetUserIds = [], targetRoles = [], message, byUserId = null, link = '') => {
  try {
    console.log(`Creating notification with params: targetUsers=${JSON.stringify(targetUserIds)}, targetRoles=${JSON.stringify(targetRoles)}, message=${message}, link=${link}`);
    
    if (!message) {
      throw new Error('Notification message is required');
    }
    
    if (targetUserIds.length === 0 && targetRoles.length === 0) {
      throw new Error('At least one target user or role must be specified');
    }
    
    const notification = new Notification({
      type: targetRoles,
      targetUsers: targetUserIds,
      message,
      by: byUserId,
      link,
      readBy: []
    });
    
    const savedNotification = await notification.save();
    console.log(`Notification created successfully with ID: ${savedNotification._id}`);
    return savedNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    console.error('Notification data:', { targetUserIds, targetRoles, message, byUserId, link });
    throw error;
  }
};

/**
 * Create a notification for article approval
 * @param {String} articleId - ID of the approved article
 * @param {String} articleTitle - Title of the approved article
 * @param {String} authorId - ID of the article author
 * @param {String} adminId - ID of the admin who approved the article
 * @returns {Promise<Object>} - The created notification
 */
const notifyArticleApproval = async (articleId, articleTitle, authorId, adminId) => {
  const message = `Your article "${articleTitle}" has been approved and published`;
  const link = `/articles/${articleId}`;
  
  // This notification is only for the specific article author
  return createNotification([authorId], [], message, adminId, link);
};

/**
 * Create a notification for article rejection
 * @param {String} articleId - ID of the rejected article
 * @param {String} articleTitle - Title of the rejected article
 * @param {String} authorId - ID of the article author
 * @param {String} adminId - ID of the admin who rejected the article
 * @param {String} reason - Reason for rejection
 * @returns {Promise<Object>} - The created notification
 */
const notifyArticleRejection = async (articleId, articleTitle, authorId, adminId, reason) => {
  const message = `Your article "${articleTitle}" was returned for revision${reason ? ': ' + reason : ''}`;
  const link = `/editor/${articleId}`;
  
  // This notification is only for the specific article author
  return createNotification([authorId], [], message, adminId, link);
};

/**
 * Create a notification for article submission
 * @param {String} articleId - ID of the submitted article
 * @param {String} articleTitle - Title of the submitted article
 * @param {String} authorId - ID of the article author
 * @returns {Promise<Object>} - The created notification
 */
const notifyArticleSubmission = async (articleId, articleTitle, authorId) => {
  const message = `New article "${articleTitle}" has been submitted for review`;
  const link = `/admin/articles/review/${articleId}`;
  
  try {
    // Find all admin and owner users
    const admins = await User.find({ role: { $in: ['admin', 'owner'] } }).select('_id');
    const adminIds = admins.map(admin => admin._id);
    
    // This notification is for all admins and owners
    return createNotification(adminIds, [], message, authorId, link);
  } catch (error) {
    console.error('Error finding admins for notification:', error);
    // Fallback to role-based if user lookup fails
    return createNotification([], ['admin', 'owner'], message, authorId, link);
  }
};

/**
 * Create a notification for new comment
 * @param {String} articleId - ID of the article
 * @param {String} articleTitle - Title of the article
 * @param {String} authorId - ID of the article author
 * @param {String} commenterId - ID of the user who commented
 * @returns {Promise<Object>} - The created notification
 */
const notifyNewComment = async (articleId, articleTitle, authorId, commenterId) => {
  try {
    console.log(`Creating comment notification: articleId=${articleId}, articleTitle=${articleTitle}, authorId=${authorId}, commenterId=${commenterId}`);
    
    if (!articleId || !authorId) {
      console.error('Missing required params for comment notification:', { articleId, authorId });
      throw new Error('Article ID and author ID are required for comment notifications');
    }
    
    const message = `Someone commented on your article "${articleTitle}"`;
    const link = `/articles/${articleId}#comments`;
    
    // This notification is for the specific article author only
    const notification = await createNotification([authorId], [], message, commenterId, link);
    console.log(`Comment notification created: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error('Error creating comment notification:', error);
    throw error;
  }
};

/**
 * Create a notification for article like
 * @param {String} articleId - ID of the article
 * @param {String} articleTitle - Title of the article
 * @param {String} authorId - ID of the article author
 * @param {String} likerId - ID of the user who liked the article
 * @returns {Promise<Object>} - The created notification
 */
const notifyArticleLike = async (articleId, articleTitle, authorId, likerId) => {
  const message = `Someone liked your article "${articleTitle}"`;
  const link = `/articles/${articleId}`;
  
  // This notification is for the specific article author only
  return createNotification([authorId], [], message, likerId, link);
};

/**
 * Create a notification for comment reply
 * @param {String} articleId - ID of the article
 * @param {String} commentId - ID of the comment that was replied to
 * @param {String} commentAuthorId - ID of the comment author
 * @param {String} replierId - ID of the user who replied
 * @returns {Promise<Object>} - The created notification
 */
const notifyCommentReply = async (articleId, commentId, commentAuthorId, replierId) => {
  const message = `Someone replied to your comment`;
  const link = `/articles/${articleId}#comment-${commentId}`;
  
  // This notification is for the specific comment author only
  return createNotification([commentAuthorId], [], message, replierId, link);
};

/**
 * Create a notification for article favorite
 * @param {String} articleId - ID of the article
 * @param {String} articleTitle - Title of the article
 * @param {String} authorId - ID of the article author
 * @param {String} favoriterId - ID of the user who favorited the article
 * @returns {Promise<Object>} - The created notification
 */
const notifyArticleFavorite = async (articleId, articleTitle, authorId, favoriterId) => {
  const message = `Someone added your article "${articleTitle}" to their favorites`;
  const link = `/articles/${articleId}`;
  
  // This notification is for the specific article author only
  return createNotification([authorId], [], message, favoriterId, link);
};

/**
 * Create a notification for comment like
 * @param {String} articleId - ID of the article
 * @param {String} commentId - ID of the comment that was liked
 * @param {String} commentAuthorId - ID of the comment author
 * @param {String} likerId - ID of the user who liked the comment
 * @returns {Promise<Object>} - The created notification
 */
const notifyCommentLike = async (articleId, commentId, commentAuthorId, likerId) => {
  const message = `Someone liked your comment`;
  const link = `/articles/${articleId}#comment-${commentId}`;
  
  // This notification is for the specific comment author only
  return createNotification([commentAuthorId], [], message, likerId, link);
};

module.exports = {
  createNotification,
  notifyArticleApproval,
  notifyArticleRejection,
  notifyArticleSubmission,
  notifyNewComment,
  notifyArticleLike,
  notifyCommentReply,
  notifyArticleFavorite,
  notifyCommentLike
}; 