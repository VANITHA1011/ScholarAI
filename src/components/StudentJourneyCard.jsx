import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Upload,
  ShieldCheck,
  Brain,
  Award,
  Send,
  Clock,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

const ICON_MAP = {
  User: User,
  FileSearch: FileSearch,
  Upload: Upload,
  ShieldCheck: ShieldCheck,
  Brain: Brain,
  Award: Award,
  CheckCircle2: CheckCircle2,
  Send: Send,
  Clock: Clock,
  AlertTriangle: AlertTriangle
};

export const StudentJourneyCard = ({ journey }) => {
  const navigate = useNavigate();

  if (!journey) return null;

  const {
    currentStep,
    stepNumber = 1,
    totalSteps = 9,
    progressPercentage = 11,
    nextAction,
    blockedReason,
    profileStatus,
    documentStatus,
    applicationStatus
  } = journey;

  const IconComponent = ICON_MAP[nextAction?.iconName] || Sparkles;

  return (
    <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-indigo-950/30 backdrop-blur-xl border border-sky-200/70 dark:border-slate-800 shadow-sm transition-all duration-300">
      
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            What's Next?
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Step {stepNumber} of {totalSteps}: {currentStep?.shortName || 'Guidance'}
          </span>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
            {progressPercentage}% Completed
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(8, progressPercentage)}%` }}
        ></div>
      </div>

      {/* Main Guidance Message & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="max-w-2xl">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <IconComponent className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span>{nextAction?.title || 'Continue your scholarship journey'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            {nextAction?.description || 'Follow the step-by-step guidance to discover and apply for matching scholarships.'}
          </p>

          {/* Contextual Warning or Callout if action is blocked */}
          {blockedReason && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{blockedReason}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-shrink-0">
          {nextAction?.route && (
            <button
              onClick={() => navigate(nextAction.route)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>{nextAction.buttonText || 'Continue →'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentJourneyCard;
