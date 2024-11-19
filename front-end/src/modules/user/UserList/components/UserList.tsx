"use client";
import React from "react";
import { useQuery, gql } from "@apollo/client";
import apolloClient from "@/lib/apollo-client";
import { Tooltip } from "antd"; // Import Tooltip from Ant Design
import { SettingOutlined, UserOutlined, ProfileOutlined, InboxOutlined } from '@ant-design/icons'; // Corrected Icons
import styles from "./UserList.module.css";

// GraphQL Query
export const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      userName
      profileImage
    }
  }
`;

// User Interface
export interface User {
  id: number;
  userName: string;
  profileImage?: string;
}

// UserListProps Interface
export interface UserListProps {
  onSelectUser: (id: number, userName: string, profileImage: string) => void;
  selectedUserId: number | null;
}

// Updated UserList Component
const UserList: React.FC<UserListProps> = ({ onSelectUser, selectedUserId }) => {
  const { data, loading, error } = useQuery(GET_USERS, {
    client: apolloClient,
  });

  if (loading) return <p className="p-4">Loading users...</p>;
  if (error) return <p className="p-4 text-red-500">Error loading users!</p>;

  return (
    <div className={styles.userListContainer}>
     
      <div className={styles.userList}>
        <div className={styles.logoWithText}>
          <img className={styles.logo} src="/logo-2.png" alt="" />
        <h3 className={styles.userListHeader}>CHATS</h3>
        </div>
     
        {data.getUsers.map((user: User) => (
          <div
            key={user.id}
            className={`${styles.userItem} ${
              selectedUserId === user.id ? styles.selected : ""
            }`}
            onClick={() => onSelectUser(user.id, user.userName, user.profileImage ? user.profileImage : "")}
          >
            <div className={styles.userAvatar}>
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.userName}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarFallback}>
                  {user.userName[0]}
                </span>
              )}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>
                {user.userName || "Unknown User"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Container with Icons */}
      <div className={styles.bottomContainer}>
        <Tooltip title="Settings">
          <SettingOutlined className={styles.bottomIcon} />
        </Tooltip>
        <Tooltip title="Profile">
          <UserOutlined className={styles.bottomIcon} />
        </Tooltip>
        <Tooltip title="Status">
          <ProfileOutlined className={styles.bottomIcon} /> {/* Updated Icon */}
        </Tooltip>
        <Tooltip title="Archived Chats">
          <InboxOutlined className={styles.bottomIcon} /> {/* Updated Icon */}
        </Tooltip>
      </div>
    </div>
  );
};

export default UserList;
