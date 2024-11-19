"use client"
import React, { useState } from 'react';
import UserList from '@/modules/user/UserList/components/UserList';
import Chat from '@/modules/user/Chat/components/Chat';
import styles from './page.module.css';
import {
  ArrowLeftOutlined,
} from "@ant-design/icons";

const Dashboard = () => {
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
  const [selectedRecipientUserName, setSelectedRecipientUserName] = useState("");
  const [selectedRecipientProfileImage, setSelectedRecipientProfileImage] = useState("");
  
  // This state will track whether the user is in the chat view on mobile
  const [isInChat, setIsInChat] = useState(false);

  const handleSelectUser = (id: number, userName: string, profileImage: string) => {
    setSelectedRecipientId(id);
    setSelectedRecipientUserName(userName);
    setSelectedRecipientProfileImage(profileImage);
    setIsInChat(true);  // User selected, show Chat
  };

  const handleBackToUserList = () => {
    setIsInChat(false);  // Back to UserList view
  };

  // Determine if the screen width is mobile or desktop
  const isMobile = window.innerWidth <= 767;

  return (
    <div className={`${styles.dashboardContainer}`}>
      {/* Left Sidebar - UserList for Desktop or Mobile view when not in chat */}
      <div className={`${styles.userListSidebar} ${isInChat && isMobile ? styles.hidden : ''}`}>
        <UserList
          onSelectUser={handleSelectUser} 
          selectedUserId={selectedRecipientId}
        />
      </div>

      {/* Right Side - Chat */}
      <div className={styles.chatSidebar}>
        {isInChat ? (
          <>
            <button className={`${styles.backButton}`} onClick={handleBackToUserList}><ArrowLeftOutlined/></button>
            {selectedRecipientId !== null && (
              <Chat
                recipientId={selectedRecipientId} 
                recipientUserName={selectedRecipientUserName}
                recipientProfileImage={selectedRecipientProfileImage}
              />
            )}
          </>
        ) : (
          <div className={styles.welcomeMessage}>
            <div>
              <h3 className="text-xl font-medium mb-2">Welcome to Chat</h3>
              <p>Select a user to start a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
