const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { uploadBase64Image } = require('../utils/cloudinaryConfig');
const { notifyArticleApproval, notifyArticleRejection, notifyArticleSubmission, notifyArticleLike, notifyArticleFavorite, notifyNewComment, notifyCommentReply } = require('../utils/notifications');

// Validation middleware
const articleValidation = [
  body('title').trim().isLength({ min: 3 }).escape()
    .withMessage('Title must be at least 3 characters long'),
  body('content').isObject()
    .withMessage('Content must be a valid object'),
  body('status').optional().isIn(['draft', 'published'])
    .withMessage('Invalid status'),
  body('tags').optional().isArray()
    .withMessage('Tags must be an array')
];

// Submit article for review
router.post('/:id/submit-for-review', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Check if the user is the author of the article
    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit this article for review' });
    }
    
    // Change status from draft to pending
    if (article.status === 'draft') {
      article.status = 'pending';
      await article.save();
      
      // Create notification for admins about the new submission
      await notifyArticleSubmission(article._id, article.title, req.user._id);
      
      res.json({ 
        message: 'Article submitted for review successfully',
        article 
      });
    } else {
      return res.status(400).json({ 
        message: `Cannot submit article for review. Current status: ${article.status}` 
      });
    }
  } catch (error) {
    console.error('Error submitting article for review:', error);
    res.status(500).json({ message: 'Error submitting article for review', error: error.message });
  }
});

// Get pending articles (admin only)
router.get('/moderation/pending', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const pendingArticles = await Article.find({ status: 'pending' })
      .populate('author', 'username name title avatar')
      .sort({ createdAt: -1 });
    
    res.json(pendingArticles);
  } catch (error) {
    console.error('Error fetching pending articles:', error);
    res.status(500).json({ message: 'Error fetching pending articles', error: error.message });
  }
});

// Approve an article (admin only)
router.post('/:id/approve', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    if (article.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot approve article. Current status: ${article.status}` 
      });
    }
    
    // Change status from pending to published
    article.status = 'published';
    
    // Record the admin who approved it (could be stored in a separate activity log)
    const approvedBy = {
      userId: req.user._id,
      username: req.user.username,
      role: req.user.role,
      timestamp: new Date()
    };
    
    // In a real app, you might want to store this approval info
    // article.approvedBy = approvedBy;
    
    await article.save();
    
    // Create notification for the article author
    await notifyArticleApproval(
      article._id, 
      article.title, 
      article.author, 
      req.user._id
    );
    
    res.json({ 
      message: 'Article approved and published successfully',
      article,
      approvedBy
    });
  } catch (error) {
    console.error('Error approving article:', error);
    res.status(500).json({ message: 'Error approving article', error: error.message });
  }
});

// Reject an article (admin only)
router.post('/:id/reject', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { reason } = req.body;
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    if (article.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot reject article. Current status: ${article.status}` 
      });
    }
    
    // Change status back to draft
    article.status = 'draft';
    
    // Record the rejection info (could be stored in a separate activity log)
    const rejectedBy = {
      userId: req.user._id,
      username: req.user.username,
      role: req.user.role,
      reason: reason || 'No reason provided',
      timestamp: new Date()
    };
    
    // In a real app, you might want to store this rejection info
    // article.rejectedBy = rejectedBy;
    
    await article.save();
    
    // Create notification for the article author
    await notifyArticleRejection(
      article._id, 
      article.title, 
      article.author, 
      req.user._id, 
      reason
    );
    
    res.json({ 
      message: 'Article rejected successfully',
      article,
      rejectedBy
    });
  } catch (error) {
    console.error('Error rejecting article:', error);
    res.status(500).json({ message: 'Error rejecting article', error: error.message });
  }
});

