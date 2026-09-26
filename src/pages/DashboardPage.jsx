import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { ThemeToggle } from '../components/ThemeToggle';
import { GlassCard } from '../components/GlassCard';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useSupervisorAutopilot } from '../hooks/useSupervisorAutopilot';
import { useScholarshipJourney } from '../hooks/useScholarshipJourney';
import { StudentJourneyCard } from '../components/StudentJourneyCard';
import {
  GraduationCap,
  LogOut,
  User,
  FileText,
  Brain,
  Award,
  ClipboardList,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Wand2,
  Compass,
  ArrowRight
} from 'lucide-react';

export const DashboardPage = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Centralized Automated Scholarship Journey Engine
  const journey = useScholarshipJourney();

  // Integrated Autonomous Supervisor Autopilot Controller (Background State & Metrics)
  const autopilot = useSupervisorAutopilot({
    enableAutoNavigation: false,
    stepDisplayDelayMs: 1200
  });

  const stats = autopilot.stats || {
    profile_completion: journey.profileStatus?.completionPercentage || 0,
    total_scholarships: 54,
    eligible_count: journey.eligibilityStatus?.eligibleCount || 0,
    partially_eligible_count: 0,
    rejected_count: 0,
    missing_documents: journey.requiredDocuments || [],
    verification_status: {
      profile: journey.profileStatus?.isComplete ? 'Verified' : 'Pending',
      documents: journey.documentStatus?.verifiedCount > 0 ? 'Verified' : 'Pending',
      ocr: journey.documentStatus?.hasMismatches ? 'Mismatch' : 'Verified',
      ai_matching: journey.eligibilityStatus?.eligibleCount > 0 ? 'Completed' : 'Pending'
    },
    mismatches: []
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'success');
    navigate('/');
  };

  const cards = [
    {
      title: t('cardProfileTitle', 'Student Profile'),
      description: t('cardProfileDesc', 'Update CGPA, category, annual income, and academic details for match evaluation.'),
      icon: User,
      color: 'from-blue-500 to-indigo-500',
      badge: `${journey.profileStatus?.completionPercentage ?? stats.profile_completion ?? 0}% ${t('done', 'Done')}`,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
      path: '/dashboard/profile'
    },
    {
      title: t('cardDocsTitle', 'Document Verification'),
      description: t('cardDocsDesc', 'Upload marksheets, Aadhaar, and income certificates for OCR verification.'),
      icon: FileText,
      color: 'from-violet-500 to-purple-500',
      badge: `${journey.documentStatus?.missingCount !== undefined ? journey.documentStatus.missingCount : stats.missing_documents.filter(d => d.status === 'Not Uploaded' || d.status === 'Missing').length} ${t('pending', 'Pending')}`,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
      path: '/dashboard/documents'
    },
    {
      title: t('cardCertTitle', 'Certificate Creator Agent'),
      description: t('cardCertDesc', 'Generate template certificates and verify credentials automatically.'),
      icon: Wand2,
      color: 'from-pink-500 to-rose-500',
      badge: t('agenticGen', 'Template Gen'),
      badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20',
      path: '/dashboard/certificates'
    },
    {
      title: t('cardEligibilityTitle', 'Eligibility Analysis'),
      description: t('cardEligibilityDesc', 'Audit profile eligibility rules and check criteria compliance.'),
      icon: Brain,
      color: 'from-emerald-500 to-teal-500',
      badge: stats.verification_status.ai_matching,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      path: '/dashboard/eligibility'
    },
    {
      title: t('cardRecoTitle', 'AI Recommendations'),
      description: t('cardRecoDesc', 'Explore matching scholarships ranked by eligibility and award value.'),
      icon: Award,
      color: 'from-amber-500 to-orange-500',
      badge: `${journey.eligibilityStatus?.eligibleCount || stats.eligible_count} ${t('matches', 'Matches')}`,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      path: '/dashboard/recommendations'
    },
    {
      title: t('cardInsightsTitle', 'AI Insights'),
      description: t('cardInsightsDesc', 'View application deadlines, analytics, and scholarship notifications.'),
      icon: TrendingUp,
      color: 'from-sky-500 to-indigo-500',
      badge: t('interactive', 'Interactive'),
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
      path: '/dashboard/insights'
    },
    {
      title: t('cardAssistantTitle', 'ScholarAI Assistant'),
      description: t('cardAssistantDesc', 'Ask questions on scholarship requirements, deadlines, and guides.'),
      icon: Brain,
      color: 'from-cyan-500 to-blue-500',
      badge: t('online', 'Online'),
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      path: '/dashboard/assistant'
    },
    {
      title: t('cardAppHistTitle', 'Application History'),
      description: t('cardAppHistDesc', 'Track submitted scholarship applications and review status.'),
      icon: ClipboardList,
      color: 'from-emerald-500 to-teal-500',
      badge: t('history', 'History'),
      badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
      path: '/dashboard/applications'
    },
    {
      title: t('cardJourneyTitle', 'Scholarship Journey'),
      description: t('cardJourneyDesc', 'Complete 9-step guided workflow from profile to tracking.'),
      icon: Compass,
      color: 'from-blue-600 to-indigo-600',
      badge: `Step ${journey.stepNumber || 1}/9`,
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      path: '/dashboard/journey'
    }
  ];

  return (
    <div className="min-h-screen bg-custom-image flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-400/10 blur-[130px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Navigation Header */}
      <nav className="w-full max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between relative z-50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Link to="/" className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 flex items-center">
            <GraduationCap className="w-5 h-5" />
          </Link>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
            ScholarAI
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <LanguageSelector />
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 font-semibold text-xs transition-all focus:outline-none cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> {t('logout', 'Logout')}
          </button>
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-5 py-5 relative z-10">
        
        {/* Modern Clean Hero Banner */}
        <div className="mb-5 p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm animate-slide-up relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-bold mb-2 border border-sky-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Student Portal</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">
                {t('welcome', 'Welcome back')}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">{user?.fullName || 'Student'}</span> 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('dashboardSubtitle', 'Manage your academic profile, verify documents, and explore personalized AI scholarship recommendations.')}
              </p>
            </div>

            {/* Quick action buttons & profile status chip */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              <Link
                to="/dashboard/recommendations"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{t('viewScholarships', 'View Matches')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/dashboard/profile"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300/60 dark:border-slate-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <User className="w-3.5 h-3.5 text-sky-500" />
                <span>Profile ({journey.profileStatus?.completionPercentage ?? stats.profile_completion ?? 0}%)</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 🎯 What's Next? Student Guidance Journey Card */}
        <StudentJourneyCard journey={journey} />

        {/* OCR Data Mismatch Warnings */}
        {stats.mismatches && stats.mismatches.length > 0 && (
          <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-slide-up">
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <span>⚠️</span> {t('mismatchWarning', 'Verification Warning: Document Mismatches Detected')}
            </h3>
            <div className="space-y-1">
              {stats.mismatches.map((m, idx) => (
                <p key={idx} className="text-xs text-slate-800 dark:text-slate-300 font-medium">
                  • <strong>{m.field.toUpperCase()} Mismatch:</strong> {m.message}
                </p>
              ))}
            </div>
            <Link
              to="/dashboard/eligibility"
              className="inline-block mt-2 text-xs font-bold text-rose-500 hover:underline"
            >
              {t('correctDetails', 'Correct details & Re-run Verification →')}
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 animate-slide-up">
          <GlassCard className="border border-white/20 flex flex-col justify-between py-4 px-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">{t('totalScholarships', 'Total Scholarships')}</span>
            <span className="text-2xl font-black text-slate-950 dark:text-white">{stats.total_scholarships || 54}</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium mt-1">{t('activeDatabaseSchemes', 'Active database schemes')}</p>
          </GlassCard>

          <GlassCard className="border border-white/20 flex flex-col justify-between py-4 px-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">{t('eligible', 'Eligible Matches')}</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {journey.eligibilityStatus?.eligibleCount !== undefined ? journey.eligibilityStatus.eligibleCount : (stats.eligible_count === 0 && stats.rejected_count === 0 ? '—' : stats.eligible_count)}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium mt-1">
              {journey.eligibilityStatus?.eligibleCount > 0 ? t('fullyVerified', 'Fully verified & matched') : t('completeProfile', 'Complete profile to calculate')}
            </p>
          </GlassCard>

          <GlassCard className="border border-white/20 flex flex-col justify-between py-4 px-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">{t('notEligible', 'Not Eligible')}</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats.eligible_count === 0 && stats.rejected_count === 0 ? '—' : stats.rejected_count}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium mt-1">
              {stats.eligible_count === 0 && stats.rejected_count === 0 ? t('completeProfile', 'Complete profile to calculate') : t('criteriaNotMet', 'Eligibility criteria not met')}
            </p>
          </GlassCard>

          <GlassCard className="border border-white/20 flex flex-col justify-between py-4 px-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">{t('profileReadiness', 'Profile Readiness')}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {journey.profileStatus?.completionPercentage ?? stats.profile_completion ?? 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${journey.profileStatus?.completionPercentage ?? stats.profile_completion ?? 0}%` }}
              ></div>
            </div>
          </GlassCard>
        </div>

        {/* Action Grid Section Header */}
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-sky-500" /> {t('portalServices', 'Portal Services & Actions')}
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">9 Services Available</span>
        </div>

        {/* Compact 3-Column Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                onClick={() => navigate(card.path)}
                className="group bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-slate-800/90 rounded-xl flex flex-col justify-between p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-sky-500/40 cursor-pointer transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-tr ${card.color} text-white shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {card.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {card.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 mt-4 group-hover:gap-1.5 transition-all">
                  {t('openAction', 'Open Action')} <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. {t('footerRights', 'All rights reserved.')}</p>
      </footer>
    </div>
  );
};

export default DashboardPage;
