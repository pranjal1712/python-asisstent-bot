import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { postJSON } from "../services/api";

export default function Reset() {
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState < string | null > (null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") || "";

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await postJSON("/reset-password", { token, new_password: password });
            setMsg("Password reset successful.");
            setTimeout(() => navigate("/login"), 1500);
        } catch (e) {
            setMsg("Reset failed.");
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-6">
                <h2>Reset Password</h2>
                {msg && <div className="alert alert-info">{msg}</div>}
                <form onSubmit={onSubmit}>
                    <div className="mb-3">
                        <label className="form-label">New password</label>
                        <input className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
                    </div>
                    <button className="btn btn-primary w-100">Reset</button>
                </form>
            </div>
        </div>
    );
}
