import React from "react";
import { Link } from "react-router-dom";
import "./Privacy.css"; 

export default function Privacy() {
   
     return (
            <div className="container py-2 terms-page">
                <div className="card shadow-lg border-0 rounded-4 p-4 terms-card">
                 <h2 className="mb-4 text-center">Privacy Policy</h2>
                    <p>
                     Your privacy is important to us. Here’s how <strong>PythonBot</strong>{" "}
                     handles your data:
                    </p>
                 <ul>
                     <li>
                         We may collect basic details like your <b>name, email, and login
                             info</b> when you sign up.
                     </li>
                     <li>
                         This data is only used to let you log in and use the app. We do not
                         sell or share your data.
                     </li>
                     <li>
                         Chat inputs may be stored temporarily to improve experience, but
                         they are not shared.
                     </li>
                     <li>
                         Third-party services (like Google Login) may collect basic profile
                         info (name, email).
                     </li>
                     <li>
                         Do not share sensitive personal or financial data in the app.
                     </li>
                     <li>
                         If you want your data deleted, contact us at:{" "}
                         <b>your@email.com</b>.
                     </li>
                 </ul>
                 <p className="mt-3">  This Privacy Policy may change if the project is updated. Please check
                     back for the latest version.</p>
                    <div className="text-center mt-4">
                        <Link to="/" className="btn btn-success">Back to Home</Link>
                    </div>
                </div>
            </div>
        );


}
