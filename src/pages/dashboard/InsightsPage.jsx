import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/GlassCard';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSelector } from '../../components/LanguageSelector';
import api from '../../services/api';
import {
  GraduationCap,
  ArrowLeft,
  Sparkles,
  BarChart3,
  Calendar,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileWarning,
  Loader,
  ArrowRight
} from 'lucide-react';

export const InsightsPage = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cleanEnglishText = (val) => {
      if (!val && val !== 0) return '';
      return String(val)
        .replace(/â‚¹/g, 'Rs. ')
        .replace(/â€“/g, ' - ')
        .replace(/â€”/g, ' - ')
        .replace(/Â/g, '')
        .replace(/₹/g, 'Rs. ')
        .replace(/–/g, ' - ')
        .replace(/—/g, ' - ')
        .replace(/Rs\.\s*Rs\./g, 'Rs. ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Load full scholarships list
    api.get('/scholarships')
      .then(res => {
        const cleaned = (res.data || []).map(s => ({
          ...s,
          scholarship_name: cleanEnglishText(s.scholarship_name),
          provider: cleanEnglishText(s.provider),
          description: cleanEnglishText(s.description),
          amount: cleanEnglishText(s.amount),
          deadline: cleanEnglishText(s.deadline)
        }));
        setScholarships(cleaned);
      })
      .catch(err => console.error(err));

    // Load profile
    api.get('/profile')
      .then(res => {
        setUserProfile(res.data);
      })
      .catch(err => console.error(err));

    // Load dashboard stats for notifications
    api.get('/dashboard/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Load active notifications
    api.get('/notifications')
      .then(res => {
        setDbNotifications(res.data?.notifications || []);
      })
      .catch(err => console.error('Failed to load notifications:', err));
  }, []);

  // --- Dynamic Calculations ---
  const eligibleScholarships = scholarships.filter(s => s.eligible);
  const rejectedScholarships = scholarships.filter(s => !s.eligible);

  const parseAmountNum = (amt) => {
    if (!amt) return 0;
    if (typeof amt === 'number') return amt;
    const digits = String(amt).replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

  const highestAmount = scholarships.reduce((max, s) => {
    const val = parseAmountNum(s.amount);
    return val > max ? val : max;
  }, 0);

  const bestMatch = eligibleScholarships.reduce((best, s) => {
    if (!best) return s;
    return s.match_percentage > best.match_percentage ? s : best;
  }, null);

  // Helper to calculate days left from deadline string (YYYY-MM-DD)
  const getDaysLeft = (deadlineStr) => {
    try {
      const deadlineDate = new Date(deadlineStr);
      const today = new Date();
      const diffTime = deadlineDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 30;
    }
  };

  // Build Notifications list dynamically based on profile/stats state
  const notifications = [];
  if (userProfile && stats) {
    // 1. New scholarships found
    if (eligibleScholarships.length > 0) {
      notifications.push({
        type: 'info',
        text: `🔔 ${eligibleScholarships.length} new scholarships found`,
        icon: Bell
      });
    }

    // 2. Mismatches detected
    stats.missing_documents.forEach(doc => {
      if (doc.status === 'Mismatch') {
        notifications.push({
          type: 'warning',
          text: `⚠ ${doc.name} mismatch detected`,
          icon: AlertTriangle
        });
      }
    });

    // 3. Missing documents
    stats.missing_documents.forEach(doc => {
      if (doc.status === 'Not Uploaded') {
        notifications.push({
          type: 'missing',
          text: `📄 ${doc.name} missing`,
          icon: FileWarning
        });
      }
    });

    // 4. Profile updated
    if (stats.profile_completion === 100) {
      notifications.push({
        type: 'success',
        text: `✅ Profile updated and complete`,
        icon: CheckCircle
      });
    }

    // 5. Deadlines
    eligibleScholarships.slice(0, 2).forEach(sch => {
      const days = getDaysLeft(sch.deadline);
      if (days < 35) {
        notifications.push({
          type: 'clock',
          text: `⏰ ${sch.scholarship_name.replace("Scholarship", "").trim()} Deadline in ${days} days`,
          icon: Clock
        });
      }
    });
  }

  // Combine database notifications and eligible scholarships closing soon for dedicated deadline cards
  const deadlineReminders = [];

  // 1. From database notifications
  dbNotifications.forEach((n) => {
    if (['DEADLINE_7_DAYS', 'DEADLINE_3_DAYS', 'DEADLINE_1_DAY', 'EXPIRED'].includes(n.notification_type)) {
      const days = n.notification_type === 'DEADLINE_7_DAYS' ? 7 : (n.notification_type === 'DEADLINE_3_DAYS' ? 3 : (n.notification_type === 'DEADLINE_1_DAY' ? 1 : 0));
      deadlineReminders.push({
        id: n.id,
        name: n.scholarship_name || 'Scholarship Scheme',
        days: days,
        isExpired: n.notification_type === 'EXPIRED',
        deadline: '30 September 2026',
        message: n.message
      });
    }
  });

  // 2. From eligible scholarships closing soon if no db notifications
  if (deadlineReminders.length === 0) {
    eligibleScholarships.slice(0, 3).forEach((sch) => {
      const days = getDaysLeft(sch.deadline);
      if (days <= 30) {
        deadlineReminders.push({
          id: sch.s_no,
          name: sch.scholarship_name,
          days: days,
          isExpired: days <= 0,
          deadline: sch.deadline || '30 September 2026'
        });
      }
    });
  }


  return (
    <div className="min-h-screen bg-custom-image flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      
      {/* Decorative Orbs */}
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
          <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-semibold text-sm transition-all">
            <ArrowLeft className="w-4.5 h-4.5" /> Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-8 animate-slide-up flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-sky-500" /> AI Insights & Assistant
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interactive analytics, calendar assistant, and dynamic notification center compiled by ScholarAI agents.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-sky-500" stroke="currentColor" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
            
            {/* Widget 1: AI Insights */}
            <GlassCard className="border border-white/20 p-6 flex flex-col justify-between min-h-[380px]">
              <div>
                <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-sky-500" /> AI Insights
                </h3>
                <div className="space-y-4 text-sm text-slate-700 dark:text-slate-350">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-300/10">
                    <span>Scholarships Analysed</span>
                    <span className="font-extrabold text-slate-950 dark:text-white text-base">{scholarships.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-300/10">
                    <span>Eligible</span>
                    <span className="font-extrabold text-emerald-500 text-base">{eligibleScholarships.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-300/10">
                    <span>Rejected</span>
                    <span className="font-extrabold text-rose-500 text-base">{rejectedScholarships.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-300/10">
                    <span>Highest Amount</span>
                    <span className="font-extrabold text-sky-500 text-base">Rs. {highestAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {bestMatch && (
                <div className="mt-6 pt-4 border-t border-slate-300/30 dark:border-slate-800/30">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Best Match Choice</span>
                  <span className="text-sm font-extrabold text-sky-500">{bestMatch.scholarship_name}</span>
                </div>
              )}
            </GlassCard>

            {/* Widget 2: AI Deadline Assistant */}
            <GlassCard className="border border-white/20 p-6 min-h-[380px] flex flex-col">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 mb-6 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-indigo-500" /> AI Deadline Assistant
              </h3>
              <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                {scholarships.slice(0, 4).map((sch) => {
                  const days = getDaysLeft(sch.deadline);
                  const isNear = days < 30;
                  const dotColor = days < 30 ? 'bg-rose-500' : days < 60 ? 'bg-amber-500' : 'bg-emerald-500';
                  
                  return (
                    <div key={sch.id} className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-300/20 dark:border-slate-800/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                          <h4 className="text-xs font-bold text-slate-885 dark:text-slate-200 max-w-[140px] truncate">
                            {sch.scholarship_name}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-black font-mono ${
                          days < 30 ? 'text-rose-500' : days < 60 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {days} days left
                        </span>
                      </div>
                      
                      {isNear && (
                        <div className="text-[9px] font-semibold text-rose-500 bg-rose-500/5 p-1.5 rounded mt-2 border border-rose-500/10 animate-pulse">
                          Priority HIGH | Suggestion: Complete verification this week.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Widget 3: AI Notifications (with Scholarship Deadline Reminders) */}
            <GlassCard className="border border-white/20 p-6 min-h-[380px] flex flex-col">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-emerald-500" /> AI Notifications
                </span>
                {deadlineReminders.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">
                    {deadlineReminders.length} Deadlines
                  </span>
                )}
              </h3>

              <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                {/* 1. Dedicated Scholarship Deadline Reminder UI Cards */}
                {deadlineReminders.map((d, idx) => (
                  <div
                    key={`dl-${idx}`}
                    className={`p-3.5 rounded-2xl border transition-all animate-slide-up ${
                      d.isExpired
                        ? 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 text-slate-850 dark:text-slate-200'
                        : d.days <= 1
                        ? 'border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/20 text-slate-850 dark:text-slate-200'
                        : 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 text-slate-850 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        <Bell className="w-4 h-4 animate-bounce shrink-0" />
                        <span>Scholarship Deadline Reminder</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          d.isExpired
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            : d.days <= 1
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {d.isExpired ? 'Expired' : d.days === 1 ? 'Tomorrow!' : `${d.days} days left`}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                      {d.name}{' '}
                      {d.isExpired
                        ? 'deadline has passed.'
                        : `deadline is in ${d.days} ${d.days === 1 ? 'day' : 'days'}.`}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-amber-500/20 dark:border-amber-500/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Deadline:</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-bold">{d.deadline}</strong>
                      </div>
                      <button
                        onClick={() => navigate('/dashboard/recommendations')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Scholarship</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. System and Verification Alerts */}
                {notifications.map((n, idx) => {
                  const Icon = n.icon;
                  const alertColors =
                    n.type === 'warning'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                      : n.type === 'missing'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                      : n.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                      : 'bg-sky-500/10 text-sky-500 border-sky-500/25';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${alertColors} flex items-center gap-2 text-xs font-bold leading-normal animate-slide-up`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{n.text}</span>
                    </div>
                  );
                })}

                {deadlineReminders.length === 0 && notifications.length === 0 && (
                  <div className="text-center text-slate-500 py-10 text-xs">No active notifications.</div>
                )}
              </div>
            </GlassCard>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-300/30 dark:border-slate-800/30 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
};
