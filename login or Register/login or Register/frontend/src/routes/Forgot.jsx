import React, { useState } from "react";
import { postJSON } from "../services/api";

export default function Forgot() {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState(null);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        try {
            await postJSON("/forgot-password", { email });
            setMsg("Reset link sent if email exists.");
        } catch (e) {
            setMsg("Error sending reset link.");
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-6">
                <h2>Forgot Password</h2>
                {msg && <div className="alert alert-info">{msg}</div>}
                <form onSubmit={onSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                    </div>
                    <button className="btn btn-primary w-100">Send reset link</button>
                </form>
            </div>
        </div>
    );
}
