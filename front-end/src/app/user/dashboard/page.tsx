"use client"

import React, { useState} from 'react';
import UserList from '@/modules/user/UserList/components/UserList';
import Chat from '@/modules/user/Chat/components/Chat';


const Dashboard = () => {
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
  const [selectedRecipientuserName, setSelectedRecipientUserName] = useState("");
  const [selectedRecipientProfileImage,setSelectedRecipientProfileImage] = useState("");




  const handleSelectUser = (id: number,userName:string,profileImage:string) => {
    setSelectedRecipientId(id);
    setSelectedRecipientUserName(userName);
    setSelectedRecipientProfileImage(profileImage);
  };

 

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - UserList */}
      <div className="w-1/4 border-r">
        <UserList
          onSelectUser={handleSelectUser} 
          selectedUserId={selectedRecipientId}
        />
      </div>

      {/* Right Side - Chat */}
      <div className="w-3/4">
        {selectedRecipientId ? (
          <Chat
            recipientId={selectedRecipientId} 
            recipientUserName = {selectedRecipientuserName}
            recipientProfileImage = {selectedRecipientProfileImage}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
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