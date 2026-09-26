import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft, RefreshCw } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { InputField } from '../components/InputField';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { validateEmail, validatePassword } from '../utils/validation';
import { authService } from '../services/authService';
import { ThemeToggle } from '../components/ThemeToggle';
import { CloudflareTurnstileWidget } from '../components/CloudflareTurnstileWidget';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [isCfVerified, setIsCfVerified] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    // Clean up any stale saved_accounts from previous sessions
    try {
      localStorage.removeItem('saved_accounts');
    } catch {
      // ignore
    }
  }, []);

  // Handle Google OAuth callback: ?token=...&user=...
  useEffect(() => {
    const token = searchParams.get('token');
    const userB64 = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      showToast(`Google sign-in failed: ${error.replace(/_/g, ' ')}`, 'error');
      // Clean params
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    if (token && userB64) {
      try {
        const userJson = atob(userB64.replace(/-/g, '+').replace(/_/g, '/'));
        const userData = JSON.parse(userJson);
        login({ access_token: token, user: userData }, true);
        showToast(`Welcome, ${userData.fullName || 'User'}!`, 'success');

        const isAdmin = userData.role === 'admin';
        navigate(isAdmin ? '/admin/dashboard' : '/dashboard', { replace: true });
      } catch (err) {
        console.error('Google callback parse error:', err);
        showToast('Failed to process Google sign-in response.', 'error');
        searchParams.delete('token');
        searchParams.delete('user');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleValidation = () => {
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password);

    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!handleValidation()) return;

    setIsLoading(true);
    try {
      const data = await authService.login(formData.email, formData.password);
      login(data, true);

      const isAdmin = data.user?.role === 'admin';
      if (isAdmin) {
        showToast('Welcome, Administrator!', 'success');
        navigate('/admin/dashboard');
      } else {
        showToast('Logged in successfully!', 'success');
        navigate(redirectUrl || '/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Invalid email or password.';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setErrors((prev) => ({ ...prev, email: 'Enter your email to request reset link.' }));
      showToast('Please specify a valid email address first.', 'warning');
      return;
    }

    setForgotLoading(true);
    try {
      const data = await authService.forgotPassword(formData.email);
      showToast(data.message || 'Password reset link sent!', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to process request.';
      showToast(errorMsg, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = 'http://localhost:8000/api/v1/auth/google/login';
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center py-12 px-6 relative transition-colors duration-300">
      {/* Decorative Orbs */}
      <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-sky-400/20 blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-indigo-400/20 blur-[100px] pointer-events-none animate-pulse-slow"></div>

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
        <h2 className="text-center text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 mb-2">
          {t('welcomeBack', 'Welcome Back')}
        </h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
          {t('loginSubtitle', 'Log in to continue managing your scholarships')}
        </p>

        <GlassCard className="border border-white/20 shadow-2xl overflow-hidden p-6 sm:p-8">
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <InputField
              label={t('emailAddress', 'Email Address')}
              name="email"
              type="email"
              placeholder="e.g. name@college.edu"
              icon={Mail}
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              required
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('password', 'Password')} <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium transition-colors focus:outline-none cursor-pointer"
                >
                  {forgotLoading ? 'Sending...' : t('forgotPassword', 'Forgot Password?')}
                </button>
              </div>
              <InputField
                name="password"
                type="password"
                placeholder="Enter password"
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
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-sky-500/10 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <LogIn className="w-5 h-5 mr-2" />
              )}
              {isLoading ? t('signingIn', 'Signing In...') : t('signIn', 'Sign In')}
            </button>
          </form>

          {/* ── OR Divider ── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-300/50 dark:bg-slate-700/50"></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('or', 'or')}</span>
            <div className="flex-1 h-px bg-slate-300/50 dark:bg-slate-700/50"></div>
          </div>

          {/* ── Google Sign-In Button ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center items-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            {/* Official Google "G" Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('signInWithGoogle', 'Sign in with Google')}
            </span>
          </button>

          <div className="mt-6 text-center border-t border-slate-300/40 dark:border-slate-800/40 pt-5">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('dontHaveAccount', "Don't have an account?")}{' '}
            </span>
            <Link
              to="/register"
              className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline hover:text-sky-500 dark:hover:text-sky-300 transition-colors"
            >
              {t('registerHere', 'Register Here')}
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
