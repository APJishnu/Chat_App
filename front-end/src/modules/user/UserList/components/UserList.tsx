"use client";
import React from 'react';
import { useQuery, gql } from '@apollo/client';
import apolloClient from '@/lib/apollo-client';
import './UserList.css'

// GraphQL Query
export const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      userName
    }
  }
`;

// User Interface
export interface User {
  id: number;
  userName: string;
}

// UserListProps Interface
export interface UserListProps {
  onSelectUser: (id: number) => void;
}

// UserList Component
const UserList: React.FC<UserListProps> = ({ onSelectUser }) => {
  const { data, loading, error } = useQuery(GET_USERS, {
    client: apolloClient,
  });

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error loading users!</p>;

  return (
    <div className="user-list-container">
      <h3>Select a user to chat with:</h3>
      <div className="user-list">
        {data.getUsers.map((user: User) => (
          <div
            key={user.id}
            className="user-item"
            onClick={() => onSelectUser(user.id)}
          >
            <div className="user-avatar">
              <span>{user.userName[0]}</span> {/* Display first letter as avatar */}
            </div>
            <div className="user-details">
              <span className="user-name">{user.userName}</span>
              {/* Optionally, you can add a "Last Message" or "Status" here */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
