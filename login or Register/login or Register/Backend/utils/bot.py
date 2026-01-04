# bot.py - Final Python Tutor Bot with Async, Memory, WhatsApp-style, Python-only enforcement

import asyncio
import httpx
import logging
import json
import os
import re
import time
from threading import Lock, Timer
from difflib import SequenceMatcher
from config import GROQ_API_KEY, GROQ_MODEL
from utils.input_processor import extract_text_from_image, transcribe_audio_to_text
from utils.history import get_history, delete_history, delete_oldest_history

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ----------------------- Constants & Config -----------------------
MEMORY_FILE = "conversation_memory.json"
MEMORY_EXPIRY_SECONDS = 3600  # 1 hour
MAX_INPUT_CHARS = 5000
MAX_HISTORY_CHARS = 12000
MAX_PAYLOAD_BYTES = 8000
FUZZY_THRESHOLD = 0.85
ALLOWED_LANGS = {
    "english", "hindi", "spanish", "french", "german", "marathi", "bengali", 
    "telugu", "urdu" , "watanabe", "tamil", "kannada", "malayalam", "gujarati", 
    "punjabi", "assamese", "odia" 
}

memory_lock = Lock()
conversation_memory = {}
_save_timer = None
_save_pending = False

# ----------------------- Memory Management -----------------------
def load_memory():
    with memory_lock:
        if os.path.exists(MEMORY_FILE):
            try:
                with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
            normalized = {}
            for uid, val in data.items():
                if isinstance(val, dict) and "messages" in val:
                    normalized[uid] = val
                elif isinstance(val, list):
                    normalized[uid] = {
                        "messages": val,
                        "last_topic": None,
                        "forced_lang": None
                    }
                else:
                    normalized[uid] = {
                        "messages": [],
                        "last_topic": None,
                        "forced_lang": None
                    }
            return normalized
        return {}

def _save_memory_deferred():
    global _save_pending
    with memory_lock:
        if _save_pending:
            try:
                with open(MEMORY_FILE, "w", encoding="utf-8") as f:
                    json.dump(conversation_memory, f, ensure_ascii=False, indent=4)
                logger.info("Conversation memory saved (deferred).")
                _save_pending = False
            except Exception as e:
                logger.error(f"Error saving memory file: {e}")

def save_memory_debounced():
    global _save_timer, _save_pending
    with memory_lock:
        _save_pending = True
    if _save_timer and _save_timer.is_alive():
        return
    _save_timer = Timer(2.0, _save_memory_deferred)
    _save_timer.start()

def cleanup_memory():
    now = time.time()
    to_delete = []
    with memory_lock:
        for uid in list(conversation_memory.keys()):
            bucket = conversation_memory.get(uid, {})
            msgs = bucket.get("messages", [])
            if not msgs:
                to_delete.append(uid)
                continue
            ts = msgs[-1].get("timestamp")
            if ts is None or (now - ts) > MEMORY_EXPIRY_SECONDS:
                to_delete.append(uid)
        for uid in to_delete:
            conversation_memory.pop(uid, None)
    if to_delete:
        save_memory_debounced()

def ensure_user_bucket(user_id):
    with memory_lock:
        if user_id not in conversation_memory:
            conversation_memory[user_id] = {
                "messages": [],
                "last_topic": None,
                "forced_lang": None
            }

def append_message(user_id, role, content):
    ensure_user_bucket(user_id)
    with memory_lock:
        conversation_memory[user_id]["messages"].append({
            "role": role,
            "content": content,
            "timestamp": time.time()
        })
    save_memory_debounced()

conversation_memory = load_memory()

# ----------------------- Helpers -----------------------
def get_truncated_for_api(text, limit=MAX_INPUT_CHARS):
    return text[:limit] if text and len(text) > limit else text

