import jwt from 'jsonwebtoken';

const SECRET_KEY = "your_secret_key"; // Store in env file for security

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      phoneNumber: user.phoneNumber,
    },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
};

export const validateToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
