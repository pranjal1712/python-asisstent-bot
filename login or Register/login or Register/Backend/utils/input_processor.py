import pytesseract
from PIL import Image
import tempfile
import os
from io import BytesIO
from faster_whisper import WhisperModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
whisper_model = WhisperModel("models/whisper", compute_type="float32")


def extract_text_from_image(file):
    try:
        if hasattr(file, "file"):  # UploadFile
            image = Image.open(file.file)
        elif isinstance(file, bytes):
            image = Image.open(BytesIO(file))
        elif hasattr(file, "read"):  # BytesIO-like
            image = Image.open(file)
        else:
            raise TypeError("Unsupported file type for image extraction.")
        text = pytesseract.image_to_string(image, config='--psm 6')
        logger.info("✅ Extracted text from image successfully.")
        return text.strip()
    except Exception as e:
        logger.exception("❌ Image to text conversion failed")
        raise RuntimeError(f"Failed to extract text from image: {e}")

def transcribe_audio_to_text(file):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            if hasattr(file, "file"):
                temp_audio.write(file.file.read())
            elif isinstance(file, bytes):
                temp_audio.write(file)
            elif hasattr(file, "read"):
                temp_audio.write(file.read())
            else:
                raise TypeError("Unsupported file type for audio transcription.")
            temp_path = temp_audio.name

        segments, _ = whisper_model.transcribe(temp_path)
        os.remove(temp_path)
        transcription = " ".join([seg.text for seg in segments])
        logger.info("✅ Audio transcription completed successfully.")
        return transcription.strip()
    except Exception as e:
        logger.exception("❌ Audio to text transcription failed")
        raise RuntimeError(f"Failed to transcribe audio to text: {e}")
