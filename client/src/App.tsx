import "./App.scss";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Chat from "./pages/Chat/Chat";

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserProfile } from "./utils/api/user.api";
import { logoutUser } from "./utils/auth";
import axios from "axios";

function App(): JSX.Element {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking user profile...");
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
        <Route path="/" element={user ? <Home /> : <Navigate to="/register" />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
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
}

export default App;
