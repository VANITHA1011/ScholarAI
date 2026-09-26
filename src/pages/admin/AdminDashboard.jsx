import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  FileText,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  LogOut,
  Calendar,
  DollarSign,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  FileCheck2,
  BookOpen,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  History,
  Check,
  AlertTriangle,
  FileSearch,
  Maximize2,
  Bell,
  Send,
  Timer,
  BellRing
} from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import api from '../../services/api';

export const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Dashboard Data State
  const [stats, setStats] = useState({
    total_applications: 0,
    submitted_applications: 0,
    approved_applications: 0,
    rejected_applications: 0,
    under_review_applications: 0,
    total_students: 0,
    total_scholarships: 0,
    total_documents: 0
  });
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'students'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Application Modal & Decision State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Safety Confirmation Dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // 'APPROVE' | 'REJECT' | 'UNDER_REVIEW'
    appId: null,
    reason: ''
  });

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null); // { url, filename, type }

  // Deadlines & Automated Notifications State
  const [deadlines, setDeadlines] = useState([]);
  const [isAuditingDeadlines, setIsAuditingDeadlines] = useState(false);
  const [deadlineSearch, setDeadlineSearch] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('ALL'); // ALL, ACTIVE, EXPIRING_SOON, EXPIRED
  const [testEmailModal, setTestEmailModal] = useState({
    isOpen: false,
    toEmail: 'srinagapriya5@gmail.com',
    notificationType: 'DEADLINE_3_DAYS',
    scholarshipName: 'Central Sector Scheme of Scholarship (CSSS)',
    deadline: '31 October 2026',
    studentName: 'Applicant Candidate',
    isSending: false
  });

  // Clean currency and mojibake symbols
  const cleanCurrency = (text) => {
    if (!text && text !== 0) return 'Standard Grant';
    return String(text)
      .replace(/â‚¹/g, '₹')
      .replace(/â€“/g, ' - ')
      .replace(/â€”/g, ' - ')
      .replace(/Â¹/g, '')
      .replace(/Â/g, '')
      .replace(/â/g, '')
      .replace(/¹/g, '₹')
      .replace(/–/g, ' - ')
      .replace(/—/g, ' - ')
      .trim();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Fetch all initial admin data
  const fetchDashboardData = async (showRefreshToast = false) => {
    try {
      setIsRefreshing(true);
      const [statsRes, appsRes, studentsRes, deadlinesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/applications'),
        api.get('/admin/students'),
        api.get('/admin/scholarships/deadlines').catch(() => ({ data: { deadlines: [] } }))
      ]);

      setStats(statsRes.data);
      setApplications(appsRes.data);
      setStudents(studentsRes.data);
      setDeadlines(deadlinesRes.data?.deadlines || []);

      if (showRefreshToast) {
        showToast('Admin dashboard refreshed with live data.', 'success');
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast('Failed to synchronize admin data. Please ensure backend is running.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    showToast('Logged out of Admin Portal.', 'info');
    navigate('/admin/login');
  };

  // Open Full Detail Modal
  const handleOpenDetail = async (appId) => {
    try {
      setActionLoading(true);
      const res = await api.get(`/admin/applications/${appId}`);
      setSelectedApp(res.data);
      setAdminNotes('');
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching application detail:', err);
      showToast('Could not load application details.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Safe Confirmation Modals
  const promptApprove = (app) => {
    setConfirmDialog({
      isOpen: true,
      type: 'APPROVE',
      appId: app.id,
      targetApp: app,
      reason: adminNotes || ''
    });
  };

  const promptReject = (app) => {
    setConfirmDialog({
      isOpen: true,
      type: 'REJECT',
      appId: app.id,
      targetApp: app,
      reason: adminNotes || ''
    });
  };

  const promptUnderReview = (app) => {
    setConfirmDialog({
      isOpen: true,
      type: 'UNDER_REVIEW',
      appId: app.id,
      targetApp: app,
      reason: adminNotes || ''
    });
  };

  // Execute Confirmed Decision
  const handleExecuteDecision = async () => {
    const { type, appId, reason } = confirmDialog;
    if (!type || !appId) return;

    if (type === 'REJECT' && !reason.trim()) {
      showToast('Please provide a reason for rejecting this application.', 'warning');
      return;
    }

    const newStatus = type === 'APPROVE' ? 'Approved' : (type === 'REJECT' ? 'Rejected' : 'Under Review');

    try {
      setActionLoading(true);
      const res = await api.put(`/admin/applications/${appId}/status`, {
        status: newStatus,
        admin_notes: reason.trim() || undefined
      });

      showToast(`Application #${appId} successfully marked as ${newStatus}!`, 'success');

      // Update local state immediately without full reload
      setApplications(prev =>
        prev.map(app => (app.id === appId ? { ...app, status: newStatus, history: res.data.history || app.history } : app))
      );

      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => ({
          ...prev,
          status: newStatus,
          history: res.data.history || prev.history
        }));
      }

      // Live Recalculate KPI Stats
      setStats(prev => {
        const wasPending = ['SUBMITTED', 'Applied', 'Waiting', 'Recommended', 'Interested'].includes(selectedApp?.status || '');
        const wasApproved = selectedApp?.status === 'Approved';
        const wasRejected = selectedApp?.status === 'Rejected';

        let sub = prev.submitted_applications;
        let appCount = prev.approved_applications;
        let rej = prev.rejected_applications;
        let rev = prev.under_review_applications;

        if (wasPending) sub = Math.max(0, sub - 1);
        if (wasApproved) appCount = Math.max(0, appCount - 1);
        if (wasRejected) rej = Math.max(0, rej - 1);

        if (newStatus === 'Approved') appCount += 1;
        else if (newStatus === 'Rejected') rej += 1;
        else if (newStatus === 'Under Review') rev += 1;

        return {
          ...prev,
          submitted_applications: sub,
          approved_applications: appCount,
          rejected_applications: rej,
          under_review_applications: rev
        };
      });

      setConfirmDialog({ isOpen: false, type: null, appId: null, reason: '' });
      setAdminNotes('');
    } catch (err) {
      console.error('Error updating status:', err);
      showToast(err.response?.data?.detail || 'Failed to update application status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Jump from Student Directory to their Applications
  const handleViewStudentApplications = (studentEmail) => {
    setActiveTab('applications');
    setStatusFilter('ALL');
    setSearchQuery(studentEmail);
  };

  // Filtered Applications with ID, Student, Email, and Scholarship search
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'SUBMITTED' && !['SUBMITTED', 'Applied', 'Waiting'].includes(app.status)) {
          return false;
        }
        if (statusFilter === 'APPROVED' && app.status !== 'Approved') {
          return false;
        }
        if (statusFilter === 'REJECTED' && app.status !== 'Rejected') {
          return false;
        }
        if (statusFilter === 'UNDER_REVIEW' && !['Under Review', 'Recommended', 'Interested'].includes(app.status)) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const appIdStr = String(app.id);
        const studentName = app.student?.fullName?.toLowerCase() || '';
        const studentEmail = app.student?.email?.toLowerCase() || '';
        const schName = app.scholarship?.scholarship_name?.toLowerCase() || '';
        const college = app.student?.college?.toLowerCase() || '';
        const provider = app.scholarship?.provider?.toLowerCase() || '';

        return (
          query === appIdStr ||
          query === `#${appIdStr}` ||
          studentName.includes(query) ||
          studentEmail.includes(query) ||
          schName.includes(query) ||
          college.includes(query) ||
          provider.includes(query)
        );
      }

      return true;
    });
  }, [applications, statusFilter, searchQuery]);

  // Helper for Status Badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
            <Clock className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      case 'SUBMITTED':
      case 'Applied':
      case 'Waiting':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <Clock className="w-3.5 h-3.5" /> Submitted
          </span>
        );
    }
  };

  // Helper for Scholarship Deadline Status Badge
  const getDeadlineStatusBadge = (status, daysRemaining) => {
    if (status === 'EXPIRED' || (daysRemaining !== null && daysRemaining !== undefined && daysRemaining < 0)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3" /> EXPIRED
        </span>
      );
    }
    if (status === 'EXPIRING_SOON' || (daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 7)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3 animate-pulse" /> EXPIRING SOON
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" /> ACTIVE
      </span>
    );
  };

  // Filtered Deadlines Memo
  const filteredDeadlines = useMemo(() => {
    return deadlines.filter((item) => {
      const query = deadlineSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.scholarship_name?.toLowerCase().includes(query) ||
        item.provider?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);

      const matchesFilter =
        deadlineFilter === 'ALL' || item.status === deadlineFilter;

      return matchesSearch && matchesFilter;
    });
  }, [deadlines, deadlineSearch, deadlineFilter]);

  // Trigger Automatic Deadline Audit
  const handleTriggerDeadlineAudit = async () => {
    try {
      setIsAuditingDeadlines(true);
      const res = await api.post('/admin/deadlines/check-now');
      showToast(
        `Audit Complete: Processed ${res.data.total_scholarships} scholarships, sent ${res.data.total_emails_sent} notifications (${res.data.total_skipped_duplicates} duplicate notifications skipped).`,
        'success'
      );
      // Reload deadlines
      const updated = await api.get('/admin/scholarships/deadlines');
      setDeadlines(updated.data?.deadlines || []);
    } catch (err) {
      console.error('Failed to trigger deadline audit:', err);
      showToast('Failed to run deadline audit. Please check server logs.', 'error');
    } finally {
      setIsAuditingDeadlines(false);
    }
  };

  // Dispatch Test Email
  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailModal.toEmail) {
      showToast('Please provide a recipient email address.', 'warning');
      return;
    }
    try {
      setTestEmailModal((prev) => ({ ...prev, isSending: true }));
      const res = await api.post('/notifications/test-email', {
        to_email: testEmailModal.toEmail,
        notification_type: testEmailModal.notificationType,
        scholarship_name: testEmailModal.scholarshipName,
        deadline: testEmailModal.deadline,
        student_name: testEmailModal.studentName
      });
      if (res.data?.success) {
        showToast(`Test ${testEmailModal.notificationType} email sent to ${testEmailModal.toEmail}!`, 'success');
        setTestEmailModal((prev) => ({ ...prev, isOpen: false, isSending: false }));
      } else {
        showToast(`Email notice: ${res.data?.error || res.data?.reason || 'Failed delivery'}`, 'warning');
        setTestEmailModal((prev) => ({ ...prev, isSending: false }));
      }
    } catch (err) {
      console.error('Test email failed:', err);
      showToast('Could not dispatch test email. Ensure backend is running.', 'error');
      setTestEmailModal((prev) => ({ ...prev, isSending: false }));
    }
  };


  return (
    <div className="min-h-screen gradient-bg text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                  Admin Command Center
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-md">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scholarship Verification & Decision Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {user?.fullName || 'Administrator'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {user?.email || 'admin@scholarship.com'}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout', 'Sign Out')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* KPI Metrics Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <GlassCard className="p-4 border-l-4 border-l-sky-500">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Applications</span>
              <FileText className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.total_applications}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              All submissions
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Submitted / Pending</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.submitted_applications}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Needs action
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.approved_applications}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Granted grants
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {stats.rejected_applications}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Declined requests
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Students</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats.total_students}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Registered candidates
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-l-4 border-l-violet-500">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Scholarships</span>
              <Award className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
              {stats.total_scholarships}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Live programs
            </div>
          </GlassCard>
        </section>

        {/* Tab Selection & Search Navigation */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 backdrop-blur-sm self-start">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'applications'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Applications ({applications.length})
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Student Directory ({students.length})
            </button>

            <button
              onClick={() => setActiveTab('deadlines')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'deadlines'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Deadlines &amp; Notifications ({deadlines.length})
            </button>
          </div>

          {/* Search & Filter Bar */}
          {activeTab === 'deadlines' && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search scholarship, provider, category..."
                  value={deadlineSearch}
                  onChange={(e) => setDeadlineSearch(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 rounded-xl text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {deadlineSearch && (
                  <button
                    onClick={() => setDeadlineSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Pill Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setDeadlineFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                      deadlineFilter === status
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerDeadlineAudit}
                  disabled={isAuditingDeadlines}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Run automatic deadline audit and email dispatch now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuditingDeadlines ? 'animate-spin' : ''}`} />
                  <span>{isAuditingDeadlines ? 'Auditing...' : 'Check Deadlines Now'}</span>
                </button>

                <button
                  onClick={() => setTestEmailModal((prev) => ({ ...prev, isOpen: true }))}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Send sample test email"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </button>
              </div>
            </div>
          )}
          {activeTab === 'applications' && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID (#27), student, email, scholarship..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 rounded-xl text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Pill Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                      statusFilter === status
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Tab 1: Applications View */}
        {activeTab === 'applications' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Submitted Applications</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Showing {filteredApplications.length} of {applications.length}
                </span>
              </h2>
            </div>

            {isLoading ? (
              <GlassCard className="p-12 text-center">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-slate-500">Loading submitted applications...</p>
              </GlassCard>
            ) : filteredApplications.length === 0 ? (
              <GlassCard className="p-12 text-center border-dashed border-slate-300 dark:border-slate-800">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {searchQuery ? 'No matching applications found' : 'No applications found'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery ? `No records matched "${searchQuery}".` : 'No applications in this category.'}
                </p>
                {(searchQuery || statusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </GlassCard>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-900/5">
                <table className="w-full text-left text-xs border-collapse bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">ID & Student</th>
                      <th className="py-3.5 px-4">Scholarship Target</th>
                      <th className="py-3.5 px-4">Grant Amount</th>
                      <th className="py-3.5 px-4">Documents</th>
                      <th className="py-3.5 px-4">Submitted Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                    {filteredApplications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Student ID, Name and Email */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                              {app.student?.fullName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                                  #{app.id}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {app.student?.fullName || 'Student'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {app.student?.email}
                              </div>
                              {app.student?.college && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 line-clamp-1 max-w-[200px]" title={app.student.college}>
                                  <Building2 className="w-2.5 h-2.5" /> {app.student.college}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Scholarship Title & Provider */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[240px]" title={app.scholarship?.scholarship_name}>
                            {app.scholarship?.scholarship_name || 'Scholarship'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {app.scholarship?.provider || 'Government Agency'}
                          </div>
                          <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {app.scholarship?.category || 'General'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            {cleanCurrency(app.scholarship?.amount)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Per Academic Year
                          </div>
                        </td>

                        {/* Documents Count */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <FileCheck2 className="w-4 h-4 text-indigo-500" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {app.verified_documents_count} / {app.total_documents || 1}
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {app.verified_documents_count > 0 ? 'Verified' : 'Pending'}
                          </div>
                        </td>

                        {/* Submitted Date */}
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {formatDate(app.submitted_at || app.created_at)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(app.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(app.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center gap-1 cursor-pointer"
                              title="View Full Application Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {app.status !== 'Approved' && (
                              <button
                                onClick={() => promptApprove(app)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                                title="Approve Application"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            {app.status !== 'Rejected' && (
                              <button
                                onClick={() => promptReject(app)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                                title="Reject Application"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Students Directory View */}
        {activeTab === 'students' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Registered Students Directory</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {students.length} Students
                </span>
              </h2>
            </div>

            {students.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No registered students found</h3>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <GlassCard key={student.id} className="p-5 space-y-4 hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                            {student.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                              {student.fullName}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {student.email}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          Score: {student.completionScore}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-200/60 dark:border-slate-800/60 py-3">
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-semibold">College</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1" title={student.college}>
                            {student.college || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-semibold">Degree / Dept</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
                            {student.degree || 'B.E/B.Tech'} {student.department ? `(${student.department})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-semibold">CGPA</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {student.cgpa ? `${student.cgpa} / 10.0` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-semibold">State</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {student.state || 'Tamil Nadu'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Applications: <strong className="text-slate-800 dark:text-slate-200">{student.applications_count}</strong>
                        </span>
                        <span>
                          Documents: <strong className="text-slate-800 dark:text-slate-200">{student.documents_count}</strong>
                        </span>
                      </div>
                    </div>

                    {student.applications_count > 0 && (
                      <button
                        onClick={() => handleViewStudentApplications(student.email)}
                        className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Applications ({student.applications_count})
                      </button>
                    )}
                  </GlassCard>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Scholarship Deadlines & Notifications View */}
        {activeTab === 'deadlines' && (
          <section className="space-y-4">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  Scholarship Deadline Monitoring &amp; Automated Email Notifications
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automatic daily evaluation at 09:00 AM IST (Asia/Kolkata). Reminders sent at 7 days, 3 days, 1 day, and on expiration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerDeadlineAudit}
                  disabled={isAuditingDeadlines}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuditingDeadlines ? 'animate-spin' : ''}`} />
                  <span>{isAuditingDeadlines ? 'Auditing...' : 'Check Deadlines Now'}</span>
                </button>

                <button
                  onClick={() => setTestEmailModal((prev) => ({ ...prev, isOpen: true }))}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </button>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Monitored Schemes</span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{deadlines.length}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-500">Active Schemes</span>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {deadlines.filter((d) => d.status === 'ACTIVE').length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-500">Expiring Soon (≤ 7d)</span>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  {deadlines.filter((d) => d.status === 'EXPIRING_SOON').length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-rose-500">Expired Schemes</span>
                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                  {deadlines.filter((d) => d.status === 'EXPIRED').length}
                </div>
              </div>
            </div>

            {/* Deadlines Table */}
            {filteredDeadlines.length === 0 ? (
              <GlassCard className="p-12 text-center text-slate-400">
                <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3 opacity-60" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No scholarships found</h3>
                <p className="text-xs text-slate-400 mt-1">Try changing your search term or status filter.</p>
              </GlassCard>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Scholarship Name</th>
                      <th className="py-3 px-4">Deadline</th>
                      <th className="py-3 px-4">Days Remaining</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notified / Applied</th>
                      <th className="py-3 px-4">Last Sent</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                    {filteredDeadlines.map((item) => (
                      <tr key={item.scholarship_id} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Name & Provider */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[280px]" title={item.scholarship_name}>
                            {item.scholarship_name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.provider} • <span className="text-indigo-500">{item.category}</span>
                          </div>
                        </td>

                        {/* Deadline */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          <div>{item.parsed_deadline || item.deadline}</div>
                          <div className="text-[10px] text-slate-400">Raw: {item.deadline}</div>
                        </td>

                        {/* Days Remaining */}
                        <td className="py-3.5 px-4">
                          {item.days_remaining !== null && item.days_remaining !== undefined ? (
                            item.days_remaining < 0 ? (
                              <span className="font-bold text-rose-500">Expired ({Math.abs(item.days_remaining)}d ago)</span>
                            ) : item.days_remaining === 0 ? (
                              <span className="font-bold text-rose-600 animate-pulse">Ends Today!</span>
                            ) : item.days_remaining === 1 ? (
                              <span className="font-bold text-rose-600 animate-pulse">Tomorrow (1 day)</span>
                            ) : item.days_remaining <= 3 ? (
                              <span className="font-bold text-amber-600">{item.days_remaining} days left</span>
                            ) : item.days_remaining <= 7 ? (
                              <span className="font-bold text-amber-500">{item.days_remaining} days left</span>
                            ) : (
                              <span className="font-semibold text-slate-600 dark:text-slate-400">{item.days_remaining} days left</span>
                            )
                          ) : (
                            <span className="text-slate-400 italic">Rolling / Open</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {getDeadlineStatusBadge(item.status, item.days_remaining)}
                        </td>

                        {/* Notified / Applied Count */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Bell className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{item.students_notified_count} sent</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.applied_count} applicant{item.applied_count !== 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* Last Sent */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {item.last_notification_sent ? formatDate(item.last_notification_sent) : <span className="text-slate-400 italic">None yet</span>}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() =>
                              setTestEmailModal({
                                isOpen: true,
                                toEmail: 'srinagapriya5@gmail.com',
                                notificationType:
                                  item.days_remaining !== null && item.days_remaining < 0
                                    ? 'EXPIRED'
                                    : item.days_remaining === 1
                                    ? 'DEADLINE_1_DAY'
                                    : item.days_remaining <= 3
                                    ? 'DEADLINE_3_DAYS'
                                    : 'DEADLINE_7_DAYS',
                                scholarshipName: item.scholarship_name,
                                deadline: item.parsed_deadline || item.deadline,
                                studentName: 'Applicant Candidate',
                                isSending: false
                              })
                            }
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Test email template for this scholarship"
                          >
                            <Send className="w-3 h-3" />
                            <span>Test Email</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* FULL APPLICATION REVIEW MODAL */}
      {isModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Application Review #{selectedApp.id}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Submitted on {formatDate(selectedApp.submitted_at || selectedApp.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(selectedApp.status)}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto custom-scrollbar">
              
              {/* Section 1: Scholarship Overview */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400">
                      Scholarship Target
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedApp.scholarship?.scholarship_name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Provider: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedApp.scholarship?.provider || 'Government Agency'}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {cleanCurrency(selectedApp.scholarship?.amount)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Deadline: {selectedApp.scholarship?.deadline || 'Ongoing'}
                    </div>
                  </div>
                </div>

                {selectedApp.scholarship?.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-indigo-100/70 dark:border-indigo-900/40">
                    {selectedApp.scholarship.notes}
                  </p>
                )}
              </div>

              {/* Section 2: COMPACT ELIGIBILITY & VERIFICATION SUMMARY */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs uppercase font-extrabold text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Eligibility & Verification Summary
                  </h5>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {selectedApp.documents?.filter(d => ['VERIFIED', 'Verified'].includes(d.status)).length || 0} / {selectedApp.documents?.length || 1} Documents Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-3">
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Candidate</span>
                    <strong className="text-slate-800 dark:text-slate-200 block truncate">{selectedApp.student?.fullName}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Academic CGPA</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 block">{selectedApp.student?.cgpa || 'N/A'} / 10.0</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Family Income</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 block">
                      {selectedApp.student?.annualIncome ? `₹${selectedApp.student.annualIncome.toLocaleString()}` : 'Not declared'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Category / Quota</span>
                    <strong className="text-slate-800 dark:text-slate-200 block truncate">
                      {selectedApp.student?.category || 'General'}
                    </strong>
                  </div>
                </div>

                {/* Key Eligibility Snapshot Conditions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Profile Score: {selectedApp.student?.completionScore || 85}%
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> State: {selectedApp.student?.state || 'Tamil Nadu'}
                  </span>
                  {selectedApp.student?.firstGraduate && (
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> First Graduate
                    </span>
                  )}
                  {selectedApp.student?.disability && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Disability Quota
                    </span>
                  )}
                </div>
              </div>

              {/* Section 3: Student Profile Details */}
              <div>
                <h5 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  Candidate Full Profile & Qualifications
                </h5>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                      {selectedApp.student?.fullName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Email</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5">
                      {selectedApp.student?.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Mobile</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5">
                      {selectedApp.student?.mobileNumber || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">College</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5 line-clamp-1" title={selectedApp.student?.college}>
                      {selectedApp.student?.college || 'Not set'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Degree / Dept</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5">
                      {selectedApp.student?.degree || 'B.Tech'} - {selectedApp.student?.department || 'CSE'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">CGPA</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                      {selectedApp.student?.cgpa || '8.5'} / 10.0
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">10th / 12th Marks</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5">
                      {selectedApp.student?.tenthPercentage || 'N/A'}% / {selectedApp.student?.twelfthPercentage || 'N/A'}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Annual Income</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5">
                      {selectedApp.student?.annualIncome ? `₹${selectedApp.student.annualIncome.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Category / Quota</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5">
                      {selectedApp.student?.category || 'General'} ({selectedApp.student?.quota || 'General'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Attached Documents Verification with Preview Button */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-500" />
                    Attached Supporting Documents
                  </h5>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedApp.documents?.filter(d => ['VERIFIED', 'Verified'].includes(d.status)).length || 0} / {selectedApp.documents?.length || 1} Documents Verified
                  </span>
                </div>

                {selectedApp.documents && selectedApp.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedApp.documents.map((doc) => {
                      const isVerified = ['VERIFIED', 'Verified'].includes(doc.status);
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                              {isVerified ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                                {doc.document_type} Certificate
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                {doc.filename}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isVerified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                              {doc.status || 'Verified'}
                            </span>
                            {doc.file_path && (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc({
                                  url: `http://localhost:8000${doc.file_path}`,
                                  filename: doc.filename,
                                  type: doc.document_type,
                                  studentName: selectedApp.student?.fullName || 'Applicant',
                                  appId: selectedApp.id
                                })}
                                className="px-2.5 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                                title="Open Document Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    No documents uploaded for this application.
                  </p>
                )}
              </div>

              {/* Section 5: Application Status History */}
              {selectedApp.history && selectedApp.history.length > 0 && (
                <div>
                  <h5 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-violet-500" />
                    Application Status History
                  </h5>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    {selectedApp.history.map((h, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs relative pb-2 border-b border-slate-200/60 dark:border-slate-800 last:border-0 last:pb-0">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-800 dark:text-slate-200">{h.status}</strong>
                            <span className="text-[10px] text-slate-400">{formatDate(h.timestamp)}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            {h.notes || `Updated by ${h.action_by || 'Admin'}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 6: Admin Decision Comments */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Admin Decision Notes & Comments
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add verification notes, approval remarks, or rejection reason..."
                  className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer Decision Buttons */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              >
                Close Review
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => promptUnderReview(selectedApp)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  Mark Under Review
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => promptReject(selectedApp)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Application
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => promptApprove(selectedApp)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Application
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SAFETY CONFIRMATION DIALOG */}
      {confirmDialog.isOpen && confirmDialog.targetApp && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${confirmDialog.type === 'APPROVE' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
                {confirmDialog.type === 'APPROVE' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmDialog.type === 'APPROVE' ? 'Confirm Approval' : (confirmDialog.type === 'REJECT' ? 'Confirm Rejection' : 'Confirm Status Update')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to {confirmDialog.type === 'APPROVE' ? 'approve' : 'reject'} this application?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Candidate:</span>
                <strong className="text-slate-800 dark:text-slate-200">{confirmDialog.targetApp.student?.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scholarship:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{confirmDialog.targetApp.scholarship?.scholarship_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Grant Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{cleanCurrency(confirmDialog.targetApp.scholarship?.amount)}</span>
              </div>
            </div>

            {confirmDialog.type === 'REJECT' && (
              <div>
                <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-wide">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={confirmDialog.reason}
                  onChange={(e) => setConfirmDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why this application cannot be approved..."
                  required
                  className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-800/60 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, type: null, appId: null, reason: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteDecision}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  confirmDialog.type === 'APPROVE'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 shadow-rose-500/20'
                }`}
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {confirmDialog.type === 'APPROVE' ? 'Confirm Approval' : (confirmDialog.type === 'REJECT' ? 'Confirm Rejection' : 'Confirm Update')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {previewDoc.type} Certificate Preview
                    </h4>
                    {previewDoc.studentName && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {previewDoc.studentName} {previewDoc.appId ? `(#${previewDoc.appId})` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{previewDoc.filename}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" /> Open Full
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-2xl p-4 min-h-[300px]">
              {previewDoc.filename.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  title="PDF Preview"
                  className="w-full h-[500px] rounded-xl border-0"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.filename}
                  className="max-h-[500px] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEST EMAIL MODAL */}
      {testEmailModal.isOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Send Test Scholarship Deadline Email
                </h4>
              </div>
              <button
                onClick={() => setTestEmailModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Student Email
                </label>
                <input
                  type="email"
                  required
                  value={testEmailModal.toEmail}
                  onChange={(e) => setTestEmailModal((prev) => ({ ...prev, toEmail: e.target.value }))}
                  placeholder="student-recipient@example.com"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notification Type
                </label>
                <select
                  value={testEmailModal.notificationType}
                  onChange={(e) => setTestEmailModal((prev) => ({ ...prev, notificationType: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DEADLINE_7_DAYS">DEADLINE_7_DAYS (7-Day Application Reminder)</option>
                  <option value="DEADLINE_3_DAYS">DEADLINE_3_DAYS (3-Day Approaching Reminder)</option>
                  <option value="DEADLINE_1_DAY">DEADLINE_1_DAY (URGENT Deadline Tomorrow)</option>
                  <option value="EXPIRED">EXPIRED (Scholarship Application Deadline Passed)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scholarship Scheme Name
                </label>
                <input
                  type="text"
                  required
                  value={testEmailModal.scholarshipName}
                  onChange={(e) => setTestEmailModal((prev) => ({ ...prev, scholarshipName: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={testEmailModal.studentName}
                    onChange={(e) => setTestEmailModal((prev) => ({ ...prev, studentName: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="text"
                    value={testEmailModal.deadline}
                    onChange={(e) => setTestEmailModal((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTestEmailModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testEmailModal.isSending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  {testEmailModal.isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{testEmailModal.isSending ? 'Sending Test...' : 'Send Email Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
