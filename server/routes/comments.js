const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Article = require('../models/Article');
const { auth } = require('../middleware/auth');
const { notifyNewComment, notifyCommentReply, notifyCommentLike } = require('../utils/notifications');

// Validation middleware
const commentValidation = [
  body('content').trim().isLength({ min: 1 }).withMessage('Comment cannot be empty')
];

// POST new comment on an article
router.post('/article/:articleId', [auth, ...commentValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { articleId } = req.params;
    const { content } = req.body;

    // Verify article exists
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Create and save comment
    const comment = new Comment({
      content,
      author: req.user._id,
      article: articleId
    });

    await comment.save();
    await comment.populate('author', 'username avatar');

    // Add comment to article's comment list
    article.comments.push(comment._id);
    await article.save();

    // Send notification to the article author if it's not the same user
    if (article.author.toString() !== req.user._id.toString()) {
      try {
        await notifyNewComment(
          articleId, 
          article.title, 
          article.author, 
          req.user._id
        );
        console.log('Comment notification sent');
      } catch (notificationError) {
        console.error('Error sending comment notification:', notificationError);
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error in POST /comments/article/:articleId:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

// POST reply to a comment
router.post('/reply/:commentId', [auth, ...commentValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { commentId } = req.params;
    const { content } = req.body;

    // Verify parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: 'Parent comment not found' });
    }

    // Create and save reply
    const reply = new Comment({
      content,
      author: req.user._id,
      article: parentComment.article,
      parentComment: commentId
    });

    await reply.save();
    await reply.populate('author', 'username avatar');

    // Add reply to parent comment's replies list
    parentComment.replies.push(reply._id);
    await parentComment.save();
    
    // Send notification to the parent comment author if it's not the same user
    if (parentComment.author.toString() !== req.user._id.toString()) {
      await notifyCommentReply(
        parentComment.article, 
        commentId,
        parentComment.author, 
        req.user._id
      );
    }

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error in POST /comments/reply/:commentId:', error);
    res.status(500).json({ message: 'Failed to add reply', error: error.message });
  }
});

// GET comments for a specific article
router.get('/article/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Get top-level comments (no parent)
    const comments = await Comment.find({ 
      article: articleId,
      parentComment: null 
    })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

    // Get replies for these comments
    for (let comment of comments) {
      const replies = await Comment.find({ parentComment: comment._id })
        .populate('author', 'username avatar')
        .sort({ createdAt: 1 });
      comment._doc.replies = replies;
    }

    const count = await Comment.countDocuments({ 
      article: articleId,
      parentComment: null 
    });

    res.json({
      comments,
      totalComments: count,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error('Error in GET /comments/article/:articleId:', error);
    res.status(500).json({ message: 'Failed to get comments', error: error.message });
  }
});

// PUT edit a comment
router.put('/:commentId', [auth, ...commentValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is author of comment
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    // Update comment
    comment.content = content;
    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json(comment);
  } catch (error) {
    console.error('Error in PUT /comments/:commentId:', error);
    res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
});

// DELETE a comment
router.delete('/:commentId', [auth], async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // If this is a reply, remove from parent's replies array
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(
        comment.parentComment,
        { $pull: { replies: commentId } }
      );
    } 
    // If this is a top-level comment, remove from article's comments array
    else {
      await Article.findByIdAndUpdate(
        comment.article,
        { $pull: { comments: commentId } }
      );
      
      // Delete all replies to this comment
      await Comment.deleteMany({ parentComment: commentId });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /comments/:commentId:', error);
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
});

// POST like a comment
router.post('/:commentId/like', [auth], async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.likes += 1;
    await comment.save();
    
    // Send notification to the comment author if it's not the same user
    if (comment.author.toString() !== req.user._id.toString()) {
      await notifyCommentLike(
        comment.article, 
        commentId,
        comment.author, 
        req.user._id
      );
    }

    res.json({ likes: comment.likes });
  } catch (error) {
    console.error('Error in POST /comments/:commentId/like:', error);
    res.status(500).json({ message: 'Failed to like comment', error: error.message });
  }
});

module.exports = router; 