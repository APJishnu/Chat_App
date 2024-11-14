import { gql } from "apollo-server-express";

const authTypeDefs = gql`
  scalar Upload

  type UserResponse {
    id: ID!
    firstName: String!
    lastName: String!
    userName: String!
    email: String!
    phoneNumber: String!
    profileImage: String
  }
  type LoginResponse {
    token: String
    user: UserResponse
  }

  input RegisterInput {
    firstName: String!
    lastName: String!
    userName: String!
    phoneNumber: String!
    email: String!
    password: String!
    confirmPassword: String!
  }

  input LoginInput {
    phoneNumber: String!
    password: String!
  }


  type Mutation {
    createUser(input: RegisterInput): UserResponse!
    loginUser(input: LoginInput): LoginResponse
  }
`;

export default authTypeDefs;
