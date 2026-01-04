import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { saveAuth } from "../services/auth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const apiBase = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(null);

        if (!email || !password) return setErr("All fields are required");

        setLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const res = await fetch(`${apiBase}/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
                credentials: "include",
            });

            if (!res.ok) {
                const errorText = await res.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    throw new Error("Invalid response from server");
                }
                return setErr(errorData.detail || errorData.message || "Login failed");
            }

            const data = await res.json();
            if (data.access_token) {
                saveAuth(data.access_token, data.refresh_token, data.user);
                navigate("/dashboard");
            } else {
                setErr("Login failed, no token received");
            }
        } catch (error) {
            setErr(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const googleUrl = `${apiBase}/auth/google`;

    // Typewriter heading effect
    const [displayedText, setDisplayedText] = useState("");
    const fullText = "Welcome Back";

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(fullText.slice(0, i + 1));
            i++;
            if (i === fullText.length) clearInterval(interval);
        }, 80);
        return () => clearInterval(interval);
    }, []);


    return (
        <div className="d-flex justify-content-center align-items-center ">
            <div className="card shadow-lg p-4 rounded-4" style={{ minWidth: "450px", maxWidth: "500px" }}>
                {/* Animated Heading */}
                <h2
                    className="text-center mb-3 fw-bold"
                    style={{
                        background: "linear-gradient(90deg, #00ff88, #00b347)", // 🌿 green gradient
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        animation: "gradient 3s ease infinite",
                    }}
                >
                    {displayedText}
                </h2>
                <p className="text-center text-secondary mb-4">
                    Login to your Python Tutor Bot account
                </p>

                {err && <div className="alert alert-danger text-center">{err}</div>}

                {/* Form */}
                <form onSubmit={onSubmit} className="mb-3">
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-success w-100 mb-3 text-white fw-bold"
                        style={{
                            transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="text-center mb-3 text-secondary">OR</div>

                {/* Google Button green outline */}
                <a
                    href={googleUrl}
                    className="btn btn-outline-success w-100 mb-3"
                >
                    Continue with Google
                </a>

                <div className="text-center mb-3">
                    <Link to="/forgot" className="text-success small">
                        Forgot password?
                    </Link>
                </div>

                {/* New SignUp prompt */}
                <div className="text-center mt-3 text-secondary">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-success fw-bold">
                        Sign Up
                    </Link>
                </div>

                {/* ✅ Terms & Privacy links in green */}
                <div className="text-center mt-4 small text-secondary">
                    By logging in, you agree to our{" "}
                    <Link to="/terms" className="text-success">Terms of Use</Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-success">Privacy Policy</Link>.
                </div>
            </div>

            {/* Custom animations */}
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
    );
}
