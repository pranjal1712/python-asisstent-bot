// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// export default function Success() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const token = params.get("token");
//     const refresh = params.get("refresh");

//     if (token && refresh) {
//       localStorage.setItem("access_token", token);
//       localStorage.setItem("refresh_token", refresh);

//       // ✅ Redirect to dashboard after login success
//       navigate("/dashboard");
//     } else {
//       navigate("/login"); // fallback
//     }
//   }, [navigate]);

//   return <p>Redirecting...</p>;
// }


// Success.jsx (example)
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refresh = params.get("refresh");

    console.log("✅ Token param:", token);
    console.log("✅ Refresh param:", refresh);

    if (token && refresh) {
      // ✅ Save tokens in localStorage
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", refresh);

      console.log("✅ Tokens saved to localStorage");
      navigate("/profile"); // Go to profile
    } else {
      console.warn("⚠️ No token found in URL params");
      navigate("/login"); // fallback
    }
  }, [navigate]);

  return <p>Logging you in...</p>;
}



