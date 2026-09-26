import api from './api';

// In-memory translation store: { [lang]: { [originalText]: translatedText } }
const memoryCache = {};

// Active listeners for cache updates
const listeners = new Set();

// Batch queue configuration
let batchQueue = new Set();
let batchTimeout = null;
let currentTargetLang = 'en';

// Load persistent cache from localStorage for a given language
function getLangCache(lang) {
  if (!memoryCache[lang]) {
    try {
      const stored = localStorage.getItem(`scholarai_trans_v3_${lang}`);
      memoryCache[lang] = stored ? JSON.parse(stored) : {};
    } catch {
      memoryCache[lang] = {};
    }
  }
  return memoryCache[lang];
}

// Save cache to localStorage (debounced)
let saveTimeout = null;
function persistLangCache(lang) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      if (memoryCache[lang]) {
        localStorage.setItem(`scholarai_trans_v3_${lang}`, JSON.stringify(memoryCache[lang]));
      }
    } catch {
      // quota or storage error
    }
  }, 1000);
}

// Notify subscribed components that new translations arrived
function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('[TranslationManager Listener Error]', e);
    }
  });
}

// Process the batched queue of untranslated texts
async function processBatch() {
  const textsToTranslate = Array.from(batchQueue);
  batchQueue.clear();
  const lang = currentTargetLang;

  if (!textsToTranslate.length || lang === 'en') {
    return;
  }

  try {
    const response = await api.post('/translate', {
      texts: textsToTranslate,
      target_lang: lang,
      source_lang: 'en',
    });

    const translations = response?.data?.translations;
    if (translations && typeof translations === 'object') {
      const cache = getLangCache(lang);
      Object.entries(translations).forEach(([orig, trans]) => {
        cache[orig] = trans;
      });
      persistLangCache(lang);
      notifyListeners();
    }
  } catch (err) {
    console.warn('[TranslationManager Batch Warning] Falling back to original:', err?.message || err);
  }
}

/**
 * Get translated text.
 * If available in cache, returns immediately.
 * If missing, queues for background batch translation and returns defaultText/text.
 */
export function translateDynamic(text, targetLang = 'en', defaultText = null) {
  if (!text || typeof text !== 'string') return text;
  const cleanText = text.trim();
  if (!cleanText || targetLang === 'en') return defaultText || text;

  const cache = getLangCache(targetLang);
  if (cache[cleanText]) {
    return cache[cleanText];
  }

  // Queue for batch fetching if not already queued
  currentTargetLang = targetLang;
  batchQueue.add(cleanText);

  if (batchTimeout) clearTimeout(batchTimeout);
  batchTimeout = setTimeout(processBatch, 60);

  return defaultText || text;
}

/**
 * Direct async translation request (for explicit on-demand needs)
 */
export async function translateAsync(text, targetLang = 'en') {
  if (!text || targetLang === 'en') return text;
  const cache = getLangCache(targetLang);
  if (cache[text]) return cache[text];

  try {
    const res = await api.post('/translate', {
      texts: [text],
      target_lang: targetLang,
      source_lang: 'en',
    });
    const result = res?.data?.translations?.[text] || text;
    cache[text] = result;
    persistLangCache(targetLang);
    return result;
  } catch {
    return text;
  }
}

/**
 * Subscribe to translation cache updates to trigger component re-render
 */
export function subscribeTranslations(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export default {
  translateDynamic,
  translateAsync,
  subscribeTranslations,
};
