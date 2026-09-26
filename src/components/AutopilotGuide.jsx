import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Award,
  FileCheck,
  Globe,
  Send,
  Check,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Bot
} from 'lucide-react';
import { AUTOPILOT_STEPS } from '../hooks/useSupervisorAutopilot';

export const AutopilotGuide = ({ autopilot, onManualSync }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!autopilot) return null;

  const {
    steps = AUTOPILOT_STEPS,
    activeStepIndex = 0,
    currentStep = AUTOPILOT_STEPS[0],
    isHumanActionRequired = false,
    humanActionTarget = null,
    currentActionNotice = '',
    autoNavCountdown = null,
    syncing = false,
    isPaused = false,
    setIsPaused,
    resetWorkflow
  } = autopilot;

  const progressPercent = Math.min(100, Math.round(((activeStepIndex + (activeStepIndex === 10 ? 1 : 0.5)) / steps.length) * 100));

  // Determine step status
  const getStepStatus = (index) => {
    if (index < activeStepIndex) return 'COMPLETED';
    if (index === activeStepIndex) {
      return isHumanActionRequired ? 'HUMAN_ACTION' : 'AI_WORKING';
    }
    return 'PENDING';
  };

  const getStepIcon = (index, step) => {
    const status = getStepStatus(index);
    if (status === 'COMPLETED') {
      return <Check className="w-3.5 h-3.5 text-emerald-400 font-black stroke-[3]" />;
    }
    if (status === 'HUMAN_ACTION') {
      return <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />;
    }
    if (status === 'AI_WORKING') {
      return <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />;
    }
    return <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{index + 1}</span>;
  };

  return (
    <div className="mb-8 rounded-3xl bg-slate-900/95 dark:bg-[#0b1220]/95 backdrop-blur-2xl border border-slate-700/60 dark:border-slate-800 shadow-2xl p-5 sm:p-7 relative overflow-hidden transition-all duration-300">
      
      {/* Background ambient glowing gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 relative">
            <Cpu className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                AI AGENT CONTROL CENTER
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                Step {activeStepIndex + 1} of {steps.length}
              </span>
              {isPaused && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Paused
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Autonomous multi-agent orchestration supervising profile, OCR extraction, live verification, and submission.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Pause / Resume Autopilot Toggle */}
          {setIsPaused && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume Autopilot Navigation' : 'Pause Autopilot Navigation'}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isPaused
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {/* Sync Button */}
          {onManualSync && (
            <button
              onClick={onManualSync}
              disabled={syncing}
              title="Sync Agent State"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-sky-400' : ''}`} />
              <span className="hidden md:inline">{syncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 relative z-10">
        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5">
            <span>Workflow Progress</span>
            <span className="text-[10px] text-slate-500">({activeStepIndex + 1}/{steps.length} Steps)</span>
          </span>
          <span className="text-sky-400 font-mono font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-700 shadow-md shadow-sky-500/20"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 11-Step Connected Stepper (Desktop Horizontal / Mobile Scroll) */}
      {isExpanded && (
        <div className="mt-6 pt-2 pb-2 overflow-x-auto no-scrollbar relative z-10">
          <div className="flex items-center min-w-[860px] justify-between relative px-2">
            
            {/* Background connecting bar */}
            <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-800 -z-0"></div>

            {steps.map((step, idx) => {
              const status = getStepStatus(idx);
              const isCurrent = idx === activeStepIndex;

              let nodeBg = 'bg-slate-800 border-slate-700 text-slate-400';
              let titleColor = 'text-slate-400';

              if (status === 'COMPLETED') {
                nodeBg = 'bg-emerald-950/80 border-emerald-500/60 shadow-lg shadow-emerald-500/10';
                titleColor = 'text-emerald-400 font-bold';
              } else if (status === 'HUMAN_ACTION') {
                nodeBg = 'bg-amber-950/90 border-amber-500 shadow-lg shadow-amber-500/20 animate-pulse';
                titleColor = 'text-amber-300 font-black';
              } else if (status === 'AI_WORKING') {
                nodeBg = 'bg-indigo-950/90 border-sky-400 shadow-lg shadow-sky-500/25 ring-2 ring-sky-500/30';
                titleColor = 'text-sky-300 font-black';
              }

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center group cursor-pointer transition-all ${
                    isCurrent ? 'scale-105' : 'opacity-85 hover:opacity-100'
                  }`}
                  onClick={() => {
                    if (status === 'HUMAN_ACTION' && step.targetRoute) {
                      navigate(step.targetRoute);
                    }
                  }}
                >
                  {/* Circle Node */}
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${nodeBg}`}
                  >
                    {getStepIcon(idx, step)}
                  </div>

                  {/* Label & Status */}
                  <div className="text-center mt-2 w-20">
                    <span className={`block text-[11px] leading-tight truncate ${titleColor}`}>
                      {step.shortName || step.title}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider mt-0.5 font-bold">
                      {status === 'COMPLETED' && <span className="text-emerald-400">✓ Done</span>}
                      {status === 'AI_WORKING' && <span className="text-sky-400 animate-pulse">● Active</span>}
                      {status === 'HUMAN_ACTION' && <span className="text-amber-400 font-extrabold">⚠ Action</span>}
                      {status === 'PENDING' && <span className="text-slate-600">Pending</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Action Banner: Displays AI Working Notice OR Human Action Required */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 relative z-10">
        {isHumanActionRequired && humanActionTarget ? (
          /* Human Action Required Banner */
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg shadow-amber-500/5 animate-slide-up">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 border border-amber-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ⚠ YOUR ACTION REQUIRED
                  </span>
                  <span className="text-xs font-mono text-slate-400">Step {activeStepIndex + 1}: {currentStep.title}</span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white">{humanActionTarget.title}</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed font-medium">
                  {humanActionTarget.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
              {autoNavCountdown !== null && !isPaused && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Opening in {autoNavCountdown}s...</span>
                </div>
              )}
              <button
                onClick={() => navigate(humanActionTarget.route)}
                className="py-3 px-6 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                <span>{humanActionTarget.btnText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Autonomous AI Active Banner / Final Tracking Banner */
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg animate-slide-up ${
            activeStepIndex === 10
              ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-emerald-500/30 shadow-emerald-500/5'
              : 'bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/5 border-sky-500/20 shadow-sky-500/5'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl mt-0.5 border ${
                activeStepIndex === 10
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
              }`}>
                {activeStepIndex === 10 ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5 animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    activeStepIndex === 10
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  }`}>
                    {activeStepIndex === 10 ? '🎉 COMPLETED & TRACKING' : '🤖 AI IS WORKING...'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Agent: {currentStep.agent}</span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  {currentStep.title} — {activeStepIndex === 10 ? 'Live Monitoring Active' : 'Autonomous Execution'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed font-medium">
                  {currentActionNotice || currentStep.description}
                </p>
              </div>
            </div>

            {/* Countdown / Status CTA */}
            <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
              {autoNavCountdown !== null && !isPaused && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>Continuing in {autoNavCountdown}s...</span>
                </div>
              )}
              {activeStepIndex === 10 ? (
                <button
                  onClick={() => navigate('/dashboard/applications')}
                  className="py-2.5 px-5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>View Applications History</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    const targetRoute = currentStep.targetRoute || '/dashboard/journey';
                    navigate(targetRoute);
                  }}
                  className="py-2.5 px-5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutopilotGuide;
