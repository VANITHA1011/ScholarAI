import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSelector } from '../../components/LanguageSelector';
import { GlassCard } from '../../components/GlassCard';
import { InputField } from '../../components/InputField';
import {
  GraduationCap,
  ArrowLeft,
  Settings,
  User,
  Lock,
  Bell,
  Sun,
  Globe,
  Save
} from 'lucide-react';

export const SettingsPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'password', label: 'Password Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'theme', label: 'Display Theme', icon: Sun },
    { id: 'language', label: 'Language', icon: Globe }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Settings saved successfully.', 'success');
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
          <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-semibold text-sm transition-all">
            <ArrowLeft className="w-4.5 h-4.5" /> Back
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-8 relative z-10 flex flex-col md:flex-row gap-6">
        
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-4 animate-slide-up">
          <GlassCard className="border border-white/20 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
              <Settings className="w-4.5 h-4.5 text-sky-500" /> Account Settings
            </h3>
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-thin">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer focus:outline-none w-full ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow'
                        : 'border border-slate-300/60 dark:border-slate-850/60 hover:bg-slate-200/50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Settings Form Pane */}
        <GlassCard className="flex-1 border border-white/20 p-6 md:p-8 animate-slide-up">
          <form onSubmit={handleSave}>
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">Profile Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <InputField label="Account Username" name="username" placeholder="e.g. vanitha10" value="vanitha10" readOnly />
                  <InputField label="System Role" name="role" value="Student" readOnly />
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">Password Security</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <InputField label="Current Password" name="current_password" type="password" required />
                  <InputField label="New Password" name="new_password" type="password" required />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">Notification Preferences</h2>
                <div className="space-y-4 mb-6">
                  <label className="flex items-center cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4.5 h-4.5 rounded border-slate-300 bg-white/20 text-sky-500" />
                    <span className="ml-2.5 text-sm text-slate-650 dark:text-slate-300 font-medium">Email Alerts on deadline updates</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4.5 h-4.5 rounded border-slate-300 bg-white/20 text-sky-500" />
                    <span className="ml-2.5 text-sm text-slate-650 dark:text-slate-300 font-medium">AI notifications in dashboard portal</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">Theme Settings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Toggle between system dark and light modes. Use the toggles in the top navbar for immediate adjustments.
                </p>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 p-5 rounded-2xl bg-white/30 dark:bg-slate-950/20 border border-slate-300/35 dark:border-slate-800/30 text-center font-bold text-sm text-slate-700 dark:text-white">
                    Adaptive Dark Mode Active
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">Language Preference</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Active Language</label>
                    <select className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500">
                      <option value="English">English</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 active:scale-[0.99] transition-all"
            >
              <Save className="w-5 h-5 mr-2" /> Save Settings
            </button>
          </form>
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-300/30 dark:border-slate-800/30 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
};
