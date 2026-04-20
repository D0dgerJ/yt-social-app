import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { loginUser } from "../../utils/api/auth.api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./Login.scss";

const INVALID_LOGIN_MESSAGE = "Invalid email or password";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

const Login: React.FC = () => {
  const [auth, setAuth] = useState({ email: "", password: "" });

  const { isFetching, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateLoginForm = (email: string, password: string): string | null => {
    if (!EMAIL_REGEX.test(email)) {
      return INVALID_LOGIN_MESSAGE;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return INVALID_LOGIN_MESSAGE;
    }

    return null;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = auth.email.trim().toLowerCase();
    const password = auth.password;

    const validationError = validateLoginForm(email, password);

    if (validationError) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: validationError,
      });
      toast.error(validationError);
      return;
    }

    dispatch({ type: "LOGIN_START" });

    try {
      const data = await loginUser({
        email,
        password,
      });

      dispatch({ type: "LOGIN_SUCCESS", payload: data });
      navigate("/");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || INVALID_LOGIN_MESSAGE
        : INVALID_LOGIN_MESSAGE;

      dispatch({
        type: "LOGIN_FAILURE",
        payload: message,
      });

      toast.error(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="auth-brand__badge">DodgerJ Social</div>
          <h1 className="auth-brand__title">Вход в аккаунт</h1>
          <p className="auth-brand__text">
            Общайся с друзьями, публикуй посты, следи за активностью и управляй
            своим профилем в современном интерфейсе.
          </p>

          <div className="auth-brand__features">
            <div className="auth-brand__feature">Лента постов и шорты</div>
            <div className="auth-brand__feature">Комментарии и реакции</div>
            <div className="auth-brand__feature">События, друзья и профиль</div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card__header">
              <div className="auth-card__header-top">
                <h2>Login</h2>
                <span className="auth-mini-logo">DJS</span>
              </div>
              <p>Введи email и пароль, чтобы продолжить.</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="auth-input"
                  value={auth.email}
                  onChange={(e) =>
                    setAuth({ ...auth, email: e.target.value })
                  }
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="auth-input"
                  value={auth.password}
                  onChange={(e) =>
                    setAuth({ ...auth, password: e.target.value })
                  }
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                />
              </label>

              <button className="auth-submit" disabled={isFetching}>
                {isFetching ? "Logging in..." : "Login"}
              </button>

              <button
                className="auth-secondary"
                type="button"
                onClick={() => navigate("/register")}
              >
                Create a new account
              </button>

              <button
                className="auth-link"
                type="button"
                onClick={() => {}}
              >
                Forgot password?
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;