import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import { GlassCard } from '../../components/GlassCard';
import { InputField } from '../../components/InputField';
import api from '../../services/api';
import { INDIAN_STATES_DATA } from '../../constants/institutions';
import {
  GraduationCap,
  ArrowLeft,
  Save,
  User,
  BookOpen,
  TrendingUp,
  Users,
  Award,
  Sparkles
} from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // ── Age derived from DOB ────────────────────────────────────────────────
  const calculateAgeFromDOB = (dobStr) => {
    if (!dobStr) return '';
    const today = new Date();
    const birth = new Date(dobStr);
    if (isNaN(birth.getTime())) return '';
    let age = today.getFullYear() - birth.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hasHadBirthdayThisYear) age -= 1;
    return age >= 0 ? String(age) : '';
  };

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    dob: '',
    gender: 'Male',
    mobileNumber: '',
    state: '',
    college: '',
    university: '',
    degree: '',
    department: '',
    year: '1',
    semester: '1',
    tenthPercentage: '',
    twelfthPercentage: '',
    cgpa: '',
    arrears: 'No',
    annualIncome: '',
    parentOccupation: '',
    category: 'General',
    quota: 'General',
    disability: false,
    sportsQuota: false,
    ncc: false,
    nss: false,
    firstGraduate: false,
    minority: false,
    age: '',
    religion: 'Hinduism'
  });

  const [showCustomStateInput, setShowCustomStateInput] = useState(false);
  const [showCustomCollegeInput, setShowCustomCollegeInput] = useState(false);
  const [showCustomUniversityInput, setShowCustomUniversityInput] = useState(false);
  const [completionScore, setCompletionScore] = useState(45);

  useEffect(() => {
    api.get('/profile')
      .then((res) => {
        const data = res.data;
        const stateVal = data.state || '';
        const isPredefinedState = Object.keys(INDIAN_STATES_DATA).includes(stateVal);
        const isPredefinedCollege = isPredefinedState &&
          INDIAN_STATES_DATA[stateVal]?.colleges.includes(data.college || '');
        const isPredefinedUniversity = isPredefinedState &&
          INDIAN_STATES_DATA[stateVal]?.universities.includes(data.university || '');

        setFormData((prev) => ({
          ...prev,
          dob: data.dob || '',
          gender: data.gender || 'Male',
          mobileNumber: data.mobileNumber || '',
          state: stateVal,
          college: data.college || '',
          university: data.university || '',
          degree: data.degree || '',
          department: data.department || '',
          year: data.year || '1',
          semester: data.semester || '1',
          tenthPercentage: data.tenthPercentage !== null ? String(data.tenthPercentage) : '',
          twelfthPercentage: data.twelfthPercentage !== null ? String(data.twelfthPercentage) : '',
          cgpa: data.cgpa !== null ? String(data.cgpa) : '',
          arrears: data.arrears || 'No',
          annualIncome: data.annualIncome !== null ? String(data.annualIncome) : '',
          parentOccupation: data.parentOccupation || '',
          category: data.category || 'General',
          quota: data.quota || 'General',
          disability: data.disability || false,
          sportsQuota: data.sportsQuota || false,
          ncc: data.ncc || false,
          nss: data.nss || false,
          firstGraduate: data.firstGraduate || false,
          minority: data.minority || false,
          age: calculateAgeFromDOB(data.dob || ''),
          religion: data.religion || 'Hinduism'
        }));

        if (stateVal && !isPredefinedState) {
          setShowCustomStateInput(true);
        }
        if (data.college && !isPredefinedCollege) {
          setShowCustomCollegeInput(true);
        }
        if (data.university && !isPredefinedUniversity) {
          setShowCustomUniversityInput(true);
        }
        setCompletionScore(data.completionScore || 45);
      })
      .catch((err) => {
        console.error('Failed to fetch profile:', err);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'mobileNumber') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }
    if (name === 'dob') {
      setFormData((prev) => ({
        ...prev,
        dob: value,
        age: calculateAgeFromDOB(value)
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber || !formData.state || !formData.college || !formData.university) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }

    const payload = {
      ...formData,
      tenthPercentage: formData.tenthPercentage ? parseFloat(formData.tenthPercentage) : null,
      twelfthPercentage: formData.twelfthPercentage ? parseFloat(formData.twelfthPercentage) : null,
      cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
      annualIncome: formData.annualIncome ? parseFloat(formData.annualIncome) : null,
      age: formData.age ? parseInt(formData.age, 10) : null
    };

    api.put('/profile', payload)
      .then((res) => {
        setCompletionScore(res.data.completionScore);
        showToast('Profile saved successfully! Updating your scholarship journey...', 'success');
        
        // Trigger Supervisor pipeline update and return to Dashboard
        api.post('/agent/run')
          .finally(() => {
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 600);
          });
      })
      .catch((err) => {
        showToast('Failed to save profile details.', 'error');
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
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Header & Completion Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-slide-up">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Complete Student Profile</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Complete your profile segments so our agents can analyze your scholarship matches.
            </p>
          </div>

          <GlassCard className="border border-white/20 py-4 px-6 w-full sm:w-64">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Profile Completion</span>
              <span className={`text-sm font-extrabold ${completionScore === 100 ? 'text-emerald-500' : 'text-sky-500'}`}>{completionScore}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completionScore === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-indigo-500'}`}
                style={{ width: `${completionScore}%` }}
              ></div>
            </div>
          </GlassCard>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-8 animate-slide-up">
          {/* Personal Info */}
          <GlassCard className="border border-white/20">
            <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider mb-6">
              <User className="w-4.5 h-4.5" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField
                label="Full Name"
                name="fullName"
                placeholder="e.g. Vanitha"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
              <InputField
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                required
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                >
                  <option value="Male" className="dark:bg-slate-900">Male</option>
                  <option value="Female" className="dark:bg-slate-900">Female</option>
                  <option value="Other" className="dark:bg-slate-900">Other</option>
                </select>
              </div>
              <InputField
                label="Mobile Number"
                name="mobileNumber"
                placeholder="e.g. 9876543210"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                required
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Age <span className="text-slate-400 font-normal normal-case">(auto-calculated)</span>
                </label>
                <input
                  type="text"
                  name="age"
                  value={formData.age || ''}
                  readOnly
                  placeholder="Calculated from Date of Birth"
                  className="w-full py-2.5 px-4 text-sm bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-xl outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Religion</label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                >
                  <option value="Hinduism" className="dark:bg-slate-900">Hinduism</option>
                  <option value="Islam" className="dark:bg-slate-900">Islam</option>
                  <option value="Christianity" className="dark:bg-slate-900">Christianity</option>
                  <option value="Sikhism" className="dark:bg-slate-900">Sikhism</option>
                  <option value="Buddhism" className="dark:bg-slate-900">Buddhism</option>
                  <option value="Jainism" className="dark:bg-slate-900">Jainism</option>
                  <option value="Other" className="dark:bg-slate-900">Other</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Academic Info */}
          <GlassCard className="border border-white/20">
            <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider mb-6">
              <BookOpen className="w-4.5 h-4.5" /> Academic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* State Dropdown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  State <span className="text-rose-500">*</span>
                </label>
                {showCustomStateInput ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="state"
                      placeholder="Enter custom state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500 pr-20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomStateInput(false);
                        setFormData(prev => ({ ...prev, state: '', college: '', university: '' }));
                      }}
                      className="absolute right-2 top-1.5 px-2 py-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Select State
                    </button>
                  </div>
                ) : (
                  <select
                    name="state"
                    value={formData.state}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (selectedVal === 'Other') {
                        setShowCustomStateInput(true);
                        setShowCustomCollegeInput(true);
                        setShowCustomUniversityInput(true);
                        setFormData(prev => ({ ...prev, state: '', college: '', university: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, state: selectedVal, college: '', university: '' }));
                        setShowCustomCollegeInput(false);
                        setShowCustomUniversityInput(false);
                      }
                    }}
                    className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                    required
                  >
                    <option value="" className="dark:bg-slate-900">Select State</option>
                    {Object.keys(INDIAN_STATES_DATA).map((st) => (
                      <option key={st} value={st} className="dark:bg-slate-900">{st}</option>
                    ))}
                    <option value="Other" className="dark:bg-slate-900">Other (Type Custom)</option>
                  </select>
                )}
              </div>

              {/* College Dropdown / Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  College / Institution <span className="text-rose-500">*</span>
                </label>
                {showCustomCollegeInput || !formData.state || formData.state === 'Other' || !INDIAN_STATES_DATA[formData.state] ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="college"
                      placeholder="e.g. Sona College of Technology"
                      value={formData.college}
                      onChange={handleInputChange}
                      className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                      required
                    />
                    {formData.state && formData.state !== 'Other' && INDIAN_STATES_DATA[formData.state] && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomCollegeInput(false);
                          setFormData(prev => ({ ...prev, college: '' }));
                        }}
                        className="absolute right-2 top-1.5 px-2 py-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        List Colleges
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    name="college"
                    value={formData.college}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (selectedVal === 'Other') {
                        setShowCustomCollegeInput(true);
                        setFormData(prev => ({ ...prev, college: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, college: selectedVal }));
                      }
                    }}
                    className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                    required
                  >
                    <option value="" className="dark:bg-slate-900">Select College</option>
                    {INDIAN_STATES_DATA[formData.state]?.colleges.map((col) => (
                      <option key={col} value={col} className="dark:bg-slate-900">{col}</option>
                    ))}
                    <option value="Other" className="dark:bg-slate-900">Other (Type Custom)</option>
                  </select>
                )}
              </div>

              {/* University Dropdown / Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  Affiliated University <span className="text-rose-500">*</span>
                </label>
                {showCustomUniversityInput || !formData.state || formData.state === 'Other' || !INDIAN_STATES_DATA[formData.state] ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="university"
                      placeholder="e.g. Anna University"
                      value={formData.university}
                      onChange={handleInputChange}
                      className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                      required
                    />
                    {formData.state && formData.state !== 'Other' && INDIAN_STATES_DATA[formData.state] && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomUniversityInput(false);
                          setFormData(prev => ({ ...prev, university: '' }));
                        }}
                        className="absolute right-2 top-1.5 px-2 py-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        List Universities
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    name="university"
                    value={formData.university}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (selectedVal === 'Other') {
                        setShowCustomUniversityInput(true);
                        setFormData(prev => ({ ...prev, university: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, university: selectedVal }));
                      }
                    }}
                    className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                    required
                  >
                    <option value="" className="dark:bg-slate-900">Select University</option>
                    {INDIAN_STATES_DATA[formData.state]?.universities.map((uni) => (
                      <option key={uni} value={uni} className="dark:bg-slate-900">{uni}</option>
                    ))}
                    <option value="Other" className="dark:bg-slate-900">Other (Type Custom)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  Degree <span className="text-rose-500">*</span>
                </label>
                <select
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                  required
                >
                  <option value="" className="dark:bg-slate-900">Select Degree</option>
                  <option value="B.E." className="dark:bg-slate-900">B.E.</option>
                  <option value="B.Tech" className="dark:bg-slate-900">B.Tech</option>
                  <option value="B.Sc" className="dark:bg-slate-900">B.Sc</option>
                  <option value="BCA" className="dark:bg-slate-900">BCA</option>
                  <option value="B.Com" className="dark:bg-slate-900">B.Com</option>
                  <option value="M.E." className="dark:bg-slate-900">M.E.</option>
                  <option value="M.Tech" className="dark:bg-slate-900">M.Tech</option>
                  <option value="M.Sc" className="dark:bg-slate-900">M.Sc</option>
                  <option value="MBA" className="dark:bg-slate-900">MBA</option>
                  <option value="Ph.D" className="dark:bg-slate-900">Ph.D</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                  required
                >
                  <option value="" className="dark:bg-slate-900">Select Department</option>
                  <option value="IT" className="dark:bg-slate-900">IT</option>
                  <option value="CSE" className="dark:bg-slate-900">CSE</option>
                  <option value="ECE" className="dark:bg-slate-900">ECE</option>
                  <option value="EEE" className="dark:bg-slate-900">EEE</option>
                  <option value="MECH" className="dark:bg-slate-900">MECH</option>
                  <option value="CIVIL" className="dark:bg-slate-900">CIVIL</option>
                  <option value="Science" className="dark:bg-slate-900">Science</option>
                  <option value="Arts" className="dark:bg-slate-900">Arts</option>
                  <option value="Commerce" className="dark:bg-slate-900">Commerce</option>
                  <option value="Others" className="dark:bg-slate-900">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Quota</label>
                <select
                  name="quota"
                  value={formData.quota}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                >
                  <option value="SWS" className="dark:bg-slate-900">SWS (Single Window System)</option>
                  <option value="Management" className="dark:bg-slate-900">Management</option>
                  <option value="Government" className="dark:bg-slate-900">Government Scheme</option>
                  <option value="Others" className="dark:bg-slate-900">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Year of Study</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                >
                  <option value="1" className="dark:bg-slate-900">1st Year</option>
                  <option value="2" className="dark:bg-slate-900">2nd Year</option>
                  <option value="3" className="dark:bg-slate-900">3rd Year</option>
                  <option value="4" className="dark:bg-slate-900">4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                >
                  {[...Array(8)].map((_, i) => (
                    <option key={i} value={i + 1} className="dark:bg-slate-900">Semester {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Academic Performance */}
          <GlassCard className="border border-white/20">
            <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider mb-6">
              <TrendingUp className="w-4.5 h-4.5" /> Academic Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <InputField
                label="10th Percentage"
                name="tenthPercentage"
                placeholder="e.g. 92.5"
                value={formData.tenthPercentage}
                onChange={handleInputChange}
                required
              />
              <InputField
                label="12th Percentage"
                name="twelfthPercentage"
                placeholder="e.g. 88.0"
                value={formData.twelfthPercentage}
                onChange={handleInputChange}
                required
              />
              <InputField
                label="Current CGPA"
                name="cgpa"
                placeholder="e.g. 8.5"
                value={formData.cgpa}
                onChange={handleInputChange}
                required
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">History of Arrears</label>
                <select
                  name="arrears"
                  value={formData.arrears}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                >
                  <option value="No" className="dark:bg-slate-900">No</option>
                  <option value="Yes" className="dark:bg-slate-900">Yes</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Family Info */}
          <GlassCard className="border border-white/20">
            <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider mb-6">
              <Users className="w-4.5 h-4.5" /> Family Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <InputField
                label="Annual Income (₹)"
                name="annualIncome"
                placeholder="e.g. 150000"
                value={formData.annualIncome}
                onChange={handleInputChange}
                required
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  Parent Occupation <span className="text-rose-500">*</span>
                </label>
                <select
                  name="parentOccupation"
                  value={formData.parentOccupation}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                  required
                >
                  <option value="" className="dark:bg-slate-900">Select Occupation</option>
                  <option value="Farmer" className="dark:bg-slate-900">Farmer</option>
                  <option value="Weaver" className="dark:bg-slate-900">Weaver</option>
                  <option value="Daily Wage" className="dark:bg-slate-900">Daily Wage</option>
                  <option value="Government Employee" className="dark:bg-slate-900">Government Employee</option>
                  <option value="Private Employee" className="dark:bg-slate-900">Private Employee</option>
                  <option value="Business" className="dark:bg-slate-900">Business</option>
                  <option value="Others" className="dark:bg-slate-900">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full py-2.5 px-4 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl outline-none text-slate-900 dark:text-white backdrop-blur-sm focus:border-sky-500"
                >
                  <option value="General" className="dark:bg-slate-900">General</option>
                  <option value="OC" className="dark:bg-slate-900">OC</option>
                  <option value="BC" className="dark:bg-slate-900">BC</option>
                  <option value="BCM" className="dark:bg-slate-900">BCM</option>
                  <option value="MBC" className="dark:bg-slate-900">MBC</option>
                  <option value="SC" className="dark:bg-slate-900">SC</option>
                  <option value="SCA" className="dark:bg-slate-900">SCA</option>
                  <option value="ST" className="dark:bg-slate-900">ST</option>
                  <option value="Others" className="dark:bg-slate-900">Others</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Other Info (Checkboxes) */}
          <GlassCard className="border border-white/20">
            <h3 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider mb-6">
              <Award className="w-4.5 h-4.5" /> Other Quotas / Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { name: 'disability', label: 'Disability' },
                { name: 'sportsQuota', label: 'Sports Quota' },
                { name: 'ncc', label: 'NCC' },
                { name: 'nss', label: 'NSS' },
                { name: 'firstGraduate', label: 'First Graduate' },
                { name: 'minority', label: 'Minority' }
              ].map((quota) => (
                <label key={quota.name} className="flex items-center select-none cursor-pointer group">
                  <input
                    type="checkbox"
                    name={quota.name}
                    checked={formData[quota.name]}
                    onChange={handleInputChange}
                    className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 bg-white/20 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="ml-2.5 text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors font-medium">
                    {quota.label}
                  </span>
                </label>
              ))}
            </div>
          </GlassCard>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <Save className="w-5 h-5 mr-2" /> Save Profile Details
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-300/30 dark:border-slate-800/30 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
};
