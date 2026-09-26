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
  Trash2,
  GitCompare,
  Award,
  Calendar,
  X,
  Loader
} from 'lucide-react';

export const SavedPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

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

    api.get('/saved')
      .then((res) => {
        const loaded = (res.data || []).map(item => {
          if (!item.scholarship) return null;
          const sch = item.scholarship;
          let amtStr = cleanEnglishText(sch.amount);
          if (amtStr && /^\d/.test(amtStr)) {
            amtStr = `Rs. ${amtStr}`;
          }
          if (!amtStr) amtStr = 'Varies';

          return {
            id: sch.s_no || sch.id,
            title: cleanEnglishText(sch.scholarship_name),
            amount: amtStr,
            deadline: cleanEnglishText(sch.deadline) || 'Ongoing',
            eligibility: `Academic: ${cleanEnglishText(sch.min_cgpa) || 'Open'} | Income: ${cleanEnglishText(sch.max_family_income) || 'Open'}`,
            difficulty: cleanEnglishText(sch.provider) || 'Standard Application',
            match: '95%'
          };
        }).filter(Boolean);
        setSavedList(loaded);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load saved scholarships:', err);
        setLoading(false);
      });
  }, []);

  const handleRemove = (id, title) => {
    api.delete(`/saved/${id}`)
      .then(() => {
        setSavedList((prev) => prev.filter((item) => item.id !== id));
        showToast(`Removed ${title} from saved scholarships.`, 'info');
      })
      .catch((err) => {
        showToast(`Failed to remove bookmark.`, 'error');
        console.error(err);
      });
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
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Saved Scholarships</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Track programs you bookmarked. Use the compare tool to analyze specifications side-by-side.
            </p>
          </div>
          {savedList.length >= 2 && (
            <button
              onClick={() => setComparing(true)}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs transition-all shadow shadow-sky-500/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <GitCompare className="w-4.5 h-4.5" /> Compare Saved
            </button>
          )}
        </div>

        {/* Saved List Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : savedList.length === 0 ? (
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl text-center py-16 shadow-xl animate-slide-up p-8">
            <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Bookmarks Found</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bookmark scholarships inside Recommendations to see them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            {savedList.map((item) => (
              <div key={item.id} className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between p-6 shadow-xl hover:border-sky-500/40 transition-all duration-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">{item.title}</h3>
                    <button
                      onClick={() => handleRemove(item.id, item.title)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{item.amount}</span>
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {item.match} Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-sky-500" /> Deadline: {item.deadline}</span>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700/50">{item.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Comparison Grid Modal */}
      {comparing && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 sm:p-6 z-50 animate-fade-in">
          <div className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 relative animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-sky-500" /> Side-by-Side Comparison
              </h3>
              <button
                onClick={() => setComparing(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/50">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-xs">Criteria</th>
                    {savedList.map((item) => (
                      <th key={item.id} className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                        {item.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-4 px-4 font-bold text-slate-500 dark:text-slate-400">Match Rate</td>
                    {savedList.map((item) => (
                      <td key={item.id} className="py-4 px-4 font-bold text-emerald-600 dark:text-emerald-400">{item.match}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-4 px-4 font-bold text-slate-500 dark:text-slate-400">Reward Amount</td>
                    {savedList.map((item) => (
                      <td key={item.id} className="py-4 px-4 font-extrabold text-sky-600 dark:text-sky-400">{item.amount}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-4 px-4 font-bold text-slate-500 dark:text-slate-400">Eligibility Core</td>
                    {savedList.map((item) => (
                      <td key={item.id} className="py-4 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200">{item.eligibility}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-4 px-4 font-bold text-slate-500 dark:text-slate-400">Application Complexity</td>
                    {savedList.map((item) => (
                      <td key={item.id} className="py-4 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200">{item.difficulty}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-4 px-4 font-bold text-slate-500 dark:text-slate-400">Closing Date</td>
                    {savedList.map((item) => (
                      <td key={item.id} className="py-4 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200">{item.deadline}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setComparing(false)}
              className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl text-sm transition-all cursor-pointer shadow-md"
            >
              Close Table
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-300/30 dark:border-slate-800/30 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
};
