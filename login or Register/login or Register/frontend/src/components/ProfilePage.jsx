import React, { useState, useEffect } from "react";
import { getAccessToken, clearAuth } from "../services/auth";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error message

useEffect(() => {
  const token = getAccessToken();
  console.log("Token from localStorage:", token);

  if (!token) {
    console.warn("⚠️ No token found, redirecting to login...");
    setError("Not logged in");
    setLoading(false);
    return;
  }

  fetch("http://127.0.0.1:8000/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      console.log("Response status:", res.status);
      if (!res.ok) throw new Error("Not logged in");
      return res.json();
    })
    .then((data) => {
      console.log("✅ User data received:", data);
      setUser(data);
      setUsername(data.username);
    })
    .catch((err) => {
      console.error("❌ Error fetching profile:", err);
      setError("Failed to fetch user profile");
      setUser(null);
    })
    .finally(() => setLoading(false));
}, []);


  const handleUpdate = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Not logged in");
      return;
    }

    const formData = new FormData();
    if (username) formData.append("username", username);
    if (file) formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/users/me", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      console.log("Profile update response:", data);
      alert(data.msg || "Profile updated!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!user) return <p>No user data available.</p>;

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-3">Edit Profile</h2>

      {/* ✅ Logout button */}
      <button
        onClick={() => {
          clearAuth(); // localStorage se sab auth data clear
          window.location.href = "/login"; // redirect to login page
        }}
        className="bg-red-500 text-white px-4 py-2 rounded mb-3"
      >
        Logout
      </button>

      <img
        src={user.profile_image || "/default-avatar.png"}
        alt="avatar"
        className="w-20 h-20 rounded-full mb-3"
      />
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-2"
      />
      <button
        onClick={handleUpdate}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Save Changes
      </button>
    </div>
  );

}
