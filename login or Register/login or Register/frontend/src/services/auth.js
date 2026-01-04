// src/services/auth.js

// Save tokens and user info in localStorage
export const saveAuth = (accessToken, refreshToken, user) => {
  if (accessToken) {
    localStorage.setItem("access_token", accessToken);  // ✅ matches ProfilePage.jsx
  }
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
  }
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

// Get access token
export const getAccessToken = () => {
  return localStorage.getItem("access_token");
};

// Clear everything on logout
export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};
