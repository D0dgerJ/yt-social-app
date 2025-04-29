import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { loginAuth } from "../../utils/api/auth.api";
import "./Login.scss";

const Login = () => {
  const [auth, setAuth] = useState({
    email: "",
    password: "",
  });
  const { user, isFetching, error, dispatch } = useContext(AuthContext);

  const handleLogin = (e) => {
    e.preventDefault();
    loginAuth({ email: auth.email, password: auth.password }, dispatch);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <h1>Solu Social</h1>
          <span>Connect With Friends On Solu Social.</span>
        </div>
        <div className="login-right">
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              onChange={(e) => {
                setAuth({ ...auth, email: e.target.value });
              }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="login-input"
              onChange={(e) => {
                setAuth({ ...auth, password: e.target.value });
              }}
              required
              minLength={3}
            />
            <button className="login-button">
              {isFetching ? "Logging In" : "Login"}
            </button>
            <span className="forgot-password">Forgot password?</span>
            <button className="register-button">
              Create A New Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
