"use client";

import Chat from '@/modules/user/Chat/components/Chat';
import React from 'react';
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();
  
  // Get recipientId from the search params and convert it to a number
  const recipientId = searchParams.get("recipientId");

  // Check if recipientId is valid and convert it to a number, else handle the case when it's null
  const recipientIdNumber = recipientId ? parseInt(recipientId, 10) : NaN;

  // If recipientId is not valid, you can either handle it by showing an error or redirecting
  if (isNaN(recipientIdNumber)) {
    return <div>Invalid recipient ID</div>; // or redirect to an error page, etc.
  }

  return (
    <div className="min-h-screen ">
      <Chat recipientId={recipientIdNumber} /> {/* Pass the valid recipientId */}
    </div>
  );
};

export default Page;
