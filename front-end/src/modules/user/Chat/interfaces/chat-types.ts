export interface ChatProps {
  recipientId: number;
  recipientUserName: string;
  recipientProfileImage: string;
}
interface User {
  id: string;
  userName: string;
  profileImage?: string;
}

export interface Message {
  id: number;
  text: string;
  timestamp: Date;
  senderId: number;
  sender: User;
  recipient: User;
  audioUrl?: string;
  imageUrl?: string;
}

export interface AttachmentFile {
  file: File;
  preview: string;
  type: "image" | "video";
}
