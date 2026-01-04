import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  const apiBase = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!username || !email || !password) return setErr("All fields required");

    try {
      const res = await fetch(`${apiBase}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error("Invalid response from server");
        }
        return setErr(errorData.detail || errorData.message || "Signup failed");
      }

      navigate("/dashboard");
    } catch (e) {
      setErr(e.message || "Signup failed");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center position-relative"
      style={{ minHeight: "80vh", overflow: "hidden" }}
    >
      {/* Signup Card */}
      <div
        className="card shadow-lg p-4 rounded-4"
        style={{ minWidth: "350px", maxWidth: "400px", zIndex: 1 }}
      >
        <h2
          className="text-center mb-3 fw-bold"
          style={{
            background: "linear-gradient(90deg, #00c853, #2e7d32)", // 💚 green gradient
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradient 3s ease infinite",
          }}
        >
          Create Account
        </h2>
        <p className="text-center text-secondary mb-4">
          Sign up for your Python Tutor Bot account
        </p>

        {err && <div className="alert alert-danger text-center">{err}</div>}

        <form onSubmit={onSubmit} className="mb-3">
          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              id="floatingUsername"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label htmlFor="floatingUsername">Username</label>
          </div>
          <div className="form-floating mb-3">
            <input
              type="email"
              className="form-control"
              id="floatingEmail"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="floatingEmail">Email</label>
          </div>
          <div className="form-floating mb-4">
            <input
              type="password"
              className="form-control"
              id="floatingPassword"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="floatingPassword">Password</label>
          </div>

          {/* ✅ Checkbox for terms */}
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="termsCheck"
              required
            />
            <label
              className="form-check-label text-secondary small"
              htmlFor="termsCheck"
            >
              I agree to the{" "}
              <Link
                to="/terms"
                target="_blank"
                className="text-success fw-bold"
              >
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                target="_blank"
                className="text-success fw-bold"
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            className="btn w-100 mb-3 text-white fw-bold"
            style={{
              background: "linear-gradient(90deg, #00c853, #2e7d32)", // 💚 green gradient
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            Create Account
          </button>
        </form>

        <div className="text-center mt-3 text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-success fw-bold">
            Login
          </Link>
        </div>

        {/* CSS for animated gradient */}
        <style>
          {`
            @keyframes gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}
        </style>
      </div>
    </div>
  );
}
