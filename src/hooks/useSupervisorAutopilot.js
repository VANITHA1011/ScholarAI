import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

/**
 * 11-Step AI Agent Autopilot Lifecycle Definition
 */
export const AUTOPILOT_STEPS = [
  {
    id: 'profile',
    stepNumber: 1,
    title: 'Profile',
    shortName: 'Profile',
    description: 'Student background, academic parameters, and socio-economic criteria.',
    humanActionTitle: 'Complete Student Profile',
    humanActionDesc: 'Profile information is required before ScholarAI can evaluate eligibility.',
    targetRoute: '/dashboard/profile',
    agent: 'Profile Agent',
    isHumanAction: true
  },
  {
    id: 'documents',
    stepNumber: 2,
    title: 'Documents',
    shortName: 'Documents',
    description: 'Mandatory certificates and marksheets verification.',
    humanActionTitle: 'Upload Required Documents',
    humanActionDesc: 'Please upload your mandatory certificates for OCR verification.',
    targetRoute: '/dashboard/documents',
    agent: 'Document Agent',
    isHumanAction: true
  },
  {
    id: 'verification',
    stepNumber: 3,
    title: 'Verification',
    shortName: 'Verification',
    description: 'OCR text extraction and cross-field verification vs profile details.',
    humanActionTitle: 'Document Discrepancy Found',
    humanActionDesc: 'Verification Agent flagged discrepancies between certificates and profile.',
    targetRoute: '/dashboard/documents',
    agent: 'OCR & Verification Agent',
    isHumanAction: false
  },
  {
    id: 'eligibility',
    stepNumber: 4,
    title: 'Eligibility',
    shortName: 'Eligibility',
    description: '16-criteria deterministic and RAG rule evaluation across scholarship database.',
    humanActionTitle: 'Review Eligibility Analysis',
    humanActionDesc: 'Multi-parameter deterministic and AI criteria evaluation.',
    targetRoute: '/dashboard/eligibility',
    agent: 'Eligibility Engine',
    isHumanAction: false
  },
  {
    id: 'recommendations',
    stepNumber: 5,
    title: 'Recommendations',
    shortName: 'Recommendations',
    description: 'AI recommendation ranking by match score, funding amount, and deadlines.',
    humanActionTitle: 'View Recommendation Matches',
    humanActionDesc: 'Matching completed. Top scholarships ranked and ready.',
    targetRoute: '/dashboard/recommendations',
    agent: 'Recommendation Agent',
    isHumanAction: false
  },
  {
    id: 'scholarship_selection',
    stepNumber: 6,
    title: 'Select Scholarship',
    shortName: 'Selection',
    description: 'Student choice of target scholarship to initiate application packaging.',
    humanActionTitle: 'Choose Your Scholarship',
    humanActionDesc: 'Ranked matches are ready. Please select the scholarship you wish to apply for.',
    targetRoute: '/dashboard/recommendations',
    agent: 'Supervisor Agent',
    isHumanAction: true
  },
  {
    id: 'final_confirmation',
    stepNumber: 7,
    title: 'Final Confirmation',
    shortName: 'Confirmation',
    description: 'Student final review and approval of the assembled application bundle.',
    humanActionTitle: 'Review & Confirm Application',
    humanActionDesc: 'Your application package is fully prepared. Please review and confirm final submission.',
    targetRoute: '/dashboard/journey',
    agent: 'Supervisor Agent',
    isHumanAction: true
  },
  {
    id: 'submission',
    stepNumber: 8,
    title: 'Submit',
    shortName: 'Submission',
    description: 'Transmitting application to database and dispatching confirmation email.',
    humanActionTitle: 'Submitting Application',
    humanActionDesc: 'ScholarAI is transmitting official application.',
    targetRoute: '/dashboard/journey',
    agent: 'Submission Agent',
    isHumanAction: false
  },
  {
    id: 'tracking',
    stepNumber: 9,
    title: 'Tracking',
    shortName: 'Tracking',
    description: 'Real-time application status monitoring, verification logs, and audit trail.',
    humanActionTitle: 'Track Application Status',
    humanActionDesc: 'Scholarship application submitted. Real-time audit history is active.',
    targetRoute: '/dashboard/applications',
    agent: 'Tracking Agent',
    isHumanAction: false
  }
];

