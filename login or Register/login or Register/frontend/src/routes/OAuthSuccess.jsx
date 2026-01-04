import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveAuth } from "../services/auth";
import { getJSON } from "../services/api";
import qs from "qs";

// This route handles:
// 1) backend redirect to /oauth-success?access_token=...&refresh_token=...&user=...
// 2) backend redirect with code -> the backend should exchange and redirect with tokens
// 3) in case backend returned a JSON response (if you call it via fetch), you can adapt.

export default function OAuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // 1. tokens in query string
        const access = searchParams.get("access_token");
        const refresh = searchParams.get("refresh_token");
        const user = searchParams.get("user");

        if (access) {
            saveAuth(access, refresh || undefined, user ? JSON.parse(decodeURIComponent(user)) : undefined);
            navigate("/dashboard");
            return;
        }

        // 2. If backend redirected with a short code, you can also call backend to return tokens.
        const code = searchParams.get("code");
        if (code) {
            // if backend expects the code, call backend endpoint to exchange (if your backend isn't already exchanging)
            // For our setup backend /auth/google already exchanges and returns tokens - so ideally backend redirects to oauth-success with tokens.
            // fallback: call backend endpoint /auth/google/finalize?code=...
            (async () => {
                try {
                    const apiBase = import.meta.env.VITE_API_BASE;
                    const resp = await fetch(`${apiBase}/auth/google/callback?code=${encodeURIComponent(code)}`, { credentials: "include" });
                    const data = await resp.json();
                    if (data.access_token) {
                        saveAuth(data.access_token, data.refresh_token, data.user);
                        navigate("/dashboard");
                    } else {
                        navigate("/login");
                    }
                } catch (err) {
                    navigate("/login");
                }
            })();
            return;
        }

        // else just go to login
        navigate("/login");
    }, []);

    return <div className="text-center py-5">Signing in...</div>;
}
