import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "./routes/landing";
import Login from "./routes/Login";
import Signup from "./routes/Signup";
import Forgot from "./routes/Forgot";
import Reset from "./routes/Reset";
import OAuthSuccess from "./routes/OAuthSuccess";
import Dashboard from "./routes/Dashboard";
import AppNavbar from "./components/Navbar";
import Terms from "./components/Terms";
import Privacy from "./components/Privacy";
import ProfilePage from "./components/ProfilePage";
import Success from "./components/Success";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // jaha navbar hide karna hai
  const hideNavbarRoutes = ["/dashboard"];

  return (
    <>
      {!hideNavbarRoutes.includes(location.pathname) && (
        <AppNavbar theme={theme} toggleTheme={toggleTheme} />
      )}
      <div className="container app-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/reset" element={<Reset />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route
            path="/dashboard"
            element={<Dashboard theme={theme} toggleTheme={toggleTheme} />}
          />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
