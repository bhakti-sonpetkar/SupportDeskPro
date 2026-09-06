import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.message || ""
  );
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        username,
        password,
      });

      const {
        access,
        refresh,
        role,
        username: loggedInUsername,
      } = response.data;

      // ADMIN uses Django Admin separately
      if (role === "ADMIN") {
        setError(
          "Admin users must log in through Django Admin."
        );
        return;
      }

      // Save authentication data
      login(
        access,
        refresh,
        role,
        loggedInUsername
      );

      // Role-based navigation
      if (role === "CUSTOMER") {
        navigate("/dashboard");
      } else if (role === "AGENT") {
        navigate("/agent-dashboard");
      } else {
        setError("Invalid user role.");
      }
    } catch (error) {
      console.error(error);

      const data = error.response?.data;

      if (data?.detail) {
        setError(data.detail);
      } else if (data?.non_field_errors) {
        setError(
          Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors
        );
      } else {
        setError("Invalid username or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <h1>SupportDeskPro</h1>
          <p>
            Customer Support & Ticket Management
          </p>
        </div>

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              autoComplete="current-password"
            />
          </div>

          {success && (
            <div className="login-success">
              {success}
            </div>
          )}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        <div className="register-link">
          <span>
            Don't have an account?
          </span>{" "}
          <Link to="/register">
            Register as Customer
          </Link>
        </div>

        <div className="admin-info">
          <strong>Support Agent?</strong>
          <span>
            Agent accounts are created by an administrator.
          </span>
        </div>

      </div>
    </div>
  );
}

export default Login;