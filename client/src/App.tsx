import "./App.scss";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Chat from "./pages/Chat/Chat";
import Shorts from "./pages/Shorts/Shorts";
import Events from "./pages/Events/Events";
import Moderation from "./pages/Moderation/Moderation";
import ModerationHistory from "@/pages/Moderation/ModerationHistory";
import ModerationPostDetails from "@/pages/Moderation/ModerationPostDetails";
import ModerationUsers from "@/pages/Moderation/ModerationUsers";
import ModerationComments from "./pages/Moderation/ModerationComments";
import ModerationCommentDetails from "@/pages/Moderation/ModerationCommentDetails";
import ModerationRoles from "@/pages/Moderation/ModerationRoles";

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserProfile } from "./utils/api/user.api";
import { logoutUser } from "./utils/auth";
import axios from "axios";

import { SocketProvider } from "./context/SocketContext";
import { useChatSocket } from "./hooks/useChatSocket";
import FloatingChatWindow from "@/components/Chat/FloatingChatWindow/FloatingChatWindow";

const AppInner: React.FC = () => {
  const { user, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isAppReady, setIsAppReady] = useState(false);

  useChatSocket();

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (user) {
          const profile = await getUserProfile();

          if (profile) {
            dispatch({
              type: "UPDATE_USER",
              payload: profile,
            });
          }
        }
      } catch (error) {
        console.error("❌ PROFILE ERROR:", error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          logoutUser(navigate);
        }
      } finally {
        setIsAppReady(true);
      }
    };

    void checkUser();
  }, [user?.id, dispatch, navigate]);

  if (!isAppReady) {
    return (
      <div className="app-loader">
        <div className="app-loader__card">
          <div className="app-loader__spinner" />
          <div className="app-loader__text">Загрузка приложения...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={user ? <Home feedMode="home" /> : <Navigate to="/register" />}
        />
        <Route
          path="/explore"
          element={user ? <Home feedMode="explore" /> : <Navigate to="/login" />}
        />
        <Route path="/profile/:username" element={<Profile />} />
        <Route
          path="/shorts"
          element={user ? <Shorts /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat"
          element={user ? <Chat /> : <Navigate to="/login" />}
        />
        <Route
          path="/events"
          element={user ? <Events /> : <Navigate to="/login" />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login />}
        />

        <Route
          path="/moderation"
          element={user ? <Moderation /> : <Navigate to="/login" />}
        />
        <Route
          path="/moderation/users"
          element={user ? <ModerationUsers /> : <Navigate to="/login" />}
        />
        <Route
          path="/moderation/roles"
          element={user ? <ModerationRoles /> : <Navigate to="/login" />}
        />
        <Route
          path="/moderation/posts/:postId"
          element={user ? <ModerationPostDetails /> : <Navigate to="/login" />}
        />
        <Route
          path="/moderation/history"
          element={user ? <ModerationHistory /> : <Navigate to="/login" />}
        />
        <Route
          path="/moderation/comments"
          element={user ? <ModerationComments /> : <Navigate to="/login" />}
        />
        <Route
          path="/moderation/comments/:commentId"
          element={user ? <ModerationCommentDetails /> : <Navigate to="/login" />}
        />
      </Routes>

      <FloatingChatWindow />
    </>
  );
};

function App(): JSX.Element {
  return (
    <SocketProvider>
      <AppInner />
    </SocketProvider>
  );
}

export default App;