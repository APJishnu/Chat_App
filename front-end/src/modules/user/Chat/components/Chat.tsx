
// 2. Update the Chat.tsx component
"use client"
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
import apolloClient from "@/lib/apollo-client";
import './Chat.css';

export interface ChatProps {
  recipientId: number;
}

export interface Message {
  id: number;
  timestamp: Date;
  sender: {
    userName: string;
    id: string;
  };
  text: string;
  isCurrentUser: boolean;
}

export const GET_MESSAGES = gql`
  query GetMessages($recipientId: Int!) {
    getMessages(recipientId: $recipientId) {
      id
      text
      timestamp
      sender {
        userName
        id
      }
      isCurrentUser
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
        userName
        id
      }
      isCurrentUser
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
        userName
        id
      }
      isCurrentUser
    }
  }
`;

const Chat: React.FC<ChatProps> = ({ recipientId }) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  const parsedRecipientId = parseInt(recipientId.toString(), 10);

  // Query for initial messages
  const { data: queryData, loading, error } = useQuery(GET_MESSAGES, {
    client:apolloClient,
    variables: { recipientId: parsedRecipientId },
    fetchPolicy: 'network-only',
  });

  console.log(queryData)

  // Mutation for sending messages
  const [sendMessage] = useMutation(SEND_MESSAGE, {
    client:apolloClient,
    onCompleted: (data) => {
      if (data?.sendMessage) {
        setMessage("");
      }
    }
  });

  useSubscription(MESSAGE_SUBSCRIPTION, {
    client:apolloClient,
    variables: { recipientId: parsedRecipientId },
    onData: ({ data }) => {
      console.log(data.data)
      const newMessage = data.data?.messageSent;
      if (newMessage) {
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === newMessage.id);
          if (!messageExists) {
            return [...prev, newMessage];
          }
          return prev;
        });
      }
    },
  });

 // Inside useEffect for setting initial messages from query
useEffect(() => {
  if (queryData?.getMessages) {
    const formattedMessages = queryData.getMessages.map((msg: Message) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
    setMessages(formattedMessages);
  }
}, [queryData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() === "") return;
    try {
      await sendMessage({ variables: { text: message, recipientId } });
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  if (loading) return <p>Loading chat...</p>;
  if (error) return <p>Error loading chat: {error.message}</p>;

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((msg: Message,index) => (
           <div
           key={index}
           className={`message ${msg.isCurrentUser ? 'sent' : 'received'}`}
         >
            <div className="message-bubble">
              <div className="message-sender">{msg.sender.userName}</div>
              <div className="message-content">{msg.text}</div>
              <div className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>u-
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button 
          onClick={handleSendMessage}
          disabled={message.trim() === ""}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;