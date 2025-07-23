// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const commentRoutes = require('./routes/comments');
const uploadRoutes = require('./routes/uploads');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletters');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const { auth, authorize } = require('./middleware/auth');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const Article = require('./models/Article');

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' })); // Increase payload limit for base64 images
app.use(cookieParser());

// CORS configuration with improved cookie handling
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie']
}));

// Cookie security middleware
app.use((req, res, next) => {
  // Set secure headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletters', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Database stats endpoint
app.get('/api/database/stats', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    // Mock database stats for demonstration
    const stats = [
      {
        name: 'Users',
        rows: await User.countDocuments(),
        size: '0.5MB',
        lastModified: new Date().toISOString().split('T')[0]
      },
      {
        name: 'Articles',
        rows: await Article.countDocuments(),
        size: '1.2MB',
        lastModified: new Date().toISOString().split('T')[0]
      },
      {
        name: 'Comments',
        rows: 120,
        size: '0.3MB',
        lastModified: new Date().toISOString().split('T')[0]
      }
    ];
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ message: 'Error fetching database stats' });
  }
});

// Newsletter endpoints
app.get('/api/newsletters', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    // Mock newsletter data
    const newsletters = [
      {
        id: 1,
        subject: 'July Updates',
        sentDate: '2023-07-15',
        recipients: 1250,
        openRate: '62%',
        clickRate: '18%',
        status: 'Sent'
      },
      {
        id: 2,
        subject: 'August Announcements',
        sentDate: '2023-08-01',
        recipients: 1340,
        openRate: '58%',
        clickRate: '15%',
        status: 'Sent'
      },
      {
        id: 3,
        subject: 'September Preview',
        sentDate: '',
        recipients: 0,
        openRate: '0%',
        clickRate: '0%',
        status: 'Draft'
      }
    ];
    
    res.json(newsletters);
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ message: 'Error fetching newsletters' });
  }
});

// User profile update route
app.put('/api/users/profile', auth, async (req, res) => {
  try {
    const { username, name, bio, title, avatar } = req.body;
    const userId = req.user._id;

    // Find user and update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, name, bio, title, avatar },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new token with updated user info
    const token = jwt.sign(
      { userId: updatedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set HTTP-only cookie with the new token
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Return the updated user and new token
    res.json({ 
      user: updatedUser,
      token 
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// User password update route
app.put('/api/users/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real app, you would verify the current password
    // and hash the new password before saving
    // This is a simplified version
    
    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
});

// User notification settings route
app.put('/api/users/notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // In a real app, you would store these settings in the user model
    // For now, we'll just acknowledge the request
    
    res.json({ message: 'Notification settings updated' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Error updating notification settings', error: error.message });
  }
});

// User statistics route
app.get('/api/users/statistics', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Mock statistics data
    // In a real app, you would calculate these from the database
    const statistics = {
      totalArticles: 5,
      totalViews: 1250,
      totalLikes: 47,
      totalComments: 23
    };
    
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Protected route example
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'Protected route accessed successfully', user: req.user });
});

// Writer-only route example
app.post('/api/articles', auth, authorize('writer', 'admin'), (req, res) => {
  res.json({ message: 'Writer/admin only route' });
});

// Admin-only route example
app.delete('/api/articles/:id', auth, authorize('admin'), (req, res) => {
  res.json({ message: 'Admin only route' });
});

// User management API endpoints
app.get('/api/users', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    // Format for admin panel
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name || user.username,
      email: user.email,
      role: user.role,
      registrationDate: user.createdAt.toISOString().split('T')[0],
      status: user.emailVerified ? 'Active' : 'Pending',
      articles: 0, // Would be calculated in a real app
      lastLogin: user.lastSeen || user.createdAt.toISOString().split('T')[0],
      avatar: user.avatar || ''
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Promote a user
app.put('/api/users/:id/promote', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent promoting an already admin user
    if (user.role === 'admin' || user.role === 'owner') {
      return res.status(400).json({ 
        message: `User is already an ${user.role}`,
        role: user.role,
        name: user.name || user.username
      });
    }

    // Determine promotion path: user -> writer -> admin
    let newRole = 'writer';
    if (user.role === 'writer') {
      newRole = 'admin';
    }

    // Update user role
    user.role = newRole;
    await user.save();
    
    res.json({ 
      message: `User promoted to ${newRole}`,
      role: newRole,
      name: user.name || user.username
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ message: 'Error promoting user', error: error.message });
  }
});

// Demote a user
app.put('/api/users/:id/demote', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent demoting an owner
    if (user.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Cannot demote an owner' });
    }

    // Determine demotion path: admin -> writer -> user
    let newRole = 'writer';
    if (user.role === 'writer') {
      newRole = 'user';
    } else if (user.role === 'user') {
      return res.status(400).json({ 
        message: 'User already has minimum role',
        role: user.role,
        name: user.name || user.username
      });
    }

    // Update user role
    user.role = newRole;
    await user.save();
    
    res.json({ 
      message: `User demoted to ${newRole}`,
      role: newRole,
      name: user.name || user.username
    });
  } catch (error) {
    console.error('Error demoting user:', error);
    res.status(500).json({ message: 'Error demoting user', error: error.message });
  }
});

