import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { loginUser } from "../../utils/api/auth.api";
import "./Login.scss";

const Login: React.FC = () => {
  const [auth, setAuth] = useState({ email: "", password: "" });

  const { user, isFetching, error, dispatch } = useContext(AuthContext);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginUser({ email: auth.email, password: auth.password })
  .then((data) => {
    dispatch({ type: 'LOGIN_SUCCESS', payload: data });
  })
  .catch((err) => {
    dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
  });
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
              value={auth.email}
              onChange={(e) =>
                setAuth({ ...auth, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="login-input"
              value={auth.password}
              onChange={(e) =>
                setAuth({ ...auth, password: e.target.value })
              }
              required
              minLength={3}
            />
            <button className="login-button" disabled={isFetching}>
              {isFetching ? "Logging In" : "Login"}
            </button>
            <span className="forgot-password">Forgot password?</span>
            <button className="register-button" type="button">
              Create A New Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
