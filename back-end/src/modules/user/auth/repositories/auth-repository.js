import { prisma } from "../../../../../prisma/client.js";

class AuthRepository {
  static async createUser(input) {
    try {
      const newUser = await prisma.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          userName: input.userName,
          phoneNumber: input.phoneNumber,
          email: input.email,
          profileImage: input.profileImage,
          password: input.password,
        },
      });
      return newUser;
    } catch (error) {
      console.error("Error saving user:", error);
      throw new Error("Failed to save user to the database");
    }
  }

  static async findUserByPhoneNumber(phoneNumber) {
    try {
      return await prisma.user.findUnique({
        where: { phoneNumber },
      });
    } catch (error) {
      console.error("Error finding user:", error);
      throw new Error("User not found");
    }
  }
}

export default AuthRepository;
