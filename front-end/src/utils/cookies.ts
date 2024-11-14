import { jwtDecode, JwtPayload } from "jwt-decode";
import Cookies from "js-cookie";

interface CustomJwtPayload extends JwtPayload {
  id?: string; // or `number` if `id` is a number in your JWT payload
}

export const getUserToken = (): string | null => {
  const token = Cookies.get("userToken");
  return token ?? null;
};

export const decodeUserToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const decoded = jwtDecode<CustomJwtPayload>(token);
    return decoded.id || null;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};
