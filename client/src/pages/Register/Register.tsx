import "./Register.scss";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { registerUser } from "../../utils/api/auth.api";
import { Link, useNavigate } from "react-router-dom";

interface AuthData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [auth, setAuth] = useState<AuthData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (auth.confirmPassword !== auth.password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await registerUser({
        username: auth.username,
        email: auth.email,
        password: auth.password,
      });

      toast.success("Registration successful");
      navigate("/login");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="register-page">
      <div className="register-wrapper">
        <div className="register-left">
          <h1>Solu Social</h1>
          <span>Connect With Friends On Solu Social.</span>
        </div>
        <div className="register-right">
          <form onSubmit={handleRegister} className="register-form">
            <input
              type="text"
              placeholder="Username"
              className="register-input"
              value={auth.username}
              onChange={(e) =>
                setAuth((prev) => ({ ...prev, username: e.target.value }))
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="register-input"
              value={auth.email}
              onChange={(e) =>
                setAuth((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="register-input"
              value={auth.password}
              onChange={(e) =>
                setAuth((prev) => ({ ...prev, password: e.target.value }))
              }
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="register-input"
              value={auth.confirmPassword}
              onChange={(e) =>
                setAuth((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              required
            />
            <button type="submit" className="register-submit-btn">
              Sign Up
            </button>
            <Link to="/login" className="register-login-btn">
              Login Into Your Account
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
