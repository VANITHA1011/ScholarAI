import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSelector } from '../../components/LanguageSelector';
import { GlassCard } from '../../components/GlassCard';
import api from '../../services/api';
import {
  GraduationCap,
  ArrowLeft,
  Sparkles,
  Loader,
  CheckCircle,
  Brain,
  TrendingUp,
  Award,
  AlertCircle,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const EligibilityPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [complete, setComplete] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const steps = [
    'Supervisor: Validating Student Profile parameters...',
    'Supervisor: Analyzing Uploaded Verification Documents...',
    'OCR Engine: Parsing scanned document text details...',
    'Verification Agent: Cross-matching Profile vs OCR databases...',
    'Matching Agent: Executing 16-parameter eligibility score engine...'
  ];

  // Fetch current status on component mount
  useEffect(() => {
    fetchInitialState();
  }, []);

  const fetchInitialState = async () => {
    setInitialLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/agent/state');
      if (res.data && res.data.current_stage && res.data.current_stage !== 'NOT_STARTED') {
        // Optionally run pipeline to get latest details
        const runRes = await api.post('/agent/run');
        setAgentResult(runRes.data);
        setComplete(true);
      }
    } catch (err) {
      console.log('No prior workflow run found or state fetch error:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setComplete(false);
    setAgentResult(null);
    setErrorMsg(null);
    setCurrentStep(0);

    const runStep = (index) => {
      if (index < steps.length) {
        setCurrentStep(index);
        setTimeout(() => {
          runStep(index + 1);
        }, 800);
      } else {
        api.post('/agent/run')
          .then((res) => {
            setAgentResult(res.data);
            setAnalyzing(false);
            setComplete(true);
            showToast('AI Supervisor Workflow completed!', 'success');
          })
          .catch((err) => {
            setAnalyzing(false);
            setComplete(false);
            const errText = err.response?.data?.detail || 'Agent workflow execution failed. Please check your connection or profile.';
            setErrorMsg(errText);
            showToast(errText, 'error');
            console.error(err);
          });
      }
    };

    runStep(0);
  };

  return (
    <div className="min-h-screen bg-custom-image flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-400/10 blur-[130px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg flex items-center">
            <GraduationCap className="w-6 h-6" />
          </Link>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
            ScholarAI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-3xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-8 text-center animate-slide-up">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> AI Supervisor Agent
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
            Scholarship Eligibility & Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Supervise the autonomous agent workflow from student goal validation up to final scholarship recommendations.
          </p>
        </div>

        {/* Action Card */}
        <div className="space-y-8 animate-slide-up">
          <GlassCard className="border border-white/20 text-center py-10 px-6 sm:px-8 shadow-xl">
            
            {/* 1. Loading State during initial check */}
            {initialLoading && (
              <div className="py-8 flex flex-col items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-sky-500 mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Loading supervisor agent state...
                </p>
              </div>
            )}

            {/* 2. Error State */}
            {!initialLoading && !analyzing && errorMsg && (
              <div className="py-6 max-w-md mx-auto animate-fade-in">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Workflow Execution Notice
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {errorMsg}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleAnalyze}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:opacity-95 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry Supervisor Workflow
                  </button>
                  <Link
                    to="/dashboard/profile"
                    className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                  >
                    Check Profile
                  </Link>
                </div>
              </div>
            )}

            {/* 3. Ready / Initial State (Before running) */}
            {!initialLoading && !analyzing && !complete && !errorMsg && (
              <div>
                <div className="w-20 h-20 bg-sky-500/10 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow">
                  <Brain className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                  Execute Agent Workflow
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                  The AI Supervisor Agent will automatically coordinate verification of profiles, OCR logs, mismatch alerts, and compute recommendations.
                </p>
                <button
                  onClick={handleAnalyze}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 animate-pulse" /> Run Supervisor Workflow
                </button>
              </div>
            )}

            {/* 4. Active Progress Animation State */}
            {analyzing && (
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-sky-500/10 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow">
                  <Loader className="w-10 h-10 animate-spin" />
                </div>
                <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-slate-100">
                  Orchestrating Autonomous Agents...
                </h2>
                <div className="space-y-4 text-left">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 transition-opacity duration-300 ${
                        idx < currentStep
                          ? 'opacity-100 text-emerald-500 font-semibold'
                          : idx === currentStep
                          ? 'opacity-100 text-sky-500 font-bold'
                          : 'opacity-30 text-slate-400'
                      }`}
                    >
                      {idx < currentStep ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : idx === currentStep ? (
                        <Loader className="w-5 h-5 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex-shrink-0"></div>
                      )}
                      <span className="text-xs sm:text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Completed Result States */}
            {!initialLoading && complete && agentResult && (
              <div className="max-w-xl mx-auto animate-fade-in text-left">
                
                {/* Result Case A: Profile Incomplete */}
                {agentResult.action === "NEED_PROFILE" && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      Student Profile Incomplete
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      The supervisor detected missing profile credentials needed to evaluate eligibility:
                      {agentResult.missing_fields && agentResult.missing_fields.length > 0 && (
                        <strong className="block text-rose-500 mt-2 font-mono text-xs bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          {agentResult.missing_fields.join(', ')}
                        </strong>
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        to="/dashboard/profile"
                        className="py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow hover:opacity-95 flex items-center justify-center gap-2"
                      >
                        Complete Student Profile <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={handleAnalyze}
                        className="py-3 px-5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Re-check
                      </button>
                    </div>
                  </div>
                )}

                {/* Result Case B: Documents Missing */}
                {agentResult.action === "NEED_DOCUMENTS" && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      Verification Documents Required
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      The supervisor requires certificates to invoke the OCR and document verification agent:
                      {agentResult.missing_documents && agentResult.missing_documents.length > 0 && (
                        <strong className="block text-indigo-500 mt-2 font-mono text-xs bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                          {agentResult.missing_documents.join(', ')}
                        </strong>
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        to="/dashboard/documents"
                        className="py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow hover:opacity-95 flex items-center justify-center gap-2"
                      >
                        Upload Verification Documents <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={handleAnalyze}
                        className="py-3 px-5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Re-evaluate
                      </button>
                    </div>
                  </div>
                )}

                {/* Result Case C: Data Mismatch Warning */}
                {agentResult.action === "NEED_CORRECTION" && (
                  <div>
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                      ⚠️ OCR Data Mismatch Warning
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                      Verification failed due to mismatches between your profile credentials and OCR-extracted document text.
                    </p>
                    {agentResult.mismatches && agentResult.mismatches.length > 0 && (
                      <div className="space-y-3 mb-8">
                        {agentResult.mismatches.map((m, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
                            <span className="text-rose-500 font-extrabold text-base mt-0.5">⚠️</span>
                            <div>
                              <span className="block text-xs font-bold uppercase tracking-wider text-rose-500 font-mono mb-1">
                                {m.field} Mismatch
                              </span>
                              <p className="text-sm text-slate-800 dark:text-slate-200">{m.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        to="/dashboard/profile"
                        className="flex-1 text-center py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        Edit Profile Details
                      </Link>
                      <Link
                        to="/dashboard/documents"
                        className="flex-grow text-center py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow hover:opacity-95"
                      >
                        Check Uploaded Documents
                      </Link>
                    </div>
                  </div>
                )}

                {/* Result Case D: Matching Completed / Select Scholarship */}
                {(agentResult.action === "NEED_SCHOLARSHIP_SELECT" || agentResult.action === "MATCHING_COMPLETED") && (
                  <div>
                    <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                      Eligibility Matching Complete
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 leading-relaxed">
                      {agentResult.message || 'The Matching Agent evaluated scholarship opportunities against your profile parameters.'}
                    </p>
                    <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-6 text-center">
                      <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                        {agentResult.scholarships?.filter(s => s.status !== "Rejected").length || 0}
                      </span>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                        Matching Scholarships Available
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleAnalyze}
                        className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        Re-Analyze
                      </button>
                      <Link
                        to="/dashboard/recommendations"
                        className="flex-grow text-center py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow hover:opacity-95 flex items-center justify-center gap-2"
                      >
                        View Ranked Scholarships <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Result Case E: Application Ready / Completed */}
                {(agentResult.action === "COMPLETED" || agentResult.action === "APPLICATION_READY") && (
                  <div>
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                      AI Verification & Eligibility Confirmed
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-emerald-500/10 dark:bg-emerald-500/15 p-4 rounded-xl border border-emerald-500/20 mb-6 leading-relaxed">
                      {agentResult.ai_explanation || agentResult.message || 'All profile data and documents verified successfully! You are ready to proceed.'}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleAnalyze}
                        className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-800 font-semibold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        Re-Analyze
                      </button>
                      <Link
                        to="/dashboard/journey"
                        className="flex-grow text-center py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow hover:opacity-95 flex items-center justify-center gap-2"
                      >
                        Track Application Journey <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Fallback for any other unexpected action string */}
                {!["NEED_PROFILE", "NEED_DOCUMENTS", "NEED_CORRECTION", "NEED_SCHOLARSHIP_SELECT", "MATCHING_COMPLETED", "COMPLETED", "APPLICATION_READY"].includes(agentResult.action) && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      Workflow Updated
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {agentResult.message || 'Your AI workflow state has been updated.'}
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={handleAnalyze}
                        className="py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow hover:opacity-95"
                      >
                        Re-Run Workflow
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </GlassCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-300/30 dark:border-slate-800/30 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
};
