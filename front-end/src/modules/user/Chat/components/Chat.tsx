// Chat.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
import apolloClient from "@/lib/apollo-client";
import EmojiPicker from "emoji-picker-react";
import styles from "./Chat.module.css";
import { useCurrentUserId } from "@/context/useContext";

interface ChatProps {
  recipientId: number;
  recipientUserName: string;
  recipientProfileImage: string;
}

interface User {
  id: string;
  userName: string;
  profileImage?: string;
}

interface Message {
  id: number;
  text: string;
  timestamp: Date;
  senderId: number;
  sender: User;
  recipient: User;
  imageUrl?: string;
}

const GET_MESSAGES = gql`
  query GetMessages($recipientId: Int!) {
    getMessages(recipientId: $recipientId) {
      id
      text
      imageUrl
      timestamp
      senderId
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($text: String!, $image: Upload, $recipientId: Int!) {
    sendMessage(text: $text, image: $image, recipientId: $recipientId) {
      id
      text
      imageUrl
      timestamp
      senderId
    }
  }
`;

const MESSAGE_SUBSCRIPTION = gql`
  subscription MessageSent($recipientId: Int!) {
    messageSent(recipientId: $recipientId) {
      id
      text
      imageUrl
      timestamp
      senderId
    }
  }
`;

const Chat: React.FC<ChatProps> = ({
  recipientId,
  recipientUserName,
  recipientProfileImage,
}) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserIdString = useCurrentUserId();

  const currentUserId = Number(currentUserIdString);

  const {
    data: queryData,
    loading,
    error,
  } = useQuery(GET_MESSAGES, {
    client: apolloClient,
    variables: { recipientId: Number(recipientId) },
    fetchPolicy: "network-only",
    skip: !recipientId,
  });

  const [sendMessage] = useMutation(SEND_MESSAGE, {
    client: apolloClient,
    onCompleted: () => {
      setMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
      setIsUploading(false);
    },
  });

  useSubscription(MESSAGE_SUBSCRIPTION, {
    client: apolloClient,
    variables: { recipientId: Number(recipientId) },
    onData: ({ data }) => {
      const newMessage = data.data?.messageSent;
      if (newMessage) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === newMessage.id);
          if (!messageExists) {
            return [
              ...prev,
              {
                ...newMessage,
                timestamp: new Date(newMessage.timestamp),
              },
            ];
          }
          return prev;
        });
      }
    },
  });

  useEffect(() => {
    if (queryData?.getMessages) {
      const formattedMessages = queryData.getMessages.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedMessages);
    }
  }, [queryData, currentUserId]);

  useEffect(() => {
    if (selectedImage) {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        setImagePreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(selectedImage);
    }
  }, [selectedImage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() === "" && !selectedImage) return;
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      await sendMessage({
        variables: {
          text: message,
          image: selectedImage,
          recipientId: Number(recipientId),
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (error) {
      console.error("Error sending message:", error);
      clearInterval(progressInterval);
      setUploadProgress(0);
    }
  };

  if (loading)
    return <div className={styles.loadingContainer}>Loading chat...</div>;
  if (error)
    return <div className={styles.errorContainer}>Error: {error.message}</div>;

  return (
    <div className={styles.chatContainer}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.recipientInfo}>
          {recipientProfileImage ? (
            <img
              src={recipientProfileImage}
              alt={recipientUserName}
              className={styles.recipientImage}
            />
          )
          : (
            <div className={styles.recipientAvatar}>
            <span className={styles.avatarFallback}>
              {recipientUserName[0]}
            </span>
            </div>
          )}
          <h2>{recipientUserName}</h2>
        </div>
      </div>

      {/* Messages Container */}
      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.senderId === currentUserId
                ? styles.messageSent
                : styles.messageReceived
            }`}
          >
            <div className={styles.messageBubble}>
              {msg.text && <p>{msg.text}</p>}
              {msg.imageUrl && (
                <div className={styles.messageImageContainer}>
                  <img
                    src={msg.imageUrl}
                    alt="Message attachment"
                    className={`${styles.messageImage} ${
                      isUploading ? styles.messageImageLoading : ""
                    }`}
                  />
                </div>
              )}
              <span className={styles.messageTimestamp}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className={styles.imagePreview}>
          <button
            onClick={removeSelectedImage}
            className={styles.imagePreviewClose}
          >
            ×
          </button>
          <img src={imagePreview} alt="Preview" />
        </div>
      )}

      {/* Message Input */}
      <div className={styles.messageInput}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={styles.emojiButton}
        >
          😀
        </button>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className={styles.fileInput}
          ref={fileInputRef}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className={styles.attachButton}
        >
          📎
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className={styles.messageInputField}
        />

        <button
          onClick={handleSendMessage}
          disabled={isUploading || (!message.trim() && !selectedImage)}
          className={`${styles.sendButton} ${
            isUploading || (!message.trim() && !selectedImage)
              ? styles.sendButtonDisabled
              : ""
          }`}
        >
          {isUploading ? "..." : "Send"}
        </button>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className={styles.uploadProgress}>
          <div
            className={styles.uploadProgressBar}
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className={styles.emojiPickerContainer}>
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setMessage((prev) => prev + emojiData.emoji);
              setShowEmojiPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
