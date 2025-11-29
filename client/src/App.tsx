import "./App.scss";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Chat from "./pages/Chat/Chat";
import Shorts from "./pages/Shorts/Shorts";
import Events from "./pages/Events/Events";

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

const AppInner: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isAppReady, setIsAppReady] = useState(false);

  useChatSocket();

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (user) {
          const profile = await getUserProfile();
          console.log("PROFILE OK", profile);
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

    checkUser();
  }, [user, navigate]);

  if (!isAppReady) return <div className="loader">Loading...</div>;

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/register" />}
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
      </Routes>
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