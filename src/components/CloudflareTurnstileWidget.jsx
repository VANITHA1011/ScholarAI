import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

/**
 * CloudflareTurnstileWidget
 * Faithful replica of Cloudflare Turnstile / Verification UI:
 * - "Microsoft" / Title header
 * - Crisp white rounded card with light border
 * - Green spinning dots while verifying -> Green checkmark badge on success
 * - Cloudflare logo with "Privacy • Help" links
 */
export const CloudflareTurnstileWidget = ({ 
  onVerified, 
  title = "Microsoft",
  autoVerify = true,
  delayMs = 1500 
}) => {
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success'

  useEffect(() => {
    if (autoVerify) {
      const timer = setTimeout(() => {
        setStatus('success');
        if (onVerified) onVerified(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }
  }, [autoVerify, delayMs, onVerified]);

  const handleManualClick = () => {
    if (status !== 'success') {
      setStatus('verifying');
      setTimeout(() => {
        setStatus('success');
        if (onVerified) onVerified(true);
      }, 1200);
    }
  };

  return (
    <div className="w-full my-3">
      {title && (
        <div className="text-center mb-1.5 font-semibold text-slate-700 dark:text-slate-300 text-sm tracking-tight">
          {title}
        </div>
      )}
      <div 
        onClick={handleManualClick}
        className="w-full bg-[#fbfbfb] dark:bg-slate-900 border border-[#e5e5e5] dark:border-slate-700/80 rounded-md p-3.5 flex items-center justify-between shadow-xs select-none cursor-pointer transition-all hover:border-[#d0d0d0] dark:hover:border-slate-600"
      >
        {/* Left Side: Spinner or Success Checkmark */}
        <div className="flex items-center gap-3">
          {status === 'success' ? (
            <div className="w-7 h-7 rounded-full bg-[#1b873f] flex items-center justify-center text-white shadow-xs transition-transform duration-200 scale-100 animate-in fade-in zoom-in">
              <Check className="w-4 h-4 stroke-[3.5]" />
            </div>
          ) : (
            <div className="relative w-7 h-7 flex items-center justify-center">
              {/* Dotted green animated ring */}
              <div className="w-6 h-6 border-[2.5px] border-emerald-500/25 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          )}

          <span className="text-[15px] font-medium text-slate-800 dark:text-slate-100">
            {status === 'success' ? 'Success!' : 'Verifying…'}
          </span>
        </div>

        {/* Right Side: Cloudflare Logo + Privacy/Help Links */}
        <div className="flex flex-col items-end pl-2">
          <div className="flex items-center gap-1">
            {/* Cloudflare Cloud Logo SVG */}
            <svg className="w-5 h-5 text-[#F38020]" viewBox="0 0 100 100" fill="currentColor">
              <path d="M78.6 42.4c-1.6-9.8-10.1-17.4-20.3-17.4-8.8 0-16.3 5.7-19.1 13.7-2-.6-4.1-.9-6.2-.9-10.5 0-19.1 8.5-19.1 19.1 0 .9.1 1.8.2 2.7C6.3 60.5 0 67.9 0 76.9c0 10.5 8.5 19.1 19.1 19.1h58.5c12.4 0 22.4-10 22.4-22.4 0-10.8-7.7-19.7-18-21.8-.4-3.2-1.6-6.4-3.4-9.4z" />
            </svg>
            <span className="font-extrabold text-[12px] tracking-wider text-slate-900 dark:text-white uppercase">
              CLOUDFLARE
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 space-x-1">
            <a 
              href="https://www.cloudflare.com/privacypolicy/" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy
            </a>
            <span>•</span>
            <a 
              href="https://support.cloudflare.com/" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
