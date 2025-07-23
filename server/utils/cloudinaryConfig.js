const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Utility function to upload base64 image to Cloudinary
const uploadBase64Image = async (base64String, folder = 'articles') => {
  try {
    // Remove base64 prefix if present
    const base64WithoutPrefix = base64String.includes('base64,') 
      ? base64String.split('base64,')[1] 
      : base64String;
    
    // Configure transformation
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64WithoutPrefix}`, {
      folder,
      transformation: [
        { width: 1280, height: 720, crop: 'limit' }, // Max resolution 720p
        { fetch_format: 'webp' }  // Convert to webp
      ]
    });
    
    return result;
  } catch (error) {
    console.error('Error uploading to cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

// Configure avatar upload (1:1 ratio)
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // 1:1 ratio
      { fetch_format: 'webp' }
    ]
  }
});

// Configure banner upload (16:9 ratio)
const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1280, height: 720, crop: 'fill' }, // 16:9 ratio
      { fetch_format: 'webp' }
    ]
  }
});

// Configure article image upload
const articleImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'articles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [
      { width: 1280, height: 720, crop: 'limit' }, // Max resolution 720p
      { fetch_format: 'webp' }
    ]
  }
});

// Create multer upload instances
const uploadAvatar = multer({ storage: avatarStorage });
const uploadBanner = multer({ storage: bannerStorage });
const uploadArticleImage = multer({ storage: articleImageStorage });

module.exports = {
  cloudinary,
  uploadBase64Image,
  uploadAvatar,
  uploadBanner,
  uploadArticleImage
}; 