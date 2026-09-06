import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");

    // Password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Minimum password length
    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register/", {
        username,
        email,
        password,
      });

      navigate("/login", {
        state: {
          message:
            "Registration successful. You can now log in.",
        },
      });
    } catch (error) {
      console.error(error);

      const data = error.response?.data;

      if (data) {
        if (data.username) {
          setError(
            Array.isArray(data.username)
              ? data.username[0]
              : data.username
          );
        } else if (data.email) {
          setError(
            Array.isArray(data.email)
              ? data.email[0]
              : data.email
          );
        } else if (data.password) {
          setError(
            Array.isArray(data.password)
              ? data.password[0]
              : data.password
          );
        } else if (data.detail) {
          setError(data.detail);
        } else if (data.non_field_errors) {
          setError(
            Array.isArray(data.non_field_errors)
              ? data.non_field_errors[0]
              : data.non_field_errors
          );
        } else {
          setError(
            "Registration failed. Please check your details."
          );
        }
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <div className="register-header">
          <h1>SupportDeskPro</h1>
          <p>
            Create your customer account
          </p>
        </div>

        <form onSubmit={handleRegister}>

          <div className="register-form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
              autoComplete="username"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Customer Account"}
          </button>

        </form>

        <div className="login-link">
          <span>
            Already have an account?
          </span>{" "}
          <Link to="/login">
            Login
          </Link>
        </div>

        <div className="agent-info">
          <strong>Support Agent?</strong>
          <span>
            Agent accounts are created by an administrator.
          </span>
        </div>

      </div>
    </div>
  );
}

export default Register;
