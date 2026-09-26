import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSelector } from '../../components/LanguageSelector';
import { GlassCard } from '../../components/GlassCard';
import api from '../../services/api';
import {
  GraduationCap,
  ArrowLeft,
  Wand2,
  FileCheck,
  Building,
  User,
  Sparkles,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';

export const CertificateGeneratorPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'aadhaar';

  const [activeDocType, setActiveDocType] = useState(initialType);
  const [profile, setProfile] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [fields, setFields] = useState({
    // Aadhaar Card
    aadhaar: {
      name: '',
      dob: '08/09/2004',
      gender: 'MALE',
      state: 'Tamil Nadu',
      aadhaar_number: '6543 2109 8765'
    },
    // Income Certificate
    income: {
      certificate_no: 'TN-42023025211847',
      date: '03-01-2023',
      name: '',
      father_name: 'Peter',
      door_no: '45/1',
      street: 'Green Park Street',
      area: 'Anna Nagar',
      taluk: 'Salem South',
      district: 'Salem',
      annual_income: '180000',
      family: [
        { name: 'John', relation: 'Self', age: '24', occupation: 'Private Employee', monthly: '15000', annual: '180000' },
        { name: 'Peter', relation: 'Father', age: '52', occupation: 'Electrician', monthly: '0', annual: '0' },
        { name: 'Mary', relation: 'Mother', age: '48', occupation: 'Homemaker', monthly: '0', annual: '0' }
      ]
    },
    // College ID
    college: {
      college_name: 'Babu Banarasi Das Institute of Technology & Management',
      registration_no: 'BBDITM/BT-EC/2022/00032',
      name: '',
      course: 'B. Tech / EC',
      father_name: 'Mustaqeem Shaukat Ali',
      mobile: '9956843367',
      batch: '2022-2025',
      cgpa: '8.4'
    },
    // Community Certificate
    community: {
      certificate_no: 'TN-5202009111842',
      date: '17-09-2020',
      name: '',
      father_name: 'Suresh',
      door_no: '40/A',
      street: 'Salai Street',
      village: 'Vellakoil Village',
      taluk: 'Palayamkottai',
      district: 'Tirunelveli',
      category: 'OBC',
      community_name: 'Maravars Community'
    },
    // 10th Certificate
    tenth: {
      roll_no: '12145612',
      name: '',
      dob: '28.10.2006',
      school_name: 'VIDYODAYA (G) HR SEC SCHOOL T NAGAR CHENNAI SOUTH',
      marks: {
        tamil: '92',
        english: '95',
        maths: '98',
        science: '94',
        social_science: '96'
      }
    },
    // 12th Certificate
    twelfth: {
      roll_no: '849322',
      register_no: '1710839322',
      name: '',
      dob: '28.10.1999',
      school_name: 'VIDYODAYA (G) HR SEC SCHOOL T NAGAR CHENNAI SOUTH',
      marks: {
        french: '181',
        english: '180',
        physics: '187',
        chemistry: '180',
        biology: '168',
        mathematics: '164'
      }
    },
    // Disability Certificate
    disability: {
      certificate_no: 'DIS-TN-2024-00842',
      date: '12-04-2023',
      name: '',
      father_name: 'K. Senthil Kumar',
      dob: '2004-05-14',
      gender: 'MALE',
      disability_type: 'Locomotor Disability (Orthopedic)',
      percentage: '45',
      diagnosis: 'Post-polio residual paralysis of left lower limb',
      issuing_hospital: 'District Medical Board, Government General Hospital, Tamil Nadu'
    },
    // Sports Quota Certificate
    sportsQuota: {
      certificate_no: 'SDAT-TN-2023-00491',
      date: '14-08-2023',
      name: '',
      father_name: 'K. Senthil Kumar',
      sport_name: 'Athletics (400m Track & Field)',
      competition_level: 'State Championship (Senior Level)',
      achievement: 'Gold Medalist - 1st Position',
      issuing_authority: 'Sports Development Authority of Tamil Nadu (SDAT)',
      representation_year: '2023'
    },
    // First Graduate Certificate
    firstGraduate: {
      certificate_no: 'FG-TN-2023-88319',
      date: '20-06-2023',
      name: '',
      father_name: 'K. Senthil Kumar',
      mother_name: 'S. Lakshmi',
      door_no: '12/4B, South Car Street',
      village_taluk: 'Palayamkottai Taluk',
      district: 'Tirunelveli',
      issuing_officer: 'Headquarters Deputy Tahsildar',
      declaration: 'Certified that neither the parents nor any of the siblings of the applicant has graduated from any university/college.'
    },
    // NCC Certificate
    ncc: {
      certificate_no: 'NCC/TN/2023/C-0842',
      date: '15-03-2023',
      name: '',
      father_name: 'K. Senthil Kumar',
      unit: '1 (TN) CTC NCC, Anna University',
      directorate: 'Tamil Nadu, Puducherry & A&N Directorate',
      cert_type: "'C' Certificate (Alpha Grade)",
      rank: 'Senior Under Officer (SUO)',
      issuing_authority: 'Group Commander, NCC Group HQ'
    },
    // NSS Certificate
    nss: {
      certificate_no: 'NSS-TN-2023-4512',
      date: '10-05-2023',
      name: '',
      father_name: 'K. Senthil Kumar',
      college: 'Sona College of Technology',
      service_hours: '240 Hours + 7-Day Special Camp',
      camp_name: 'Youth for Cleanliness & Green Environment',
      issuing_authority: 'NSS Programme Coordinator & University Registrar'
    },
    // Minority Certificate
    minority: {
      certificate_no: 'MIN-TN-2023-7741',
      date: '18-07-2023',
      name: '',
      father_name: 'K. Senthil Kumar',
      community_religion: 'Muslim Community',
      language: 'Urdu',
      door_no: '45/2, Mosque Street',
      district: 'Chennai',
      issuing_authority: 'Revenue Divisional Officer / Tahsildar'
    }
  });

  const autoFillFieldsFromProfile = (p, notify = false) => {
    if (!p) return;
    setFields(prev => {
      const u = JSON.parse(JSON.stringify(prev));
      const nameVal = p.fullName || '';

      // Aadhaar Card
      if (nameVal) u.aadhaar.name = nameVal;
      if (p.dob) u.aadhaar.dob = p.dob;
      if (p.gender) u.aadhaar.gender = p.gender.toUpperCase();
      if (p.state) u.aadhaar.state = p.state;

      // Income Certificate
      if (nameVal) u.income.name = nameVal;
      if (p.annualIncome !== undefined && p.annualIncome !== null && p.annualIncome !== '') {
        const incStr = String(p.annualIncome);
        u.income.annual_income = incStr;
        if (u.income.family && u.income.family[0]) {
          u.income.family[0].name = nameVal;
          u.income.family[0].annual = incStr;
          u.income.family[0].monthly = String(Math.round(Number(incStr) / 12));
        }
      }
      if (p.parentOccupation && u.income.family && u.income.family[1]) {
        u.income.family[1].occupation = p.parentOccupation;
      }
      if (p.state) u.income.district = p.state;

      // College ID
      if (nameVal) u.college.name = nameVal;
      if (p.college) u.college.college_name = p.college;
      if (p.degree) {
        u.college.course = p.department ? `${p.degree} / ${p.department}` : p.degree;
      }
      if (p.cgpa !== undefined && p.cgpa !== null && p.cgpa !== '') {
        u.college.cgpa = String(p.cgpa);
      }
      if (p.mobileNumber) u.college.mobile = p.mobileNumber;

      // Community Certificate
      if (nameVal) u.community.name = nameVal;
      if (p.category) u.community.category = p.category;
      if (p.state) u.community.district = p.state;
      if (p.religion) u.community.community_name = `${p.religion} Community`;

      // 10th Marksheet
      if (nameVal) u.tenth.name = nameVal.toUpperCase();
      if (p.dob) u.tenth.dob = p.dob;
      if (p.tenthPercentage !== undefined && p.tenthPercentage !== null && p.tenthPercentage !== '') {
        const pct = Number(p.tenthPercentage);
        if (!isNaN(pct)) {
          const baseMark = Math.min(100, Math.max(35, Math.round(pct)));
          u.tenth.marks = {
            tamil: String(Math.min(100, Math.round(baseMark * 0.98))),
            english: String(Math.min(100, Math.round(baseMark * 1.01))),
            maths: String(Math.min(100, Math.round(baseMark * 1.03))),
            science: String(Math.min(100, Math.round(baseMark * 0.97))),
            social_science: String(Math.min(100, Math.round(baseMark * 0.99)))
          };
        }
      }

      // 12th Marksheet
      if (nameVal) u.twelfth.name = nameVal.toUpperCase();
      if (p.dob) u.twelfth.dob = p.dob;
      if (p.twelfthPercentage !== undefined && p.twelfthPercentage !== null && p.twelfthPercentage !== '') {
        const pct = Number(p.twelfthPercentage);
        if (!isNaN(pct)) {
          const base200 = Math.min(200, Math.max(70, Math.round((pct / 100) * 200)));
          u.twelfth.marks = {
            french: String(Math.min(200, Math.round(base200 * 0.98))),
            english: String(Math.min(200, Math.round(base200 * 0.97))),
            physics: String(Math.min(200, Math.round(base200 * 1.01))),
            chemistry: String(Math.min(200, Math.round(base200 * 0.99))),
            biology: String(Math.min(200, Math.round(base200 * 0.96))),
            mathematics: String(Math.min(200, Math.round(base200 * 1.02)))
          };
        }
      }

      // Disability Certificate
      if (nameVal) u.disability.name = nameVal;
      if (p.dob) u.disability.dob = p.dob;
      if (p.gender) u.disability.gender = p.gender.toUpperCase();
      if (p.state) u.disability.issuing_hospital = `District Medical Board, Government General Hospital, ${p.state}`;
      if (p.disabilityPercentage) {
        u.disability.percentage = String(p.disabilityPercentage);
      } else {
        u.disability.percentage = '45';
      }

      // Sports Quota Certificate
      if (nameVal) u.sportsQuota.name = nameVal;
      if (p.state) u.sportsQuota.issuing_authority = `Sports Development Authority of ${p.state} (SDAT)`;

      // First Graduate Certificate
      if (nameVal) u.firstGraduate.name = nameVal;
      if (p.state) u.firstGraduate.district = p.state;

      // NCC Certificate
      if (nameVal) u.ncc.name = nameVal;
      if (p.state) u.ncc.directorate = `${p.state} & Directorate General NCC`;

      // NSS Certificate
      if (nameVal) u.nss.name = nameVal;
      if (p.college) u.nss.college = p.college;

      // Minority Certificate
      if (nameVal) u.minority.name = nameVal;
      if (p.religion) u.minority.community_religion = `${p.religion} Community`;
      if (p.state) u.minority.district = p.state;

      return u;
    });

    if (notify) {
      showToast('Certificate generator fields auto-filled from your profile!', 'success');
    }
  };

  // Load current user profile details to pre-fill name and values
  useEffect(() => {
    api.get('/profile')
      .then(res => {
        const p = res.data;
        setProfile(p);
        autoFillFieldsFromProfile(p, false);
      })
      .catch(err => console.error('Error fetching profile:', err));
  }, []);

  const handleFieldChange = (docType, fieldKey, value) => {
    setFields(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        [fieldKey]: value
      }
    }));
  };

  const handleMarkChange = (docType, subject, value) => {
    setFields(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        marks: {
          ...prev[docType].marks,
          [subject]: value
        }
      }
    }));
  };

  const handleGenerate = () => {
    setIsSubmitting(true);
    const activeFields = fields[activeDocType];

    api.post('/documents/generate', {
      document_type: activeDocType,
      fields: activeFields
    })
      .then(res => {
        showToast(`${documentsMap[activeDocType]} generated successfully!`, 'success');
        api.post('/agent/run')
          .then(() => {
            showToast('Supervisor Agent updated pipeline status.', 'success');
          })
          .catch(e => console.error(e));
        setIsSubmitting(false);
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to generate certificate.', 'error');
        setIsSubmitting(false);
      });
  };

  const handleDownload = () => {
    const element = document.getElementById('certificate-template');
    if (!element) return;
    
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(element, { 
        useCORS: true, 
        scale: 2,
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            
            // Clean inline style attribute first
            const styleAttr = el.getAttribute('style');
            if (styleAttr && styleAttr.includes('okl')) {
              const cleanedStyle = styleAttr.replace(/okl(ch|ab)\([^)]+\)/g, '#000000');
              el.setAttribute('style', cleanedStyle);
            }
            
            const computed = window.getComputedStyle(el);
            const propsToCheck = [
              'color', 'background-color', 'border-color', 
              'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
              'box-shadow', 'text-shadow', 'background-image', 'outline-color'
            ];
            
            propsToCheck.forEach(prop => {
              const val = el.style.getPropertyValue(prop) || computed.getPropertyValue(prop);
              if (val && val.includes('okl')) {
                let fallback = '#000000';
                if (prop === 'background-color') {
                  fallback = el.className.includes('bg-white') ? '#ffffff' : 
                             el.className.includes('bg-indigo-50') ? '#eef2ff' :
                             el.className.includes('bg-slate-50') ? '#f8fafc' : 
                             el.className.includes('bg-slate-200') ? '#e2e8f0' : '#ffffff';
                } else if (prop === 'color') {
                  fallback = el.className.includes('text-slate-900') || el.className.includes('text-slate-800') ? '#0f172a' :
                             el.className.includes('text-indigo-700') ? '#4338ca' :
                             el.className.includes('text-indigo-950') ? '#1e1b4b' :
                             el.className.includes('text-slate-500') || el.className.includes('text-slate-400') ? '#64748b' : '#0f172a';
                } else if (prop.includes('border')) {
                  fallback = el.className.includes('border-indigo-400') ? '#818cf8' : '#cbd5e1';
                } else if (prop.includes('shadow')) {
                  fallback = 'none';
                } else if (prop === 'background-image') {
                  fallback = 'none';
                } else {
                  fallback = '#cbd5e1';
                }
                el.style.setProperty(prop, fallback, 'important');
              }
            });
          }
        }
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${activeDocType}_certificate.png`;
        link.href = canvas.toDataURL();
        link.click();
      }).catch(err => {
        console.error('Download failed:', err);
        showToast('Download failed.', 'error');
      });
    });
  };

  const hasDisability = Boolean(
    profile?.disability === true ||
    String(profile?.disability).toLowerCase() === 'yes' ||
    profile?.physicallyChallenged === true ||
    String(profile?.physicallyChallenged).toLowerCase() === 'yes'
  );
  const hasSportsQuota = Boolean(
    profile?.sportsQuota === true ||
    String(profile?.sportsQuota).toLowerCase() === 'yes'
  );
  const hasFirstGraduate = Boolean(
    profile?.firstGraduate === true ||
    String(profile?.firstGraduate).toLowerCase() === 'yes'
  );
  const hasNcc = Boolean(
    profile?.ncc === true ||
    String(profile?.ncc).toLowerCase() === 'yes'
  );
  const hasNss = Boolean(
    profile?.nss === true ||
    String(profile?.nss).toLowerCase() === 'yes'
  );
  const hasMinority = Boolean(
    profile?.minority === true ||
    String(profile?.minority).toLowerCase() === 'yes'
  );

  const standardDocs = {
    aadhaar: { name: 'Aadhaar Card', reason: 'Mandatory government identity & age proof for scholarship verification.' },
    income: { name: 'Income Certificate', reason: 'Annual family income verification for means-based concessions and scholarships.' },
    college: { name: 'College ID', reason: 'Bonafide student enrollment, course, and roll number authentication.' },
    community: { name: 'Community Certificate', reason: 'Reservation category proof (OBC, SC, ST, MBC, DNC) for reserved quotas.' },
    tenth: { name: '10th Marksheet', reason: 'Secondary education verification and date of birth authentication.' },
    twelfth: { name: '12th Marksheet', reason: 'Higher secondary marksheet determining scholarship merit percentiles.' }
  };

  const quotaDefs = {
    disability: {
      name: 'Disability Certificate',
      label: 'Disability Certificate (Required for PwD)',
      selected: hasDisability,
      reason: 'Mandatory medical board proof (Form V / UDID) for Divyangjan & PwD reservation.'
    },
    sportsQuota: {
      name: 'Sports Quota Certificate',
      label: 'Sports Quota Certificate (Required for Sports Quota)',
      selected: hasSportsQuota,
      reason: 'Official verification of State, National, or University athletic representation & awards.'
    },
    firstGraduate: {
      name: 'First Graduate Certificate',
      label: 'First Graduate Certificate (Required for First Graduate)',
      selected: hasFirstGraduate,
      reason: 'Revenue Department certificate proving applicant is the first college graduate in the family.'
    },
    ncc: {
      name: 'NCC Certificate',
      label: 'NCC Certificate (Required for NCC Quota)',
      selected: hasNcc,
      reason: 'Ministry of Defence NCC Cadet A/B/C certification for defence preference.'
    },
    nss: {
      name: 'NSS Certificate',
      label: 'NSS Certificate (Required for NSS Quota)',
      selected: hasNss,
      reason: 'National Service Scheme 240 hrs + 7-day special camp community award.'
    },
    minority: {
      name: 'Minority Certificate',
      label: 'Minority Certificate (Required for Minority Quota)',
      selected: hasMinority,
      reason: 'Revenue Department proof of recognized religious or linguistic minority status.'
    }
  };

  // Only include quota certificates that are selected in the profile!
  const selectedQuotaDocs = Object.fromEntries(
    Object.entries(quotaDefs).filter(([key, def]) => def.selected)
  );

  const documentsMap = {
    ...Object.fromEntries(Object.entries(standardDocs).map(([k, d]) => [k, d.name])),
    ...Object.fromEntries(Object.entries(selectedQuotaDocs).map(([k, d]) => [k, d.label]))
  };

  // If user navigated directly via search param to a specific doc type, ensure it's accessible
  if (quotaDefs[activeDocType] && !documentsMap[activeDocType]) {
    documentsMap[activeDocType] = quotaDefs[activeDocType].label;
  }

  const getDocReason = (key) => {
    if (standardDocs[key]) return standardDocs[key].reason;
    if (quotaDefs[key]) return quotaDefs[key].reason;
    return 'Required for scholarship verification.';
  };

  return (
    <div className="min-h-screen bg-custom-image flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      {/* Background decorations */}
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
          <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-semibold text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-4.5 h-4.5" /> Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-6 relative z-10 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-sky-500" /> Certificate Creator Agent
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No original copies? Auto-fill from your saved profile or edit fields below to generate high-fidelity official templates and auto-verify them.
            </p>
          </div>
          <button
            onClick={() => autoFillFieldsFromProfile(profile, true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            Auto-fill from Profile
          </button>
        </div>

        {/* Tab Buttons Organized by Category */}
        <div className="flex flex-col gap-3.5 pb-3 border-b border-slate-200 dark:border-slate-800">
          {/* 1. Standard Required Certificates */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>1. Standard Required Certificates</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(standardDocs).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setActiveDocType(key)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeDocType === key
                      ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Additional Certificates Based on Selected Quotas */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>2. Additional Certificates Based on Selected Quotas ({Object.keys(selectedQuotaDocs).length} Active)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                (automatically updated from your profile)
              </span>
            </div>
            {Object.keys(selectedQuotaDocs).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedQuotaDocs).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setActiveDocType(key)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                      activeDocType === key
                        ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                        : 'bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>No additional quotas selected in profile. Check Disability, Sports Quota, First Graduate, NCC, NSS, or Minority in your profile to automatically require certificates here.</span>
              </div>
            )}
          </div>
        </div>

        {/* Form and Preview Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Panel */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <GlassCard className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-500" /> Fill Details for {documentsMap[activeDocType] || activeDocType}
                </h2>
                <button
                  onClick={() => autoFillFieldsFromProfile(profile, true)}
                  title="Auto-fill forms using your profile details"
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Fill
                </button>
              </div>

              {/* Why it is required banner */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Why Required:</strong>
                  <span>{getDocReason(activeDocType)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">

                {/* Dynamic Form Render */}
                {activeDocType === 'aadhaar' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Full Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.aadhaar.name}
                      onChange={(e) => handleFieldChange('aadhaar', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Date of Birth (DOB)</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.aadhaar.dob}
                      onChange={(e) => handleFieldChange('aadhaar', 'dob', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Gender</label>
                    <select
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.aadhaar.gender}
                      onChange={(e) => handleFieldChange('aadhaar', 'gender', e.target.value)}
                    >
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                    <label className="text-xs font-semibold text-slate-500">State</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.aadhaar.state}
                      onChange={(e) => handleFieldChange('aadhaar', 'state', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Aadhaar Number</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.aadhaar.aadhaar_number}
                      onChange={(e) => handleFieldChange('aadhaar', 'aadhaar_number', e.target.value)}
                    />
                  </>
                )}

                {activeDocType === 'income' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Certificate Number</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.income.certificate_no}
                      onChange={(e) => handleFieldChange('income', 'certificate_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Applicant Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.income.name}
                      onChange={(e) => handleFieldChange('income', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Father's Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.income.father_name}
                      onChange={(e) => handleFieldChange('income', 'father_name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Annual Income (₹)</label>
                    <input
                      type="number"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.income.annual_income}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange('income', 'annual_income', val);
                        // Also update first family member (self)
                        setFields(prev => {
                          const updated = { ...prev };
                          if (updated.income.family[0]) {
                            updated.income.family[0].annual = val;
                            updated.income.family[0].monthly = String(Math.round(Number(val) / 12));
                          }
                          return updated;
                        });
                      }}
                    />
                    <label className="text-xs font-semibold text-slate-500">Taluk / District</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Taluk"
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                        value={fields.income.taluk}
                        onChange={(e) => handleFieldChange('income', 'taluk', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="District"
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                        value={fields.income.district}
                        onChange={(e) => handleFieldChange('income', 'district', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {activeDocType === 'college' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">College Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.college.college_name}
                      onChange={(e) => handleFieldChange('college', 'college_name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Registration Number</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.college.registration_no}
                      onChange={(e) => handleFieldChange('college', 'registration_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Student Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.college.name}
                      onChange={(e) => handleFieldChange('college', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Course / Degree</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.college.course}
                      onChange={(e) => handleFieldChange('college', 'course', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.college.cgpa}
                      onChange={(e) => handleFieldChange('college', 'cgpa', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Batch / Years</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.college.batch}
                      onChange={(e) => handleFieldChange('college', 'batch', e.target.value)}
                    />
                  </>
                )}

                {activeDocType === 'community' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Certificate Number</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.community.certificate_no}
                      onChange={(e) => handleFieldChange('community', 'certificate_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Applicant Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.community.name}
                      onChange={(e) => handleFieldChange('community', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Father's Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.community.father_name}
                      onChange={(e) => handleFieldChange('community', 'father_name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Category</label>
                    <select
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.community.category}
                      onChange={(e) => handleFieldChange('community', 'category', e.target.value)}
                    >
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="MBC">MBC</option>
                      <option value="BC">BC</option>
                      <option value="FC">FC (General)</option>
                    </select>
                    <label className="text-xs font-semibold text-slate-500">Community Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.community.community_name}
                      onChange={(e) => handleFieldChange('community', 'community_name', e.target.value)}
                    />
                  </>
                )}

                {activeDocType === 'tenth' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Roll Number</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.tenth.roll_no}
                      onChange={(e) => handleFieldChange('tenth', 'roll_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Candidate Name (Capitals)</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.tenth.name}
                      onChange={(e) => handleFieldChange('tenth', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">School Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.tenth.school_name}
                      onChange={(e) => handleFieldChange('tenth', 'school_name', e.target.value)}
                    />
                    <h3 className="text-xs font-bold text-indigo-500 mt-2">Subject Scores (Max 100 per subject)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(fields.tenth.marks).map(subject => (
                        <div key={subject} className="flex flex-col">
                          <label className="text-[10px] font-semibold text-slate-500 capitalize">{subject.replace('_', ' ')}</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-sm"
                            value={fields.tenth.marks[subject]}
                            onChange={(e) => handleMarkChange('tenth', subject, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeDocType === 'twelfth' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Permanent Register No</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.twelfth.register_no}
                      onChange={(e) => handleFieldChange('twelfth', 'register_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Candidate Name (Capitals)</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.twelfth.name}
                      onChange={(e) => handleFieldChange('twelfth', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">School Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.twelfth.school_name}
                      onChange={(e) => handleFieldChange('twelfth', 'school_name', e.target.value)}
                    />
                    <h3 className="text-xs font-bold text-indigo-500 mt-2">Subject Scores (Max 200 per subject)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(fields.twelfth.marks).map(subject => (
                        <div key={subject} className="flex flex-col">
                          <label className="text-[10px] font-semibold text-slate-500 capitalize">{subject}</label>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-sm"
                            value={fields.twelfth.marks[subject]}
                            onChange={(e) => handleMarkChange('twelfth', subject, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* --- DISABILITY CERTIFICATE FORM --- */}
                {activeDocType === 'disability' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Certificate Number</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.disability.certificate_no}
                      onChange={(e) => handleFieldChange('disability', 'certificate_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Full Name of Applicant</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.disability.name}
                      onChange={(e) => handleFieldChange('disability', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Father's / Guardian's Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.disability.father_name}
                      onChange={(e) => handleFieldChange('disability', 'father_name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Date of Birth</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.disability.dob}
                          onChange={(e) => handleFieldChange('disability', 'dob', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Gender</label>
                        <select
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.disability.gender}
                          onChange={(e) => handleFieldChange('disability', 'gender', e.target.value)}
                        >
                          <option value="MALE">MALE</option>
                          <option value="FEMALE">FEMALE</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>
                    </div>
                    <label className="text-xs font-semibold text-slate-500">Disability Type / Category</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.disability.disability_type}
                      onChange={(e) => handleFieldChange('disability', 'disability_type', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Disability Percentage (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.disability.percentage}
                      onChange={(e) => handleFieldChange('disability', 'percentage', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Clinical Diagnosis</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.disability.diagnosis}
                      onChange={(e) => handleFieldChange('disability', 'diagnosis', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Issuing Hospital / Authority</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.disability.issuing_hospital}
                      onChange={(e) => handleFieldChange('disability', 'issuing_hospital', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Date of Issue</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.disability.date}
                      onChange={(e) => handleFieldChange('disability', 'date', e.target.value)}
                    />
                  </>
                )}

                {/* --- SPORTS QUOTA CERTIFICATE FORM --- */}
                {activeDocType === 'sportsQuota' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Certificate Serial No.</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.sportsQuota.certificate_no}
                      onChange={(e) => handleFieldChange('sportsQuota', 'certificate_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Athlete Full Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.sportsQuota.name}
                      onChange={(e) => handleFieldChange('sportsQuota', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Father's / Guardian's Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.sportsQuota.father_name}
                      onChange={(e) => handleFieldChange('sportsQuota', 'father_name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Sport / Discipline</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.sportsQuota.sport_name}
                          onChange={(e) => handleFieldChange('sportsQuota', 'sport_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Competition Level</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.sportsQuota.competition_level}
                          onChange={(e) => handleFieldChange('sportsQuota', 'competition_level', e.target.value)}
                        />
                      </div>
                    </div>
                    <label className="text-xs font-semibold text-slate-500">Achievement / Position Secured</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.sportsQuota.achievement}
                      onChange={(e) => handleFieldChange('sportsQuota', 'achievement', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Issuing Sports Federation / Authority</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.sportsQuota.issuing_authority}
                      onChange={(e) => handleFieldChange('sportsQuota', 'issuing_authority', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Representation Year</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.sportsQuota.representation_year}
                          onChange={(e) => handleFieldChange('sportsQuota', 'representation_year', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Date of Award</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.sportsQuota.date}
                          onChange={(e) => handleFieldChange('sportsQuota', 'date', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* --- FIRST GRADUATE CERTIFICATE FORM --- */}
                {activeDocType === 'firstGraduate' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Certificate Number</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.firstGraduate.certificate_no}
                      onChange={(e) => handleFieldChange('firstGraduate', 'certificate_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Candidate Full Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.firstGraduate.name}
                      onChange={(e) => handleFieldChange('firstGraduate', 'name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Father's Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.firstGraduate.father_name}
                          onChange={(e) => handleFieldChange('firstGraduate', 'father_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Mother's Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.firstGraduate.mother_name}
                          onChange={(e) => handleFieldChange('firstGraduate', 'mother_name', e.target.value)}
                        />
                      </div>
                    </div>
                    <label className="text-xs font-semibold text-slate-500">Address / Door No & Street</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.firstGraduate.door_no}
                      onChange={(e) => handleFieldChange('firstGraduate', 'door_no', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Village / Taluk</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.firstGraduate.village_taluk}
                          onChange={(e) => handleFieldChange('firstGraduate', 'village_taluk', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">District</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.firstGraduate.district}
                          onChange={(e) => handleFieldChange('firstGraduate', 'district', e.target.value)}
                        />
                      </div>
                    </div>
                    <label className="text-xs font-semibold text-slate-500">Issuing Officer / Designation</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.firstGraduate.issuing_officer}
                      onChange={(e) => handleFieldChange('firstGraduate', 'issuing_officer', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Date of Issue</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.firstGraduate.date}
                      onChange={(e) => handleFieldChange('firstGraduate', 'date', e.target.value)}
                    />
                  </>
                )}

                {/* --- NCC CERTIFICATE FORM --- */}
                {activeDocType === 'ncc' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Certificate No.</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.ncc.certificate_no}
                      onChange={(e) => handleFieldChange('ncc', 'certificate_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Cadet Full Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.ncc.name}
                      onChange={(e) => handleFieldChange('ncc', 'name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Rank</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.ncc.rank}
                          onChange={(e) => handleFieldChange('ncc', 'rank', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Certificate Grade</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.ncc.cert_type}
                          onChange={(e) => handleFieldChange('ncc', 'cert_type', e.target.value)}
                        />
                      </div>
                    </div>
                    <label className="text-xs font-semibold text-slate-500">Unit / Battalion</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.ncc.unit}
                      onChange={(e) => handleFieldChange('ncc', 'unit', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Directorate</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.ncc.directorate}
                      onChange={(e) => handleFieldChange('ncc', 'directorate', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Issuing Authority</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.ncc.issuing_authority}
                          onChange={(e) => handleFieldChange('ncc', 'issuing_authority', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Date of Issue</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.ncc.date}
                          onChange={(e) => handleFieldChange('ncc', 'date', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* --- NSS CERTIFICATE FORM --- */}
                {activeDocType === 'nss' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Certificate Serial No.</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.nss.certificate_no}
                      onChange={(e) => handleFieldChange('nss', 'certificate_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Volunteer Full Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.nss.name}
                      onChange={(e) => handleFieldChange('nss', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">College / Institution</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.nss.college}
                      onChange={(e) => handleFieldChange('nss', 'college', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Completed Service Hours</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.nss.service_hours}
                      onChange={(e) => handleFieldChange('nss', 'service_hours', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Camp Theme / Project</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.nss.camp_name}
                      onChange={(e) => handleFieldChange('nss', 'camp_name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Issuing Authority</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.nss.issuing_authority}
                          onChange={(e) => handleFieldChange('nss', 'issuing_authority', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Date</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.nss.date}
                          onChange={(e) => handleFieldChange('nss', 'date', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* --- MINORITY CERTIFICATE FORM --- */}
                {activeDocType === 'minority' && (
                  <>
                    <label className="text-xs font-semibold text-slate-500">Certificate No.</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.minority.certificate_no}
                      onChange={(e) => handleFieldChange('minority', 'certificate_no', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Applicant Full Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.minority.name}
                      onChange={(e) => handleFieldChange('minority', 'name', e.target.value)}
                    />
                    <label className="text-xs font-semibold text-slate-500">Father's Name</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.minority.father_name}
                      onChange={(e) => handleFieldChange('minority', 'father_name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Minority Community</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.minority.community_religion}
                          onChange={(e) => handleFieldChange('minority', 'community_religion', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Language / Mother Tongue</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.minority.language}
                          onChange={(e) => handleFieldChange('minority', 'language', e.target.value)}
                        />
                      </div>
                    </div>
                    <label className="text-xs font-semibold text-slate-500">Residential Address</label>
                    <input
                      type="text"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={fields.minority.door_no}
                      onChange={(e) => handleFieldChange('minority', 'door_no', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">District</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.minority.district}
                          onChange={(e) => handleFieldChange('minority', 'district', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Date of Issue</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          value={fields.minority.date}
                          onChange={(e) => handleFieldChange('minority', 'date', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2.5 mt-5">
                <button
                  onClick={handleDownload}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-white" />
                  <span>Download Certificate Image (.png)</span>
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs flex items-start gap-2">
                <FileCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Manual Upload Flow</span>
                  1. Fill details and click "Generate & Download" to save the certificate image.
                  2. Navigate to your scholarship apply section.
                  3. Upload the downloaded file in the required document slots.
                  4. The OCR verification agent will scan the document and match it against your profile.
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Live Preview Panel */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Certificate Preview</span>
              <span className="text-xs text-sky-500 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> High-Fidelity Rendering</span>
            </div>

            {/* Render Styled Templates */}
            <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center min-h-[500px]">
              
              {/* --- AADHAAR CARD TEMPLATE --- */}
              {activeDocType === 'aadhaar' && (
                <div id="certificate-template" className="w-[500px] bg-white text-slate-900 border border-slate-300 rounded-lg p-4 shadow-xl font-sans relative select-none">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-red-500 pb-1.5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="w-6 h-1.5 bg-orange-500 rounded-sm"></div>
                        <div className="w-6 h-1.5 bg-white border border-slate-200 flex items-center justify-center text-[4px] text-blue-900">☀</div>
                        <div className="w-6 h-1.5 bg-green-600 rounded-sm"></div>
                      </div>
                      <span className="text-[9px] font-extrabold text-blue-900 tracking-tighter">AADHAAR</span>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-orange-600">भारत सरकार</div>
                      <div className="text-[11px] font-bold text-green-700 uppercase tracking-wide">Government of India</div>
                    </div>
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-[10px]">A</div>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    {/* Left: Avatar placeholder */}
                    <div className="col-span-4 flex flex-col items-center">
                      <div className="w-24 h-28 border border-slate-400 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden rounded">
                        <User className="w-14 h-14 text-slate-350" />
                        <div className="absolute bottom-0 w-full bg-slate-600/40 text-[8px] text-white text-center py-0.5">Photo</div>
                      </div>
                    </div>

                    {/* Middle: Details */}
                    <div className="col-span-8 text-[11px] flex flex-col gap-1">
                      <div>
                        <span className="font-bold text-slate-500 text-[9px] block">नाम / Name</span>
                        <span className="font-extrabold text-slate-900 tracking-wider text-xs uppercase">{fields.aadhaar.name || 'Madhi'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500 text-[9px] block">जन्म तिथि / DOB</span>
                        <span className="font-bold text-slate-800">{fields.aadhaar.dob}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500 text-[9px] block">लिंग / Gender</span>
                        <span className="font-bold text-slate-800">{fields.aadhaar.gender}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500 text-[9px] block">राज्य / State</span>
                        <span className="font-bold text-slate-800">{fields.aadhaar.state}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Aadhaar Number */}
                  <div className="border-t border-red-500 mt-4 pt-2 flex flex-col items-center">
                    <div className="text-lg font-bold tracking-widest text-slate-900 mb-0.5">
                      {fields.aadhaar.aadhaar_number}
                    </div>
                    <div className="text-[10px] font-bold text-red-600 uppercase">
                      मेरा आधार, मेरी पहचान
                    </div>
                  </div>
                </div>
              )}

              {/* --- INCOME CERTIFICATE TEMPLATE --- */}
              {activeDocType === 'income' && (
                <div id="certificate-template" className="w-[500px] bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-5 shadow-xl font-serif text-[11px] leading-relaxed relative">
                  {/* Top Seal Header */}
                  <div className="flex flex-col items-center border-b border-slate-300 pb-3 mb-4">
                    <Building className="w-8 h-8 text-slate-700 mb-1" />
                    <div className="text-[10px] font-bold text-slate-800 uppercase">வருவாய் மற்றும் பேரிடர் மேலாண்மை துறை</div>
                    <div className="text-xs font-bold text-slate-900 uppercase">Income Certificate</div>
                  </div>

                  <div className="flex justify-between items-center mb-3 text-[10px] text-slate-600">
                    <div>சான்றிதழ் எண் / Certificate No: <span className="font-bold text-slate-800">{fields.income.certificate_no}</span></div>
                    <div>நாள் / Date: <span className="font-bold text-slate-800">{fields.income.date}</span></div>
                  </div>

                  <p className="mb-3 text-justify">
                    This is to certify that Thiru/Selvi <strong>{fields.income.name || 'John'}</strong> son of Mr. <strong>{fields.income.father_name}</strong> residing at Door No. {fields.income.door_no}, {fields.income.street}, {fields.income.area}, {fields.income.taluk} Taluk, {fields.income.district} District, State of Tamil Nadu, annual income is as per details furnished by his/her in the table below is <strong>Rs. {Number(fields.income.annual_income).toLocaleString('en-IN')}/-</strong>.
                  </p>

                  {/* Family table */}
                  <table className="w-full border-collapse border border-slate-400 text-[10px] mb-4">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-slate-400 p-1">S. No</th>
                        <th className="border border-slate-400 p-1">Family Member</th>
                        <th className="border border-slate-400 p-1">Relation</th>
                        <th className="border border-slate-400 p-1">Age</th>
                        <th className="border border-slate-400 p-1">Occupation</th>
                        <th className="border border-slate-400 p-1">Annual Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.income.family.map((member, index) => (
                        <tr key={index} className="text-center bg-white">
                          <td className="border border-slate-400 p-1">{index+1}</td>
                          <td className="border border-slate-400 p-1 font-semibold">{member.name}</td>
                          <td className="border border-slate-400 p-1">{member.relation}</td>
                          <td className="border border-slate-400 p-1">{member.age}</td>
                          <td className="border border-slate-400 p-1">{member.occupation}</td>
                          <td className="border border-slate-400 p-1 font-semibold">₹{Number(member.annual).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Digital Sign */}
                  <div className="flex flex-col items-end mt-4">
                    <div className="border border-green-600/30 bg-green-50 p-2 rounded-xl flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">✓</div>
                      <div>
                        <div className="text-[9px] font-bold text-green-700">Signature Valid</div>
                        <div className="text-[8px] text-green-600">Digitally signed by TAHASILDAR</div>
                        <div className="text-[8px] text-green-600">Date: {fields.income.date} 17:52 IST</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- COLLEGE ID CARD TEMPLATE --- */}
              {activeDocType === 'college' && (
                <div id="certificate-template" className="w-[320px] bg-white text-slate-900 border border-slate-300 rounded-xl shadow-2xl overflow-hidden font-sans relative select-none">
                  {/* Top Banner */}
                  <div className="bg-gradient-to-tr from-blue-700 to-indigo-800 text-white p-3 text-center border-b-4 border-red-500">
                    <Building className="w-6 h-6 mx-auto mb-0.5 text-blue-200" />
                    <div className="text-[9px] font-bold leading-tight uppercase tracking-wider">{fields.college.college_name}</div>
                    <div className="text-[9px] text-yellow-300 font-bold mt-0.5 uppercase tracking-widest">STUDENT IDENTITY CARD</div>
                  </div>

                  <div className="p-4 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden mb-3">
                      <User className="w-12 h-12 text-slate-350" />
                    </div>

                    <div className="w-full text-[10px] flex flex-col gap-1.5 text-slate-800 border-b border-slate-100 pb-3 mb-2">
                      <div className="flex justify-between"><span className="text-slate-400 font-semibold">Reg No:</span><span className="font-bold">{fields.college.registration_no}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400 font-semibold">College:</span><span className="font-bold text-slate-950 uppercase">{fields.college.college_name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400 font-semibold">Name:</span><span className="font-bold text-slate-950 uppercase">{fields.college.name || 'JOHN'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400 font-semibold">Course:</span><span className="font-bold">{fields.college.course}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400 font-semibold">Batch:</span><span className="font-bold">{fields.college.batch}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400 font-semibold">CGPA Score:</span><span className="font-bold text-blue-600">{fields.college.cgpa}</span></div>
                    </div>

                    {/* Barcode representation */}
                    <div className="w-full flex flex-col items-center mt-2">
                      <div className="h-6 w-3/4 bg-slate-900 flex gap-0.5 items-center px-2">
                        {[1,3,1,1,2,3,1,2,1,3,1,2,1,1,2,2,1,3,1].map((val, idx) => (
                          <div key={idx} className="bg-white h-full" style={{ width: `${val * 1.5}px` }}></div>
                        ))}
                      </div>
                      <span className="text-[8px] text-slate-400 tracking-widest mt-1">*{fields.college.registration_no.split('/').pop()}*</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- COMMUNITY CERTIFICATE TEMPLATE --- */}
              {activeDocType === 'community' && (
                <div id="certificate-template" className="w-[500px] bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-5 shadow-xl font-serif text-[11px] leading-relaxed relative">
                  {/* Top Seal Header */}
                  <div className="flex flex-col items-center border-b border-slate-300 pb-3 mb-4">
                    <Building className="w-8 h-8 text-slate-700 mb-1" />
                    <div className="text-[10px] font-bold text-slate-800 uppercase">வருவாய் மற்றும் பேரிடர் மேலாண்மை துறை</div>
                    <div className="text-xs font-bold text-slate-900 uppercase">Community Certificate</div>
                  </div>

                  <div className="flex justify-between items-center mb-3 text-[10px] text-slate-600">
                    <div>சான்றிதழ் எண் / Certificate No: <span className="font-bold text-slate-800">{fields.community.certificate_no}</span></div>
                    <div>நாள் / Date: <span className="font-bold text-slate-800">{fields.community.date}</span></div>
                  </div>

                  <p className="mb-3 text-justify">
                    This is to certify that Thiru/Selvi <strong>{fields.community.name || 'John'}</strong> son of Mr. <strong>{fields.community.father_name}</strong> residing at Door No. {fields.community.door_no}, {fields.community.street}, {fields.community.village}, {fields.community.taluk} Taluk, {fields.community.district} District, State of Tamil Nadu, belongs to <strong>{fields.community.community_name} ({fields.community.category})</strong> category.
                  </p>

                  <p className="mb-4 text-justify">
                    This certificate is digitally signed and does not require any seal or signature.
                  </p>

                  {/* Digital Sign */}
                  <div className="flex flex-col items-end mt-6">
                    <div className="border border-green-600/30 bg-green-50 p-2 rounded-xl flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">✓</div>
                      <div>
                        <div className="text-[9px] font-bold text-green-700">Signature Valid</div>
                        <div className="text-[8px] text-green-600">Digitally signed by TAHASILDAR</div>
                        <div className="text-[8px] text-green-600">Date: {fields.community.date} 15:29 IST</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 10th MARKSHEET TEMPLATE --- */}
              {activeDocType === 'tenth' && (
                <div id="certificate-template" className="w-[500px] bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-5 shadow-xl font-sans text-[10px] leading-relaxed relative">
                  {/* Header */}
                  <div className="flex flex-col items-center border-b-2 border-slate-400 pb-2 mb-3 text-center">
                    <div className="text-xs font-bold text-blue-900">STATE BOARD OF SCHOOL EXAMINATIONS, TAMILNADU</div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase">SECONDARY SCHOOL LEAVING CERTIFICATE (SSLC)</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <span className="block text-slate-400 font-semibold text-[8px]">NAME OF CANDIDATE</span>
                      <span className="font-bold text-slate-800">{fields.tenth.name || 'MADHI'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold text-[8px]">ROLL NO</span>
                      <span className="font-bold text-slate-800">{fields.tenth.roll_no}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold text-[8px]">DATE OF BIRTH</span>
                      <span className="font-bold text-slate-800">{fields.tenth.dob}</span>
                    </div>
                  </div>

                  {/* Marks Table */}
                  <table className="w-full border-collapse border border-slate-400 text-center text-[9px] mb-3 bg-white">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-slate-400 p-1">SUBJECT</th>
                        <th className="border border-slate-400 p-1">MAX MARKS</th>
                        <th className="border border-slate-400 p-1">MARKS OBTAINED</th>
                        <th className="border border-slate-400 p-1">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(fields.tenth.marks).map(([subj, mark]) => (
                        <tr key={subj}>
                          <td className="border border-slate-400 p-1 font-bold uppercase">{subj}</td>
                          <td className="border border-slate-400 p-1">100</td>
                          <td className="border border-slate-400 p-1 font-semibold text-slate-900">{mark}</td>
                          <td className="border border-slate-400 p-1 text-green-700 font-bold">PASS</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold">
                        <td className="border border-slate-400 p-1">TOTAL</td>
                        <td className="border border-slate-400 p-1">{Object.keys(fields.tenth.marks).length * 100}</td>
                        <td className="border border-slate-400 p-1 text-blue-700">
                          {Object.values(fields.tenth.marks).reduce((acc, curr) => acc + Number(curr || 0), 0)}
                        </td>
                        <td className="border border-slate-400 p-1">
                          {((Object.values(fields.tenth.marks).reduce((acc, curr) => acc + Number(curr || 0), 0) / (Object.keys(fields.tenth.marks).length * 100)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-[8px] text-slate-400 italic">
                    School: {fields.tenth.school_name}
                  </div>
                </div>
              )}

              {/* --- 12th MARKSHEET TEMPLATE --- */}
              {activeDocType === 'twelfth' && (
                <div id="certificate-template" className="w-[500px] bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-5 shadow-xl font-sans text-[10px] leading-relaxed relative">
                  {/* Header */}
                  <div className="flex flex-col items-center border-b-2 border-slate-400 pb-2 mb-3 text-center">
                    <div className="text-xs font-bold text-blue-900">DEPARTMENT OF GOVERNMENT EXAMINATIONS, TAMILNADU</div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase">HIGHER SECONDARY COURSE CERTIFICATE</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="col-span-2">
                      <span className="block text-slate-400 font-semibold text-[8px]">NAME OF THE CANDIDATE</span>
                      <span className="font-bold text-slate-800">{fields.twelfth.name || 'SHRUTI SRI B C'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold text-[8px]">REGISTER NO</span>
                      <span className="font-bold text-slate-800">{fields.twelfth.register_no}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold text-[8px]">ROLL NO / SESSION</span>
                      <span className="font-bold text-slate-800">{fields.twelfth.roll_no} / MAR 2017</span>
                    </div>
                  </div>

                  {/* Marks Table */}
                  <table className="w-full border-collapse border border-slate-400 text-center text-[9px] mb-3 bg-white">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-slate-400 p-1">SUBJECT</th>
                        <th className="border border-slate-400 p-1">MAX MARKS</th>
                        <th className="border border-slate-400 p-1">MARKS OBTAINED</th>
                        <th className="border border-slate-400 p-1">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(fields.twelfth.marks).map(([subj, mark]) => (
                        <tr key={subj}>
                          <td className="border border-slate-400 p-1 font-bold uppercase">{subj}</td>
                          <td className="border border-slate-400 p-1">200</td>
                          <td className="border border-slate-400 p-1 font-semibold text-slate-900">{mark}</td>
                          <td className="border border-slate-400 p-1 text-green-700 font-bold">PASS</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold">
                        <td className="border border-slate-400 p-1">TOTAL</td>
                        <td className="border border-slate-400 p-1">{Object.keys(fields.twelfth.marks).length * 200}</td>
                        <td className="border border-slate-400 p-1 text-blue-700">
                          {Object.values(fields.twelfth.marks).reduce((acc, curr) => acc + Number(curr || 0), 0)}
                        </td>
                        <td className="border border-slate-400 p-1">
                          {((Object.values(fields.twelfth.marks).reduce((acc, curr) => acc + Number(curr || 0), 0) / (Object.keys(fields.twelfth.marks).length * 200)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-[8px] text-slate-400 italic">
                    School: {fields.twelfth.school_name}
                  </div>
                </div>
              )}

              {/* --- DISABILITY CERTIFICATE TEMPLATE --- */}
              {activeDocType === 'disability' && (
                <div id="certificate-template" className="w-[560px] bg-white text-slate-900 border-2 border-slate-400 rounded-xl p-6 shadow-2xl font-serif relative select-none">
                  {/* Header */}
                  <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs font-black bg-slate-100">
                        🇮🇳
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Government of India / State Medical Board</div>
                    <div className="text-base font-black text-slate-900 uppercase tracking-wider mt-0.5">CERTIFICATE OF DISABILITY</div>
                    <div className="text-[9px] text-slate-500 italic mt-0.5">
                      (Issued under Rights of Persons with Disabilities Rules, 2017 - Form V / UDID Format)
                    </div>
                  </div>

                  {/* Cert No and Date bar */}
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 mb-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-sans">
                    <div>Certificate No: <span className="font-mono font-bold text-slate-900">{fields.disability.certificate_no}</span></div>
                    <div>Date of Issue: <span className="font-mono font-bold text-slate-900">{fields.disability.date}</span></div>
                  </div>

                  {/* Main Grid: Details + Beneficiary Photo */}
                  <div className="grid grid-cols-12 gap-4 mb-3 font-sans">
                    {/* Left: Photo box */}
                    <div className="col-span-4 flex flex-col items-center gap-1.5">
                      <div className="w-24 h-28 border-2 border-slate-400 bg-slate-50 rounded flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                        <User className="w-12 h-12 text-slate-400" />
                        <div className="absolute bottom-0 w-full bg-slate-800 text-[7px] text-white text-center py-0.5 uppercase font-bold">
                          Attested Photo
                        </div>
                      </div>
                      <div className="w-24 text-[8px] text-center text-slate-500 border border-dashed border-slate-300 rounded py-0.5">
                        Medical Board Seal
                      </div>
                    </div>

                    {/* Right: Personal & Clinical Info */}
                    <div className="col-span-8 text-[11px] flex flex-col gap-1.5 leading-snug">
                      <p>
                        This is to certify that we have carefully examined <strong className="text-slate-900 uppercase font-black tracking-wide">{fields.disability.name || 'APPLICANT NAME'}</strong>,
                        Son / Daughter of <strong className="text-slate-900">{fields.disability.father_name}</strong>.
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                        <div>DOB: <span className="font-bold">{fields.disability.dob}</span></div>
                        <div>Gender: <span className="font-bold">{fields.disability.gender}</span></div>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-500 text-[10px] block">Disability Classification:</span>
                        <span className="font-bold text-slate-900">{fields.disability.disability_type}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Diagnosis:</span>
                        <span className="italic text-slate-800 text-[10px]">{fields.disability.diagnosis}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Disability Assessment Box */}
                  <div className="my-3 p-3 bg-indigo-50 border-2 border-indigo-400 rounded-xl flex items-center justify-between text-indigo-950 font-sans">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Permanent Disability Assessment</div>
                      <div className="text-xs font-bold mt-0.5">Condition: Permanent / Progressive: No</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-indigo-700">{fields.disability.percentage}%</div>
                      <div className="text-[8px] font-bold uppercase text-indigo-600">Benchmark Disability</div>
                    </div>
                  </div>

                  {/* Issuing Authority & Signatures */}
                  <div className="mt-4 pt-3 border-t border-slate-300 flex justify-between items-end text-[9px] text-slate-600 font-sans">
                    <div className="max-w-[220px]">
                      <span className="font-bold block text-slate-800">Issuing Authority:</span>
                      <span>{fields.disability.issuing_hospital}</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="text-xs text-slate-800 italic mb-1 font-bold">Dr. R. Ramanathan</div>
                      <div className="w-28 border-t border-slate-400"></div>
                      <span className="font-bold text-slate-800">Chairperson / Specialist</span>
                      <span className="text-[8px] text-slate-500">District Medical Board</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- SPORTS QUOTA CERTIFICATE TEMPLATE --- */}
              {activeDocType === 'sportsQuota' && (
                <div id="certificate-template" className="w-[560px] bg-white text-slate-900 border-4 border-amber-600/70 rounded-2xl p-7 shadow-2xl font-serif relative select-none">
                  <div className="absolute inset-1.5 border-2 border-amber-500/40 rounded-xl pointer-events-none"></div>
                  {/* Header */}
                  <div className="text-center border-b-2 border-amber-800/40 pb-3 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-10 h-10 rounded-full border-2 border-amber-600 flex items-center justify-center text-sm font-black bg-amber-50 shadow-inner">
                        🏆
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-amber-900 uppercase tracking-widest">
                      Sports Development Authority / Sports Association
                    </div>
                    <div className="text-base font-black text-amber-950 uppercase tracking-wider mt-0.5">
                      CERTIFICATE OF MERIT & SPORTS QUOTA
                    </div>
                    <div className="text-[9px] text-amber-700 italic mt-0.5">
                      (Official State / National Level Athletic Representation & Achievement)
                    </div>
                  </div>

                  {/* Cert No and Date bar */}
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 mb-4 bg-amber-50/60 border border-amber-200 rounded-lg px-3 py-1.5 font-sans">
                    <div>Certificate No: <span className="font-mono font-bold text-amber-950">{fields.sportsQuota.certificate_no}</span></div>
                    <div>Date of Award: <span className="font-mono font-bold text-amber-950">{fields.sportsQuota.date}</span></div>
                  </div>

                  {/* Certificate Body */}
                  <div className="font-sans text-[11px] leading-relaxed mb-4 text-slate-800 text-center px-3">
                    <p className="mb-2">
                      This is proudly presented to certify that
                    </p>
                    <div className="text-base font-black text-slate-950 uppercase tracking-wide border-b border-dashed border-amber-400 pb-1 inline-block px-4">
                      {fields.sportsQuota.name || 'ATHLETE FULL NAME'}
                    </div>
                    <p className="mt-2">
                      Son / Daughter of <strong className="text-slate-900">{fields.sportsQuota.father_name}</strong>, has officially represented in the discipline of:
                    </p>
                    <div className="my-2.5 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-left">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-amber-800 font-bold block">Discipline / Sport</span>
                        <span className="text-xs font-black text-amber-950">{fields.sportsQuota.sport_name}</span>
                        <span className="text-[10px] text-slate-600 block mt-0.5">Level: <strong>{fields.sportsQuota.competition_level}</strong></span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-amber-800 font-bold block">Achievement</span>
                        <span className="text-xs font-black text-emerald-700 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 inline-block">
                          {fields.sportsQuota.achievement}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Year: {fields.sportsQuota.representation_year}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 italic">
                      Certified for eligibility under Government of Tamil Nadu / National Sports Quota admission & scholarship reservations.
                    </p>
                  </div>

                  {/* Issuing Authority & Signatures */}
                  <div className="mt-5 pt-3 border-t border-amber-200 flex justify-between items-end text-[9px] text-slate-600 font-sans">
                    <div className="max-w-[200px]">
                      <span className="font-bold block text-slate-800">Issuing Federation / Authority:</span>
                      <span className="text-slate-700">{fields.sportsQuota.issuing_authority}</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="text-xs text-slate-800 italic mb-1 font-bold">K. Vijayakumar, IAS</div>
                      <div className="w-28 border-t border-slate-400"></div>
                      <span className="font-bold text-slate-800">Member Secretary / Director</span>
                      <span className="text-[8px] text-slate-500">Sports Development Authority</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- FIRST GRADUATE CERTIFICATE TEMPLATE --- */}
              {activeDocType === 'firstGraduate' && (
                <div id="certificate-template" className="w-[560px] bg-white text-slate-900 border-2 border-slate-500 rounded-xl p-6 shadow-2xl font-serif relative select-none">
                  {/* Header */}
                  <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-xs font-black bg-slate-100">
                        🏛️
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Government of Tamil Nadu • Revenue Department</div>
                    <div className="text-[11px] font-semibold text-slate-600">முதல் பட்டதாரி சான்றிதழ்</div>
                    <div className="text-base font-black text-slate-900 uppercase tracking-wider mt-0.5">FIRST GRADUATE CERTIFICATE</div>
                    <div className="text-[9px] text-slate-500 italic mt-0.5">
                      (Issued under G.O. (Ms) No. 85, Higher Education (J2) Department)
                    </div>
                  </div>

                  {/* Cert No and Date bar */}
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 mb-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-sans">
                    <div>Certificate No: <span className="font-mono font-bold text-slate-900">{fields.firstGraduate.certificate_no}</span></div>
                    <div>Date of Issue: <span className="font-mono font-bold text-slate-900">{fields.firstGraduate.date}</span></div>
                  </div>

                  {/* Main Content */}
                  <div className="text-[11px] font-sans flex flex-col gap-2.5 leading-relaxed text-slate-800">
                    <p>
                      This is to certify that Selvan / Selvi <strong className="text-slate-950 uppercase font-bold">{fields.firstGraduate.name || 'APPLICANT NAME'}</strong>, 
                      Son / Daughter of Thiru <strong className="text-slate-950">{fields.firstGraduate.father_name}</strong> and Tmt <strong className="text-slate-950">{fields.firstGraduate.mother_name}</strong>, 
                      residing at <strong className="text-slate-900">{fields.firstGraduate.door_no}, {fields.firstGraduate.village_taluk}, {fields.firstGraduate.district} District</strong>,
                      is eligible for First Graduate tuition fee concession & scholarship benefits.
                    </p>

                    {/* Official Declaration Banner */}
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-0.5">Statutory Revenue Verification</div>
                      <p className="text-[10px] text-emerald-900 leading-snug">
                        {fields.firstGraduate.declaration}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                      <div>Family Graduate Count: <strong className="text-slate-900 font-bold">0 (None)</strong></div>
                      <div>Jurisdiction: <strong className="text-slate-900 font-bold">{fields.firstGraduate.district}</strong></div>
                    </div>
                  </div>

                  {/* Issuing Authority & Signatures */}
                  <div className="mt-5 pt-3 border-t border-slate-300 flex justify-between items-end text-[9px] text-slate-600 font-sans">
                    <div className="max-w-[220px]">
                      <span className="font-bold block text-slate-800">Digitally Verified Document:</span>
                      <span className="text-[8px] text-emerald-700 font-semibold block">✓ Digitally Signed with e-Mudhra Token</span>
                      <span className="text-slate-500">Government e-District Services Portal</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="text-xs text-slate-800 italic mb-1 font-bold">S. Meenakshi Sundaram</div>
                      <div className="w-28 border-t border-slate-400"></div>
                      <span className="font-bold text-slate-800">{fields.firstGraduate.issuing_officer}</span>
                      <span className="text-[8px] text-slate-500">Revenue Administration, {fields.firstGraduate.district}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- NCC CERTIFICATE TEMPLATE --- */}
              {activeDocType === 'ncc' && (
                <div id="certificate-template" className="w-[560px] bg-white text-slate-900 border-4 border-red-700/80 rounded-2xl p-6 shadow-2xl font-serif relative select-none">
                  <div className="absolute inset-1 border-2 border-indigo-900/40 rounded-xl pointer-events-none"></div>
                  <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-9 h-9 rounded-full border-2 border-red-700 flex items-center justify-center text-xs font-black bg-red-50">
                        🇮🇳
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Directorate General National Cadet Corps</div>
                    <div className="text-[10px] text-slate-600 uppercase font-semibold">Ministry of Defence • Government of India</div>
                    <div className="text-base font-black text-red-900 uppercase tracking-wider mt-0.5">NATIONAL CADET CORPS CERTIFICATE</div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 mb-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-sans">
                    <div>Certificate No: <span className="font-mono font-bold text-slate-900">{fields.ncc.certificate_no}</span></div>
                    <div>Date: <span className="font-mono font-bold text-slate-900">{fields.ncc.date}</span></div>
                  </div>

                  <div className="text-[11px] font-sans flex flex-col gap-2 text-slate-800 leading-relaxed text-center px-4">
                    <p>This is to certify that Rank <strong className="text-red-950 font-bold">{fields.ncc.rank}</strong></p>
                    <div className="text-base font-black text-slate-950 uppercase tracking-wide border-b border-slate-300 pb-1 inline-block px-4">
                      {fields.ncc.name || 'CADET FULL NAME'}
                    </div>
                    <p className="mt-1">
                      Son / Daughter of <strong className="text-slate-900">{fields.ncc.father_name}</strong>
                    </p>
                    <div className="my-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-[10px] grid grid-cols-2 gap-2">
                      <div>Unit: <strong className="text-slate-900 block font-semibold">{fields.ncc.unit}</strong></div>
                      <div>Directorate: <strong className="text-slate-900 block font-semibold">{fields.ncc.directorate}</strong></div>
                    </div>
                    <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-center">
                      <span className="text-[9px] uppercase tracking-wider text-red-800 font-bold block">Examination Qualified</span>
                      <span className="text-sm font-black text-red-950">{fields.ncc.cert_type}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-300 flex justify-between items-end text-[9px] text-slate-600 font-sans">
                    <div>
                      <span className="font-bold block text-slate-800">Commanding Officer:</span>
                      <span>Col. Rajeshwar Singh, Sena Medal</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="text-xs text-slate-800 italic mb-1 font-bold">Brig. K. Narayanan</div>
                      <div className="w-28 border-t border-slate-400"></div>
                      <span className="font-bold text-slate-800">{fields.ncc.issuing_authority}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- NSS CERTIFICATE TEMPLATE --- */}
              {activeDocType === 'nss' && (
                <div id="certificate-template" className="w-[560px] bg-white text-slate-900 border-4 border-blue-700/80 rounded-2xl p-6 shadow-2xl font-serif relative select-none">
                  <div className="text-center border-b-2 border-blue-900/30 pb-3 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-9 h-9 rounded-full border-2 border-blue-700 flex items-center justify-center text-xs font-black bg-blue-50">
                        ☸️
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-blue-950 uppercase tracking-widest">National Service Scheme (NSS)</div>
                    <div className="text-[9px] text-slate-600 uppercase font-semibold">Ministry of Youth Affairs & Sports • Government of India</div>
                    <div className="text-base font-black text-blue-900 uppercase tracking-wider mt-0.5">CERTIFICATE OF MERIT</div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 mb-4 bg-blue-50/60 border border-blue-200 rounded-lg px-3 py-1.5 font-sans">
                    <div>Certificate No: <span className="font-mono font-bold text-blue-950">{fields.nss.certificate_no}</span></div>
                    <div>Date: <span className="font-mono font-bold text-blue-950">{fields.nss.date}</span></div>
                  </div>

                  <div className="text-[11px] font-sans flex flex-col gap-2 text-slate-800 leading-relaxed text-center px-4">
                    <p>This is to certify that Volunteer</p>
                    <div className="text-base font-black text-slate-950 uppercase tracking-wide border-b border-blue-300 pb-1 inline-block px-4">
                      {fields.nss.name || 'VOLUNTEER FULL NAME'}
                    </div>
                    <p className="mt-1">
                      Student of <strong className="text-slate-900">{fields.nss.college}</strong>
                    </p>
                    <div className="my-2 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
                      <span className="text-[9px] uppercase tracking-wider text-blue-800 font-bold block">Service Completed</span>
                      <span className="text-xs font-black text-blue-950">{fields.nss.service_hours}</span>
                      <span className="text-[10px] text-slate-600 block mt-1">Theme: <em>{fields.nss.camp_name}</em></span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-300 flex justify-between items-end text-[9px] text-slate-600 font-sans">
                    <div>
                      <span className="font-bold block text-slate-800">NSS Programme Officer</span>
                      <span className="text-slate-500">Unit Level</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="text-xs text-slate-800 italic mb-1 font-bold">Dr. S. Karthikeyan</div>
                      <div className="w-28 border-t border-slate-400"></div>
                      <span className="font-bold text-slate-800">{fields.nss.issuing_authority}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- MINORITY CERTIFICATE TEMPLATE --- */}
              {activeDocType === 'minority' && (
                <div id="certificate-template" className="w-[560px] bg-white text-slate-900 border-2 border-slate-600 rounded-xl p-6 shadow-2xl font-serif relative select-none">
                  <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-xs font-black bg-slate-100">
                        ⚖️
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Government of India / State Revenue Department</div>
                    <div className="text-base font-black text-slate-900 uppercase tracking-wider mt-0.5">RELIGIOUS / LINGUISTIC MINORITY CERTIFICATE</div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 mb-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-sans">
                    <div>Certificate No: <span className="font-mono font-bold text-slate-900">{fields.minority.certificate_no}</span></div>
                    <div>Date of Issue: <span className="font-mono font-bold text-slate-900">{fields.minority.date}</span></div>
                  </div>

                  <div className="text-[11px] font-sans flex flex-col gap-2.5 text-slate-800 leading-relaxed">
                    <p>
                      This is to certify that <strong className="text-slate-950 uppercase font-bold">{fields.minority.name || 'APPLICANT NAME'}</strong>,
                      Son / Daughter of <strong className="text-slate-900">{fields.minority.father_name}</strong>, residing at {fields.minority.door_no}, {fields.minority.district},
                      belongs to the <strong className="text-indigo-950 font-bold">{fields.minority.community_religion}</strong> community (Mother Tongue: <strong>{fields.minority.language}</strong>).
                    </p>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[10px]">
                      This community is notified as a Minority Community under Section 2(c) of the National Commission for Minorities Act, 1992.
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-300 flex justify-between items-end text-[9px] text-slate-600 font-sans">
                    <div>
                      <span className="font-bold block text-slate-800">Competent Authority:</span>
                      <span>{fields.minority.issuing_authority}</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="text-xs text-slate-800 italic mb-1 font-bold">M. Selvaraj, B.Sc.</div>
                      <div className="w-28 border-t border-slate-400"></div>
                      <span className="font-bold text-slate-800">Tahsildar / RDO</span>
                      <span className="text-[8px] text-slate-500">Revenue Administration</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