def truncate_history_for_api(messages, limit_chars=MAX_HISTORY_CHARS):
    combined = ""
    safe_msgs = []
    for msg in reversed(messages):
        chunk = f"{msg.get('role','unknown')}:{msg.get('content','')}\n"
        if len(combined) + len(chunk) > limit_chars:
            break
        combined = chunk + combined
        safe_msgs.insert(0, msg)
    api_msgs = [{"role": m.get("role", "user"), "content": get_truncated_for_api(m.get("content", ""))} for m in safe_msgs]
    return api_msgs

def is_payload_safe(payload_obj, max_bytes=MAX_PAYLOAD_BYTES) -> bool:
    try:
        s = json.dumps(payload_obj, ensure_ascii=False).encode("utf-8")
        return len(s) <= max_bytes
    except Exception:
        return False

# ----------------------- WhatsApp-style Normalization -----------------------
def normalize_input(text: str) -> str:
    replacements = {
        "kya":"what","kaise":"how","hai":"is","ho":"are","krna":"do","karna":"do",
        "pls":"please","plz":"please","msg":"message","u":"you","r":"are","k":"ok",
        "lol":"laugh","idk":"i don't know","btw":"by the way","thx":"thanks",
        "bhai":"bro","yaar":"bro","nahi":"no","tho":"then","hu":"am","rha":"is",
        "dekh":"look","kaun":"who","kyu":"why","kyunki":"because","hoga":"will be",
        "abhi":"right now","ab":"now","kaafi":"enough","achha":"good","acha":"good",
        "chalo":"let's go","bs":"just","bas":"just","matlab":"meaning","samajh":"understand",
        "sahi hai":"is correct","jaldi":"quickly","jaldi karo":"do quickly",
        "ka":"of","bata":"tell","batao":"tell","kar":"do","kya kar raha hai":"what are you doing"
    }
    text_lower = text.lower()
    for slang, full in replacements.items():
        text_lower = re.sub(r'\b' + re.escape(slang) + r'\b', full, text_lower)
    return text_lower

def to_whatsapp_style(text: str) -> str:
    replacements = {
        "you":"u","are":"r","please":"plz","thanks":"thx","thank you":"thx",
        "okay":"k","hello":"hey","hi":"hey","good morning":"gm ☀️","good night":"gn 🌙",
        "see you":"cu","great":"gr8","love":"luv","laugh":"lol","really":"rlly",
        "because":"cuz","message":"msg","sure":"shur","don't":"dont","did not":"didn't",
        "what":"wat","for":"4","before":"b4","to":"2","too":"2","tonight":"2nite",
        "later":"l8r","please call me":"plz call me","are you":"r u",
        "see":"c","okay thanks":"ok thx","as soon as possible":"asap",
        "by the way":"btw","talk to you later":"ttyl","oh my god":"omg",
        "laughing out loud":"lol","for your information":"fyi","be right back":"brb",
        "got to go":"gtg","i don't know":"idk","in my opinion":"imo",
        "in my humble opinion":"imho","see you later":"cul8r","love you":"luv u",
        "call me":"cm","nothing much":"nm","not much":"nm","anyway":"anyways",
        "take care":"tc","good afternoon":"ga","be careful":"b careful","have fun":"hv fun",
    }
    text_lower = text.lower()
    for formal, slang in replacements.items():
        text_lower = re.sub(r'\b' + re.escape(formal) + r'\b', slang, text_lower)
    if "thanks" in text_lower or "thx" in text_lower: text_lower += " 🙏"
    if "lol" in text_lower: text_lower += " 😂"
    if "bye" in text_lower: text_lower += " 👋"
    if len(text_lower) > 0: text_lower = text_lower[0].upper() + text_lower[1:]
    return text_lower

