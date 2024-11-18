"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getUserToken, decodeUserToken } from "../utils/cookies";

// Define the type for the context value
interface UserContextType {
  currentUserId: string | null;
}

// Create a context with an initial value of null (as the default state)
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = getUserToken();
    if (token) {
      const userId = decodeUserToken(token);
      setCurrentUserId(userId);
    }
  }, []);

  return (
    <UserContext.Provider value={{ currentUserId }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to access the currentUserId from context
export const useCurrentUserId = (): string | null => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useCurrentUserId must be used within a UserProvider");
  }
  return context.currentUserId;
};
