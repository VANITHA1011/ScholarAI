import React, { useState, useEffect } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../services/voiceService';

// Global reference to ensure only one message speaks at a time
let currentSpeakingSetter = null;

export const VoiceOutput = ({ text, className = '' }) => {
  const { currentLang, currentLangObj, t } = useLanguage();
  const { showToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const isSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopSpeaking();
        setIsPlaying(false);
      }
    };
  }, [isPlaying]);

  const handleToggleSpeak = () => {
    if (!isSupported) {
      showToast(t('speechNotSupported', 'Voice output is not supported in this browser.'), 'error');
      return;
    }

    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      if (currentSpeakingSetter === setIsPlaying) {
        currentSpeakingSetter = null;
      }
      return;
    }

    // Stop any previously playing instance
    if (currentSpeakingSetter && currentSpeakingSetter !== setIsPlaying) {
      currentSpeakingSetter(false);
    }
    stopSpeaking();

    currentSpeakingSetter = setIsPlaying;
    setIsPlaying(true);

    speakText({
      text,
      langCode: currentLang,
      onStart: () => {
        setIsPlaying(true);
      },
      onEnd: () => {
        setIsPlaying(false);
        if (currentSpeakingSetter === setIsPlaying) {
          currentSpeakingSetter = null;
        }
      },
      onError: (err) => {
        setIsPlaying(false);
        if (currentSpeakingSetter === setIsPlaying) {
          currentSpeakingSetter = null;
        }
        console.warn('[SpeechSynthesis Warning]', err);
      }
    });
  };

  if (!text) return null;

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      title={
        isPlaying
          ? t('stopSpeaking', 'Stop voice playback')
          : t('listenAloud', 'Listen aloud in ' + (currentLangObj?.nativeName || 'your language'))
      }
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
        isPlaying
          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 ring-2 ring-amber-500/20'
          : 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800/60'
      } ${className}`}
      aria-label={isPlaying ? 'Stop speech' : 'Read aloud'}
    >
      {isPlaying ? (
        <>
          <Square className="w-3 h-3 fill-current animate-pulse" />
          <span className="text-[10px]">{t('stop', 'Stop')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">{t('listen', 'Listen')}</span>
        </>
      )}
    </button>
  );
};

export default VoiceOutput;
