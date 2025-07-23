const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Article = require('../models/Article');
const Newsletter = require('../models/Newsletter');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// Verify admin access endpoint (used by frontend to check admin status)
router.get('/verify-admin', auth, async (req, res) => {
  try {
    const userRole = req.user.role.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'owner';
    
    if (isAdmin) {
      return res.json({ 
        isAdmin: true, 
        role: req.user.role,
        message: 'User has admin access' 
      });
    } else {
      return res.status(403).json({ 
        isAdmin: false,
        message: 'User does not have admin access'
      });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;
    
    // Build query with search if provided
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination based on search
    const totalUsers = await User.countDocuments(query);
    
    // Get paginated users with search
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get active users count
    const activeUsersCount = await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    
    // Get new users this week
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name || user.username,
      email: user.email,
      role: user.role,
      registrationDate: user.createdAt,
      status: 'Active', // Assuming all users are active for now
      articles: 0, // Placeholder until we count articles
      lastLogin: user.lastLogin || user.createdAt, // Placeholder as we don't track last login yet
      avatar: user.avatar || ''
    }));
    
    // Populate article counts separately (more efficient than multiple lookups in map)
    for (const user of formattedUsers) {
      const count = await Article.countDocuments({ author: user.id });
      user.articles = count;
    }
    
    res.json({
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      },
      stats: {
        activeUsers: activeUsersCount,
        newUsersThisWeek: newUsersThisWeek
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Promote user to a role with higher privileges
router.post('/users/:userId/promote', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Role progression: user -> writer -> admin
    // Owner is a protected role that cannot be assigned through this endpoint
    let newRole = user.role;
    
    switch (user.role.toLowerCase()) {
      case 'user':
        newRole = 'writer';
        break;
      case 'writer':
        newRole = 'admin';
        break;
      case 'admin':
        return res.status(400).json({ message: 'User already has highest assignable role' });
    }
    
    user.role = newRole;
    await user.save();
    
    res.json({ 
      message: `User promoted to ${newRole}`,
      user: {
        id: user._id,
        role: user.role,
        name: user.name || user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ message: 'Error promoting user', error: error.message });
  }
});

// Demote user to a role with lower privileges
router.post('/users/:userId/demote', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Role demotion: admin -> writer -> user
    let newRole = user.role;
    
    switch (user.role.toLowerCase()) {
      case 'admin':
        newRole = 'writer';
        break;
      case 'writer':
        newRole = 'user';
        break;
      case 'user':
        return res.status(400).json({ message: 'User already has lowest role' });
      case 'owner':
        return res.status(403).json({ message: 'Cannot demote owner account' });
    }
    
    user.role = newRole;
    await user.save();
    
    res.json({ 
      message: `User demoted to ${newRole}`,
      user: {
        id: user._id,
        role: user.role,
        name: user.name || user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error demoting user:', error);
    res.status(500).json({ message: 'Error demoting user', error: error.message });
  }
});

// Delete a user
router.delete('/users/:userId', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account through this endpoint' });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow deleting owner accounts unless you're the owner
    if (user.role.toLowerCase() === 'owner' && req.user.role.toLowerCase() !== 'owner') {
      return res.status(403).json({ message: 'Cannot delete an owner account' });
    }
    
    await User.findByIdAndDelete(req.params.userId);
    
    // In a real app, you might also handle:
    // 1. Reassigning or deleting the user's articles
    // 2. Anonymizing comments
    // 3. Removing references to the user elsewhere
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Get all articles for admin
router.get('/articles', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalArticles = await Article.countDocuments();
    
    // Get paginated articles
    const articles = await Article.find()
      .populate('author', 'name username avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const formattedArticles = articles.map(article => ({
      id: article._id,
      title: article.title,
      author: article.author ? article.author.name || article.author.username : 'Unknown',
      publishDate: article.createdAt,
      status: article.status.charAt(0).toUpperCase() + article.status.slice(1), // Capitalize status
      views: article.views || 0,
      category: article.category || 'Uncategorized',
      wordCount: article.content ? article.content.length: 0,
    }));
    
    res.json({
      articles: formattedArticles,
      pagination: {
        total: totalArticles,
        page,
        limit,
        totalPages: Math.ceil(totalArticles / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
});

// Get admin dashboard statistics
router.get('/stats', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) } // First day of current month
    });
    
    // Users registered in the last week
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: lastWeekStart }
    });
    
    // Active users (users who logged in within the last week)
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: lastWeekStart }
    });
    
    // Get user counts by role
    const admins = await User.countDocuments({ role: { $in: ['admin', 'owner'] } });
    const writers = await User.countDocuments({ role: 'writer' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    // Get user distribution by role
    const userDistribution = [
      { role: 'Admin', count: await User.countDocuments({ role: 'admin' }) },
      { role: 'Owner', count: await User.countDocuments({ role: 'owner' }) },
      { role: 'Writer', count: await User.countDocuments({ role: 'writer' }) },
      { role: 'User', count: await User.countDocuments({ role: 'user' }) }
    ];
    
    // Article statistics
    const totalArticles = await Article.countDocuments();
    const publishedArticles = await Article.countDocuments({ status: 'published' });
    const pendingArticles = await Article.countDocuments({ status: 'pending' });
    const draftArticles = await Article.countDocuments({ status: 'draft' });
    const underReviewArticles = await Article.countDocuments({ status: 'under-review' });
    const rejectedArticles = await Article.countDocuments({ status: 'rejected' });
    
    // Articles created in last week
    const newArticlesThisWeek = await Article.countDocuments({
      createdAt: { $gte: lastWeekStart }
    });
    
    // Content status distribution
    const contentStatus = [
      { status: 'Published', count: publishedArticles },
      { status: 'Pending', count: pendingArticles },
      { status: 'Under Review', count: underReviewArticles },
      { status: 'Draft', count: draftArticles },
      { status: 'Rejected', count: rejectedArticles }
    ];
    
    // Get the total views across all published articles
    const viewsAggregate = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalViews = viewsAggregate.length > 0 ? viewsAggregate[0].totalViews : 0;
    
    // Views from the last week (estimated)
    const weeklyViews = Math.round(totalViews * 0.25); // Assume 25% of views are from last week
    
    // Get article counts by category for content distribution
    const categories = await Article.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const contentDistribution = categories.map(cat => ({
      category: cat._id || 'Uncategorized',
      count: cat.count
    }));
    
    // Newsletter statistics
    const totalNewsletters = await Newsletter.countDocuments();
    const newslettersSent = await Newsletter.countDocuments({ status: 'sent' });
    
    // Calculate subscriber count (mock data as we don't have a separate subscribers table)
    const newsletterSubscribers = Math.round(totalUsers * 0.7); // Assume 70% of users subscribe
    
    // Generate weekly activity data (mock data as we don't have real activity tracking)
    const weeklyActivity = [
      { day: 'Monday', articles: 5, users: 12, views: 145 },
      { day: 'Tuesday', articles: 7, users: 9, views: 156 },
      { day: 'Wednesday', articles: 3, users: 15, views: 187 },
      { day: 'Thursday', articles: 8, users: 11, views: 201 },
      { day: 'Friday', articles: 10, users: 18, views: 223 },
      { day: 'Saturday', articles: 4, users: 7, views: 190 },
      { day: 'Sunday', articles: 2, users: 5, views: 167 }
    ];
    
    // Return all stats
    res.json({
      users: {
        total: totalUsers,
        new: usersThisMonth,
        newThisWeek: newUsersThisWeek,
        active: activeUsers,
        admins,
        writers,
        regularUsers
      },
      articles: {
        total: totalArticles,
        published: publishedArticles,
        pending: pendingArticles,
        newThisWeek: newArticlesThisWeek
      },
      views: {
        total: totalViews,
        weekly: weeklyViews
      },
      newsletter: {
        subscribers: newsletterSubscribers,
        total: totalNewsletters,
        sent: newslettersSent
      },
      contentDistribution,
      userDistribution,
      contentStatus,
      weeklyActivity
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin statistics', error: error.message });
  }
});

// Get admin dashboard statistics
router.get('/stats/dashboard', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    
    const lastMonthStart = new Date(today);
    lastMonthStart.setDate(today.getDate() - 30);
    
    // User statistics
    const totalUsers = await User.countDocuments();
    
    // Users registered in the last week
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: lastWeekStart }
    });
    
    // Get user counts by role
    const roleBreakdown = {
      admin: await User.countDocuments({ role: 'admin' }),
      owner: await User.countDocuments({ role: 'owner' }),
      writer: await User.countDocuments({ role: 'writer' }),
      user: await User.countDocuments({ role: 'user' })
    };
    
    // Article statistics
    const totalArticles = await Article.countDocuments();
    
    // Article status breakdown
    const articleStatusCounts = {
      published: await Article.countDocuments({ status: 'published' }),
      pending: await Article.countDocuments({ status: 'pending' }),
      draft: await Article.countDocuments({ status: 'draft' })
    };
    
    // Articles created in last week
    const newArticlesThisWeek = await Article.countDocuments({
      createdAt: { $gte: lastWeekStart }
    });
    
    // Total views across all published articles
    const viewsAggregate = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalViews = viewsAggregate.length > 0 ? viewsAggregate[0].totalViews : 0;
    
    // Views from the last week (assuming we don't have date-specific view tracking)
    // In a real system, you would have a view history collection with timestamps
    const totalViewsThisWeek = Math.round(totalViews * 0.25); // Estimate: 25% of total views were from last week
    
    // Get top 5 articles by views
    const topArticlesByViews = await Article.find({ status: 'published' })
      .select('title views author createdAt likes')
      .populate('author', 'username name avatar')
      .sort({ views: -1 })
      .limit(5);
    
    // Get top 5 articles by likes
    const topArticlesByLikes = await Article.find({ status: 'published' })
      .select('title views author createdAt likes')
      .populate('author', 'username name avatar')
      .sort({ likes: -1 })
      .limit(5);
      
    // Get article counts by category
    const categories = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Format category data for frontend
    const contentDistribution = categories.map(cat => ({
      category: cat._id || 'Uncategorized',
      count: cat.count,
      percentage: Math.round((cat.count / articleStatusCounts.published) * 100)
    }));
    
    // Newsletter statistics
    const totalNewsletters = await Newsletter.countDocuments();
    const newslettersSent = await Newsletter.countDocuments({ status: 'Sent' });
    
    // Last newsletter sent
    const lastNewsletter = await Newsletter.findOne({ status: 'Sent' })
      .sort({ sentDate: -1 })
      .select('subject sentDate recipients openRate clickRate');
    
    // Calculate subscriber count - since we don't have a dedicated subscriber model,
    // we estimate based on total active users who might subscribe
    const subscriberPercentage = 0.72; // Assume 72% of users are newsletter subscribers
    const newsletterSubscribersCount = Math.round(totalUsers * subscriberPercentage);
    
    // Get recent activity (use notifications for this)
    const recentActivity = await Notification
      .find()
      .populate('by', 'username name avatar')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Weekly activity data for the chart
    // In a production system, you would track daily active users
    // Here we generate reasonable data based on total users
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyActivity = daysOfWeek.map(day => {
      // Generate a value between 25-50% of total users representing daily active users
      const activityPercentage = 0.25 + (Math.random() * 0.25);
      return {
        day,
        activeUsers: Math.round(totalUsers * activityPercentage)
      };
    });
    
    // Compute month-over-month growth rates
    // In a real system, this would come from historical data
    const growthStats = {
      users: {
        value: newUsersThisWeek,
        percentage: Math.round((newUsersThisWeek / totalUsers) * 100 * 4) // Monthly estimate
      },
      articles: {
        value: newArticlesThisWeek,
        percentage: Math.round((newArticlesThisWeek / totalArticles) * 100 * 4) // Monthly estimate
      },
      views: {
        value: totalViewsThisWeek,
        percentage: 15.3 // Placeholder
      },
      subscribers: {
        value: Math.round(totalUsers * 0.05), // New subscribers (5% of total users)
        percentage: 6.7 // Placeholder
      }
    };
    
    // Return comprehensive dashboard stats
    res.json({
      users: {
        total: totalUsers,
        newThisWeek: newUsersThisWeek,
        roleBreakdown,
        growthRate: growthStats.users.percentage
      },
      articles: {
        total: totalArticles,
        newThisWeek: newArticlesThisWeek,
        statusCounts: articleStatusCounts,
        growthRate: growthStats.articles.percentage,
        topByViews: topArticlesByViews,
        topByLikes: topArticlesByLikes
      },
      views: {
        total: totalViews,
        thisWeek: totalViewsThisWeek,
        growthRate: growthStats.views.percentage
      },
      newsletter: {
        subscribers: newsletterSubscribersCount,
        total: totalNewsletters,
        sent: newslettersSent,
        lastSent: lastNewsletter,
        growthRate: growthStats.subscribers.percentage
      },
      contentDistribution,
      recentActivity,
      weeklyActivity
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching admin statistics', error: error.message });
  }
});

