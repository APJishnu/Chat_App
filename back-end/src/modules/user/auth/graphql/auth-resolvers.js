import { generateToken } from '../../../../utils/jwt-token.js';
import AuthController from '../controller/auth-controller.js';

const authResolvers = {
  Query: {},
  Mutation: {
    createUser: async (_, { input }) => {
      const response = await AuthController.createUser(input);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message);
    },

    loginUser: async (_, { input }) => {
      const user = await AuthController.loginUser(input);
      if (user) {
        const token = generateToken(user);
        return { token, user };
      }
      throw new Error("Invalid phone number or password");
    },

  },

};

export default authResolvers;
