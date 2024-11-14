// src/modules/chat/controller/chat-controller.js

import ChatRepository from '../repositories/chat-repository.js';

class ChatController {

  static async getUsers() {
    try {
      // This should return the list of users from the database
      const users = await ChatRepository.getUsers();
      return users;
    } catch (error) {
      console.error('Error in getting users:', error);
      throw new Error('Failed to retrieve users');
    }
  }
  
  static async getMessages(userId, recipientId) {
    try {
      const messages = await ChatRepository.getMessages(userId, recipientId);
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

  static async sendMessage(text, senderId, recipientId) {
    try {
      const newMessage = await ChatRepository.saveMessage(text, senderId, recipientId);
      return {
        success: true,
        message: 'Message sent successfully',
        data: newMessage,
      };
    } catch (error) {
      console.error('Error in sending message:', error);
      return {
        success: false,
        message: 'Failed to send message',
        data: null,
      };
    }
  }
}

export default ChatController;