# ----------------------- Python Detection -----------------------
PYTHON_PATTERNS = [r"\b" + kw + r"\b" for kw in [
    "False","True","None","and","as","assert","break","class","continue","def","del",
    "elif","else","except","finally","for","from","global","if","import","in","is",
    "lambda","nonlocal","not","or","pass","raise","return","try","while","with","yield",
    "print","input","open","int","float","str","list","dict","set","tuple","bool",
    "range","enumerate","zip","map","filter","reduce","max","min","sum","any","all",
    "sorted","reversed","staticmethod","classmethod","property","self","super"
]]
PYTHON_REGEX = re.compile("|".join(PYTHON_PATTERNS), re.IGNORECASE)
FUZZY_KEYWORDS = [w.lower() for w in [
    "python","flask","django","pandas","numpy","scipy","matplotlib","seaborn","sklearn",
    "fastapi","asyncio","pytest","tkinter","requests","json","os","sys","subprocess",
    "threading","multiprocessing","re","logging","email","shutil","datetime","time",
    "calendar","function","variable","loop","iterator","generator","comprehension",
    "class","object","inheritance","polymorphism","encapsulation","method","attribute"
]]
OTHER_LANGS = re.compile(
    r"\b("
    # Languages except Python
    r"java|c|c\+\+|c#|javascript|js|typescript|php|ruby|rust|go|swift|kotlin|objective-c|dart|scala|"
    r"perl|haskell|lua|r|matlab|vba|fortran|cobol|groovy|bash|shell|sh|powershell|f#|elixir|julia|erlang|assembly|sql|html|css|xml|json|yaml|"
    # Frameworks / Libraries except Python ones
    r"react|angular|vue|node\.js|express|laravel|symfony|rails|spring|flutter|xamarin|unity|unreal|bootstrap|jquery|webpack|babel|npm|yarn|"
    r"tensorflow|pytorch|keras|opencv|vuejs|next\.js|nuxt|nestjs|svelte|tailwind|electron|cordova|react-native|"
    # Platforms / Cloud / DevOps
    r"aws|azure|gcp|docker|kubernetes|heroku|digitalocean|vagrant|terraform|ansible|jenkins|ci/cd|linux|unix|windows|macos|ubuntu|centos|debian|"
    # Generic programming terms except Python keywords
    r"interface|pointer|array|stack|queue|tree|graph|hash|algorithm|data structure|api|server|client|frontend|backend|ui|ux|database|nosql|git|github|cli|terminal|container|blockchain|smart contract|solidity|ethereum|rest|graphql|microservices|mvc|mvvm|design pattern|singleton|factory|observer|decorator|adapter|facade|strategy|iterator|prototype|module|package|script|thread|process|concurrency|parallelism|asynchronous|synchronous|event loop|promise|callback|exception|debug|log|logging|monitoring|profiling|optimization|performance|refactor|test|unit test|integration test|mock|stubbing|deployment"
    r")\b",
    re.IGNORECASE
)


def is_python_related(text: str) -> bool:
    if not text: return False
    t = text.lower()
    if OTHER_LANGS.search(t): return False
    if PYTHON_REGEX.search(t): return True
    words = re.findall(r"\w+", t)
    for word in words:
        for kw in FUZZY_KEYWORDS:
            if SequenceMatcher(None, word, kw).ratio() >= FUZZY_THRESHOLD: return True
    return "python" in t

def is_greeting(text: str) -> bool:
    greetings_keywords = ["hi","hello","hey","hii","hiii","hola","namaste","good morning","good afternoon","good evening","morning","evening"]
    if not text: return False
    clean = text.strip().lower()
    return any(clean.startswith(g) for g in greetings_keywords)

