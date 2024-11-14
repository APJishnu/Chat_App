"use client";

import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import apolloClient from "@/lib/apollo-client";
import "./RegistrationForm.css"; // Create and import this CSS file to apply custom styles

const REGISTER_USER = gql`
  mutation CreateUser($input: RegisterInput!) {
    createUser(input: $input) {
      id
      firstName
      lastName
      userName
      email
      phoneNumber
      profileImage
    }
  }
`;

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createUser] = useMutation(REGISTER_USER, {
    client: apolloClient,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await createUser({
        variables: { input: formData },
      });

      alert("User registered successfully");
      console.log(data);
    } catch (error: any) {
      console.error("Error during sign-up:", error);
      setError("Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">Sign Up</h2>
        <p className="subtitle">Create an account to get started</p>

        <div className="form-container">

          <div className="full-name-div">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              className="input"
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="input"
            />
          </div>
         
          <input
            type="text"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            placeholder="User Name"
            className="input"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="input"
          />
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Phone Number"
            className="input"
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="input"
          />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="input"
          />
        </div>

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        {error && <p className="text-red-400 mt-1 text-center">{error}</p>}
      </form>
      <div className="form-section">
        Already have an account? <a href="/login">Login</a>
      </div>
    </div>
  );
};

export default RegistrationForm;
