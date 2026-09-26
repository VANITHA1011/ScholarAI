import React, { useState, useEffect } from 'react';
import {
  Globe,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Loader,
  UserCheck,
  FileText,
  AlertTriangle,
  ArrowRight,
  Upload,
  X,
  Sparkles,
  Search,
  Lock
} from 'lucide-react';
import {
  startDocumentCollection,
  confirmHumanVerification,
  getDocumentCollectionStatus,
  recordManualDocumentAccess
} from '../services/api';
import { useToast } from './Toast';

export const BrowserAutomationPanel = ({
  documentType = 'tenth',
  documentName = '10th Standard Marksheet',
  isOpen = false,
  onClose,
  onDocumentObtained
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifyingHuman, setVerifyingHuman] = useState(false);
  const [session, setSession] = useState(null);

  const docKey = String(documentType).toLowerCase().trim();

  // Start or fetch automation state when modal opens
  useEffect(() => {
    if (isOpen && docKey) {
      initAutomation();
    }
  }, [isOpen, docKey]);

  const initAutomation = async () => {
    setLoading(true);
    try {
      const res = await startDocumentCollection(docKey, true);
      setSession(res.data);
    } catch (err) {
      console.error('Error starting browser automation:', err);
      showToast('Could not launch browser automation for official portal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmHumanVerification = async () => {
    setVerifyingHuman(true);
    try {
      const res = await confirmHumanVerification(docKey);
      setSession(res.data);
      if (res.data.state === 'HUMAN_VERIFICATION_REQUIRED') {
        showToast('Verification is still required. Please complete it in the browser.', 'error');
      } else if (res.data.state === 'DOCUMENT_PAGE_FOUND') {
        showToast('Verification confirmed! Official certificate page located.', 'success');
      }
    } catch (err) {
      console.error('Error confirming human verification:', err);
      showToast('Could not verify challenge state. Please retry.', 'error');
    } finally {
      setVerifyingHuman(false);
    }
  };

  const handleManualAccess = async () => {
    try {
      const res = await recordManualDocumentAccess(docKey);
      setSession(res.data);
      if (session?.official_url) {
        window.open(session.official_url, '_blank', 'noopener,noreferrer');
      }
      showToast('Switched to manual access. Upload your certificate once obtained.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBrowser = () => {
    const url = session?.official_url || 'https://www.digilocker.gov.in/';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  const currentState = session?.state || 'WEBSITE_PENDING';
  const isHumanVerification = currentState === 'HUMAN_VERIFICATION_REQUIRED';
  const isBlocked = currentState === 'WEBSITE_BLOCKED';
  const isDocFound = currentState === 'DOCUMENT_PAGE_FOUND' || currentState === 'DOCUMENT_DOWNLOADED';
  const isSearching = currentState === 'SEARCHING' || currentState === 'WEBSITE_OPENED' || currentState === 'WEBSITE_PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl animate-scale-up relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-extrabold uppercase tracking-wider mb-0.5 border border-sky-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Human-in-the-Loop Browser Automation</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Collect: {session?.portal_info?.name || documentName}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Meta Banner */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Official Authority:</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {session?.portal_info?.authority || 'Government Authority'}
            </p>
          </div>
          <a
            href={session?.official_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-semibold"
          >
            <span>Visit Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Workflow Progress Stepper */}
        <div className="py-2 space-y-3">
          {/* Step 1: Identify */}
          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
              ✓
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Official authority & certificate portal identified
            </span>
          </div>

          {/* Step 2: Open Site */}
          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
              ✓
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Opening official website: <span className="font-mono text-sky-600 dark:text-sky-400">{session?.official_url}</span>
            </span>
          </div>

          {/* Step 3: Security & Search */}
          <div className="flex items-center gap-3 text-xs">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                isDocFound
                  ? 'bg-emerald-500 text-white'
                  : isHumanVerification
                  ? 'bg-amber-500 text-white ring-2 ring-amber-500/30 animate-pulse'
                  : isBlocked
                  ? 'bg-rose-500 text-white'
                  : 'bg-sky-500 text-white animate-pulse'
              }`}
            >
              {isDocFound ? '✓' : isHumanVerification ? '!' : isBlocked ? '✕' : '●'}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isHumanVerification
                  ? 'Human Verification Required'
                  : isBlocked
                  ? 'Website Automation Blocked'
                  : isDocFound
                  ? 'Certificate Page Located'
                  : 'Searching for certificate on official portal...'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {session?.status_message || 'Inspecting official portal...'}
              </p>
            </div>
          </div>
        </div>

        {/* Contextual State Callout Panels */}
        <div className="mt-4">
          {/* 1. Human Verification Challenge Banner */}
          {isHumanVerification && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <h4 className="font-bold text-sm">Human verification required</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                Please complete the verification (CAPTCHA / Cloudflare check) in the browser window.
                ScholarAI will continue automatically after verification.
              </p>
              {session?.verification_reason && (
                <p className="text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                  Reason: {session.verification_reason}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={handleOpenBrowser}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-300/70 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Browser</span>
                </button>
                <button
                  onClick={handleConfirmHumanVerification}
                  disabled={verifyingHuman}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {verifyingHuman ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking challenge state...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>I've completed verification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 2. Blocked Website Banner */}
          {isBlocked && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-900 dark:text-rose-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <h4 className="font-bold text-sm">Automatic access to this website is currently blocked</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                This portal restricts automated interaction. In accordance with ScholarAI safety standards,
                we never bypass security controls. You can open the official website manually to obtain the certificate.
              </p>
              {session?.block_reason && (
                <p className="text-[11px] font-mono text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                  {session.block_reason}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={handleManualAccess}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Website Manually</span>
                </button>
                <button
                  onClick={initAutomation}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Retry Later
                </button>
              </div>
            </div>
          )}

          {/* 3. Normal / Document Found Banner */}
          {isDocFound && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <h4 className="font-bold text-sm">Certificate source ready</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                The official certificate issuance page has been verified. Download your certificate
                and proceed to upload it into ScholarAI for OCR and automated verification.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    if (onDocumentObtained) onDocumentObtained(docKey);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Downloaded Certificate</span>
                </button>
                <button
                  onClick={handleOpenBrowser}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-300/70 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Portal Tab</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">
            State: <strong className="font-mono text-slate-600 dark:text-slate-300">{currentState}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrowserAutomationPanel;