export const useSupervisorAutopilot = (options = {}) => {
  const {
    enableAutoNavigation = true,
    stepDisplayDelayMs = 1500, // Visible time per stage on Dashboard (~1.5s)
    onStateChange
  } = options;

  const navigate = useNavigate();
  const location = useLocation();

  const [agentState, setAgentState] = useState(null);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [autoNavCountdown, setAutoNavCountdown] = useState(null);
  const [currentActionNotice, setCurrentActionNotice] = useState('');
  const [isHumanActionRequired, setIsHumanActionRequired] = useState(false);
  const [humanActionTarget, setHumanActionTarget] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Sequential visual animation ref
  const lastAnimatedStepRef = useRef(-1);
  const stepTimerRef = useRef(null);
  const navTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isNavigatingRef = useRef(false);

  // Deterministically compute the true backend milestone step (0 to 8)
  const computeTargetMilestone = useCallback((stateData, profileData, docsData, appsData) => {
    const stage = stateData?.current_stage || 'NOT_STARTED';
    
    // Robust check for profile presence
    const hasProfile = profileData && (
      profileData.annualIncome !== undefined ||
      Boolean(profileData.state) ||
      Boolean(profileData.category) ||
      Boolean(profileData.degree)
    );
    const isProfileComplete = Boolean(
      hasProfile ||
      ['Complete', 'Ready', 'PROFILE_READY'].includes(stateData?.profile_status)
    );
    
    const docs = Array.isArray(docsData) ? docsData : [];
    const uploadedDocs = docs.filter(d => d.status && !['Pending', 'Not Uploaded', 'NOT_UPLOADED'].includes(d.status));
    const verifiedDocs = docs.filter(d => ['VERIFIED', 'Verified'].includes(d.status));
    const hasMismatches = docs.some(d => d.status === 'MISMATCH' || d.status === 'Mismatch');
    const hasOcrFailed = docs.some(d => d.status === 'OCR_FAILED' || d.status === 'OCR Failed');
    
    const hasUploadedDocs = uploadedDocs.length >= 1;
    const areDocsVerified = verifiedDocs.length >= 1 && !hasMismatches && !hasOcrFailed;
    const areDocsMissing = !hasUploadedDocs || stage === 'DOCUMENTS_MISSING';

    const apps = Array.isArray(appsData) ? appsData : [];
    const submittedApps = apps.filter(a => (a.status || '').toUpperCase() === 'SUBMITTED');
    const submittedSchIds = new Set(submittedApps.map(a => Number(a.scholarship_id)));

    const matchingResults = Array.isArray(stateData?.matching_results) ? stateData.matching_results : [];
    const eligibleMatches = matchingResults.filter(m => m.status === 'Eligible' || m.status === 'Partially Eligible');
    const eligibleCount = eligibleMatches.length;

    // Remaining unsubmitted recommended scholarships
    const unsubmittedEligible = eligibleMatches.filter(m => !submittedSchIds.has(Number(m.id)));

    // ALL eligible scholarships submitted
    const allEligibleSubmitted = eligibleCount > 0 && unsubmittedEligible.length === 0;

    // Active unsubmitted selected scholarship
    const activeSchId = stateData?.scholarship_id;
    const isCurrentSelectedUnsubmitted = activeSchId && !submittedSchIds.has(Number(activeSchId));

    // Hard prerequisite checks
    if (!isProfileComplete) {
      return 0; // Step 1: Profile
    }
    if (areDocsMissing) {
      return 1; // Step 2: Documents
    }
    if (hasMismatches || hasOcrFailed || stage === 'CORRECTION_REQUIRED') {
      return 2; // Step 3: Verification with issues (stop here if correction needed)
    }

    // 1. If ALL eligible scholarships are submitted, stop at Tracking
    if (allEligibleSubmitted) {
      return 8; // Step 9: Tracking
    }

    // 2. If a specific unsubmitted scholarship is currently selected -> go to Final Confirmation
    if (isCurrentSelectedUnsubmitted && stage === 'APPLICATION_READY') {
      return 6; // Step 7: Final Confirmation
    }

    // 3. Otherwise, return to Selection so user can select their next recommended scholarship
    return 5; // Step 6: Selection (Recommendations)
  }, []);

  // Update visual presentation for any step index (0 to 8)
  const applyStepDetails = useCallback((stepIdx, stateData, profileData) => {
    const stepDef = AUTOPILOT_STEPS[stepIdx] || AUTOPILOT_STEPS[0];
    let isHuman = false;
    let humanTarget = null;
    let notice = '';
    let navRoute = null;

    switch (stepIdx) {
      case 0: // Step 1: Profile
        isHuman = true;
        navRoute = '/dashboard/profile';
        humanTarget = {
          title: '👤 Complete Student Profile',
          desc: 'Profile information is required before ScholarAI can evaluate eligibility.',
          route: '/dashboard/profile',
          btnText: 'Complete Profile →'
        };
        notice = 'Profile incomplete. Routing to Student Profile in ~1s...';
        break;

      case 1: // Step 2: Documents
        isHuman = true;
        navRoute = '/dashboard/documents';
        humanTarget = {
          title: '📄 Upload Required Documents',
          desc: stateData?.decision_reason || 'Required certificates or marksheets are missing. Please upload your documents for OCR verification.',
          route: '/dashboard/documents',
          btnText: 'Upload Documents →'
        };
        notice = 'Required verification documents missing. Routing to Documents in ~1s...';
        break;

      case 2: // Step 3: Verification
        isHuman = stateData?.current_stage === 'CORRECTION_REQUIRED';
        navRoute = isHuman ? '/dashboard/documents' : null;
        humanTarget = isHuman ? {
          title: '⚠️ Document Discrepancy Found',
          desc: stateData?.decision_reason || 'Discrepancies found between document OCR values and profile details.',
          route: '/dashboard/documents',
          btnText: 'Review Document Issues →'
        } : null;
        notice = isHuman
          ? 'Verification Agent flagged issues. Routing to Document Verification...'
          : 'OCR & Verification Agent: Extracting text and cross-verifying certificates vs profile details...';
        break;

      case 3: // Step 4: Eligibility
        isHuman = false;
        navRoute = null;
        notice = 'Eligibility Engine: Evaluating 16-parameter deterministic and RAG rule criteria...';
        break;

      case 4: // Step 5: Recommendations
        isHuman = false;
        navRoute = null;
        notice = 'Recommendation Agent: Compiling and ranking best scholarships by match score and funding...';
        break;

      case 5: // Step 6: Selection
        isHuman = true;
        navRoute = '/dashboard/recommendations';
        humanTarget = {
          title: '🎓 Select a Scholarship',
          desc: 'All prerequisites verified. Choose your target scholarship from ranked recommendations.',
          route: '/dashboard/recommendations',
          btnText: 'Choose Scholarship →'
        };
        notice = 'Ranked recommendations ready! Routing to Recommendations to select scholarship...';
        break;

      case 6: // Step 7: Final Confirmation
        isHuman = true;
        navRoute = '/dashboard/journey';
        humanTarget = {
          title: '👤 Final Confirmation Required',
          desc: 'All documents, OCR extractions, and criteria match. Please review and confirm final submission.',
          route: '/dashboard/journey',
          btnText: 'Review & Confirm Application →'
        };
        notice = 'Application package prepared and verified. Proceeding to final review...';
        break;

      case 7: // Step 8: Submission
        isHuman = false;
        navRoute = null;
        notice = 'Submission Agent: Transmitting official application and triggering Brevo email notification...';
        break;

      case 8: // Step 9: Tracking
      default:
        isHuman = false;
        navRoute = '/dashboard/applications';
        notice = '🎉 Scholarship application submitted successfully! ScholarAI is tracking your status.';
        break;
    }

    setActiveStepIndex(stepIdx);
    setIsHumanActionRequired(isHuman);
    setHumanActionTarget(humanTarget);
    setCurrentActionNotice(notice);

    return { stepIdx, isHuman, humanTarget, notice, navRoute };
  }, []);

  // Synchronize entire state with backend
  const syncState = useCallback(async (options = {}) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setSyncing(false);
      return null;
    }

    const { triggerRun = false, scholarshipId = null, event = 'EVALUATE' } = options;
    setSyncing(true);

    try {
      if (triggerRun) {
        let runUrl = '/agent/run';
        if (scholarshipId) runUrl += `?scholarship_id=${scholarshipId}`;
        await api.post(runUrl).catch(e => console.warn('Supervisor run warning:', e));
      }

      const [stateRes, statsRes, profileRes, docsRes, appsRes] = await Promise.all([
        api.get('/agent/state').catch(() => ({ data: null })),
        api.get('/dashboard/stats').catch(() => ({ data: null })),
        api.get('/profile').catch(() => ({ data: null })),
        api.get('/documents').catch(() => ({ data: [] })),
        api.get('/applications').catch(() => ({ data: [] }))
      ]);

      const stateData = stateRes.data;
      const statsData = statsRes.data;
      const profileData = profileRes.data;
      const docsData = docsRes.data || [];
      const appsData = appsRes.data || [];

      setAgentState(stateData);
      setStats(statsData);
      setProfile(profileData);
      setDocuments(docsData);
      setApplications(appsData);

      const targetMilestone = computeTargetMilestone(stateData, profileData, docsData, appsData);

      // If on /dashboard and we haven't animated yet, start from previous animated step
      if (location.pathname === '/dashboard') {
        let startStep = lastAnimatedStepRef.current >= 0 ? lastAnimatedStepRef.current : 0;
        if (startStep > targetMilestone) startStep = targetMilestone;
        applyStepDetails(startStep, stateData, profileData);
      } else {
        applyStepDetails(targetMilestone, stateData, profileData);
        lastAnimatedStepRef.current = targetMilestone;
      }

      if (onStateChange) {
        onStateChange({ state: stateData, milestone: targetMilestone });
      }

      setLoading(false);
      setSyncing(false);
      return { stateData, targetMilestone };
    } catch (err) {
      console.error('Failed to sync supervisor state:', err);
      setLoading(false);
      setSyncing(false);
      return null;
    }
  }, [computeTargetMilestone, applyStepDetails, location.pathname, onStateChange]);

  // Initial load
  useEffect(() => {
    syncState({ triggerRun: true });
  }, [syncState]);

  // Visual Stepper & Navigation Animation Engine on /dashboard
  useEffect(() => {
    if (isPaused || loading || syncing) return;

    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setAutoNavCountdown(null);

    const isDashboard = location.pathname === '/dashboard';
    if (!isDashboard) {
      // When user is on any other sub-route (profile, documents, recommendations, journey), stop dashboard timer
      return;
    }

    const targetMilestone = computeTargetMilestone(agentState, profile, documents, applications);

    // If current visual step is behind the target milestone, step forward visibly (~1s per step)
    if (activeStepIndex < targetMilestone) {
      stepTimerRef.current = setTimeout(() => {
        const nextStep = activeStepIndex + 1;
        lastAnimatedStepRef.current = nextStep;
        applyStepDetails(nextStep, agentState, profile);
      }, stepDisplayDelayMs || 1000);
      return;
    }

    // Once at the target milestone:
    lastAnimatedStepRef.current = targetMilestone;
    const details = applyStepDetails(targetMilestone, agentState, profile);

    // If auto navigation is enabled and this milestone has a destination route, navigate
    if (enableAutoNavigation && details.navRoute && details.navRoute !== location.pathname) {
      let remainingSecs = 2;
      setAutoNavCountdown(remainingSecs);

      countdownIntervalRef.current = setInterval(() => {
        remainingSecs -= 1;
        if (remainingSecs <= 0) {
          clearInterval(countdownIntervalRef.current);
          setAutoNavCountdown(null);
        } else {
          setAutoNavCountdown(remainingSecs);
        }
      }, 1000);

      navTimerRef.current = setTimeout(() => {
        if (!isNavigatingRef.current) {
          isNavigatingRef.current = true;
          navigate(details.navRoute);
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 1000);
        }
      }, (stepDisplayDelayMs || 1000) * 2);
    }

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [
    enableAutoNavigation,
    isPaused,
    loading,
    syncing,
    activeStepIndex,
    stepDisplayDelayMs,
    agentState,
    profile,
    documents,
    applications,
    location.pathname,
    navigate,
    computeTargetMilestone,
    applyStepDetails
  ]);

  // Actions
  const selectScholarship = async (scholarshipId) => {
    setLoading(true);
    try {
      await api.post(`/agent/journey/start?scholarship_id=${scholarshipId}`);
      lastAnimatedStepRef.current = 6;
      await syncState({ triggerRun: true, scholarshipId: scholarshipId, event: 'SCHOLARSHIP_SELECTED' });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error selecting scholarship:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async (scholarshipId) => {
    if (!scholarshipId) return { success: false, message: 'No scholarship selected.' };
    setLoading(true);
    try {
      const res = await api.post(`/applications/${scholarshipId}`, { status: 'Submitted' });
      lastAnimatedStepRef.current = 9;
      await syncState({ triggerRun: true, event: 'EVALUATE' });
      navigate('/dashboard/applications');
      return res.data;
    } catch (err) {
      console.error('Submission failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetWorkflow = async () => {
    setLoading(true);
    try {
      await api.post('/agent/journey/reset');
      lastAnimatedStepRef.current = 0;
      await syncState({ triggerRun: true });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error resetting workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    steps: AUTOPILOT_STEPS,
    activeStepIndex,
    currentStep: AUTOPILOT_STEPS[activeStepIndex] || AUTOPILOT_STEPS[0],
    agentState,
    stats,
    profile,
    documents,
    applications,
    loading,
    syncing,
    autoNavCountdown,
    currentActionNotice,
    isHumanActionRequired,
    humanActionTarget,
    isPaused,
    setIsPaused,
    syncState,
    selectScholarship,
    submitApplication,
    resetWorkflow
  };
};

export default useSupervisorAutopilot;
