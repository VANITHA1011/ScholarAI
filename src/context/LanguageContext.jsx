import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { languages } from '../config/languages';
import { translateDynamic, translateAsync, subscribeTranslations } from '../services/translationManager';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      return localStorage.getItem('scholarai_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  // State tick to force re-render when new async Cloudflare translations arrive
  const [, setTranslationTick] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('scholarai_lang', currentLang);
    } catch {
      // ignore storage error
    }
  }, [currentLang]);

  // Subscribe to Cloudflare translation batch updates
  useEffect(() => {
    const unsubscribe = subscribeTranslations(() => {
      setTranslationTick((tick) => tick + 1);
    });
    return unsubscribe;
  }, []);

  const setLanguage = (langCode) => {
    if (languages.some((l) => l.code === langCode)) {
      setCurrentLang(langCode);
    }
  };

  /**
   * Pure Cloudflare Dynamic Translation:
   * Translates any UI text or dynamic database text via Cloudflare Workers AI with caching.
   */
  const t = useCallback(
    (keyOrText, defaultText) => {
      const textToTranslate = defaultText || keyOrText;
      if (!textToTranslate) return '';
      if (currentLang === 'en') return textToTranslate;

      return translateDynamic(textToTranslate, currentLang, textToTranslate);
    },
    [currentLang]
  );

  /**
   * Dynamic content translator for scholarship descriptions, eligibility rules, and DB strings
   */
  const translateText = useCallback(
    (text) => {
      if (!text || currentLang === 'en') return text;
      return translateDynamic(text, currentLang, text);
    },
    [currentLang]
  );

  const currentLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        currentLangObj,
        setLanguage,
        languages,
        t,
        translateText,
        translateAsync: (txt) => translateAsync(txt, currentLang),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export { languages };
