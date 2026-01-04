🤖 Python Assistant Bot (Multimodal AI)

A Python-based intelligent assistant bot that accepts text, image, and voice inputs and responds only to Python-related queries.
The bot is designed with a clean backend architecture, authentication support, and multimodal input handling.

🚀 Features

✅ Python-only responses (non-Python queries are politely rejected)

🗣️ Voice input support (Speech-to-Text)

🖼️ Image input support (OCR-based text extraction)

💬 Text-based chat

🔐 Authentication support (JWT / Google OAuth – optional)

📦 Clean and modular backend structure

⚡ FastAPI-based REST API

🛠️ Tech Stack
Backend

Python 3.10+

FastAPI

Uvicorn

Pydantic

AI / ML

OpenAI Whisper (Speech-to-Text)

OCR (Tesseract / EasyOCR) for image input

LLM API / Local model (for Python explanations)

Other Tools

JWT Authentication

MongoDB (optional – for users & chat history)

Git & GitHub

📂 Project Structure
python-bot/
│
├── Backend/
│   ├── app.py                # FastAPI entry point
│   ├── routes/               # API routes
│   ├── services/             # AI, OCR, Whisper logic
│   ├── auth/                 # Authentication logic
│   ├── utils/                # Helper functions
│   └── models/               # Schemas / DB models
│
├── frontend/                 # React frontend (optional)
│
├── requirements.txt
├── .gitignore
└── README.md

🔐 Python-Only Response Logic

The bot ensures only Python-related questions are answered by using:

Keyword filtering

Pattern matching

Context validation

📌 Example:

❌ “Explain Java inheritance” → Rejected

✅ “Explain Python decorators” → Answered
