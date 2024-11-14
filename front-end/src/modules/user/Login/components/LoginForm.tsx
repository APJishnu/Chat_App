import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import apolloClient from "@/lib/apollo-client";
import './LoginForm.css';

const LOGIN_USER = gql`
  mutation LoginUser($input: LoginInput!) {
    loginUser(input: $input) {
      token
      user {
        id
        firstName
        lastName
        phoneNumber
      }
    }
  }
`;

const LoginForm = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginUser] = useMutation(LOGIN_USER, {
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
      const { data } = await loginUser({
        variables: { input: formData },
      });

      if (data?.loginUser?.token) {
        onLogin(data.loginUser.token);
        alert("Login successful!");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError("Invalid phone number or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="title">Login</h2>
        <div className="form-container">
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
        </div>

        <button
          type="submit"
          className="form-button"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default LoginForm;
