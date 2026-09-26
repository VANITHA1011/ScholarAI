import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSelector = ({ variant = 'default', className = '' }) => {
  const { currentLang, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = languages.find((l) => l.code === currentLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 shadow-sm backdrop-blur-md transition-all cursor-pointer select-none"
        aria-label="Select Language"
      >
        <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
        <span className="font-medium">{activeLang.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 shadow-2xl z-[9999] py-2 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95">
          <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
            Select Language
          </div>
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-colors text-left cursor-pointer ${
                  lang.code === currentLang
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <div>
                    <span className="block font-semibold leading-tight">{lang.nativeName}</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">{lang.name}</span>
                  </div>
                </div>
                {lang.code === currentLang && <Check className="w-4 h-4 text-sky-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
