// src/modules/chat/controller/chat-controller.js
import ChatRepository from '../repositories/chat-repository.js';
import cloudinary from 'cloudinary';
import { Readable } from 'stream';
import crypto from 'crypto';


// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// Encryption and Decryption utilities
const encryptionKey = process.env.ENCRYPTION_KEY;
console.log(encryptionKey) 
const iv = crypto.randomBytes(16);
function encrypt(text) {
  try {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + encrypted;
  } catch (error) {
    console.error("Encryption Error:", error);
    throw error;
  }
}

function decrypt(encryptedText) {
  try {
    const ivHex = encryptedText.substring(0, 32);
    const encryptedMessage = encryptedText.substring(32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption Error:", error);
    throw error;
  }
}


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
      messages.forEach(message => {
        if (message.imageUrl) {
          message.imageUrl = decrypt(message.imageUrl);
        }
        if (message.audioUrl) {
          message.audioUrl = decrypt(message.audioUrl);
        }
      });
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

  static async uploadToCloudinary(file, folder = "chat_files") {
    try {
      if (!file) throw new Error("No file provided");
  
      const { createReadStream, mimetype } = await file;
  
      const isAudio = mimetype.startsWith("audio/");
      const isImage = mimetype.startsWith("image/");
      if (!isImage && !isAudio) {
        throw new Error("File must be an image or audio");
      }
  
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            folder,
            resource_type: "auto", // Automatically detect file type
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
  
        const fileStream = createReadStream();
        fileStream.pipe(uploadStream);
  
        fileStream.on("error", (error) => reject(error));
        uploadStream.on("error", (error) => reject(error));
      });
  
      return await uploadPromise;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }
  
  static async sendMessage(text, image, audio, senderId, recipientId) {
    try {
      if (!text && !image && !audio) {
        throw new Error("Message must contain text, image, or audio");
      }
  
      let imageUrl = null;
      let audioUrl = null;
  
      if (image) {
        imageUrl = await ChatController.uploadToCloudinary(image, "chat_images");
        imageUrl = encrypt(imageUrl); // Encrypt image URL
       
      }
  
      if (audio) {
        audioUrl = await ChatController.uploadToCloudinary(audio, "chat_audios");
        audioUrl = encrypt(audioUrl); // Encrypt audio URL
      }
  
      const newMessage = await ChatRepository.saveMessage(text, imageUrl, audioUrl, senderId, recipientId);

   
        if ( newMessage.imageUrl) {
          newMessage.imageUrl = decrypt(newMessage.imageUrl);
        }
        if (newMessage.audioUrl) {
          newMessage.audioUrl = decrypt(newMessage.audioUrl);
      
        }
  
      return {
        success: true,
        message: "Message sent successfully",
        data: newMessage,
      };
    } catch (error) {
      console.error("Error in sending message:", error);
      return {
        success: false,
        message: error.message || "Failed to send message",
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