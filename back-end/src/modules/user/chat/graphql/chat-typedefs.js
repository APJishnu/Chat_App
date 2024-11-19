import { gql } from "apollo-server-express";

const chatTypeDefs = gql`
  directive @defer on FIELD
  directive @stream(initialCount: Int) on FIELD_DEFINITION
  scalar Upload

  enum MessageType {
    TEXT
    IMAGE
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    userName: String!
    email: String!
    phoneNumber: String!
    profileImage: String 
  }

  type Message {
    id: Int
    text: String
    imageUrl: String
    audioUrl:String
    type: MessageType
    timestamp: String
    senderId:Int
    recipientId:Int 
  }

  type Query {
    getMessages(recipientId: Int!): [Message] @stream(initialCount: 10)
    getUsers: [User]
    getUser(userName: String!): User
  }

  type Mutation {
    sendMessage(text: String, image: Upload , audio: Upload  , recipientId: Int!): Message
  }

  type Subscription {
    messageSent(recipientId: Int!): Message
  }
`;

export default chatTypeDefs;