// Delete a user
app.delete('/api/users/:id', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Find and delete the user
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Additional cleanup that would be done in a real app
    // - Delete user's articles or reassign them
    // - Delete user's comments or anonymize them
    // - Remove user from any associations

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Bulk update users
app.put('/api/users/bulk-update', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { userIds, updates } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'No users specified for update' });
    }

    // Prevent self-role-demotion
    if (updates.role && updates.role !== 'admin' && updates.role !== 'owner') {
      if (userIds.includes(req.user._id.toString())) {
        return res.status(400).json({ message: 'Cannot demote yourself' });
      }
    }

    // Apply updates to all specified users
    const updatePromises = userIds.map(async (userId) => {
      const user = await User.findById(userId);
      if (!user) return null;
      
      // Skip updating owners unless the requester is also an owner
      if (user.role === 'owner' && req.user.role !== 'owner') {
        return null;
      }
      
      // Apply the updates
      Object.keys(updates).forEach(key => {
        if (key !== 'password') { // Don't bulk update passwords
          user[key] = updates[key];
        }
      });
      
      return user.save();
    });

    // Wait for all updates to complete
    const updatedUsers = await Promise.all(updatePromises);
    const successCount = updatedUsers.filter(user => user !== null).length;
    
    res.json({ 
      message: `Updated ${successCount} users successfully`,
      updatedCount: successCount
    });
  } catch (error) {
    console.error('Error bulk updating users:', error);
    res.status(500).json({ message: 'Error updating users', error: error.message });
  }
});

// Article management endpoints
app.get('/api/articles', auth, authorize('admin'), async (req, res) => {
  try {
    const articles = await Article.find()
      .populate('author', 'username name')
      .sort({ createdAt: -1 });
    
    // Format for admin panel
    const formattedArticles = articles.map(article => ({
      id: article._id,
      title: article.title,
      author: article.author ? (article.author.name || article.author.username) : 'Unknown',
      publishDate: article.createdAt.toISOString().split('T')[0],
      status: article.status,
      views: article.views || 0,
      category: article.category || 'Uncategorized',
      wordCount: article.content ? article.content.length / 5 : 0
    }));
    
    res.json(formattedArticles);
  } catch (error) {
    console.error('Error fetching articles for admin:', error);
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
});

// Approve article
app.post('/api/articles/:articleId/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Update status to published
    article.status = 'published';
    await article.save();
    
    res.json({
      id: article._id,
      status: article.status,
      message: 'Article approved and published'
    });
  } catch (error) {
    console.error('Error approving article:', error);
    res.status(500).json({ message: 'Error approving article', error: error.message });
  }
});

// Reject article
app.post('/api/articles/:articleId/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const { articleId } = req.params;
    const { reason } = req.body;
    
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // In a real app, you might add feedback or rejection reason to the article
    // For now, just change status back to draft
    article.status = 'draft';
    await article.save();
    
    res.json({
      id: article._id,
      status: article.status,
      message: 'Article rejected and moved back to drafts',
      reason: reason || 'No reason provided'
    });
  } catch (error) {
    console.error('Error rejecting article:', error);
    res.status(500).json({ message: 'Error rejecting article', error: error.message });
  }
});

