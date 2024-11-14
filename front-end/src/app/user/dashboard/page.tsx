"use client"


import Login from '@/modules/user/Login/views/Login';
import UserList from '@/modules/user/UserList/components/UserList';
import React,{ useState, useEffect } from 'react';
import Cookies from 'js-cookie';



const page =() => {
  const [authToken, setAuthtoken] = useState(""); // Store user ID after login
  const [recipientId, setRecipientId] = useState<number | null>(null); // Store recipient ID for chat

  useEffect(() => {
    const token = Cookies.get("userToken"); 
    if (token) {
      setAuthtoken(token);
    }
  }, []);

  const handleSelectUser = (id: number) => {
    setRecipientId(id);

    setTimeout(()=>{
        window.location.href = `/user/chat?recipientId=${id}`
    })
  };


  return (
    <div>
      {!authToken ? (
        <Login />
      ) : !recipientId && (
        <UserList onSelectUser={handleSelectUser} />
      )}
    </div>
  );
};

export default page;
