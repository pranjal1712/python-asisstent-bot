import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# ========== LOGIN / AUTH CONFIG ==========
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# JWT Secret
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-if-not-found")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Email (for password reset / notifications)
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# ========== BOT CONFIG ==========
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")  # or llama3-70b-8192, gemma, etc.

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables.")

# ========== DATABASE CONFIG ==========
# NOTE: dono me alag variable names the (MONGO_URI / MONGO_URL) → ek hi kar dete hain
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URL") or "mongodb://localhost:27017/"
DB_NAME = os.getenv("DB_NAME", "chatbot_db")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
