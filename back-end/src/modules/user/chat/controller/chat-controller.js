// src/modules/chat/controller/chat-controller.js
import ChatRepository from '../repositories/chat-repository.js';
import cloudinary from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class ChatController {
  static async getUsers() {
    try {
      const users = await ChatRepository.getUsers();
      return users;
    } catch (error) {
      console.error('Error in getting users:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  static async getMessages(userId, recipientId, offset, limit) {
    try {
      const messages = await ChatRepository.getMessages(userId, recipientId, offset, limit);
      return {
        success: true,
        message: 'Messages retrieved successfully',
        data: messages,
      };
    } catch (error) {
      console.error('Error in getting messages:', error);
      return {
        success: false,
        message: 'Failed to retrieve messages',
        data: [],
      };
    }
  }

  static async uploadToCloudinary(file) {
    try {
      // First, ensure we have a file
      if (!file) throw new Error('No file provided');

      const { createReadStream, filename, mimetype } = await file;
      
      // Validate file type if needed
      if (!mimetype.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Create upload promise
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            folder: 'chat_images',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );

        // Pipe the file stream to the upload stream
        const fileStream = createReadStream();
        fileStream.pipe(uploadStream);

        // Handle stream errors
        fileStream.on('error', (error) => reject(error));
        uploadStream.on('error', (error) => reject(error));
      });

      return await uploadPromise;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  static async sendMessage(text, image, senderId, recipientId) {
    try {
      // Check if either text or image exists
      if (!text && !image) {
        throw new Error("Message must contain either text or image");
      }

      let imageUrl = null;

      // Upload image to Cloudinary if it exists
      if (image) {
        try {
          imageUrl = await ChatController.uploadToCloudinary(image);
        } catch (uploadError) {
          console.error('Error uploading to Cloudinary:', uploadError);
          throw new Error('Failed to upload image');
        }
      }

      // Save message with text and/or image URL to database
      const newMessage = await ChatRepository.saveMessage(text, imageUrl, senderId, recipientId);
      
      return {
        success: true,
        message: 'Message sent successfully',
        data: newMessage,
      };
    } catch (error) {
      console.error('Error in sending message:', error);
      return {
        success: false,
        message: error.message || 'Failed to send message',
        data: null,
      };
    }
  }


  // Optional: Method to delete image from Cloudinary
  static async deleteCloudinaryImage(imageUrl) {
    try {
      if (!imageUrl) return true;
      
      const publicId = `chat_images/${imageUrl.split('/').pop().split('.')[0]}`;
      await cloudinary.v2.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      return false;
    }
  }
}

export default ChatController;