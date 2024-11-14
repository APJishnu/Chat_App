// src/modules/chat/graphql/typeDefs.js

import { gql } from "apollo-server-express";

const chatTypeDefs = gql`

  directive @defer on FIELD
  directive @stream on FIELD_DEFINITION

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
    timestamp: String
    sender: User
    recipient: User
  }


  type Query {
    getMessages(recipientId: Int!): [Message] @stream
    getUsers: [User] 
    getUser(userName: String!): User
  }

  type Mutation {
    sendMessage(text: String!, recipientId: Int!): Message
  }

  type Subscription {
    messageSent(recipientId: Int!): Message
  }
`;

export default chatTypeDefs;
