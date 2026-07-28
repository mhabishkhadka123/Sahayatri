/**
 * Cloudinary utility for photo uploads.
 * 
 * TODO: Set these in your .env file:
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 * 
 * Get credentials from: https://cloudinary.com/console
 */

import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';

// Configure Cloudinary if credentials are available
if (config.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  console.info('☁️  Cloudinary configured successfully');
} else {
  console.info(
    '☁️  Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env'
  );
}

/**
 * Upload a file buffer to Cloudinary.
 * 
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary.
 * 
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!config.cloudinary.isConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};
