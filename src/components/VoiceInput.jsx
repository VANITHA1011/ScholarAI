import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import { startListening, stopListening, isSpeechRecognitionSupported } from '../services/voiceService';

export const VoiceInput = ({ onTranscript, disabled = false, className = '' }) => {
  const { currentLang, currentLangObj, t } = useLanguage();
  const { showToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const isSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    // Cleanup active listening on unmount
    return () => {
      stopListening();
    };
  }, []);

  // When user switches language while listening, restart in new language
  useEffect(() => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    }
  }, [currentLang]);

  const handleToggleListening = () => {
    if (!isSupported) {
      showToast(t('voiceNotSupported', 'Voice input is not supported in this browser. Please use Chrome or Edge.'), 'error');
      return;
    }

    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);

    startListening({
      langCode: currentLang,
      onStart: () => {
        setIsListening(true);
      },
      onResult: (transcript, isFinal) => {
        if (onTranscript && transcript) {
          onTranscript(transcript);
        }
      },
      onError: (err) => {
        setIsListening(false);
        showToast(err.message || t('voiceError', 'Could not capture voice. Please try again.'), 'error');
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleToggleListening}
        disabled={disabled}
        title={
          isListening
            ? t('stopListening', 'Listening in ' + (currentLangObj?.nativeName || 'your language') + '... Click to stop.')
            : t('startListening', 'Speak in ' + (currentLangObj?.nativeName || 'your language'))
        }
        className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-500/20 animate-pulse'
            : 'bg-white/70 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 shadow-xs'
        } ${className}`}
        aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </>
        ) : (
          <Mic className="w-4 h-4 text-sky-500" />
        )}
      </button>

      {/* Floating active listening badge */}
      {isListening && (
        <div className="absolute bottom-full mb-2 left-0 z-50 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md shadow-xl border border-white/10 whitespace-nowrap flex items-center gap-1.5 animate-in fade-in zoom-in-95">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span>{t('listening', 'Listening in')} {currentLangObj?.nativeName || currentLangObj?.name}...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
