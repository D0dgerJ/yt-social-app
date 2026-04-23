import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { loginUser } from "../../utils/api/auth.api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./Login.scss";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

const Login: React.FC = () => {
  const [auth, setAuth] = useState({ email: "", password: "" });

  const { isFetching, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const invalidLoginMessage = t("auth.invalidEmailOrPassword");

  const validateLoginForm = (email: string, password: string): string | null => {
    if (!EMAIL_REGEX.test(email)) {
      return invalidLoginMessage;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return invalidLoginMessage;
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
        ? err.response?.data?.message || invalidLoginMessage
        : invalidLoginMessage;

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
          <h1 className="auth-brand__title">{t("auth.loginTitle")}</h1>
          <p className="auth-brand__text">{t("auth.loginText")}</p>

          <div className="auth-brand__features">
            <div className="auth-brand__feature">{t("auth.loginFeature1")}</div>
            <div className="auth-brand__feature">{t("auth.loginFeature2")}</div>
            <div className="auth-brand__feature">{t("auth.loginFeature3")}</div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card__header">
              <div className="auth-card__header-top">
                <h2>{t("auth.loginCardTitle")}</h2>
                <span className="auth-mini-logo">DJS</span>
              </div>
              <p>{t("auth.loginCardText")}</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <label className="auth-field">
                <span>{t("common.email")}</span>
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
                <span>{t("common.password")}</span>
                <input
                  type="password"
                  placeholder={t("auth.loginPasswordPlaceholder")}
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
                {isFetching ? t("auth.loggingIn") : t("auth.login")}
              </button>

              <button
                className="auth-secondary"
                type="button"
                onClick={() => navigate("/register")}
              >
                {t("auth.createNewAccount")}
              </button>

              <button
                className="auth-link"
                type="button"
                onClick={() => {}}
              >
                {t("auth.forgotPassword")}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;