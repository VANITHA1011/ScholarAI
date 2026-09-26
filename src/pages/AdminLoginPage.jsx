import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { InputField } from '../components/InputField';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { authService } from '../services/authService';
import { ThemeToggle } from '../components/ThemeToggle';
import { CloudflareTurnstileWidget } from '../components/CloudflareTurnstileWidget';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

export const AdminLoginPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCfVerified, setIsCfVerified] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrors({
        email: !formData.email ? 'Admin email is required.' : '',
        password: !formData.password ? 'Admin password is required.' : ''
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.login(formData.email, formData.password);
      
      const isAdmin = data.user?.role === 'admin';
      if (!isAdmin) {
        showToast('Access denied: This account does not have administrator privileges.', 'error');
        setIsLoading(false);
        return;
      }

      login(data, true);
      showToast('Admin access granted. Welcome to the Command Center.', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Invalid administrative credentials.';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center py-12 px-6 relative transition-colors duration-300">
      {/* Decorative Orbs */}
      <div className="absolute top-[15%] right-[15%] w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[15%] left-[15%] w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none"></div>

      <div className="absolute top-5 right-5 z-50 flex items-center gap-3">
        <LanguageSelector />
        <Link
          to="/"
          className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-2.5 rounded-xl glass-panel"
        >
          <ArrowLeft className="w-4 h-4" /> {t('home', 'Home')}
        </Link>
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 text-white">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 mb-2">
          {t('adminLoginTitle', 'Admin Portal')}
        </h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t('adminSubtitle', 'Student Scholarship Verification & Management System')}
        </p>

        <GlassCard className="border border-indigo-500/20 shadow-2xl overflow-hidden p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label={t('adminEmail', 'Admin Email')}
              name="email"
              type="email"
              placeholder="admin@scholarship.com"
              icon={Mail}
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              required
            />

            <div>
              <InputField
                label={t('adminPassword', 'Admin Password')}
                name="password"
                type="password"
                placeholder="Enter admin password"
                icon={Lock}
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                required
              />
            </div>

            {/* Cloudflare Verification Challenge Widget */}
            <CloudflareTurnstileWidget 
              title="Microsoft"
              onVerified={(verified) => setIsCfVerified(verified)}
            />

            <button
              type="submit"
              disabled={isLoading || !isCfVerified}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-5 h-5 mr-2" />
              )}
              {isLoading ? t('verifyingAdminAuthority', 'Verifying Admin Authority...') : t('accessAdminDashboard', 'Access Admin Dashboard')}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-300/40 dark:border-slate-800/40 pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <Link
              to="/login"
              className="font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              ← {t('studentLogin', 'Student Login')}
            </Link>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('secureAuthentication', 'Secure Authentication')}
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
