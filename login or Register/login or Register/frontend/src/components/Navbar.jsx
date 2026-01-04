import React, { useState, useEffect } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";

export default function AppNavbar() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Theme Apply
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);



  // ✅ Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // dummy user info (API se replace karna)
      setUser({ name: "Google User", email: "test@gmail.com" });
    }
  }, []);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    navigate("/");
  };

  return (
    <Navbar
      bg={darkMode ? "dark" : "light"}
      variant={darkMode ? "dark" : "light"}
      expand="lg"
      className="shadow-sm"
    >
      <Container>
        {/* Left Side - Logo + Brand */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src="/logo.png"
            alt="Python Bot"
            className="me-1"
            style={{ width: "40px", height: "40px" }}
          />
          <span className="fw-bold fs-4">Python Bot</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* ✅ If Logged in → Profile Dropdown */}
            {user ? (
              <NavDropdown
                title={user.name || "Profile"}
                id="profile-dropdown"
                align="end"
              >
                <NavDropdown.Item disabled>{user.email}</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link
                as={Link}
                to="/login"
                className="px-3 py-1 rounded border border-success text-success fw-semibold mx-1"
                style={{ transition: "0.3s" }}
              >
                Login
              </Nav.Link>
            )}

            {/* ✅ Terms & Privacy only on Landing Page */}
            {location.pathname === "/" && (
              <>
                <Nav.Link as={Link} to="/terms" className="mx-2">
                  Terms
                </Nav.Link>
                <Nav.Link as={Link} to="/privacy" className="mx-2">
                  Privacy
                </Nav.Link>
              </>
            )}

            {/* Dark Mode Toggle Button */}
            <Nav.Link
              onClick={() => setDarkMode(!darkMode)}
              style={{ cursor: "pointer", fontSize: "1.2rem" }}
              title="Toggle Dark Mode"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
