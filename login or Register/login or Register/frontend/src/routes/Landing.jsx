// src/routes/Landing.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AnimatedCards from "../components/AnimatedCards";

export default function Landing() {
  // Rotating dynamic text
  const rotatingTexts = [
    "Master Python with instant AI guidance – Learn, Practice & Code smarter.",
    "Your personal Python mentor, ready to answer questions step by step.",
    "Ask anything about Python, debug your code, and level up your skills.",
    "Learn Python faster, practice smarter, and get clear explanations in real-time.",
    "Stuck with Python? Ask your AI tutor and get quick, easy-to-understand answers!"
  ];

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3000); // every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-5 px-4">
      {/* Logo */}
      <img
        src="/logo.png"
        alt="Python Tutor Bot"
        className="mx-auto mb-3"
        style={{ width: "80px", height: "80px" }}
      />

      {/* Heading */}
      <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
        Python Tutor Bot
      </h1>

      {/* Dynamic Rotating Text */}
      <p className="lead mb-4 text-secondary dark:text-light transition-opacity duration-500">
        {rotatingTexts[currentTextIndex]}
      </p>

      {/* Feature List */}
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
        <li>Real-time Python code explanations</li>
        
      </ul>

      {/* Buttons */}
      <div className="mt-3 d-flex justify-content-center flex-wrap gap-3">
        <Link to="/dashboard" className="btn btn-success btn-lg px-4 shadow-sm">
          🚀 Get Started
        </Link>
        <Link to="/login" className="btn btn-outline-success btn-lg px-4">
          Login
        </Link>
      </div>

      {/* Animated Cards Section */}
      <div className="mt-5">
        <AnimatedCards />
      </div>
    </div>
  );
}
