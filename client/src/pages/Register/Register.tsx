import axios from "axios";
import "./Register.scss";
import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { registerUser } from "../../utils/api/auth.api";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

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

  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (auth.confirmPassword !== auth.password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const user = await registerUser({
        username: auth.username,
        email: auth.email.trim(),
        password: auth.password,
      });

      dispatch({ type: "LOGIN_SUCCESS", payload: user });

      toast.success(`Welcome, ${user.username}!`);
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Registration error:", error.response?.data);
        toast.error(error.response?.data?.message || "Something went wrong");
      } else {
        console.error("Unknown error:", error);
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="auth-brand__badge">DodgerJ Social</div>
          <h1 className="auth-brand__title">Создай аккаунт</h1>
          <p className="auth-brand__text">
            Присоединяйся к DodgerJ Social, чтобы публиковать посты, общаться,
            следить за друзьями и настраивать свой профиль.
          </p>

          <div className="auth-brand__features">
            <div className="auth-brand__feature">Персональный профиль</div>
            <div className="auth-brand__feature">Комментарии, реакции и друзья</div>
            <div className="auth-brand__feature">События, explore и шорты</div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card__header">
              <div className="auth-card__header-top">
                <h2>Register</h2>
                <span className="auth-mini-logo">DJS</span>
              </div>
              <p>Заполни форму и начни пользоваться приложением.</p>
            </div>

            <form onSubmit={handleRegister} className="auth-form">
              <label className="auth-field">
                <span>Username</span>
                <input
                  type="text"
                  placeholder="Choose a username"
                  className="auth-input"
                  value={auth.username}
                  onChange={(e) =>
                    setAuth((prev) => ({ ...prev, username: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="auth-input"
                  value={auth.email}
                  onChange={(e) =>
                    setAuth((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Create a password"
                  className="auth-input"
                  value={auth.password}
                  onChange={(e) =>
                    setAuth((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
              </label>

              <label className="auth-field">
                <span>Confirm password</span>
                <input
                  type="password"
                  placeholder="Repeat the password"
                  className="auth-input"
                  value={auth.confirmPassword}
                  onChange={(e) =>
                    setAuth((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
              </label>

              <button type="submit" className="auth-submit">
                Sign up
              </button>

              <Link className="auth-secondary auth-secondary--link" to="/login">
                Already have an account? Login
              </Link>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;