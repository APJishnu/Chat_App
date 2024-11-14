"use client";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useCurrentUserId } from '../../../context/useContext'; // Import the hook to access the currentUserId
import Chat from '@/modules/user/Chat/components/Chat';

const Page = () => {
  const searchParams = useSearchParams();
  const currentUserId = useCurrentUserId(); // Get currentUserId from context
  
  // Get recipientId from the search params and convert it to a number
  const recipientId = searchParams.get("recipientId");

  // Check if recipientId is valid and convert it to a number, else handle the case when it's null
  const recipientIdNumber = recipientId ? parseInt(recipientId, 10) : NaN;

  // If recipientId is not valid, you can either handle it by showing an error or redirecting
  if (isNaN(recipientIdNumber)) {
    return <div>Invalid recipient ID</div>; // or redirect to an error page, etc.
  }

  // Make sure currentUserId is not null or undefined before passing it
  if (!currentUserId) {
    return <div>User not logged in</div>; // Handle if currentUserId is not available
  }

  return (
    <div className="min-h-screen">
      <Chat recipientId={recipientIdNumber} currentUserId={parseInt(currentUserId, 10)} /> {/* Pass currentUserId and recipientId */}
    </div>
  );
};

export default Page;
