import React from "react";
import { useChat } from "../../context/ChatContext";

const Login = ({ onToggle }) => {
  const { email, setEmail, password, setPassword, handleSubmit } = useChat();

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Welcome Back!</h2>
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
      <button type="submit">Login</button>
      <p>
        Don't have an account? <span onClick={onToggle}>Register</span>
      </p>
    </form>
  );
};

export default Login;
