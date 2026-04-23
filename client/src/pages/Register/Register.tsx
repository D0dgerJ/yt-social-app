import axios from "axios";
import "./Register.scss";
import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { registerUser } from "../../utils/api/auth.api";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

interface AuthData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 6;

const Register: React.FC = () => {
  const [auth, setAuth] = useState<AuthData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const validateRegisterForm = (data: AuthData): string | null => {
    const username = data.username.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    if (username.length < USERNAME_MIN_LENGTH) {
      return t("auth.usernameMin", { count: USERNAME_MIN_LENGTH });
    }

    if (!EMAIL_REGEX.test(email)) {
      return t("auth.invalidEmail");
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return t("auth.passwordMin", { count: PASSWORD_MIN_LENGTH });
    }

    if (data.confirmPassword !== password) {
      return t("auth.passwordsDoNotMatch");
    }

    return null;
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateRegisterForm(auth);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const user = await registerUser({
        username: auth.username.trim(),
        email: auth.email.trim().toLowerCase(),
        password: auth.password,
      });

      dispatch({ type: "LOGIN_SUCCESS", payload: user });

      toast.success(t("auth.welcome", { username: user.username }));
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || t("auth.somethingWentWrong"));
      } else {
        toast.error(t("auth.somethingWentWrong"));
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="auth-brand__badge">DodgerJ Social</div>
          <h1 className="auth-brand__title">{t("auth.registerTitle")}</h1>
          <p className="auth-brand__text">{t("auth.registerText")}</p>

          <div className="auth-brand__features">
            <div className="auth-brand__feature">{t("auth.registerFeature1")}</div>
            <div className="auth-brand__feature">{t("auth.registerFeature2")}</div>
            <div className="auth-brand__feature">{t("auth.registerFeature3")}</div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card__header">
              <div className="auth-card__header-top">
                <h2>{t("auth.registerCardTitle")}</h2>
                <span className="auth-mini-logo">DJS</span>
              </div>
              <p>{t("auth.registerCardText")}</p>
            </div>

            <form onSubmit={handleRegister} className="auth-form">
              <label className="auth-field">
                <span>{t("common.username")}</span>
                <input
                  type="text"
                  placeholder={t("auth.chooseUsername")}
                  className="auth-input"
                  value={auth.username}
                  onChange={(e) =>
                    setAuth((prev) => ({ ...prev, username: e.target.value }))
                  }
                  required
                  minLength={USERNAME_MIN_LENGTH}
                />
              </label>

              <label className="auth-field">
                <span>{t("common.email")}</span>
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
                <span>{t("common.password")}</span>
                <input
                  type="password"
                  placeholder={t("auth.createPassword")}
                  className="auth-input"
                  value={auth.password}
                  onChange={(e) =>
                    setAuth((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                />
              </label>

              <label className="auth-field">
                <span>{t("auth.confirmPassword")}</span>
                <input
                  type="password"
                  placeholder={t("auth.repeatPassword")}
                  className="auth-input"
                  value={auth.confirmPassword}
                  onChange={(e) =>
                    setAuth((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                />
              </label>

              <button type="submit" className="auth-submit">
                {t("auth.signUp")}
              </button>

              <Link className="auth-secondary auth-secondary--link" to="/login">
                {t("auth.alreadyHaveAccount")}
              </Link>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;