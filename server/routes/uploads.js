const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { uploadBase64Image, uploadAvatar, uploadBanner, uploadArticleImage } = require('../utils/cloudinaryConfig');

// Handle base64 image upload
router.post('/base64', auth, async (req, res) => {
  try {
    const { image, folder = 'articles' } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }
    
    const result = await uploadBase64Image(image, folder);
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Upload avatar (1:1 ratio)
router.post('/avatar', auth, uploadAvatar.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No avatar image provided' });
    }
    
    res.json({
      url: req.file.path,
      originalname: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Error uploading avatar', error: error.message });
  }
});

// Upload banner (16:9 ratio)
router.post('/banner', auth, uploadBanner.single('banner'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No banner image provided' });
    }
    
    res.json({
      url: req.file.path,
      originalname: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ message: 'Error uploading banner', error: error.message });
  }
});

// Upload article image
router.post('/article-image', auth, uploadArticleImage.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }
    
    res.json({
      success: 1,
      file: {
        url: req.file.path,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading article image:', error);
    res.status(500).json({ 
      success: 0,
      message: 'Error uploading image', 
      error: error.message 
    });
  }
});

module.exports = router; 