"use client";
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
import apolloClient from "@/lib/apollo-client";
import "./Chat.css";

export interface ChatProps {
  recipientId: number;
  currentUserId: number; // Add currentUserId prop
}

export interface User {
  id: string;
  userName: string;
}

export interface Message {
  id: number;
  text: string;
  timestamp: Date;
  sender: User;
  recipient: User;
}

export const GET_MESSAGES = gql`
  query GetMessages($recipientId: Int!) {
    getMessages(recipientId: $recipientId){
      id
      text @defer
      timestamp
      sender {
        id
        userName
         profileImage @defer
      }
      recipient {
        id
        userName
        profileImage @defer
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($text: String!, $recipientId: Int!) {
    sendMessage(text: $text, recipientId: $recipientId) {
      id
      text
      timestamp
      sender {
        id
        userName
      }
      recipient {
        id
        userName
      }
    }
  }
`;

export const MESSAGE_SUBSCRIPTION = gql`
  subscription MessageSent($recipientId: Int!) {
    messageSent(recipientId: $recipientId) {
      id
      text
      timestamp
      sender {
        id
        userName
      }
      recipient {
        id
        userName
      }
    }
  }
`;

const Chat: React.FC<ChatProps> = ({ recipientId, currentUserId }) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientName, setRecipientName] = useState<string>("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Query for initial messages
  const {
    data: queryData,
    loading,
    error,
  } = useQuery(GET_MESSAGES, {
    client: apolloClient,
    variables: { recipientId },
    fetchPolicy: "network-only",
    onCompleted: () => {
      // Handle deferred data once it's loaded
    },
  });

  // Mutation for sending messages
  const [sendMessage] = useMutation(SEND_MESSAGE, {
    client: apolloClient,
    onCompleted: (data) => {
      if (data?.sendMessage) {
        setMessage("");
      }
    },
  });

  // Subscription for real-time messages
  useSubscription(MESSAGE_SUBSCRIPTION, {
    client: apolloClient,
    variables: { recipientId },
    onData: ({ data }) => {
      console.log(data);
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

  // Set initial messages from query
  useEffect(() => {
    if (queryData?.getMessages) {
      const formattedMessages = queryData.getMessages.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedMessages);

      // Set recipient name if available
      if (formattedMessages.length > 0) {
        const recipient =
          formattedMessages[0].sender.id === currentUserId.toString()
            ? formattedMessages[0].recipient
            : formattedMessages[0].sender;
        setRecipientName(recipient.userName);
      }
    }
  }, [queryData, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() === "") return;
    try {
      await sendMessage({
        variables: {
          text: message,
          recipientId,
        },
      });
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  const isMessageFromCurrentUser = (message: Message) => {
    return message.sender.id === currentUserId.toString();
  };

  if (loading) return <p>Loading chat...</p>;
  if (error) return <p>Error loading chat: {error.message}</p>;

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <h2>Chat with {recipientName}</h2>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.map((msg: Message, index) => (
          <div
            key={msg.id || index}
            className={`message ${
              isMessageFromCurrentUser(msg) ? "sent" : "received"
            }`}
          >
            <div className="message-bubble">
              <div className="message-sender">
                {isMessageFromCurrentUser(msg) ? "You" : msg.sender.userName}
              </div>
              <div className="message-content">{msg.text}</div>
              <div className="message-timestamp">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button onClick={handleSendMessage} disabled={message.trim() === ""}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
