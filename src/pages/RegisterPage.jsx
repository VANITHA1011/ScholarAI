import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Shield, ArrowLeft, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { InputField } from '../components/InputField';
import { useToast } from '../components/Toast';
import {
  getPasswordStrength,
  validateEmail,
  validateFullName,
  validatePassword,
  validateConfirmPassword
} from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

export const RegisterPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { showToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(allValues.password, value);
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    // If user has already touched this field, validate on change
    if (touched[name]) {
      const err = validateField(name, value, updatedForm);
      setErrors((prev) => ({ ...prev, [name]: err }));
    } else if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Special case: if changing password, revalidate confirmPassword if already filled
    if (name === 'password' && formData.confirmPassword && touched.confirmPassword) {
      const confirmErr = validateConfirmPassword(value, formData.confirmPassword);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    let err = validateField(name, value, formData);

    // If email is valid syntax, check if already in local saved accounts
    if (name === 'email' && !err && value.trim()) {
      try {
        const savedAccounts = JSON.parse(localStorage.getItem('saved_accounts') || '[]');
        const exists = savedAccounts.some(
          (acc) => acc.email?.toLowerCase() === value.trim().toLowerCase()
        );
        if (exists) {
          err = 'This email is already registered. Please login instead.';
        }
      } catch {
        // ignore
      }
    }

    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleValidation = () => {
    const errs = {
      fullName: validateFullName(formData.fullName),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
    };

    // Filter out empty error strings
    const activeErrors = Object.fromEntries(
      Object.entries(errs).filter(([_, v]) => Boolean(v))
    );

    setErrors(activeErrors);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    return Object.keys(activeErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidation()) {
      const firstError = Object.values(errors)[0] || 'Please fix the highlighted errors before submitting.';
      showToast(firstError, 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const submissionData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };
      await authService.register(submissionData);

      // Auto-save account credentials into saved_accounts in localStorage
      const savedAccounts = JSON.parse(localStorage.getItem('saved_accounts') || '[]');
      const filtered = savedAccounts.filter(acc => acc.email.toLowerCase() !== submissionData.email);
      filtered.push({
        fullName: submissionData.fullName,
        email: submissionData.email,
        password: submissionData.password
      });
      localStorage.setItem('saved_accounts', JSON.stringify(filtered));

      showToast('Registration successful! Logging you in...', 'success');
      const loginData = await authService.login(submissionData.email, submissionData.password);
      login(loginData, true);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Registration failed. Please try again.';
      if (
        typeof errorMsg === 'string' &&
        (errorMsg.toLowerCase().includes('already registered') ||
         errorMsg.toLowerCase().includes('already exist') ||
         errorMsg.toLowerCase().includes('exists'))
      ) {
        setErrors((prev) => ({
          ...prev,
          email: 'This email is already registered. Please login instead.',
        }));
        showToast('This email is already registered. Please login.', 'error');
      } else {
        showToast(errorMsg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center py-12 px-4 sm:px-6 relative transition-colors duration-300">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] rounded-full bg-sky-400/15 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[5%] right-[5%] w-[400px] h-[400px] rounded-full bg-indigo-400/15 blur-[120px] pointer-events-none animate-pulse-slow"></div>

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

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <h2 className="text-center text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 mb-2">
          {t('createAccount', 'Create Account')}
        </h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
          {t('registerSubtitle', 'Join AI Scholarship Assistant today and discover matching funding opportunities')}
        </p>

        <GlassCard className="border border-white/20 shadow-2xl">
          <form onSubmit={handleRegisterSubmit} className="space-y-6" noValidate>
            
            {/* Form Section: Personal Info */}
            <div>
              <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4" /> Personal Information
              </h3>

              <InputField
                label={t('fullName', 'Full Name')}
                name="fullName"
                placeholder="e.g. John Doe"
                icon={User}
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={errors.fullName}
                required
              />
              <InputField
                label={t('emailAddress', 'Email Address')}
                name="email"
                type="email"
                placeholder="e.g. student@gmail.com"
                icon={Mail}
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={errors.email}
                required
              />
            </div>

            {/* Form Section: Security */}
            <div className="pt-2 border-t border-slate-300/30 dark:border-slate-800/30">
              <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider mb-4">
                <Shield className="w-4 h-4" /> Password & Security
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <InputField
                    label={t('password', 'Password')}
                    name="password"
                    type="password"
                    placeholder="Min 8 characters (letters & numbers)"
                    icon={Lock}
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    error={errors.password}
                    required
                  />
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-1 px-1">
                      <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-500 dark:text-slate-400">
                        <span>Strength:</span>
                        <span className="font-bold">{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full strength-bar ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <InputField
                  label={t('confirmPassword', 'Confirm Password')}
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  icon={Lock}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={errors.confirmPassword}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-sky-500/10 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              {isLoading ? t('creatingAccount', 'Creating Account...') : t('signUp', 'Complete Registration')}
            </button>

          </form>

          <div className="mt-6 text-center border-t border-slate-300/40 dark:border-slate-800/40 pt-5">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('alreadyHaveAccount', 'Already have an account?')}{' '}
            </span>
            <Link
              to="/login"
              className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline hover:text-sky-500 dark:hover:text-sky-300 transition-colors"
            >
              {t('login', 'Login Here')}
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
