import AuthRepository from '../repositories/auth-repository.js';
import bcrypt from 'bcrypt';

class AuthController {
  static async createUser(input) {
    try {

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const newUser = await AuthRepository.createUser({...input,password: hashedPassword,});
      return {
        success: true,
        message: 'User created successfully',
        data: newUser,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: 'Failed to create user',
        data: null,
      };
    }
  }

  static async loginUser(input) {
    try {
      const user = await AuthRepository.findUserByPhoneNumber(input.phoneNumber);
      if (user && bcrypt.compareSync(input.password, user.password)) {
        return user;
      }
      throw new Error("Invalid phone number or password");
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Login failed");
    }
  }
}

export default AuthController;
