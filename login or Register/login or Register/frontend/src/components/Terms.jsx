import React from "react";
import { Link } from "react-router-dom";
import "./Terms.css";

export default function Terms() {
    return (
        <div className="container py-2 terms-page">
            <div className="card shadow-lg border-0 rounded-4 p-4 terms-card">
                <h2 className="mb-4 text-center">Terms of Use</h2>
                <p>
                    Welcome to <strong>PythonBot</strong>! By using this website/app, you
                    agree to the following terms:
                </p>
                <ul>
                    <li><b>PythonBot</b> is a student project created for learning.</li>
                    <li>Responses may not always be correct — use responsibly.</li>
                    <li>We are not responsible for any loss or misuse.</li>
                    <li>Do not use for illegal or harmful activities.</li>
                    <li>App may change or stop anytime without notice.</li>
                </ul>
                <p className="mt-3">By continuing to use PythonBot, you agree to these Terms.</p>
                <div className="text-center mt-4">
                    <Link to="/" className="btn btn-success">Back to Home</Link>
                </div>


            </div>
        </div>
    );
}
