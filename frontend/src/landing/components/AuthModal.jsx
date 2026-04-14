import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { login, signup } from "../../api/auth";

const modeConfig = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in with your username and password.",
    cta: "Sign In",
  },
  signup: {
    title: "Get started",
    subtitle: "Create your account with a custom username and password.",
    cta: "Sign Up",
  },
};

const initialState = { username: "", password: "", confirmPassword: "" };

function validate(mode, values) {
  const errors = {};

  if (!values.username.trim()) {
    errors.username = "Username is required.";
  } else if (values.username.trim().length < 3) {
    errors.username = "Use at least 3 characters.";
  }

  if (!values.password.trim()) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }

  if (mode !== "login") {
    if (!values.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

export default function AuthModal({ isOpen, mode, onClose, onModeChange, onAuthSuccess }) {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("Username and password authentication only.");

  const config = useMemo(() => modeConfig[mode] ?? modeConfig.login, [mode]);

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({});
      setStatus("idle");
      setStatusMessage("Username and password authentication only.");
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    if (status !== "idle") {
      setStatus("idle");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(mode, values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setStatus("error");
      setStatusMessage("Please correct the highlighted fields.");
      return;
    }

    try {
      setStatus("loading");
      setStatusMessage(mode === "login" ? "Signing you in..." : "Creating your account...");
      const payload = { username: values.username.trim(), password: values.password };
      const response = mode === "login" ? await login(payload) : await signup(payload);
      setStatus("success");
      setStatusMessage(mode === "login" ? "Signed in successfully." : "Account created successfully.");
      onAuthSuccess?.(response);
      onClose();
    } catch (error) {
      setStatus("error");
      const fallbackMessage =
        error?.code === "ECONNABORTED"
          ? "Request timed out. Check whether the backend database connection is working."
          : error?.message === "Network Error"
            ? "Cannot reach the backend server. Make sure it is running on http://localhost:8000."
            : "Authentication failed. Please try again.";
      setStatusMessage(error?.response?.data?.detail || fallbackMessage);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="auth-modal__close" onClick={onClose} aria-label="Close authentication modal">
              ×
            </button>

            <div className="auth-modal__intro">
              <span className="eyebrow eyebrow--glow">Secure access</span>
              <h2>{config.title}</h2>
              <p>{config.subtitle}</p>
            </div>

            <div className="auth-modal__switch">
              {Object.keys(modeConfig).map((modeKey) => (
                <button
                  className={modeKey === mode ? "is-active" : ""}
                  key={modeKey}
                  onClick={() => onModeChange(modeKey)}
                  type="button"
                >
                  {modeKey === "signup" ? "Sign Up" : "Sign In"}
                </button>
              ))}
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label className={`auth-field ${errors.username ? "has-error" : status === "success" ? "is-success" : ""}`}>
                <span>Username</span>
                <input
                  autoComplete="username"
                  name="username"
                  onChange={handleChange}
                  placeholder="Enter your username"
                  type="text"
                  value={values.username}
                />
                {errors.username ? <small>{errors.username}</small> : null}
              </label>

              <label className={`auth-field ${errors.password ? "has-error" : status === "success" ? "is-success" : ""}`}>
                <span>Password</span>
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  name="password"
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  type="password"
                  value={values.password}
                />
                {errors.password ? <small>{errors.password}</small> : null}
              </label>

              {mode !== "login" ? (
                <label
                  className={`auth-field ${
                    errors.confirmPassword ? "has-error" : status === "success" ? "is-success" : ""
                  }`}
                >
                  <span>Confirm Password</span>
                  <input
                    autoComplete="new-password"
                    name="confirmPassword"
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    type="password"
                    value={values.confirmPassword}
                  />
                  {errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}
                </label>
              ) : null}

              <button className="button button--primary auth-form__submit" type="submit">
                {status === "loading" ? "Please wait..." : config.cta}
              </button>

              <div className={`auth-form__status auth-form__status--${status}`}>
                {statusMessage}
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
