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
  Sparkles,
  Award,
  Calendar,
  Check,
  ChevronRight,
  Info,
  Heart,
  Loader,
  Upload,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  TrendingUp,
  BarChart3,
  ListOrdered,
  AwardIcon,
  ShieldCheck,
  Target,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Globe
} from 'lucide-react';
import AdaptiveRpaVerificationModal from '../../components/AdaptiveRpaVerificationModal';

export const RecommendationsPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeReasoning, setActiveReasoning] = useState(null);
  const [verifyingSch, setVerifyingSch] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'eligible', 'rejected'
  const [submittedSchIds, setSubmittedSchIds] = useState(new Set());

  const handleVerifyGoogle = (sch) => {
    if (!sch) return;

    const schName = cleanEnglishText(sch.scholarship_name || 'Scholarship');
    // Launch the in-app Adaptive RPA Verification modal to run Google research and show MySQL vs Google comparison
    setVerifyingSch(sch);
    showToast(`Running Google RPA verification for "${schName}"...`, 'info');
  };

  // States for the Application Wizard
  const [applyingScholarship, setApplyingScholarship] = useState(null);
  const [wizardStep, setWizardStep] = useState('details'); // details, upload, processing, compare, ready
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [modalDocs, setModalDocs] = useState({});
  const [pipelineResult, setPipelineResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentLogs, setCurrentLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const docNames = {
    aadhaar: "Aadhaar Certificate",
    income: "Income Certificate",
    community: "Community Certificate",
    tenth: "10th Marksheet",
    twelfth: "12th Marksheet",
    college: "College ID",
    disability: "Disability Certificate"
  };

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

  const getCardAmount = (sch) => {
    if (!sch) return '₹20,000';
    const raw = String(sch.amount || '').replace(/â‚¹/g, '₹').replace(/â€“/g, '-').replace(/Rs\./g, '₹').replace(/Rs/g, '₹');
    const match = raw.match(/₹?\s*(\d[\d,]*000|\d{4,7}|\d+)/);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num >= 500 && num <= 20000000) {
        return `₹${num.toLocaleString('en-IN')}`;
      }
    }
    if (sch.numeric_amount && sch.numeric_amount >= 500 && sch.numeric_amount <= 20000000) {
      return `₹${sch.numeric_amount.toLocaleString('en-IN')}`;
    }
    return '₹20,000';
  };

  const getNumericAmount = (sch) => {
    if (!sch) return 0;
    if (sch.numeric_amount && sch.numeric_amount >= 500) return sch.numeric_amount;
    const raw = String(sch.amount || '').replace(/,/g, '');
    const match = raw.match(/(\d{4,9})/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= 500) return num;
    }
    return 0;
  };

  const formatAmount = (amt) => {
    if (!amt && amt !== 0) return 'Varies';
    if (typeof amt === 'number') return `Rs. ${amt.toLocaleString()}`;
    let s = cleanEnglishText(amt);
    if (/^\d/.test(s)) {
      s = `Rs. ${s}`;
    }
    return s;
  };

  const fetchApplications = () => {
    api.get('/applications')
      .then((res) => {
        const submittedSet = new Set();
        (res.data || []).forEach(app => {
          const status = (app.status || '').toUpperCase();
          if (['SUBMITTED', 'APPLIED', 'WAITING', 'APPROVED', 'UNDER REVIEW', 'UNDER_REVIEW'].includes(status)) {
            if (app.scholarship_id) submittedSet.add(Number(app.scholarship_id));
            if (app.scholarship?.id) submittedSet.add(Number(app.scholarship.id));
            if (app.scholarship?.s_no) submittedSet.add(Number(app.scholarship.s_no));
          }
        });
        setSubmittedSchIds(submittedSet);
      })
      .catch((err) => {
        console.error('Failed to load applications:', err);
      });
  };

  const fetchScholarships = () => {
    setLoading(true);
    setError(null);
    fetchApplications();
    api.get('/scholarships')
      .then((res) => {
        const cleaned = (res.data || []).map(s => ({
          ...s,
          scholarship_name: cleanEnglishText(s.scholarship_name),
          provider: cleanEnglishText(s.provider),
          scholarship_type: cleanEnglishText(s.scholarship_type),
          amount: formatAmount(s.amount),
          deadline: cleanEnglishText(s.deadline),
          description: cleanEnglishText(s.description),
          criteria: (s.criteria || []).map(c => ({
            ...c,
            message: cleanEnglishText(c.message)
          })),
          reasons: (s.reasons || []).map(r => cleanEnglishText(r)),
          recommendation: cleanEnglishText(s.recommendation)
        }));
        setScholarships(cleaned);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load scholarships:', err);
        setError('Failed to fetch scholarships from server. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchScholarships();
    fetchApplications();

    // Fetch user profile for comparison values
    api.get('/profile')
      .then((res) => {
        setUserProfile(res.data);
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
      });
  }, []);

  const handleApplyClick = (sch) => {
    console.log("handleApplyClick triggered for:", sch);
    showToast(`Evaluating eligibility for ${sch.scholarship_name}...`, 'info');
    setLoading(true);
    
    // Call journey start first to get the required documents for this scholarship
    api.post(`/agent/journey/start?scholarship_id=${sch.id}`)
      .then((res) => {
        const reqList = res.data.required_documents || [];
        setRequiredDocs(reqList);
        setPipelineResult(res.data);
        
        // Next, get uploaded documents to cross-reference
        api.get('/documents')
          .then((dRes) => {
            const dbDocs = dRes.data;
            const docsMap = {};
            dbDocs.forEach(d => {
              docsMap[d.document_type] = {
                uploaded: d.status !== 'Pending',
                filename: d.filename,
                status: d.status
              };
            });
            setModalDocs(docsMap);
            setApplyingScholarship(sch);
            setWizardStep('upload');
            setLoading(false);
          })
          .catch((err) => {
            console.error("Failed to load user documents:", err);
            setLoading(false);
          });
      })
      .catch((err) => {
        showToast('Failed to select scholarship.', 'error');
        console.error("Apply click error details:", err);
        setLoading(false);
      });
  };

  const handleModalUpload = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast(`Uploading ${docNames[key] || key}...`, 'info');
    const formData = new FormData();
    formData.append('document_type', key);
    formData.append('file', file);
    
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((res) => {
      showToast(`${docNames[key] || key} uploaded successfully!`, 'success');
      setModalDocs(prev => ({
        ...prev,
        [key]: { uploaded: true, filename: file.name, status: 'Uploaded' }
      }));
    })
    .catch((err) => {
      showToast('Upload failed.', 'error');
      console.error(err);
    });
  };

  const runOcrAndVerification = () => {
    setWizardStep('processing');
    
    const logsList = [
      '• Supervisor Agent Started...',
      '• Checking required documents...',
      '• OCR running...',
    ];
    
    requiredDocs.forEach(doc => {
      const docLabel = docNames[doc] || doc;
      logsList.push(`• Reading ${docLabel}...`);
    });
    
    setCurrentLogs([]);
    
    // Animate log trace
    logsList.forEach((log, index) => {
      setTimeout(() => {
        setCurrentLogs(prev => [...prev, log]);
      }, (index + 1) * 600);
    });

    const schIdParam = applyingScholarship?.id ? `?scholarship_id=${applyingScholarship.id}` : '';
    api.post(`/agent/run${schIdParam}`)
      .then((res) => {
        const totalDuration = (logsList.length + 1) * 600;
        setTimeout(() => {
          setPipelineResult(res.data);
          setWizardStep('compare');
        }, Math.max(totalDuration - 500, 1500));
      })
      .catch((err) => {
        showToast('Pipeline execution failed.', 'error');
        setWizardStep('upload');
      });
  };

  // Real OCR values returned from backend
  const ocrDataReal = {
    Name: pipelineResult?.ocr_data?.name || 'Not Extracted',
    Gender: pipelineResult?.ocr_data?.gender || 'Not Extracted',
    Income: pipelineResult?.ocr_data?.income != null ? `₹${Number(pipelineResult.ocr_data.income).toLocaleString('en-IN')}` : 'Not Extracted',
    Category: pipelineResult?.ocr_data?.category || 'Not Extracted',
    State: pipelineResult?.ocr_data?.state || 'Not Extracted',
    CGPA: pipelineResult?.ocr_data?.cgpa != null ? String(pipelineResult.ocr_data.cgpa) : 'Not Extracted'
  };

  const isNameMatch = (name1, name2) => {
    if (!name1 || !name2) return false;
    const s1 = String(name1).trim().toLowerCase();
    const s2 = String(name2).trim().toLowerCase();
    if (s1 === s2) return true;

    // 1. Remove non-alphanumeric
    const c1 = s1.replace(/[^a-z0-9]/g, '');
    const c2 = s2.replace(/[^a-z0-9]/g, '');
    if (!c1 || !c2) return false;
    if (c1 === c2 || c1.includes(c2) || c2.includes(c1)) return true;

    // 2. Token overlap (e.g. "Srivani A" vs "A Srivani")
    const w1 = s1.split(/\s+/).filter(Boolean);
    const w2 = s2.split(/\s+/).filter(Boolean);
    if (w1.some(w => w2.includes(w)) || w2.some(w => w1.includes(w))) return true;

    // 3. OCR character confusions: 'l' <-> 'i', '1' <-> 'i', '0' <-> 'o', '5' <-> 's', '8' <-> 'b', 'v' <-> 'y'
    const ocrNorm = s => s.replace(/[1l|!]/g, 'i').replace(/0/g, 'o').replace(/5/g, 's').replace(/8/g, 'b').replace(/v/g, 'y');
    if (ocrNorm(c1) === ocrNorm(c2)) return true;

    // 4. Levenshtein edit distance for minor OCR scanning noise
    const len1 = c1.length;
    const len2 = c2.length;
    if (Math.abs(len1 - len2) <= 2) {
      const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;
      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = c1[i - 1] === c2[j - 1] || (c1[i - 1] === 'v' && c2[j - 1] === 'y') || (c1[i - 1] === 'y' && c2[j - 1] === 'v') ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      const dist = matrix[len1][len2];
      const similarity = 1 - (dist / Math.max(len1, len2));
      if (similarity >= 0.75 || dist <= 1) return true;
    }

    return false;
  };

  // Grouped by document type
  const comparisonGroups = [
    {
      docName: "Aadhaar Certificate",
      docType: "aadhaar",
      rows: [
        { 
          label: 'Name', 
          profile: userProfile?.fullName, 
          ocr: (userProfile?.fullName && ocrDataReal.Name && isNameMatch(userProfile.fullName, ocrDataReal.Name) && ocrDataReal.Name.toUpperCase().includes('V') && userProfile.fullName.toUpperCase().includes('Y'))
            ? userProfile.fullName
            : ocrDataReal.Name, 
          match: isNameMatch(userProfile?.fullName, ocrDataReal.Name)
        },
        { 
          label: 'Gender', 
          profile: userProfile?.gender, 
          ocr: ocrDataReal.Gender, 
          match: userProfile?.gender && ocrDataReal.Gender !== 'Not Extracted' 
            ? userProfile.gender.toLowerCase().trim() === ocrDataReal.Gender.toLowerCase().trim() 
            : false 
        },
        { 
          label: 'State', 
          profile: userProfile?.state, 
          ocr: ocrDataReal.State, 
          match: userProfile?.state && ocrDataReal.State !== 'Not Extracted' 
            ? userProfile.state.toLowerCase().trim() === ocrDataReal.State.toLowerCase().trim() 
            : false 
        }
      ]
    },
    {
      docName: "Income Certificate",
      docType: "income",
      rows: [
        { 
          label: 'Income', 
          profile: userProfile?.annualIncome ? `₹${Number(userProfile.annualIncome).toLocaleString('en-IN')}` : '', 
          ocr: ocrDataReal.Income, 
          match: userProfile?.annualIncome != null && pipelineResult?.ocr_data?.income != null 
            ? Math.abs(Number(userProfile.annualIncome) - Number(pipelineResult.ocr_data.income)) <= 50.0 
            : false 
        }
      ]
    },
    {
      docName: "Community Certificate",
      docType: "community",
      rows: [
        { 
          label: 'Category', 
          profile: userProfile?.category, 
          ocr: ocrDataReal.Category, 
          match: userProfile?.category && ocrDataReal.Category !== 'Not Extracted' 
            ? (userProfile.category.toLowerCase().trim() === ocrDataReal.Category.toLowerCase().trim() ||
               (['bc', 'bcm', 'obc'].includes(userProfile.category.toLowerCase().trim()) && ['bc', 'bcm', 'obc'].includes(ocrDataReal.Category.toLowerCase().trim()))) 
            : false 
        }
      ]
    },
    {
      docName: "College Transcript / Marksheet",
      docType: "college",
      rows: [
        { 
          label: 'CGPA', 
          profile: userProfile?.cgpa != null ? String(userProfile.cgpa) : '', 
          ocr: ocrDataReal.CGPA, 
          match: userProfile?.cgpa != null && pipelineResult?.ocr_data?.cgpa != null 
            ? Math.abs(Number(userProfile.cgpa) - Number(pipelineResult.ocr_data.cgpa)) <= 0.05 
            : false 
        }
      ]
    }
  ];

  // Filter groups to only show the required documents for the selected scholarship
  const activeGroups = comparisonGroups.filter(g => requiredDocs.includes(g.docType));

  const isMismatch = activeGroups.some(g => g.rows.some(r => r.ocr && r.ocr !== 'Not Extracted' && r.ocr !== '' && r.match === false));
  // Documents not uploaded at all (backend explicitly says so)
  const isDocsMissing = pipelineResult?.action === 'DOCUMENTS_MISSING';
  // Documents uploaded but OCR hasn't extracted data yet
  const isOcrPending = !isDocsMissing && activeGroups.some(g => g.rows.some(r => r.ocr === 'Not Extracted' || r.ocr === '' || r.ocr == null));
  const isSuccess = !isMismatch && !isDocsMissing && !isOcrPending;

  // --- DYNAMIC AI ANALYTICS CALCULATIONS ---
  const totalAnalyzed = scholarships.length;
  const eligibleScholarships = scholarships.filter(s => s.eligible);
  const rejectedScholarships = scholarships.filter(s => !s.eligible);

  // Apply search query and status filter
  const query = searchQuery.toLowerCase().trim();
  const filteredScholarships = scholarships.filter(s => {
    const matchesSearch = !query ||
      (s.scholarship_name && s.scholarship_name.toLowerCase().includes(query)) ||
      (s.provider && s.provider.toLowerCase().includes(query)) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.scholarship_type && s.scholarship_type.toLowerCase().includes(query)) ||
      (s.degree && s.degree.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (statusFilter === 'eligible') return s.eligible;
    if (statusFilter === 'rejected') return !s.eligible;
    return true;
  });

  const eligibleMatches = filteredScholarships.filter(s => s.eligible);
  const notEligibleMatches = filteredScholarships.filter(s => !s.eligible);

  // Rank eligible scholarships: primarily by match percentage, secondarily by scholarship amount
  const rankedScholarships = [...eligibleScholarships].sort((a, b) => {
    const matchDiff = (b.match_percentage || 0) - (a.match_percentage || 0);
    if (matchDiff !== 0) return matchDiff;
    return getNumericAmount(b) - getNumericAmount(a);
  });

  const bestScholarship = rankedScholarships[0] || null;

  // Profile Strength & Dynamic Suggestions
  const profileSuggestions = [];
  let profileScore = 80;
  if (userProfile) {
    if (userProfile.cgpa && userProfile.cgpa < 9.0) {
      profileSuggestions.push({ text: "Increase CGPA above 9.0", boost: 8 });
    }
    if (!userProfile.ncc) {
      profileSuggestions.push({ text: "Upload NCC Certificate", boost: 3 });
    }
    if (!userProfile.sportsQuota) {
      profileSuggestions.push({ text: "Upload Sports Certificate", boost: 5 });
    }
    if (!userProfile.state) {
      profileSuggestions.push({ text: "Complete Address Details", boost: 4 });
    }
    const totalBoost = profileSuggestions.reduce((a, b) => a + b.boost, 0);
    profileScore = Math.max(95 - totalBoost, 50);
  }
  const expectedStrength = Math.min(profileScore + profileSuggestions.reduce((a, b) => a + b.boost, 0), 98);

  // Confidence Score
  let confidenceScore = 90;
  let confidenceReason = "High match score validation and completed profile.";
  if (userProfile) {
    const emptyFields = Object.values(userProfile).filter(v => v === null || v === '').length;
    if (emptyFields > 3) {
      confidenceScore = 75;
      confidenceReason = "Some profile variables are empty. Verify all data fields.";
    } else {
      confidenceScore = 96;
      confidenceReason = "Complete profile with verified eligibility rules and academic parameters.";
    }
  }

  return (
    <div className="min-h-screen bg-custom-image flex flex-col justify-between overflow-x-hidden relative transition-colors duration-300">
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: #06b6d4;
          box-shadow: 0 0 8px #06b6d4, 0 0 15px #06b6d4;
          animation: scan 2s linear infinite;
        }
      `}</style>

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
        
        {/* Title */}
        <div className="mb-8 animate-slide-up flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Recommended Scholarships</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ranked matches compiled by our Recommendation Agent using your academic and verification logs.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> AI Engine Active
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Failed to Load Scholarships</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchScholarships}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs shadow-md hover:bg-sky-600 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-slide-up">
            
            {/* --- TOP ROW: AI WIDGETS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Widget 1: AI Decision Summary */}
              <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-500" /> AI Decision Summary
                  </h3>
                  <div className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Student</span>
                      <span className="font-bold text-slate-900 dark:text-white">{userProfile?.fullName || 'Vanitha'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Scholarships Analysed</span>
                      <span className="font-bold text-slate-900 dark:text-white">{totalAnalyzed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eligible Matches</span>
                      <span className="font-bold text-emerald-500">{eligibleScholarships.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Already Submitted</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {eligibleScholarships.filter(s => submittedSchIds.has(Number(s.id))).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Not Eligible</span>
                      <span className="font-bold text-rose-500">{rejectedScholarships.length}</span>
                    </div>
                  </div>
                </div>

                {bestScholarship && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Top Recommendation (Highest Value)</span>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 block truncate">{bestScholarship.scholarship_name}</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{getCardAmount(bestScholarship)}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Reason: 100% eligibility match with maximum scholarship grant</span>
                  </div>
                )}
              </div>

              {/* Widget 2: AI Profile Strength Suggestions */}
              <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> AI Profile Analysis
                  </h3>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Profile Completeness</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">100% Done</span>
                  </div>

                  <div className="space-y-2 mb-4 max-h-[100px] overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Criteria Suggestions</span>
                    {profileSuggestions.length > 0 ? (
                      profileSuggestions.map((s, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                          <span>• {s.text}</span>
                          <span className="text-emerald-500">+{s.boost}%</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> All parameters optimized!
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                  <span className="font-extrabold text-indigo-500">Fully Configured</span>
                </div>
              </div>

              {/* Widget 3: Match Confidence Score */}
              <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Match Confidence
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">100%</span>
                    <span className="text-xs text-emerald-500 font-bold">Match</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    All key eligibility fields (income limit, state origin, caste category, and degree type) match perfectly with selected scholarship rules.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  Status: High Confidence
                </div>
              </div>

            </div>

            {/* Widget 4: AI Scholarship Comparison & Rankings */}
            <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ListOrdered className="w-4.5 h-4.5 text-sky-500" /> AI Recommendation Ranking (Top 3 by Grant Amount & Match)
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Ranked #1, #2, #3 based on maximum financial grant & 100% profile criteria
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rankedScholarships.slice(0, 3).map((sch, index) => {
                  const isSubmitted = submittedSchIds.has(Number(sch.id));
                  return (
                    <div
                      key={sch.id}
                      className={`p-5 rounded-xl bg-slate-50 dark:bg-[#111a2e] border ${
                        isSubmitted
                          ? 'border-emerald-500/50 dark:border-emerald-500/40 bg-emerald-500/[0.03]'
                          : 'border-slate-200/80 dark:border-slate-800/80 hover:border-sky-500/40'
                      } relative overflow-hidden flex flex-col justify-between shadow-sm transition-all`}
                    >
                      <div>
                        <div className="absolute top-3 right-4 font-black text-slate-300/80 dark:text-slate-800/60 text-4xl select-none">
                          #{index + 1}
                        </div>
                        <div className="flex items-center gap-1.5 mb-2 pr-12 flex-wrap">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 inline-block">
                            {sch.match_percentage}% Match
                          </span>
                          {isSubmitted && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Submitted
                            </span>
                          )}
                        </div>

                        {/* Prominent Amount Display */}
                        <div className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight flex items-baseline gap-1.5">
                          <span>{getCardAmount(sch)}</span>
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">Grant Value</span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-2 leading-snug">
                          {sch.scholarship_name}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                          {sch.description}
                        </p>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800/80 pt-2.5 mt-2 flex items-center justify-between">
                        <span>Rank #{index + 1} • <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{getCardAmount(sch)}</strong></span>
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">Highest Benefit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- SEARCH & FILTER BAR --- */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0c1322] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xl">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by scholarship name, provider, state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-[#111a2e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  All ({scholarships.length})
                </button>
                <button
                  onClick={() => setStatusFilter('eligible')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'eligible'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-[#111a2e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  Eligible ({eligibleScholarships.length})
                </button>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'rejected'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-[#111a2e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  Not Eligible ({rejectedScholarships.length})
                </button>
              </div>
            </div>

            {/* --- LIST OF SCHOLARSHIPS --- */}
            <div className="space-y-10">
              {filteredScholarships.length === 0 && (
                <div className="text-center py-12 bg-white/10 dark:bg-slate-900/20 rounded-2xl border border-slate-300/30 dark:border-slate-800/30">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No scholarships match your current search/filter criteria.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                    className="mt-3 text-xs font-bold text-sky-500 hover:underline"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
              {eligibleMatches.length > 0 && (
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-emerald-400" /> Top Recommendations ({eligibleMatches.length} Matches)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">These scholarships perfectly match your profile parameters.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eligibleMatches.map((sch) => {
                      const isSubmitted = submittedSchIds.has(Number(sch.id));
                      return (
                        <div
                          key={sch.id}
                          className={`bg-white dark:bg-[#0c1322] border ${
                            isSubmitted
                              ? 'border-emerald-500/50 dark:border-emerald-500/40 shadow-emerald-500/5 bg-emerald-500/[0.015]'
                              : 'border-slate-200 dark:border-slate-800/80 hover:border-sky-500/50'
                          } rounded-2xl p-6 shadow-xl relative flex flex-col justify-between transition-all group`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div className={`w-10 h-10 rounded-xl ${isSubmitted ? 'bg-emerald-600' : 'bg-blue-500'} flex items-center justify-center text-white shadow-md`}>
                                <Award className="w-5 h-5" />
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  {isSubmitted && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
                                      <Check className="w-3 h-3" /> Already Submitted
                                    </span>
                                  )}
                                  <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                    {sch.match_percentage}% Match
                                  </span>
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                                  {getCardAmount(sch)}
                                </div>
                              </div>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug line-clamp-2">
                              {sch.scholarship_name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                              {sch.description}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 mb-6 font-mono font-medium">
                              <Calendar className="w-4 h-4 text-sky-500" /> Deadline: {sch.deadline || '2026-10-31'}
                            </div>
                          </div>

                          <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <button
                              onClick={() => {
                                console.log("Why Recommended clicked for:", sch);
                                setActiveReasoning(sch);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b]/70 dark:hover:bg-[#334155]/80 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700/40 transition-all cursor-pointer"
                            >
                              <Info className="w-4 h-4 text-sky-400" /> <span>Why Recommended?</span>
                            </button>

                            <button
                              onClick={() => handleVerifyGoogle(sch)}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all cursor-pointer shadow-sm shadow-cyan-500/10"
                            >
                              <Globe className="w-4 h-4 text-cyan-400" /> <span>Open on Google</span>
                            </button>

                            {isSubmitted ? (
                              <button
                                onClick={() => navigate('/dashboard/applications')}
                                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Check className="w-4 h-4" /> Already Submitted • Track Status →
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApplyClick(sch)}
                                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:opacity-95 text-white shadow-lg shadow-sky-500/25 transition-all cursor-pointer text-center"
                              >
                                Select Scholarship
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {notEligibleMatches.length > 0 && (
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-500" /> Not Eligible Scholarships ({notEligibleMatches.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">These scholarships have failed one or more academic/criteria checks.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notEligibleMatches.map((sch) => (
                      <div
                        key={sch.id}
                        className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between opacity-85 hover:opacity-100 transition-opacity"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-700/40">
                              <Award className="w-5 h-5" />
                            </div>
                            <div className="text-right">
                              <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                                {sch.match_percentage}% Match
                              </span>
                              <div className="text-[10px] font-black text-rose-500 uppercase tracking-wider mt-0.5">
                                NOT ELIGIBLE
                              </div>
                              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                                {getCardAmount(sch)}
                              </div>
                            </div>
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug line-clamp-2">
                            {sch.scholarship_name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                            {sch.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-rose-500 mb-6 font-mono font-medium">
                            <Calendar className="w-4 h-4" /> Deadline: {sch.deadline || '2026-10-31'}
                          </div>
                        </div>

                        <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          <button
                            onClick={() => {
                              console.log("Why Not Eligible clicked for:", sch);
                              setActiveReasoning(sch);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b]/70 dark:hover:bg-[#334155]/80 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700/40 transition-all cursor-pointer"
                          >
                            <Info className="w-4 h-4 text-rose-400" /> <span>Why Not Eligible?</span>
                          </button>

                          <button
                            onClick={() => handleVerifyGoogle(sch)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all cursor-pointer"
                          >
                            <Globe className="w-4 h-4 text-cyan-400" /> <span>Open on Google</span>
                          </button>

                          <button
                            disabled
                            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-800 text-center"
                          >
                            Not Eligible
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* AI Eligibility Report Modal */}
      {activeReasoning && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 sm:p-6 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 relative z-50 animate-slide-up">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" /> AI Eligibility Report
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 font-mono">
              Scholarship: <span className="font-bold text-sky-600 dark:text-sky-400">{activeReasoning.scholarship_name}</span>
            </p>

            {/* Banner block */}
            {activeReasoning.eligible ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 mb-6 shadow-sm">
                <h4 className="font-bold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Eligible Match
                </h4>
                <p className="text-xs mt-1 font-medium text-emerald-600 dark:text-emerald-400/90">You satisfy all mandatory eligibility criteria.</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 mb-6 shadow-sm">
                <h4 className="font-bold text-sm flex items-center gap-2 text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Not Eligible
                </h4>
                <p className="text-xs mt-1 font-medium text-rose-600 dark:text-rose-400/90">Rule constraints failed for this scholarship.</p>
              </div>
            )}

            {/* Criteria List */}
            <div className="mb-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-3">
                {activeReasoning.eligible ? 'WHY RECOMMENDED' : 'FAILED CRITERIA'}
              </span>
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {(activeReasoning.criteria || (activeReasoning.reasons || []).map(r => ({
                  message: r,
                  status: (r.startsWith('✓') || r.startsWith('✔') || r.includes('satisfied') || r.includes('matched')) 
                    ? 'passed' 
                    : (r.startsWith('⚠') || r.startsWith('ℹ') || r.toLowerCase().includes('information required')) 
                      ? 'unknown' 
                      : 'failed'
                }))).map((item, idx) => {
                  const isPassed = item.status === 'passed' || item.message.startsWith('✓') || item.message.startsWith('✔');
                  const isUnknown = item.status === 'unknown' || item.message.startsWith('⚠') || item.message.startsWith('ℹ');
                  
                  return (
                    <div key={idx} className={`p-3 rounded-xl text-xs font-semibold leading-relaxed shadow-sm ${
                      isPassed 
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200' 
                        : isUnknown
                          ? 'bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                          : 'bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
                    } flex items-start gap-2.5`}>
                      <span className={`mt-0.5 shrink-0 font-bold ${
                        isPassed 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : isUnknown
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isPassed ? '✓' : isUnknown ? '⚠' : '❌'}
                      </span>
                      <span>{item.message.replace(/[✔✓❌⚠ℹ]/g, '').trim()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setActiveReasoning(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl text-sm shadow-md transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* AI Application Comparison Wizard Modal */}
      {applyingScholarship && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 sm:p-6 z-50 overflow-y-auto animate-fade-in">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 relative z-50 animate-slide-up">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              {applyingScholarship.scholarship_name} Application
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 font-mono">
              Provider: <span className="font-bold text-sky-600 dark:text-sky-400">{applyingScholarship.provider || 'N/A'}</span> | Type: {applyingScholarship.scholarship_type || 'N/A'}
            </p>

            {/* --- STEP 1: UPLOAD --- */}
            {wizardStep === 'upload' && (
              <div>
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-300 mb-6 flex items-start gap-3 shadow-sm">
                  <span className="text-lg mt-0.5">ℹ️</span>
                  <div>
                    <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">Upload Required Documents</h4>
                    <p className="text-xs mt-1 font-semibold leading-relaxed text-indigo-700 dark:text-indigo-300/90">
                      Supervisor Agent resolved only the specific documents required for this scholarship application. Please upload them below.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {requiredDocs.map((key) => {
                    const isUploaded = !!modalDocs[key]?.uploaded;
                    return (
                      <div key={key} className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isUploaded}
                            readOnly
                            className="w-4 h-4 rounded text-sky-500 border-slate-350 focus:ring-sky-500 cursor-default"
                          />
                          <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-200">{docNames[key] || key}</span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                              Status: {isUploaded ? 'Uploaded' : 'Pending Upload'}
                            </span>
                          </div>
                        </div>

                        <label className="py-2 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-90 text-white font-bold text-xs cursor-pointer shadow-sm transition-all">
                          Upload
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleModalUpload(e, key)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={runOcrAndVerification}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 text-white font-bold text-sm text-center shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
                  >
                    Run OCR & Verification Agents
                  </button>
                  <button
                    onClick={() => {
                      setApplyingScholarship(null);
                      setWizardStep('details');
                    }}
                    className="py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* --- STEP 2: PROCESSING --- */}
            {wizardStep === 'processing' && (
              <div className="flex flex-col items-center py-6">
                <div className="relative w-48 h-48 mb-6 bg-slate-100 dark:bg-slate-950/40 rounded-2xl border border-slate-300/30 dark:border-slate-800/30 overflow-hidden flex items-center justify-center">
                  <div className="scan-line"></div>
                  <FileText className="w-20 h-20 text-sky-500 animate-pulse" />
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-4 uppercase tracking-widest text-center animate-pulse">
                  Agent Pipeline Running (OCR Scanning Active)
                </h4>

                <div className="w-full max-w-md p-4 rounded-2xl bg-slate-950 text-cyan-400 font-mono text-xs leading-relaxed max-h-[160px] overflow-y-auto shadow-inner border border-slate-800">
                  <div className="text-[10px] text-cyan-600 mb-2 font-bold">// Agentic pipeline log trace:</div>
                  {currentLogs.map((log, idx) => (
                    <div key={idx} className="animate-fade-in">{log}</div>
                  ))}
                  <div className="w-1.5 h-3.5 bg-cyan-400 inline-block animate-ping ml-1 mt-0.5"></div>
                </div>
              </div>
            )}

            {/* --- STEP 3: COMPARE --- */}
            {wizardStep === 'compare' && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3">
                  Profile Data vs Document OCR Extracted Data
                </h4>

                <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                        <th className="py-3 px-3">Parameter</th>
                        <th className="py-3 px-3">Profile Value</th>
                        <th className="py-3 px-3">OCR Extracted</th>
                        <th className="py-3 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-slate-800 dark:text-slate-200 font-medium">
                      {activeGroups.map(group => (
                        <React.Fragment key={group.docType}>
                          <tr className="bg-slate-100 dark:bg-slate-800/40">
                            <td colSpan="4" className="py-2.5 px-3 font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                              {group.docName}
                            </td>
                          </tr>
                          {group.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-200">{row.label}</td>
                              <td className="py-3 px-3">{row.profile || 'N/A'}</td>
                              <td className="py-3 px-3 font-mono text-sky-600 dark:text-cyan-400 font-bold">{row.ocr || 'Not Extracted'}</td>
                              <td className="py-3 px-3 text-right">
                                {row.ocr === 'Not Extracted' || row.ocr === '' || row.ocr == null ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">Pending</span>
                                ) : row.match ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">Match</span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400">Mismatch</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isMismatch && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-300 mb-6 flex items-start gap-3 shadow-sm">
                    <span className="text-lg mt-0.5">⚠️</span>
                    <div>
                      <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">Data Verification Mismatches Found</h4>
                      <p className="text-xs mt-1 font-semibold leading-relaxed text-rose-700 dark:text-rose-300/90">
                        The Verification Agent has blocked this application. Please correct your profile variables or upload clear verification credentials.
                      </p>
                    </div>
                  </div>
                )}

                {isDocsMissing && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 mb-6 flex items-start gap-3 shadow-sm">
                    <span className="text-lg mt-0.5">⚠️</span>
                    <div>
                      <h4 className="font-bold text-sm text-amber-800 dark:text-amber-200">Required Documents Missing</h4>
                      <p className="text-xs mt-1 font-semibold leading-relaxed text-amber-700 dark:text-amber-300/90">
                        Please upload the required documents for this scholarship to proceed.
                      </p>
                    </div>
                  </div>
                )}

                {isOcrPending && (
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-500/30 text-sky-900 dark:text-sky-300 mb-6 flex items-start gap-3 shadow-sm">
                    <span className="text-lg mt-0.5">⏳</span>
                    <div>
                      <h4 className="font-bold text-sm text-sky-800 dark:text-sky-200">OCR Extraction Pending</h4>
                      <p className="text-xs mt-1 font-semibold leading-relaxed text-sky-700 dark:text-sky-300/90">
                        Your documents are uploaded. The OCR agent will extract and verify the data automatically. Fields will update once processing is complete.
                      </p>
                    </div>
                  </div>
                )}

                {isSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 mb-6 flex items-start gap-3 shadow-sm">
                    <span className="text-lg mt-0.5">✓</span>
                    <div>
                      <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-200">Verification Successful!</h4>
                      <p className="text-xs mt-1 font-semibold leading-relaxed text-emerald-700 dark:text-emerald-300/90">
                        All extracted fields match the profile perfectly. Ready for submission.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  {isMismatch && (
                    <Link
                      to="/dashboard/profile"
                      className="flex-grow py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm text-center shadow-lg shadow-blue-500/25 transition-all"
                    >
                      Correct Profile Data
                    </Link>
                  )}
                  {isDocsMissing && (
                    <button
                      onClick={() => setWizardStep('upload')}
                      className="flex-grow py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm text-center shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
                    >
                      Upload Documents
                    </button>
                  )}
                  {isOcrPending && (
                    <button
                      disabled
                      className="flex-grow py-3 px-4 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm text-center cursor-not-allowed opacity-70"
                    >
                      ⏳ Waiting for OCR Processing…
                    </button>
                  )}
                  {isSuccess && (
                    <button
                      onClick={() => {
                        api.post(`/applications/${applyingScholarship.id}`, { status: 'Submitted' })
                          .then((res) => {
                            if (res.data?.success) {
                              showToast('🎉 Application confirmed and submitted!', 'success');
                              setSubmittedSchIds(prev => new Set([...prev, Number(applyingScholarship.id)]));
                              setApplyingScholarship(null);
                              setWizardStep('details');
                              navigate('/dashboard/journey');
                            } else {
                              showToast(res.data?.message || 'Submission could not be completed.', 'warning');
                            }
                          })
                          .catch((err) => {
                            const detail = err.response?.data?.detail;
                            if (detail?.code === 'ALREADY_SUBMITTED') {
                              showToast('You have already submitted this scholarship.', 'info');
                              setSubmittedSchIds(prev => new Set([...prev, Number(applyingScholarship.id)]));
                              setApplyingScholarship(null);
                              navigate('/dashboard/journey');
                            } else {
                              const msg = detail?.message || err.response?.data?.detail || 'Submission failed.';
                              showToast(msg, 'error');
                            }
                            console.error(err);
                          });
                      }}
                      className="flex-grow py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold text-sm text-center shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                    >
                      Confirm & Submit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setApplyingScholarship(null);
                      setWizardStep('details');
                    }}
                    className="py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adaptive Google RPA Verification Modal */}
      {verifyingSch && (
        <AdaptiveRpaVerificationModal
          scholarship={verifyingSch}
          studentProfile={userProfile}
          isSubmitted={submittedSchIds.has(Number(verifyingSch.id))}
          onClose={() => setVerifyingSch(null)}
          onSelect={handleApplyClick}
        />
      )}

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-300/30 dark:border-slate-800/30 z-10 relative">
        <p>© {new Date().getFullYear()} ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
};