// Get user statistics
router.get('/stats/users', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    
    // Basic user stats
    const totalUsers = await User.countDocuments();
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: lastWeekStart }
    });
    
    // User role distribution
    const roleDistribution = {
      admin: await User.countDocuments({ role: 'admin' }),
      owner: await User.countDocuments({ role: 'owner' }),
      writer: await User.countDocuments({ role: 'writer' }),
      user: await User.countDocuments({ role: 'user' })
    };
    
    // Most active users (by article count)
    // Get users with most articles
    const activeWriters = await Article.aggregate([
      { $group: { _id: '$author', articleCount: { $sum: 1 } } },
      { $sort: { articleCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Get user details for the active authors
    const activeWriterIds = activeWriters.map(writer => writer._id);
    const activeWriterDetails = await User.find({ 
      _id: { $in: activeWriterIds } 
    }).select('username name avatar');
    
    // Combine the article counts with user details
    const mostActiveUsers = activeWriters.map(writer => {
      const userDetail = activeWriterDetails.find(user => 
        user._id.toString() === writer._id.toString()
      );
      
      return {
        id: writer._id,
        username: userDetail?.username || 'Unknown',
        name: userDetail?.name || 'Unknown',
        avatar: userDetail?.avatar || '',
        articleCount: writer.articleCount
      };
    });
    
    // Top users by engagement (use article likes as proxy)
    const topLikedAuthors = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$author', totalLikes: { $sum: '$likes' } } },
      { $sort: { totalLikes: -1 } },
      { $limit: 5 }
    ]);
    
    const topAuthorIds = topLikedAuthors.map(author => author._id);
    const topAuthorDetails = await User.find({ 
      _id: { $in: topAuthorIds } 
    }).select('username name avatar');
    
    const topEngagementUsers = topLikedAuthors.map(author => {
      const userDetail = topAuthorDetails.find(user => 
        user._id.toString() === author._id.toString()
      );
      
      return {
        id: author._id,
        username: userDetail?.username || 'Unknown',
        name: userDetail?.name || 'Unknown',
        avatar: userDetail?.avatar || '',
        totalLikes: author.totalLikes
      };
    });
    
    // Recently registered users
    const recentUsers = await User.find()
      .select('username name email role createdAt avatar')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // User growth trends - get registrations by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format the user growth data for the frontend
    const userGrowthTrend = userGrowth.map(item => ({
      period: `${item._id.year}-${item._id.month}`,
      count: item.count
    }));
    
    const registrationTrends = {
      labels: userGrowthTrend.map(item => item.period),
      data: userGrowthTrend.map(item => item.count)
    };
    
    res.json({
      total: totalUsers,
      newThisWeek: newUsersThisWeek,
      roleDistribution,
      mostActiveUsers,
      topEngagementUsers,
      recentUsers,
      registrationTrends
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
});

// Get article statistics
router.get('/stats/articles', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    
    // Basic article stats
    const totalArticles = await Article.countDocuments();
    const newArticlesThisWeek = await Article.countDocuments({
      createdAt: { $gte: lastWeekStart }
    });
    
    // Article status breakdown
    const statusCounts = {
      published: await Article.countDocuments({ status: 'published' }),
      pending: await Article.countDocuments({ status: 'pending' }),
      draft: await Article.countDocuments({ status: 'draft' })
    };
    
    // Get top articles by views
    const topByViews = await Article.find({ status: 'published' })
      .select('title views author createdAt likes category')
      .populate('author', 'username name avatar')
      .sort({ views: -1 })
      .limit(10);
      
    // Get top articles by likes
    const topByLikes = await Article.find({ status: 'published' })
      .select('title likes author createdAt views category')
      .populate('author', 'username name avatar')
      .sort({ likes: -1 })
      .limit(10);
    
    // Articles by category
    const categories = await Article.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const categoryDistribution = categories.map(cat => ({
      category: cat._id || 'Uncategorized',
      count: cat.count
    }));
    
    // Recent articles
    const recentArticles = await Article.find()
      .select('title status author createdAt category views likes')
      .populate('author', 'username name avatar')
      .sort({ createdAt: -1 })
      .limit(15);
    
    // Article publication trends - by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const articleGrowth = await Article.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format the article growth data for the frontend
    const articleGrowthTrend = articleGrowth.map(item => ({
      period: `${item._id.year}-${item._id.month}`,
      count: item.count
    }));
    
    // Get engagement metrics
    const totalViews = await Article.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    
    const totalLikes = await Article.aggregate([
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]);
    
    // Calculate average word count (mock data since we don't store word count)
    const avgWordCount = 1200; // Mock data
    
    const commentCounts = await Comment.countDocuments();
    
    const engagementMetrics = {
      views: totalViews.length > 0 ? totalViews[0].total : 0,
      likes: totalLikes.length > 0 ? totalLikes[0].total : 0,
      comments: commentCounts,
      avgWordCount
    };
    
    // Calculate pending review metrics
    const pendingArticles = await Article.find({ status: 'pending' })
      .select('title author createdAt')
      .populate('author', 'username name')
      .sort({ createdAt: 1 }) // Oldest first
      .limit(5);
      
    const oldestPendingDate = pendingArticles.length > 0 
      ? pendingArticles[0].createdAt 
      : null;
    
    const avgWaitTime = oldestPendingDate
      ? Math.round((today - new Date(oldestPendingDate)) / (1000 * 60 * 60 * 24)) // days
      : 0;
    
    const reviewMetrics = {
      pending: statusCounts.pending,
      oldestPending: oldestPendingDate,
      avgWaitTime,
      pendingList: pendingArticles
    };
    
    res.json({
      total: totalArticles,
      newThisWeek: newArticlesThisWeek,
      statusCounts,
      categoryDistribution,
      topByViews,
      topByLikes,
      recentArticles,
      publicationTrends: {
        labels: articleGrowthTrend.map(item => item.period),
        data: articleGrowthTrend.map(item => item.count)
      },
      engagement: engagementMetrics,
      reviewStats: reviewMetrics
    });
  } catch (error) {
    console.error('Error fetching article stats:', error);
    res.status(500).json({ message: 'Error fetching article statistics', error: error.message });
  }
});

