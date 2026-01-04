import requests
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
import io



# Update this to your FastAPI server's URL
API_URL =  "http://127.0.0.1:8000/chat"

def record_audio(duration=5, samplerate=16000):
    print(f"🎤 Recording for {duration} seconds...")
    audio = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype='int16')
    sd.wait()
    buffer = io.BytesIO()
    wav.write(buffer, samplerate, audio)
    buffer.seek(0)
    return buffer

def send_audio(file_buffer):
    files = {"file": ("audio.wav", file_buffer, "audio/wav")}
    headers = {
        "accept": "application/json",
        # "Authorization": "Bearer <your_jwt_token>"  # Add if login system is integrated
    }
    response = requests.post(API_URL, files=files, headers=headers)
    print("📨 Status Code:", response.status_code)
    try:
        print("🧠 Response:", response.json())
    except Exception as e:
        print("⚠️ Error parsing response:", e)

def test_audio_input():
    audio_buffer = record_audio()
    send_audio(audio_buffer)

if __name__ == "__main__":
    test_audio_input()
