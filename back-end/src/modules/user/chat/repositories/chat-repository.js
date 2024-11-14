// src/modules/chat/repositories/chat-repository.js

import { prisma } from "../../../../../prisma/client.js";

function formatMessage(message, currentUserId) {
  return {
    ...message,
    isCurrentUser: message.senderId === currentUserId,
    timestamp: message.timestamp.toISOString(), // Format timestamp as ISO string
  };
}

class ChatRepository {
  static async getUsers() {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          userName: true,
        },
      });
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users from the database");
    }
  }

  static async getMessages(userId, recipientId) {
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: recipientId },
            { senderId: recipientId, recipientId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
            },
          },
          recipient: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      // Format each message using formatMessage helper
      const formattedMessages = messages.map((message) => formatMessage(message, userId));

      return formattedMessages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw new Error("Failed to fetch messages from the database");
    }
  }

  static async saveMessage(text, senderId, recipientId) {
    try {
      const newMessage = await prisma.message.create({
        data: {
          text,
          senderId,
          recipientId,
        },
        include: {
          sender: { select: { id: true, userName: true, profileImage: true } },
          recipient: { select: { id: true, userName: true, profileImage: true } },
        },
      });

      // Format the new message using formatMessage helper
      return formatMessage(newMessage, senderId);
    } catch (error) {
      console.error("Error saving message:", error);
      throw new Error("Failed to save message to the database");
    }
  }

  static async getUserByUsername(userName) {
    try {
      const user = await prisma.user.findUnique({
        where: { userName },
        select: {
          id: true,
          userName: true,
          profileImage: true,
        },
      });
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user from the database");
    }
  }
}

export default ChatRepository;