// Get newsletter statistics
router.get('/stats/newsletter', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    // Basic newsletter stats
    const totalNewsletters = await Newsletter.countDocuments();
    const sentNewsletters = await Newsletter.countDocuments({ status: 'Sent' });
    const draftNewsletters = await Newsletter.countDocuments({ status: 'Draft' });
    
    // Calculate subscriber count based on total users
    // Since we don't have a dedicated subscriber model
    const totalUsers = await User.countDocuments();
    const subscriberPercentage = 0.72; // Estimate: 72% of users are subscribed
    const totalSubscribers = Math.round(totalUsers * subscriberPercentage);
    
    // Last sent newsletter
    const lastSent = await Newsletter.findOne({ status: 'Sent' })
      .sort({ sentDate: -1 })
      .populate('createdBy', 'username name avatar')
      .select('subject content sentDate recipients openRate clickRate createdBy');
      
    // Recent newsletters
    const recentNewsletters = await Newsletter.find()
      .populate('createdBy', 'username name avatar')
      .sort({ createdAt: -1 })
      .limit(10);
      
    // Performance metrics averages - using existing newsletter data
    const performanceMetrics = await Newsletter.aggregate([
      { $match: { status: 'Sent' } },
      {
        $group: {
          _id: null,
          avgRecipients: { $avg: '$recipients' },
          // openRate and clickRate are stored as strings with % - need to convert
          newsletters: { $push: { openRate: '$openRate', clickRate: '$clickRate' } }
        }
      }
    ]);
    
    // Process the string percentages to get numeric averages
    let avgOpenRate = 0;
    let avgClickRate = 0;
    
    if (performanceMetrics.length > 0) {
      // Extract numeric values from percentage strings
      const openRates = performanceMetrics[0].newsletters.map(n => 
        parseFloat(n.openRate?.replace('%', '') || 0)
      );
      
      const clickRates = performanceMetrics[0].newsletters.map(n => 
        parseFloat(n.clickRate?.replace('%', '') || 0)
      );
      
      // Calculate averages
      avgOpenRate = openRates.length > 0 
        ? openRates.reduce((sum, rate) => sum + rate, 0) / openRates.length
        : 0;
        
      avgClickRate = clickRates.length > 0
        ? clickRates.reduce((sum, rate) => sum + rate, 0) / clickRates.length
        : 0;
    }
    
    // Generate monthly newsletter sends - for growth trend chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const newsletterGrowth = await Newsletter.aggregate([
      { $match: { status: 'Sent', sentDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$sentDate' }, 
            month: { $month: '$sentDate' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format growth data for frontend
    const sendTrend = newsletterGrowth.map(item => ({
      period: `${item._id.year}-${item._id.month}`,
      count: item.count
    }));
    
    // Placeholder for subscriber growth (since we don't track this)
    // In a real system, you'd track subscriber history
    const subscriberGrowth = [
      { period: '2023-7', count: Math.round(totalSubscribers * 0.85) },
      { period: '2023-8', count: Math.round(totalSubscribers * 0.87) },
      { period: '2023-9', count: Math.round(totalSubscribers * 0.9) },
      { period: '2023-10', count: Math.round(totalSubscribers * 0.93) }, 
      { period: '2023-11', count: Math.round(totalSubscribers * 0.97) },
      { period: '2023-12', count: totalSubscribers }
    ];
    
    res.json({
      totals: {
        newsletters: totalNewsletters,
        sent: sentNewsletters,
        draft: draftNewsletters,
        subscribers: totalSubscribers
      },
      performance: {
        avgRecipients: performanceMetrics.length > 0 ? Math.round(performanceMetrics[0].avgRecipients) : 0,
        avgOpenRate: avgOpenRate.toFixed(1),
        avgClickRate: avgClickRate.toFixed(1)
      },
      lastSent,
      recentNewsletters,
      trends: {
        sends: {
          labels: sendTrend.map(item => item.period),
          data: sendTrend.map(item => item.count)
        },
        subscribers: {
          labels: subscriberGrowth.map(item => item.period),
          data: subscriberGrowth.map(item => item.count)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching newsletter stats:', error);
    res.status(500).json({ message: 'Error fetching newsletter statistics', error: error.message });
  }
});

// Create new user (admin only)
router.post('/users', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'User with this email already exists' });
      } else {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Create new user
    const user = new User({
      name,
      username,
      email,
      password, // Note: Password will be hashed by the User model's pre-save hook
      role: role || 'user' // Make sure we use lowercase role to match schema enum
    });

    await user.save();

    // Return user without password
    const userResponse = {
      id: user._id,
      name: user.name || '',
      username: user.username, // Include the username in response
      email: user.email,
      role: user.role,
      registrationDate: user.createdAt,
      status: 'Active',
      articles: 0,
      lastLogin: user.createdAt,
      avatar: user.avatar || ''
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

module.exports = router; 