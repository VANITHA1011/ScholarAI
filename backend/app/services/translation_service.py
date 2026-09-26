import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Cloudflare credentials from backend/.env
ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

# In-memory translation cache: (source_lang, target_lang, text) -> translated_text
_TRANSLATION_CACHE: Dict[str, str] = {}

LANGUAGE_NAMES = {
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "ml": "Malayalam",
    "kn": "Kannada",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "en": "English"
}

def _get_cache_key(source_lang: str, target_lang: str, text: str) -> str:
    return f"{source_lang}:{target_lang}:{text.strip()}"

def _build_system_prompt(target_lang_name: str) -> str:
    return (
        f"You are a professional UI translator for an educational scholarship platform (ScholarAI). "
        f"Translate ONLY the supplied text from English to {target_lang_name}. "
        "Preserve the exact meaning. "
        "Do not summarize. "
        "Do not explain. "
        "Do not add information. "
        "Do not remove information. "
        "Do not change numbers, percentages, currency symbols (₹), URLs, email addresses, names, IDs, placeholders, or formatting. "
        "Use natural, grammatically correct terminology appropriate for an educational scholarship website. "
        "Key domain terminology examples: "
        "- 'Document Verification' -> 'ஆவண சரிபார்ப்பு' (Tamil) / 'दस्तावेज़ सत्यापन' (Hindi) / 'పత్ర పరిశీలన' (Telugu) "
        "- 'Student Profile' -> 'மாணவர் சுயவிவரம்' (Tamil) / 'छात्र प्रोफ़ाइल' (Hindi) / 'విద్యార్థి ప్రొఫైల్' (Telugu) "
        "- 'Dashboard' -> 'டாஷ்போர்டு' (Tamil) / 'डैशबोर्ड' (Hindi) / 'డ్యాష్‌బోర్డ్' (Telugu) "
        "- 'Scholarship Application' -> 'கல்வி உதவித்தொகை விண்ணப்பம்' (Tamil) / 'छात्रवृत्ति आवेदन' (Hindi) / 'స్కాలర్‌షిప్ దరఖాస్తు' (Telugu) "
        "Return ONLY the translated text without quotes, notes, or explanations."
    )

def _call_cloudflare_llama_translation(text: str, target_lang: str) -> Optional[str]:
    """Translate text using Cloudflare Llama 3.1 8B with strict UI translation prompt."""
    if not ACCOUNT_ID or not API_TOKEN:
        return None

    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messages": [
            {
                "role": "system",
                "content": _build_system_prompt(target_name)
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "max_tokens": 256,
        "temperature": 0.1
    }

    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                result_text = data.get("result", {}).get("response")
                if result_text and result_text.strip():
                    clean = result_text.strip().strip('"').strip("'").strip("`")
                    # If model accidentally returns "Translation: ...", strip prefix
                    if clean.lower().startswith("translation:"):
                        clean = clean[12:].strip()
                    return clean
    except Exception as e:
        print(f"[Cloudflare Llama Translation Warning] {e}")
    return None

def translate_single_text(text: str, target_lang: str = "en", source_lang: str = "en") -> str:
    """Translate single string using Cloudflare Llama 3.1 8B with caching and fallback."""
    if not text or not text.strip() or target_lang == source_lang or target_lang == "en":
        return text

    cache_key = _get_cache_key(source_lang, target_lang, text)
    if cache_key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[cache_key]

    translated = _call_cloudflare_llama_translation(text, target_lang)
    final_text = translated if translated else text

    if translated:
        _TRANSLATION_CACHE[cache_key] = final_text

    return final_text

def translate_batch(texts: List[str], target_lang: str = "en", source_lang: str = "en") -> Dict[str, str]:
    """Translate list of texts with in-memory caching and return mapping {original: translated}."""
    if not texts:
        return {}

    if target_lang == source_lang or target_lang == "en":
        return {t: t for t in texts}

    results: Dict[str, str] = {}
    uncached: List[str] = []

    # 1. Check in-memory cache first
    for t in texts:
        t_clean = t.strip()
        if not t_clean:
            results[t] = t
            continue
        cache_key = _get_cache_key(source_lang, target_lang, t_clean)
        if cache_key in _TRANSLATION_CACHE:
            results[t] = _TRANSLATION_CACHE[cache_key]
        else:
            uncached.append(t)

    # 2. Translate uncached items
    for t in uncached:
        res = translate_single_text(t, target_lang, source_lang)
        results[t] = res

    return results