// GET all articles with search, filtering, and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'published', 
      sort = 'newest',
      search = '',
      category = '',
      tags = '',
      authorId = '',
      minDate = '',
      maxDate = '',
      exact = false,
      favoritesOnly = false
    } = req.query;
    
    // Check if we need to filter by favorites
    if (favoritesOnly === 'true' && req.user) {
      // Redirect to the favorites endpoint
      return res.redirect(`/api/articles/favorites?page=${page}&limit=${limit}&sort=${sort}&search=${search}&category=${category}`);
    }
    
    // Base query - filter by status
    let query = { status };
    
    // If user is authenticated, allow them to see their own drafts
    if (req.user) {
      if (status === 'all') {
        // If status is 'all', show published articles + user's drafts
        query = {
          $or: [
            { status: 'published' },
            { status: 'draft', author: req.user._id }
          ]
        };
      } else if (status === 'my-drafts') {
        // Show only user's drafts
        query = { status: 'draft', author: req.user._id };
      }
    }
    
    // Enhanced search functionality
    if (search) {
      if (exact === 'true') {
        // Exact match search using regex with word boundaries
        const searchRegex = new RegExp(`\\b${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { tags: { $in: [searchRegex] } }
        ];
      } else {
        // Full-text search - make sure your MongoDB has text indexes set up
        query.$text = { $search: search };
        
        // Add a score field for relevance sorting
        if (sort === 'relevance') {
          // This will be used for sorting by search relevance
          sortScore = { score: { $meta: 'textScore' } };
        }
      }
    }
    
    // Category filter - support for multiple categories
    if (category) {
      if (category.includes(',')) {
        // Multiple categories filter
        const categoryArray = category.split(',').map(cat => cat.trim());
        query.category = { $in: categoryArray };
      } else {
        query.category = category;
      }
    }
    
    // Tags filter (can be comma-separated)
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Author filter
    if (authorId) {
      query.author = authorId;
    }
    
    // Date range filter
    if (minDate) {
      query.createdAt = { ...query.createdAt || {}, $gte: new Date(minDate) };
    }
    
    if (maxDate) {
      query.createdAt = { ...query.createdAt || {}, $lte: new Date(maxDate) };
    }
    
    // Sorting options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { views: -1 },
      trending: { likes: -1 },
      relevance: { score: { $meta: 'textScore' } } // For relevance-based sorting
    };
    
    const sortBy = sortOptions[sort] || sortOptions.newest;
    
    // Prepare the query with projection
    let articlesQuery = Article.find(query);
    
    // Add text score projection if doing a text search and sorting by relevance
    if (search && sort === 'relevance' && !exact) {
      articlesQuery = articlesQuery.select({ score: { $meta: 'textScore' } });
    }

    // Execute query with pagination and populate author data
    const articles = await articlesQuery
      .populate('author', 'username name title avatar')
      .sort(sortBy)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Get total count for pagination
    const count = await Article.countDocuments(query);

    // Get available categories for filtering
    const categories = await Article.distinct('category', { status: 'published' });
    
    // Get popular tags
    const popularTags = await Article.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Add favorited status for each article if user is logged in
    let articlesWithFavorited = articles;
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        articlesWithFavorited = articles.map(article => {
          const articleObj = article.toObject();
          articleObj.favorited = user.favorites.some(
            favoriteId => favoriteId.toString() === article._id.toString()
          );
          return articleObj;
        });
      }
    }

    res.json({
      articles: articlesWithFavorited,
      totalArticles: count,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      categories,
      popularTags: popularTags.map(tag => ({ name: tag._id, count: tag.count }))
    });
  } catch (error) {
    console.error('Error in GET /articles:', error);
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
});

// GET related articles
router.get('/related', async (req, res) => {
  try {
    const { 
      limit = 3, 
      category = '', 
      tags = '', 
      excludeId = '' 
    } = req.query;
    
    // Build query for related articles
    const query = { status: 'published' };
    
    // Exclude the current article from results
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    // Match by category if provided
    if (category) {
      query.category = category;
    }
    
    // Match by tags if provided
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Find related articles with limit
    let articles = await Article.find(query)
      .populate('author', 'username name avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    // If we don't have enough articles with strict matching,
    // fallback to get more articles without tag/category filters
    if (articles.length < Number(limit)) {
      const remainingCount = Number(limit) - articles.length;
      const existingIds = articles.map(article => article._id);
      
      // Query for additional articles, excluding those already found
      const additionalQuery = { 
        status: 'published', 
        _id: { $nin: [...existingIds, excludeId] }
      };
      
      const additionalArticles = await Article.find(additionalQuery)
        .populate('author', 'username name avatar')
        .sort({ createdAt: -1 })
        .limit(remainingCount);
      
      // Combine the results
      articles = [...articles, ...additionalArticles];
    }
    
    res.json({
      articles,
      totalArticles: articles.length,
      currentPage: 1,
    });
  } catch (error) {
    console.error('Error in GET /articles/related:', error);
    res.status(500).json({ message: 'Error fetching related articles', error: error.message });
  }
});

// GET user's favorite articles
router.get('/favorites', [auth], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'newest',
      search = '',
      category = ''
    } = req.query;
    
    // Get user with populated favorites
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: {
        path: 'author',
        select: 'username name title avatar'
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let favorites = user.favorites || [];
    
    // Apply search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      favorites = favorites.filter(article => 
        searchRegex.test(article.title) || 
        (article.description && searchRegex.test(article.description)) ||
        (article.category && searchRegex.test(article.category))
      );
    }
    
    // Apply category filter if provided
    if (category) {
      favorites = favorites.filter(article => article.category === category);
    }
    
    // Apply sorting
    switch (sort) {
      case 'oldest':
        favorites.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'popular':
        favorites.sort((a, b) => b.views - a.views);
        break;
      case 'trending':
        favorites.sort((a, b) => b.likes - a.likes);
        break;
      default: // 'newest'
        favorites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // Get total count
    const count = favorites.length;
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    favorites = favorites.slice(startIndex, endIndex);
    
    // Get available categories from favorites
    const categories = [...new Set(user.favorites.map(article => article.category).filter(Boolean))];
    
    res.json({
      articles: favorites,
      totalArticles: count,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      categories
    });
  } catch (error) {
    console.error('Error in GET /articles/favorites:', error);
    res.status(500).json({ message: 'Error fetching favorite articles', error: error.message });
  }
});

// GET article by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'username name title avatar');
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // If article is draft, only author or admin can view it
    if (article.status === 'draft') {
      if (!req.user || (req.user._id.toString() !== article.author._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      // Increment view count for published articles
      article.views += 1;
      await article.save();
    }

    // Get comments for the article
    const comments = await Comment.find({ 
      article: req.params.id,
      parentComment: null // Only get top-level comments
    })
    .populate('author', 'username name avatar')
    .sort({ createdAt: -1 });

    // Check if the current user has favorited this article
    let favorited = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        favorited = user.favorites.some(
          favoriteId => favoriteId.toString() === article._id.toString()
        );
      }
    }

    // Convert to object to add favorited property
    const articleObj = article.toObject();
    articleObj.favorited = favorited;

    res.json({ article: articleObj, comments });
  } catch (error) {
    console.error('Error in GET /articles/:id:', error);
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
});

// GET check if article is favorited by current user
router.get('/:id/favorite', [auth], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isFavorited = user.favorites.some(
      favoriteId => favoriteId.toString() === req.params.id
    );
    
    res.json({ favorited: isFavorited });
  } catch (error) {
    console.error('Error in GET /articles/:id/favorite:', error);
    res.status(500).json({ message: 'Error checking favorite status', error: error.message });
  }
});

// POST new article
router.post('/', [auth, authorize('writer', 'admin'), ...articleValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, content, status, category, tags, coverImage } = req.body;
    
    // Upload cover image to Cloudinary if it's a base64 string
    let coverImageUrl = coverImage;
    if (coverImage && coverImage.startsWith('data:')) {
      try {
        const uploadResult = await uploadBase64Image(coverImage, 'covers');
        coverImageUrl = uploadResult.secure_url;
      } catch (err) {
        return res.status(400).json({ message: 'Error uploading cover image', error: err.message });
      }
    }

    // Process content for embedded base64 images
    if (content && content.blocks) {
      // Find and replace base64 images with Cloudinary URLs
      for (let i = 0; i < content.blocks.length; i++) {
        const block = content.blocks[i];
        if (block.type === 'image' && block.data && block.data.file && block.data.file.url && block.data.file.url.startsWith('data:')) {
          try {
            const uploadResult = await uploadBase64Image(block.data.file.url, 'article-content');
            content.blocks[i].data.file.url = uploadResult.secure_url;
          } catch (err) {
            console.error('Error uploading embedded image:', err);
            // Continue with other images
          }
        }
      }
    }

    const article = new Article({
      title,
      description: description || '',
      content,
      author: req.user._id,
      status: status || 'draft',
      category: category || 'Uncategorized',
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      coverImage: coverImageUrl || ''
    });

    await article.save();
    await article.populate('author', 'username avatar');
    
    res.status(201).json(article);
  } catch (error) {
    console.error('Error in POST /articles:', error);
    res.status(500).json({ message: 'Error creating article', error: error.message });
  }
});

// PUT update article
router.put('/:id', [auth, ...articleValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check if user is author or admin
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, content, status, category, tags, coverImage } = req.body;
    
    // Upload cover image to Cloudinary if it's a base64 string
    let coverImageUrl = coverImage;
    if (coverImage && coverImage.startsWith('data:')) {
      try {
        const uploadResult = await uploadBase64Image(coverImage, 'covers');
        coverImageUrl = uploadResult.secure_url;
      } catch (err) {
        return res.status(400).json({ message: 'Error uploading cover image', error: err.message });
      }
    }

    // Process content for embedded base64 images
    if (content && content.blocks) {
      // Find and replace base64 images with Cloudinary URLs
      for (let i = 0; i < content.blocks.length; i++) {
        const block = content.blocks[i];
        if (block.type === 'image' && block.data && block.data.file && block.data.file.url && block.data.file.url.startsWith('data:')) {
          try {
            const uploadResult = await uploadBase64Image(block.data.file.url, 'article-content');
            content.blocks[i].data.file.url = uploadResult.secure_url;
          } catch (err) {
            console.error('Error uploading embedded image:', err);
            // Continue with other images
          }
        }
      }
    }
    
    // Update article fields
    article.title = title;
    article.description = description || article.description;
    article.content = content;
    article.status = status || article.status;
    article.category = category || article.category;
    article.tags = Array.isArray(tags) ? tags : (tags ? [tags] : article.tags);
    
    // Only update coverImage if provided
    if (coverImageUrl) {
      article.coverImage = coverImageUrl;
    }

    await article.save();
    await article.populate('author', 'username avatar');

    res.json(article);
  } catch (error) {
    console.error('Error in PUT /articles/:id:', error);
    res.status(500).json({ message: 'Error updating article', error: error.message });
  }
});

// DELETE article
router.delete('/:id', [auth], async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Check if user is author or admin
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete associated comments
    await Comment.deleteMany({ article: req.params.id });
    
    // Delete the article
    await Article.findByIdAndDelete(req.params.id);

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /articles/:id:', error);
    res.status(500).json({ message: 'Error deleting article', error: error.message });
  }
});

// POST like an article
router.post('/:id/like', [auth], async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Check if user already liked this article
    const userLiked = article.likedBy.some(userId => 
      userId.toString() === req.user._id.toString()
    );
    
    if (userLiked) {
      // Unlike: remove user from likedBy and decrement likes
      article.likedBy = article.likedBy.filter(
        userId => userId.toString() !== req.user._id.toString()
      );
      article.likes -= 1;
    } else {
      // Like: add user to likedBy and increment likes
      article.likedBy.push(req.user._id);
      article.likes += 1;
      
      // Send notification to author if the liker is not the author
      if (article.author.toString() !== req.user._id.toString()) {
        await notifyArticleLike(
          article._id, 
          article.title, 
          article.author, 
          req.user._id
        );
      }
    }
    
    await article.save();
    
    res.json({ 
      likes: article.likes,
      userLiked: !userLiked
    });
  } catch (error) {
    console.error('Error in POST /articles/:id/like:', error);
    res.status(500).json({ message: 'Error liking article', error: error.message });
  }
});

// GET comments for an article
router.get('/:id/comments', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get top-level comments
    const comments = await Comment.find({ 
      article: req.params.id,
      parentComment: null
    })
    .populate('author', 'username avatar title')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));
    
    // For each comment, get replies
    const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
      const replies = await Comment.find({ parentComment: comment._id })
        .populate('author', 'username avatar title')
        .sort({ createdAt: 1 });
      
      const commentObj = comment.toObject();
      commentObj.replies = replies;
      return commentObj;
    }));

    // Get total comments count for pagination
    const count = await Comment.countDocuments({ 
      article: req.params.id,
      parentComment: null
    });

    res.json({
      comments: commentsWithReplies,
      totalComments: count,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error('Error in GET /articles/:id/comments:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// POST add a new comment to an article
router.post('/:id/comments', [auth], async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Check if article exists
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Create new comment
    const comment = new Comment({
      content: content.trim(),
      author: req.user._id,
      article: req.params.id
    });

    await comment.save();

    // Add comment to article
    article.comments.push(comment._id);
    await article.save();

    // Populate author details
    await comment.populate('author', 'username avatar title');

    // Send notification to the article author if it's not the same user
    if (article.author.toString() !== req.user._id.toString()) {
      try {
        await notifyNewComment(
          req.params.id, 
          article.title, 
          article.author, 
          req.user._id
        );
        console.log('Comment notification sent from article route');
      } catch (notificationError) {
        console.error('Error sending comment notification from article route:', notificationError);
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error in POST /articles/:id/comments:', error);
    res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
});

// POST reply to a comment
router.post('/comments/:commentId/reply', [auth], async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    // Check if parent comment exists
    const parentComment = await Comment.findById(req.params.commentId);
    if (!parentComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Create reply comment
    const reply = new Comment({
      content: content.trim(),
      author: req.user._id,
      article: parentComment.article,
      parentComment: parentComment._id
    });

    await reply.save();

    // Add reply to parent comment
    parentComment.replies.push(reply._id);
    await parentComment.save();

    // Populate author details
    await reply.populate('author', 'username avatar title');

    // Send notification to the parent comment author if it's not the same user
    if (parentComment.author.toString() !== req.user._id.toString()) {
      try {
        await notifyCommentReply(
          parentComment.article, 
          parentComment._id,
          parentComment.author, 
          req.user._id
        );
        console.log('Comment reply notification sent from article route');
      } catch (notificationError) {
        console.error('Error sending comment reply notification from article route:', notificationError);
      }
    }

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error in POST /comments/:commentId/reply:', error);
    res.status(500).json({ message: 'Error creating reply', error: error.message });
  }
});

// POST favorite/unfavorite an article
router.post('/:id/favorite', [auth], async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if article is already in user's favorites
    const isFavorited = user.favorites.some(
      favoriteId => favoriteId.toString() === article._id.toString()
    );
    
    if (isFavorited) {
      // Remove from favorites
      user.favorites = user.favorites.filter(
        favoriteId => favoriteId.toString() !== article._id.toString()
      );
      
      // Remove user from article's favoritedBy
      article.favoritedBy = article.favoritedBy.filter(
        userId => userId.toString() !== user._id.toString()
      );
    } else {
      // Add to favorites
      user.favorites.push(article._id);
      
      // Add user to article's favoritedBy
      article.favoritedBy.push(user._id);
      
      // Send notification to author if the user is not the author
      if (article.author.toString() !== user._id.toString()) {
        await notifyArticleFavorite(
          article._id,
          article.title,
          article.author,
          user._id
        );
      }
    }
    
    await Promise.all([user.save(), article.save()]);
    
    res.json({ 
      favorited: !isFavorited
    });
  } catch (error) {
    console.error('Error in POST /articles/:id/favorite:', error);
    res.status(500).json({ message: 'Error favoriting article', error: error.message });
  }
});

module.exports = router; 