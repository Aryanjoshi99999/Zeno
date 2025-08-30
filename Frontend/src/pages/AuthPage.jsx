import React, { useState } from "react";
import Login from "../components/auth/Login";
import Register from "../components/auth/Register";
import "./AuthPage.css";

function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="auth-page-container">
      {isRegistering ? (
        <Register onToggle={() => setIsRegistering(false)} />
      ) : (
        <Login onToggle={() => setIsRegistering(true)} />
      )}
    </div>
  );
}

export default AuthPage;
