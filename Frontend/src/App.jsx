import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useChat } from "./context/ChatContext";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import SearchedUserProfile from "./pages/SearchedUserProfile";
import FriendRequests from "./pages/FriendRequests";
import Header from "./components/Header/Header.jsx";

function App() {
  const { login } = useChat();

  return (
    <div>
      <Header />
      <Routes>
        <Route
          path="/auth"
          element={!login ? <AuthPage /> : <Navigate to="/" />}
        />

        <Route
          path="/"
          element={login ? <ChatPage /> : <Navigate to="/auth" />}
        />
        <Route path="/profile/:userId" element={<SearchedUserProfile />} />
        <Route path="/friendRequests" element={<FriendRequests />} />
      </Routes>
    </div>
  );
}

export default App;
