"use client"

import React from "react";
import LoginForm from "../components/LoginForm";
import Cookies from 'js-cookie'

const Login = () => {

  const handleLogin = (token: string) => {
    Cookies.set("userToken", token, { expires: 1 / 24 });
  };

  return (
    <div>
        <LoginForm onLogin={handleLogin} />
    </div>
  );
};

export default Login;
