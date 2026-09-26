import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSelector } from '../../components/LanguageSelector';
import { GlassCard } from '../../components/GlassCard';
import api from '../../services/api';
import {
  GraduationCap,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Loader,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink
} from 'lucide-react';

export const HistoryPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();

  const targetAppId = Number(searchParams.get('id') || searchParams.get('appId') || params.id || 0);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docsCount, setDocsCount] = useState(0);
  const [expandedAppId, setExpandedAppId] = useState(null);

  useEffect(() => {
    // If not logged in, redirect to login with return path
    const token = localStorage.getItem('token');
    if (!token && !user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    Promise.all([
      api.get('/applications'),
      api.get('/documents')
    ])
      .then(([appsRes, docsRes]) => {
        const appsData = appsRes.data || [];
        setApplications(appsData);
        const docs = docsRes.data || {};
        const verifiedCount = Object.values(docs).filter(d => d.status === 'VERIFIED' || d.status === 'Verified').length;
        setDocsCount(verifiedCount);
        setLoading(false);

        // Auto-expand and scroll to target application from email link
        if (targetAppId) {
          setExpandedAppId(targetAppId);
          setTimeout(() => {
            const el = document.getElementById(`app-card-${targetAppId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        } else if (appsData.length > 0) {
          setExpandedAppId(appsData[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load application history:', err);
        if (err.response?.status === 401) {
          navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
        } else {
          showToast('Error fetching application history.', 'error');
        }
        setLoading(false);
      });
  }, [targetAppId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatIncome = (val) => {
    if (!val && val !== 0) return 'No Limit';
    const str = String(val).trim();
    if (/^(no limit|none|n\/a|all|any|open|no specific)/i.test(str)) {
      return 'No Limit';
    }
    const digits = str.replace(/[^\d]/g, '');
    if (!digits || Number(digits) >= 9999999 || Number(digits) === 0) {
      return 'No Limit';
    }
    return `₹${Number(digits).toLocaleString('en-IN')}`;
  };

  const cleanEnglishText = (val) => {
    if (!val && val !== 0) return '';
    return String(val)
      .replace(/â‚¹/g, '₹')
      .replace(/â€“/g, ' - ')
      .replace(/â€”/g, ' - ')
      .replace(/Â¹/g, '')
      .replace(/Â/g, '')
      .replace(/â/g, '')
      .replace(/¹/g, '₹')
      .replace(/–/g, ' - ')
      .replace(/—/g, ' - ')
      .replace(/Rs\.\s*Rs\./g, 'Rs. ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const formatSchAmount = (amt) => {
    if (!amt && amt !== 0) return 'Standard Grant';
    const clean = cleanEnglishText(amt);
    return clean.startsWith('₹') ? clean : `₹${clean}`;
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
          <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-4.5 h-4.5" /> Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-8 animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span>Application Status & History</span>
              {targetAppId > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Viewing #{targetAppId}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Track and monitor the real-time status of your submitted scholarship applications.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl text-center py-16 shadow-xl animate-slide-up p-8">
            <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Submitted Applications</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Complete your documents verification and confirm submission from the AI Scholarship Journey page to see your records here.
            </p>
            <Link
              to="/dashboard/journey"
              className="inline-block py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to AI Journey
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 animate-slide-up">
            {applications.map((app) => {
              const hasSnapshot = !!app.snapshot_data;
              let snapshot = null;
              if (hasSnapshot) {
                try {
                  snapshot = JSON.parse(app.snapshot_data);
                } catch (e) {
                  console.error("Failed to parse snapshot_data:", e);
                }
              }

              const schName = cleanEnglishText(snapshot ? snapshot.scholarship_name_snapshot : (app.scholarship?.scholarship_name || `Scholarship #${app.scholarship_id}`));
              const schDesc = cleanEnglishText(snapshot?.scholarship_description_snapshot || app.scholarship?.description || app.scholarship?.notes || app.scholarship?.scholarship_name || 'For professional & technical courses only');
              const schAmount = snapshot ? snapshot.scholarship_amount_snapshot : (app.scholarship?.amount || 0);
              
              const rawReqDocs = snapshot?.required_documents_snapshot || app.scholarship?.required_documents || [];
              const reqDocs = Array.isArray(rawReqDocs) 
                ? rawReqDocs 
                : (typeof rawReqDocs === 'string' && rawReqDocs ? rawReqDocs.split(',') : []);

              const isVerified = snapshot ? (snapshot.verification_status === 'Verified' || snapshot.verification_status === 'VERIFIED') : true;
              const appVerifiedCount = snapshot ? snapshot.documents_verified_count : docsCount;
              const appTotalDocs = snapshot ? snapshot.total_required_documents : (reqDocs.length || 1);
              
              const minCgpa = cleanEnglishText(snapshot ? (snapshot.min_cgpa || 'Open') : (app.scholarship?.min_cgpa || 'Open'));
              const maxIncomeRaw = snapshot?.max_family_income || app.scholarship?.max_family_income || 'No Limit';
              const maxIncomeFormatted = formatIncome(maxIncomeRaw);

              const category = cleanEnglishText(snapshot ? (snapshot.category || 'All') : (app.scholarship?.category || 'All'));
              const gender = cleanEnglishText(snapshot ? (snapshot.gender || 'All') : (app.scholarship?.gender || 'All'));
              
              const dynamicReqs = snapshot?.requirements_snapshot || app.scholarship?.requirements || [];
              const isExpanded = expandedAppId === app.id;
              const isTarget = targetAppId === app.id;

              return (
                <div
                  key={app.id}
                  id={`app-card-${app.id}`}
                  className={`bg-white dark:bg-[#0c1322] border rounded-2xl flex flex-col justify-between p-6 shadow-xl transition-all duration-300 ${
                    isTarget
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-indigo-500/15 bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-sky-500/40'
                  }`}
                >
                  {isTarget && (
                    <div className="mb-4 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Viewing Application #{app.id} from Email Notification
                      </span>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                        Selected Target
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pr-4">
                        {schName}
                      </h3>
                      <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 border ${
                        app.status === 'Approved' || app.status === 'APPROVED'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : app.status === 'Rejected' || app.status === 'REJECTED'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : app.status === 'Under Review'
                          ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30'
                          : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                      }`}>
                        {app.status === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : (app.status === 'Rejected' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />)}
                        {app.status === 'SUBMITTED' ? 'SUBMITTED / Pending Admin Review' : app.status}
                      </span>
                    </div>

                    <div className="space-y-2.5 mb-6 max-w-md">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Application ID:</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700/60 px-2.5 py-0.5 rounded-lg shadow-sm">
                          APP-2026-{app.id.toString().padStart(3, '0')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Submitted On:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatDate(app.submitted_at || app.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Verification status:</span>
                        <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-4 h-4" /> {isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Documents verified:</span>
                        <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <FileText className="w-4 h-4 text-sky-500" /> {appVerifiedCount}/{appTotalDocs} Verified
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Grant Amount:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatSchAmount(schAmount)}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 space-y-4 animate-fade-in shadow-inner">
                        <div>
                          <h4 className="font-black text-[10px] text-sky-500 uppercase tracking-wider mb-1">Scholarship Description</h4>
                          <p className="leading-relaxed font-medium text-slate-700 dark:text-slate-300">{schDesc}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 bg-white dark:bg-[#0c1322] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Min CGPA</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{minCgpa}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Max Income</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{maxIncomeFormatted}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Category</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{category}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Gender</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{gender}</span>
                          </div>
                        </div>

                        {app.history && app.history.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60">
                            <h4 className="font-black text-[10px] text-indigo-500 uppercase tracking-wider mb-2">Audit & Status History</h4>
                            <div className="space-y-2">
                              {app.history.map((h, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">[{h.status}]</span>
                                  <span>{h.notes || `Updated by ${h.action_by || 'Admin'}`}</span>
                                  <span className="text-slate-400 ml-auto text-[10px]">{formatDate(h.timestamp)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {dynamicReqs && dynamicReqs.length > 0 && (
                          <div className="mt-3">
                            <h4 className="font-black text-[10px] text-sky-500 uppercase tracking-wider mb-2">Scheme Requirements</h4>
                            <div className="space-y-1.5">
                              {dynamicReqs.map((r, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{cleanEnglishText(r.description || `${r.requirement_type} ${r.operator} ${r.required_value}`)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-black text-[10px] text-sky-500 uppercase tracking-wider mb-2">Required Document Checklist</h4>
                          <div className="flex flex-wrap gap-2">
                            {reqDocs.length > 0 ? (
                              reqDocs.map((d, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-wider border border-slate-300 dark:border-slate-700/50">
                                  {cleanEnglishText(d)}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic">No specific documents listed.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <span>Hide Details</span>
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>View Full Details</span>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <span className="text-[11px] font-semibold text-slate-400">
                      ID: #{app.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-600 dark:text-slate-400 border-t border-slate-300/30 dark:border-slate-800/30 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
};
