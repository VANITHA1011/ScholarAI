// Language BCP-47 mapping for Indian Languages and English
export const LANGUAGE_LOCALE_MAP = {
  en: ['en-IN', 'en-US', 'en-GB'],
  ta: ['ta-IN', 'ta-LK', 'ta'],
  hi: ['hi-IN', 'hi'],
  te: ['te-IN', 'te'],
  ml: ['ml-IN', 'ml'],
  kn: ['kn-IN', 'kn'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  mr: ['mr-IN', 'mr'],
  gu: ['gu-IN', 'gu'],
  pa: ['pa-IN', 'pa-Guru-IN', 'pa'],
};

// Check if SpeechRecognition is supported by the browser
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Check if SpeechSynthesis is supported by the browser
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Clean markdown symbols, citations, and URLs from text before passing to TTS
 * so speech sounds natural.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // remove markdown links [text](url) -> text
    .replace(/https?:\/\/[^\s]+/g, '') // remove remaining URLs
    .replace(/\|/g, ' ') // replace table pipes with space
    .replace(/[#*_~`>•]/g, ' ') // remove markdown formatting and bullets
    .replace(/📖|🎯|💰|🔴|🟡|🟢|⚫|✔|❌|⚠️|🤖|👤|🪄|🧠|🎓|📊|⏱️|🚀/g, '') // remove common emojis
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get all available browser voices asynchronously (handles Chrome voices async loading)
 */
export function getAvailableVoices() {
  if (!isSpeechSynthesisSupported()) return Promise.resolve([]);

  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      return resolve(voices);
    }
    // Handle onvoiceschanged event in Chrome/Edge
    const handleVoicesChanged = () => {
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(voices);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Fallback timeout in case onvoiceschanged does not fire
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices() || []);
    }, 500);
  });
}

/**
 * Find the best matching browser voice for a given language code
 */
export async function getBestVoiceForLanguage(langCode) {
  const voices = await getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  const targetLocales = LANGUAGE_LOCALE_MAP[langCode] || ['en-IN', 'en-US'];

  // Priority 1: Exact locale match (e.g. 'ta-IN')
  for (const loc of targetLocales) {
    const match = voices.find((v) => v.lang && v.lang.toLowerCase() === loc.toLowerCase());
    if (match) return match;
  }

  // Priority 2: Prefix match (e.g. 'ta')
  for (const loc of targetLocales) {
    const prefix = loc.split('-')[0].toLowerCase();
    const match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
    if (match) return match;
  }

  // Priority 3: Name match (e.g. 'Tamil', 'Hindi')
  const langNames = {
    ta: 'tamil',
    hi: 'hindi',
    te: 'telugu',
    ml: 'malayalam',
    kn: 'kannada',
    bn: 'bengali',
    mr: 'marathi',
    gu: 'gujarati',
    pa: 'punjabi',
    en: 'english',
  };
  const targetName = langNames[langCode];
  if (targetName) {
    const nameMatch = voices.find((v) => v.name && v.name.toLowerCase().includes(targetName));
    if (nameMatch) return nameMatch;
  }

  // Priority 4: Default voice or first Indian English voice or first voice available
  const defaultVoice = voices.find((v) => v.default) || voices.find((v) => v.lang && v.lang.includes('IN')) || voices[0];
  return defaultVoice || null;
}

/**
 * Active SpeechRecognition instance tracker
 */
let activeRecognition = null;

/**
 * Start SpeechRecognition (STT)
 */
export function startListening({ langCode = 'en', onResult, onError, onStart, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError(new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.'));
    return null;
  }

  // Stop previous recognition if active
  stopListening();

  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionConstructor();

  const locales = LANGUAGE_LOCALE_MAP[langCode] || ['en-IN'];
  recognition.lang = locales[0];
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const transcript = finalTranscript || interimTranscript;
    if (onResult && transcript) {
      onResult(transcript, !!finalTranscript);
    }
  };

  recognition.onerror = (event) => {
    let message = 'Speech recognition error occurred.';
    if (event.error === 'not-allowed') {
      message = 'Microphone permission denied. Please allow microphone access in your browser.';
    } else if (event.error === 'no-speech') {
      message = 'No speech was detected. Please try again.';
    } else if (event.error === 'network') {
      message = 'Network error occurred during speech recognition.';
    }
    if (onError) onError(new Error(message));
  };

  recognition.onend = () => {
    activeRecognition = null;
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
    activeRecognition = recognition;
    return recognition;
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}

/**
 * Stop active SpeechRecognition
 */
export function stopListening() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {
      // ignore
    }
    activeRecognition = null;
  }
}

/**
 * Speak text using SpeechSynthesis (TTS)
 */
export async function speakText({ text, langCode = 'en', onStart, onEnd, onError }) {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError(new Error('Speech synthesis is not supported in this browser.'));
    return;
  }

  // Stop any ongoing speech
  stopSpeaking();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleaned);
  const voice = await getBestVoiceForLanguage(langCode);

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || LANGUAGE_LOCALE_MAP[langCode]?.[0] || 'en-IN';
  } else {
    utterance.lang = LANGUAGE_LOCALE_MAP[langCode]?.[0] || 'en-IN';
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    if (onError) onError(e);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (onError) onError(err);
  }
}

/**
 * Stop active SpeechSynthesis
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export default {
  LANGUAGE_LOCALE_MAP,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  getBestVoiceForLanguage,
  startListening,
  stopListening,
  speakText,
  stopSpeaking,
  cleanTextForSpeech,
};