async def query_codellama(user_id: str, user_message: str, max_tokens: int = 1500, temperature: float = 0.75):
    cleanup_memory()
    ensure_user_bucket(user_id)
    append_message(user_id, "user", user_message)

    if not is_python_related(user_message):
        return {"user_id": user_id, "response": {"type": "message", "text": "Only Python-related queries allowed", "code": None}}

    with memory_lock:
        conversation_memory[user_id]["last_topic"] = "python"
        last_topic = conversation_memory[user_id].get("last_topic")
        forced_lang = conversation_memory[user_id].get("forced_lang")
        user_messages_copy = list(conversation_memory[user_id]["messages"])

    system_prompt = "You are an expert Python tutor. Answer clearly, in detail, with examples and step-by-step reasoning."
    if last_topic == "python":
        system_prompt += " Continue answering Python-related questions with detailed explanations and examples."
    if forced_lang:
        system_prompt += f" Respond only in {forced_lang}."

    api_history = truncate_history_for_api(user_messages_copy, limit_chars=MAX_HISTORY_CHARS)
    messages_for_api = [{"role": "system", "content": system_prompt}] + api_history
    payload = {
        "model": GROQ_MODEL,  # e.g. "llama-3.3-70b-versatile"
        "messages": messages_for_api,
        "max_tokens": max_tokens,
        "temperature": temperature
    }

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            answer = data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        logger.error(f"Groq API returned error: {e.response.text}")
        answer = f"Error from LLM: {e.response.text}"
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        answer = f"Error from LLM: {str(e)}"

    append_message(user_id, "assistant", answer)
    whatsapp_answer = to_whatsapp_style(answer)
    return {"user_id": user_id, "response": {"type": "text", "text": whatsapp_answer, "code": None}}


# ----------------------- Process Input -----------------------
async def process_input(user_id, text=None, image=None, audio=None):
    llm_output = ""
    user_id = str(user_id).strip()
    ensure_user_bucket(user_id)

    if not text and not image and not audio:
        return {"user_id": user_id, "response": {"type": "error", "text": "At least one input required", "code": None}}

    async def process_text_input(input_text):
        normalized_text = normalize_input(input_text or "")
        if normalized_text.strip().lower() in ("clear history", "reset chat"):
            await delete_history(user_id)
            with memory_lock:
                conversation_memory.pop(user_id, None)
            save_memory_debounced()
            return {"user_id": user_id, "response": {"type": "message", "text": "Chat history cleared", "code": None}}
        if is_greeting(normalized_text):
            return {"user_id": user_id, "response": {"type": "message", "text": f"Hey 👋 {user_id}!", "code": None}}
        if not is_python_related(normalized_text):
            return {"user_id": user_id, "response": {"type": "message", "text": "Only Python-related queries allowed", "code": None}}
        return await query_codellama(user_id, normalized_text)

    if image:
        extracted_text = await asyncio.to_thread(extract_text_from_image, image) or ""
        llm_output = await process_text_input(extracted_text)
    elif audio:
        audio_text = await asyncio.to_thread(transcribe_audio_to_text, audio) or ""
        llm_output = await process_text_input(audio_text)
    elif text:
        llm_output = await process_text_input(text)

    # Trim old history
    history = await get_history(user_id)
    if isinstance(history, list) and len(history) > 20:
        await delete_oldest_history(user_id, len(history) - 20)

# ---------------- GPT-style Markdown & Code Preservation ----------------
    llm_output_str = llm_output.get("response", {}).get("text") if isinstance(llm_output, dict) else ""

# Extract all code blocks
    code_match = re.findall(r"```(?:\w+)?\n([\s\S]*?)```", llm_output_str)
    code = "\n\n".join([block.strip() for block in code_match]) if code_match else None

# Extract explanation without code
    explanation = re.sub(r"```(?:\w+)?\n[\s\S]*?```", "", llm_output_str).strip()

# GPT-style formatting: capitalize first letter of each paragraph
    if explanation:
      paragraphs = [p.strip() for p in explanation.split("\n\n")]
      paragraphs = [p[0].upper() + p[1:] if p else "" for p in paragraphs]
      explanation = "\n\n".join(paragraphs)

# Convert headings (lines ending with :) to bold for better display
    explanation = re.sub(r"^(.*?:)$", r"**\1**", explanation, flags=re.MULTILINE)

# Combine explanation and code with Markdown (GPT-style)
    formatted_text = explanation
    if code:
      formatted_text += f"\n\n```python\n{code}\n```"  # frontend CSS can style this

    return {
    "user_id": user_id,
    "response": {
        "type": "code" if code else "text",
        "text": formatted_text,
        "code": code
    }
}

