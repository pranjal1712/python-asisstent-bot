import os
from dotenv import load_dotenv
from email.message import EmailMessage
import smtplib

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS") or ""
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD") or ""

if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
    raise ValueError("EMAIL_ADDRESS or EMAIL_PASSWORD is not set in the .env file")

def send_reset_email(to_email: str, token: str):
    msg = EmailMessage()
    msg['Subject'] = 'Password Reset Link'
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to_email

    reset_link = f"http://localhost:3000/reset-password?token={token}"
    msg.set_content(f"Click the link to reset your password: {reset_link}")

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        smtp.send_message(msg)
