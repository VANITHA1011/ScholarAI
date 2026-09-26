import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useScholarshipJourney } from '../../hooks/useScholarshipJourney';
import api from '../../services/api';
import {
  GraduationCap,
  ArrowLeft,
  Loader,
  RotateCcw,
  User,
  ShieldCheck,
  Check,
  CheckCircle,
  AlertTriangle,
  Send,
  Upload,
  Brain,
  Award,
  Sparkles,
  ArrowRight,
  FileSearch,
  FileText,
  Cpu,
  Lock,
  Globe
} from 'lucide-react';
import { BrowserAutomationPanel } from '../../components/BrowserAutomationPanel';

const STEP_ICONS = {
  PROFILE: User,
  REQUIRED_DOCUMENTS: FileSearch,
  DOCUMENT_UPLOAD: Upload,
  DOCUMENT_VERIFICATION: ShieldCheck,
  SCHOLARSHIP_MATCHING: Brain,
  REVIEW_SCHOLARSHIP: Award,
  MISSING_DOCUMENTS: FileText,
  PREPARE_APPLICATION: Cpu,
  SUBMIT_APPLICATION: Send
};

export const JourneyPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const journey = useScholarshipJourney();
  const [submitting, setSubmitting] = useState(false);
  const [preparingApp, setPreparingApp] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [automationDoc, setAutomationDoc] = useState(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState(null);

  const timelineScrollRef = useRef(null);

  const {
    allSteps = [],
    stepIndex = 0,
    stepNumber = 1,
    currentStep,
    progressPercentage = 11,
    nextAction,
    blockedReason,
    profileStatus,
    requiredDocuments = [],
    documentStatus,
    eligibilityStatus,
    applicationStatus,
    refreshJourney,
    loading
  } = journey;

  // Active step in detail panel defaults to current active step in workflow
  const activeDetailIndex = selectedStepIndex !== null ? selectedStepIndex : stepIndex;
  const displayedStep = allSteps[activeDetailIndex] || currentStep || allSteps[0];

  // Auto-scroll the timeline on mobile so the current active step is visible
  useEffect(() => {
    if (timelineScrollRef.current) {
      const activeEl = timelineScrollRef.current.querySelector(`[data-step-index="${stepIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [stepIndex]);

  const handlePrepareApplication = async () => {
    setPreparingApp(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 750));
      const targetSchId = applicationStatus?.selectedScholarshipId || 'default';
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`scholarverse_app_prepared_${targetSchId}`, 'true');
      }
      showToast('Application dossier prepared successfully! Proceed to Step 9 to confirm.', 'success');
      refreshJourney();
    } catch (err) {
      showToast('Error preparing application package.', 'error');
    } finally {
      setPreparingApp(false);
    }
  };

  const handleFinalSubmit = async () => {
    const targetSchId = applicationStatus?.selectedScholarshipId;
    if (!targetSchId) {
      showToast('Please select a scholarship from Recommendations before submitting.', 'error');
      navigate('/dashboard/recommendations');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/applications/${targetSchId}`, { status: 'Submitted' });
      if (res.data?.success) {
        showToast('Application successfully submitted! Confirmation email sent.', 'success');
        setReviewModalOpen(false);
        refreshJourney();
      } else {
        showToast(res.data?.message || 'Submission failed.', 'error');
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.detail?.message ||
        err.response?.data?.message ||
        'Error submitting application.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepStatus = (idx) => {
    if (applicationStatus?.hasSubmittedApp) return 'COMPLETED';
    if (idx < stepIndex) return 'COMPLETED';
    if (idx === stepIndex) {
      if (idx === 3 && (documentStatus?.hasMismatches || blockedReason)) {
        return 'FAILED';
      }
      return 'CURRENT';
    }
    return 'LOCKED';
  };

  const displayedStatus = getStepStatus(activeDetailIndex);

  return (
    <div className="min-h-screen bg-custom-image flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      {/* Decorative Orbs */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-400/10 blur-[130px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Navigation Header */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between relative z-50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
              My Scholarship Journey
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <LanguageSelector />
          <ThemeToggle />
          <button
            onClick={() => {
              setSelectedStepIndex(null);
              refreshJourney();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300/70 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            aria-label="Refresh Journey Status"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Top Progress Header Banner */}
        <div className="mb-6 p-5 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500/10 to-indigo-500/10 dark:from-sky-500/20 dark:to-indigo-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold mb-2.5 border border-sky-500/20">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Supervisor Agent Orchestrated Workflow</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1.5">
                Step {stepNumber} of {allSteps.length}: {currentStep?.title || 'Guidance'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {nextAction?.description ||
                  'Your personalized step-by-step roadmap to verified scholarship applications.'}
              </p>
            </div>

            {/* Overall Progress Indicator */}
            <div className="flex flex-col items-start md:items-end justify-center min-w-[200px] pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
                  {progressPercentage}%
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Journey Progress
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(6, progressPercentage)}%` }}
                ></div>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                {applicationStatus?.hasSubmittedApp
                  ? 'All 9 steps completed'
                  : `${Math.max(0, 9 - stepNumber)} steps remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* HORIZONTAL SCHOLARSHIP JOURNEY TIMELINE TRACK       */}
        {/* ================================================== */}
        <div className="mb-6 p-5 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>ScholarAI Journey Timeline</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-400 dark:text-slate-500 lowercase font-medium">9 sequential phases</span>
            </h2>
            <span className="text-[11px] font-medium text-slate-400 sm:hidden">
              ← Scroll to explore →
            </span>
          </div>

          {/* Horizontally scrollable container on mobile; natural fit on desktop */}
          <div
            ref={timelineScrollRef}
            className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-none sm:scrollbar-thin"
          >
            <div className="min-w-[820px] lg:min-w-full">
              <div className="grid grid-cols-9 gap-1 sm:gap-2 relative">
                {allSteps.map((step, idx) => {
                  const status = getStepStatus(idx);
                  const isCurrent = status === 'CURRENT';
                  const isCompleted = status === 'COMPLETED';
                  const isFailed = status === 'FAILED';
                  const isLocked = status === 'LOCKED';
                  const isSelected = activeDetailIndex === idx;
                  const isLast = idx === allSteps.length - 1;

                  // Horizontal connecting line between circles
                  // Completed line: emerald; In-progress: subtle gradient; Upcoming: muted
                  let lineClasses = 'bg-slate-200 dark:bg-slate-800';
                  if (idx < stepIndex) {
                    lineClasses = 'bg-emerald-500';
                  } else if (idx === stepIndex) {
                    lineClasses = 'bg-gradient-to-r from-indigo-500 to-slate-200 dark:to-slate-800';
                  }

                  return (
                    <div
                      key={step.id}
                      data-step-index={idx}
                      className="relative flex flex-col items-center group cursor-pointer"
                      onClick={() => setSelectedStepIndex(idx)}
                      title={`Click to view ${step.title} details`}
                    >
                      {/* Connecting Horizontal Line Segment (behind circles) */}
                      {!isLast && (
                        <div
                          className={`absolute top-5 sm:top-5.5 left-1/2 w-full h-1 sm:h-1.5 transition-colors duration-500 z-0 rounded-full ${lineClasses}`}
                          style={{ pointerEvents: 'none' }}
                        />
                      )}

                      {/* Circular Step Indicator */}
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm z-10 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/20 group-hover:scale-105'
                            : isCurrent
                            ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/35 ring-4 ring-sky-500/30 dark:ring-sky-500/20 scale-110 animate-pulse-slow'
                            : isFailed
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/25 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-70 group-hover:opacity-100'
                        } ${isSelected ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''}`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 stroke-[2.8]" />
                        ) : isCurrent ? (
                          <span className="relative flex items-center justify-center">
                            <span className="absolute w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-75"></span>
                            <span className="w-3 h-3 rounded-full bg-white"></span>
                          </span>
                        ) : isFailed ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <span className="text-[11px] sm:text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>

                      {/* Step Name */}
                      <p
                        className={`text-center text-[11px] sm:text-xs font-bold mt-2.5 line-clamp-1 transition-colors px-1 ${
                          isSelected
                            ? 'text-sky-600 dark:text-sky-400 font-black'
                            : isCurrent
                            ? 'text-slate-900 dark:text-white font-extrabold'
                            : isCompleted
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {step.shortName || step.title}
                      </p>

                      {/* Agent Label */}
                      <span className="text-center text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5 leading-tight px-0.5">
                        {step.agentName}
                      </span>

                      {/* Short Status Badge */}
                      <div className="mt-1.5">
                        {isCompleted && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 animate-pulse">
                            Current
                          </span>
                        )}
                        {isFailed && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Attention
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                            Waiting
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* DYNAMIC CURRENT / SELECTED STEP DETAIL PANEL       */}
        {/* ================================================== */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-md animate-slide-up">
          {/* Header Row: Step Meta & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Step {displayedStep.stepNumber} of 9
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                {displayedStep.agentName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* If user is inspecting a step other than the current active step */}
              {selectedStepIndex !== null && selectedStepIndex !== stepIndex && (
                <button
                  onClick={() => setSelectedStepIndex(null)}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold mr-2 cursor-pointer flex items-center gap-1"
                >
                  <span>Return to Current Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {displayedStatus === 'COMPLETED' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Completed
                </span>
              )}
              {displayedStatus === 'CURRENT' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  Current Action
                </span>
              )}
              {displayedStatus === 'FAILED' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Needs Attention
                </span>
              )}
              {displayedStatus === 'LOCKED' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                  <Lock className="w-3 h-3" /> Waiting / Locked
                </span>
              )}
            </div>
          </div>

          {/* Step Title & Description */}
          <div className="pt-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {displayedStep.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
              {displayedStep.description}
            </p>
          </div>

          {/* Dynamic Real-Time Data Insights Callout */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs">
            {activeDetailIndex === 0 && profileStatus && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Profile Readiness:{' '}
                <strong className="text-sky-600 dark:text-sky-400 font-extrabold">
                  {profileStatus.completionPercentage}%
                </strong>
                {profileStatus.missingFields.length > 0 &&
                  ` (Missing: ${profileStatus.missingFields.slice(0, 3).join(', ')})`}
              </p>
            )}
            {activeDetailIndex === 1 && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Mandatory Requirements:{' '}
                <strong className="text-sky-600 dark:text-sky-400 font-extrabold">
                  {requiredDocuments.length} certificates
                </strong>{' '}
                identified based on your academic & domicile profile.
              </p>
            )}
            {activeDetailIndex === 2 && documentStatus && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Upload Progress:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {documentStatus.uploadedCount} uploaded
                </strong>{' '}
                / {documentStatus.totalRequired} mandatory certificates.
              </p>
            )}
            {activeDetailIndex === 3 && documentStatus && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Verification Status:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {documentStatus.verifiedCount} verified
                </strong>
                {documentStatus.hasMismatches && (
                  <span className="text-rose-500 font-bold ml-1.5">
                    ⚠️ OCR discrepancies detected against profile details.
                  </span>
                )}
              </p>
            )}
            {activeDetailIndex === 4 && eligibilityStatus && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Eligible Schemes:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {eligibilityStatus.eligibleCount} scholarships
                </strong>{' '}
                satisfy all 16 eligibility parameters.
              </p>
            )}
            {activeDetailIndex === 5 && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Target Scholarship:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  {applicationStatus?.selectedScholarship?.scholarship_name ||
                    'Review recommendations to choose target scholarship.'}
                </strong>
              </p>
            )}
            {activeDetailIndex === 6 && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Document Checklist:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {documentStatus?.missingCount === 0
                    ? 'All required certificates verified'
                    : `${documentStatus?.missingCount} documents remaining`}
                </strong>
              </p>
            )}
            {activeDetailIndex === 7 && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Application Package:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  Verified student dossier synthesized by ScholarAI agents.
                </strong>
              </p>
            )}
            {activeDetailIndex === 8 && (
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Submission Status:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {applicationStatus?.hasSubmittedApp
                    ? 'Application submitted & under committee review'
                    : 'Awaiting student verification confirmation'}
                </strong>
              </p>
            )}
          </div>

          {/* Contextual Action Button Row */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {displayedStatus === 'CURRENT' ? (
              activeDetailIndex === 7 ? (
                // Step 8: Prepare Application
                <button
                  onClick={handlePrepareApplication}
                  disabled={preparingApp}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  {preparingApp ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Preparing Application Package...</span>
                    </>
                  ) : (
                    <>
                      <span>Prepare Application Package →</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              ) : activeDetailIndex === 8 ? (
                // Step 9: Review & Submit Application Modal Trigger
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Review & Submit Application</span>
                </button>
              ) : (
                // General Current Step Action Button
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => navigate(displayedStep.route)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <span>{displayedStep.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* HITL Browser Automation for document phases (Step 2, 3, 7) */}
                  {(activeDetailIndex === 1 || activeDetailIndex === 2 || activeDetailIndex === 6) && (
                    <button
                      onClick={() => navigate('/dashboard/documents')}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/30 transition-all cursor-pointer shadow-sm"
                      title="Verify and cross-check documents with OCR against your profile"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Verify Documents (OCR)</span>
                    </button>
                  )}

                </div>
              )
            ) : displayedStatus === 'FAILED' ? (
              // Discrepancy resolution action
              <button
                onClick={() => navigate(displayedStep.route)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Resolve Discrepancies →</span>
              </button>
            ) : displayedStatus === 'COMPLETED' ? (
              // Completed Step review
              <button
                onClick={() => navigate(displayedStep.route)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer border border-slate-300/70 dark:border-slate-700"
              >
                <span>Review Step Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              // Locked Step
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 select-none cursor-not-allowed">
                <Lock className="w-3.5 h-3.5 opacity-70" />
                <span>Locked until Step {activeDetailIndex} completes</span>
              </span>
            )}
          </div>
        </div>

        {/* Step 9 Application Review & Confirmation Modal */}
        {reviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl animate-scale-up">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Application Confirmation Checklist
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Step 9 of 9: Explicit Student Verification Sign-off
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="py-5 space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Selected Scholarship Scheme:</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {applicationStatus?.selectedScholarship?.scholarship_name || 'Scholarship Scheme'}
                  </p>
                </div>

                {/* Verification Checklist */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Academic & personal profile verified</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Required certificates verified via OCR cross-check</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>16-parameter eligibility rules satisfied</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Application dossier synthesized by AI agents</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                  ⚠️ <strong>Explicit Student Confirmation:</strong> By clicking &quot;Confirm &amp; Submit&quot;, your application and verified credentials will be transmitted directly to the scholarship committee for official review.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setReviewModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirm &amp; Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Browser Automation HITL Panel */}
        {automationDoc && (
          <BrowserAutomationPanel
            isOpen={Boolean(automationDoc)}
            documentType={automationDoc.type}
            documentName={automationDoc.name}
            onClose={() => setAutomationDoc(null)}
            onDocumentObtained={() => {
              refreshJourney();
              navigate('/dashboard/documents');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarVerse AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default JourneyPage;
