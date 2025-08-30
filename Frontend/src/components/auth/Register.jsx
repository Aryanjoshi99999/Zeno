import React from "react";
import { useChat } from "../../context/ChatContext";

const Register = ({ onToggle }) => {
  const {
    username,
    setUserName,
    email,
    setEmail,
    password,
    setPassword,
    handleRegisterSubmit,
  } = useChat();

  return (
    <form onSubmit={handleRegisterSubmit} className="auth-form">
      <h2>Create Account</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUserName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Register</button>
      <p>
        Already have an account? <span onClick={onToggle}>Login</span>
      </p>
    </form>
  );
};

export default Register;
