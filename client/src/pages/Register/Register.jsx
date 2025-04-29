import "./Register.scss";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { registerUser } from "../../utils/api/auth.api";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [auth, setAuth] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();
    if (auth.confirmPassword !== auth.password) {
      toast.error("Passwords do not match");
    } else {
      try {
        const res = await registerUser({
          username: auth.username,
          email: auth.email,
          password: auth.password,
        });
        toast.success(res.data.message);
        navigate("/login");
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message);
        toast.error("Something went wrong");
      }
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
            type="name"
            placeholder="Username"
            className="register-input"
            onChange={(e) => setAuth({ ...auth, username: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="register-input"
            onChange={(e) => setAuth({ ...auth, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="register-input"
            onChange={(e) => setAuth({ ...auth, password: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="register-input"
            onChange={(e) => setAuth({ ...auth, confirmPassword: e.target.value })}
            required
          />
          <button
            type="submit"
            className="register-submit-btn"
          >
            Sign Up
          </button>
          <button className="register-login-btn">
            <Link to={"/login"}>Login Into Your Account</Link>
          </button>
        </form>
      </div>
    </div>
  </div>
);
};

export default Register;