app.put('/api/articles/:id/approve', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;

    // Find the article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Prevent self-approval for non-admins
    if (article.author && article.author.toString() === req.user._id.toString() && 
        req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Cannot approve your own article' });
    }

    // Update article status
    article.status = 'published';
    article.publishedAt = new Date();
    await article.save();

    res.json({ 
      message: 'Article approved and published',
      articleId: article._id,
      status: article.status
    });
  } catch (error) {
    console.error('Error approving article:', error);
    res.status(500).json({ message: 'Error approving article', error: error.message });
  }
});

app.put('/api/articles/:id/reject', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;

    // Find the article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Update article status
    article.status = 'rejected';
    await article.save();

    res.json({ 
      message: 'Article rejected',
      articleId: article._id,
      status: article.status
    });
  } catch (error) {
    console.error('Error rejecting article:', error);
    res.status(500).json({ message: 'Error rejecting article', error: error.message });
  }
});

app.put('/api/articles/bulk-update', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { articleIds, updates } = req.body;
    
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({ message: 'No articles specified for update' });
    }

    // Check for self-approval if updating status to published
    if (updates.status === 'published' && req.user.role !== 'admin' && req.user.role !== 'owner') {
      const userArticles = await Article.find({
        _id: { $in: articleIds },
        author: req.user._id
      });
      
      if (userArticles.length > 0) {
        return res.status(403).json({ message: 'Cannot approve your own articles' });
      }
    }

    // Apply updates to all specified articles
    const updatePromises = articleIds.map(async (articleId) => {
      const article = await Article.findById(articleId);
      if (!article) return null;
      
      // Apply the updates
      Object.keys(updates).forEach(key => {
        article[key] = updates[key];
      });
      
      // Set publish date if publishing
      if (updates.status === 'published' && !article.publishedAt) {
        article.publishedAt = new Date();
      }
      
      return article.save();
    });

    // Wait for all updates to complete
    const updatedArticles = await Promise.all(updatePromises);
    const successCount = updatedArticles.filter(article => article !== null).length;
    
    res.json({ 
      message: `Updated ${successCount} articles successfully`,
      updatedCount: successCount
    });
  } catch (error) {
    console.error('Error bulk updating articles:', error);
    res.status(500).json({ message: 'Error updating articles', error: error.message });
  }
});

// Newsletter send endpoint
app.post('/api/newsletters/:id/send', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, you would find the newsletter in the database
    // and trigger an email sending service

    res.json({
      id,
      status: 'Sent',
      sentDate: new Date().toISOString().split('T')[0],
      recipients: Math.floor(Math.random() * 2000) + 500,
      message: 'Newsletter scheduled for delivery'
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ message: 'Error sending newsletter', error: error.message });
  }
});

// Create newsletter
app.post('/api/newsletters', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { subject, content } = req.body;
    
    // In a real app, you would save this to the database
    // For mock purposes, we'll return a generated newsletter
    const newNewsletter = {
      id: Date.now(),
      subject,
      content,
      sentDate: '',
      recipients: 0,
      openRate: '0%',
      clickRate: '0%',
      status: 'Draft'
    };
    
    res.status(201).json(newNewsletter);
  } catch (error) {
    console.error('Error creating newsletter:', error);
    res.status(500).json({ message: 'Error creating newsletter', error: error.message });
  }
});

// Test auth route - useful for debugging
app.get('/api/auth/test', (req, res) => {
  const token = req.cookies.token || 
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  
  res.json({ 
    message: 'Auth test route',
    hasCookie: !!req.cookies.token,
    hasAuthHeader: !!(req.headers.authorization && req.headers.authorization.includes('Bearer')),
    cookieNames: Object.keys(req.cookies),
    tokenExists: !!token
  });
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = new Post({ title, content });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    env: process.env.NODE_ENV || 'development'
  });
});

// CORS test route
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin || 'No origin header',
    host: req.headers.host,
    referer: req.headers.referer || 'No referer header',
    cookies: req.cookies,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

if (process.env.VERCEL !== '1') {
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS allowing all origins with credentials`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
}

module.exports = app;
