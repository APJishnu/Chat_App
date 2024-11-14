import ChatController from '../controller/chat-controller.js';
import { PubSub } from 'graphql-subscriptions';
import ChatRepository from '../repositories/chat-repository.js';

const pubsub = new PubSub();

const CHAT_CHANNEL = 'CHAT_CHANNEL';

const chatResolvers = {
  Query: {
    getMessages: async (_, { recipientId }, { userId }) => {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const response = await ChatController.getMessages(userId, recipientId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message);
    },
    getUsers: async () => {
      return ChatController.getUsers();
    },
    getUser: async (_, { userName }) => {
      const user = await ChatRepository.getUserByUsername(userName);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },
  },
  
  Mutation: {
    sendMessage: async (_, { text, recipientId }, { userId }) => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const response = await ChatController.sendMessage(text, userId, recipientId);
      
      if (response.success) {
        const message = response.data;
        // Publish to a single channel with payload containing all necessary info
        pubsub.publish(CHAT_CHANNEL, {
          messageSent: {
            ...message,
            channelId: `${userId}:${recipientId}`
          }
        });
        return message;
      }
      throw new Error(response.message);
    },
  },

  Subscription: {
    messageSent: {
      subscribe: async function* (_, { recipientId }, { userId }) {
        if (!userId) {
          throw new Error("User not authenticated for subscription");
        }

        // Create filter function to handle message routing
        const filter = (payload) => {
          const { channelId } = payload.messageSent;
          const [senderId, receiverId] = channelId.split(':');
          return (
            (senderId === userId.toString() && receiverId === recipientId.toString()) ||
            (senderId === recipientId.toString() && receiverId === userId.toString())
          );
        };

        // Subscribe to the main channel and yield messages that pass the filter
        const iterator = pubsub.asyncIterator([CHAT_CHANNEL]);
        for await (const payload of iterator) {
          if (filter(payload)) {
            yield payload;
          }
        }
      }
    }
  }
};

export default chatResolvers;