/**
 * Scholarship Journey Service
 * Single source of truth for computing the 9-step automated student scholarship journey.
 */

export const JOURNEY_STEPS = [
  {
    id: 'PROFILE',
    stepNumber: 1,
    title: 'Complete Profile',
    shortName: 'Profile',
    agentName: 'Profile Agent',
    description: 'Fill in academic, personal, and required eligibility details.',
    route: '/dashboard/profile',
    actionText: 'Complete Profile →',
    iconName: 'User'
  },
  {
    id: 'REQUIRED_DOCUMENTS',
    stepNumber: 2,
    title: 'Required Documents',
    shortName: 'Requirements',
    agentName: 'Required Document Agent',
    description: "Identify the certificates and documents required for the student's scholarship eligibility.",
    route: '/dashboard/documents',
    actionText: 'View Required Documents →',
    iconName: 'FileSearch'
  },
  {
    id: 'DOCUMENT_UPLOAD',
    stepNumber: 3,
    title: 'Upload Documents',
    shortName: 'Upload',
    agentName: 'Document Ingestion Agent',
    description: 'Upload certificates and supporting documents for verification.',
    route: '/dashboard/documents',
    actionText: 'Upload Documents →',
    iconName: 'Upload'
  },
  {
    id: 'DOCUMENT_VERIFICATION',
    stepNumber: 4,
    title: 'Document Verification',
    shortName: 'Verification',
    agentName: 'Verification Agent',
    description: "Run OCR and verify uploaded documents against the student's profile.",
    route: '/dashboard/documents',
    actionText: 'Review Verification →',
    iconName: 'ShieldCheck'
  },
  {
    id: 'SCHOLARSHIP_MATCHING',
    stepNumber: 5,
    title: 'Scholarship Matching',
    shortName: 'Matching',
    agentName: 'Matching Agent',
    description: 'Analyze the verified profile and find matching scholarships.',
    route: '/dashboard/eligibility',
    actionText: 'Find Matching Scholarships →',
    iconName: 'Brain'
  },
  {
    id: 'REVIEW_SCHOLARSHIP',
    stepNumber: 6,
    title: 'Review Scholarship',
    shortName: 'Review',
    agentName: 'Scholarship Review Agent',
    description: 'Review scholarship eligibility, requirements, deadline, and matching details.',
    route: '/dashboard/recommendations',
    actionText: 'Review Scholarships →',
    iconName: 'Award'
  },
  {
    id: 'MISSING_DOCUMENTS',
    stepNumber: 7,
    title: 'Complete Missing Documents',
    shortName: 'Missing Docs',
    agentName: 'Required Document Agent',
    description: 'Identify and complete any remaining required documents.',
    route: '/dashboard/documents',
    actionText: 'Check Missing Documents →',
    iconName: 'FileText'
  },
  {
    id: 'PREPARE_APPLICATION',
    stepNumber: 8,
    title: 'Prepare Application',
    shortName: 'Prepare',
    agentName: 'Application Agent',
    description: 'Automatically prepare the scholarship application using verified information.',
    route: '/dashboard/journey',
    actionText: 'Prepare Application →',
    iconName: 'Cpu'
  },
  {
    id: 'SUBMIT_APPLICATION',
    stepNumber: 9,
    title: 'Submit Application',
    shortName: 'Submit',
    agentName: 'Application Agent',
    description: 'Review the final application and explicitly confirm before submission.',
    route: '/dashboard/journey',
    actionText: 'Review & Submit Application →',
    iconName: 'Send'
  }
];

export const MANDATORY_DOC_DEFINITIONS = [
  {
    type: 'aadhaar',
    name: 'Aadhaar Card / Student ID',
    reason: 'Required for student identity and nationality verification.',
    howToObtain: 'Download e-Aadhaar from the official UIDAI portal (myaadhaar.uidai.gov.in) or scan your original ID card.'
  },
  {
    type: 'tenth',
    name: '10th Standard Marksheet',
    reason: 'Required to verify date of birth, identity name, and foundational academic marks.',
    howToObtain: 'Obtain from your state education board portal (e.g. dge.tn.gov.in / cbse.gov.in) or school administration.'
  },
  {
    type: 'twelfth',
    name: '12th Standard Marksheet',
    reason: 'Required to verify qualifying academic scores and eligibility cutoffs.',
    howToObtain: 'Obtain from your higher secondary board portal or college admissions file.'
  },
  {
    type: 'college',
    name: 'College ID / Bonafide Certificate',
    reason: 'Verifies current regular student enrollment, department, and academic year.',
    howToObtain: 'Obtain from your college administrative office or student portal.'
  },
  {
    type: 'income',
    name: 'Income Certificate',
    reason: 'Required for means-based scholarships with annual family income ceilings.',
    howToObtain: 'Apply and download via your State Revenue e-Sevai portal or local Tahsildar office.'
  },
  {
    type: 'community',
    name: 'Community / Caste Certificate',
    reason: 'Required for reserved category criteria (OBC, SC, ST, MBC, DNC, Minority).',
    howToObtain: 'Obtain through the official state e-District portal or Revenue Department.'
  },
  {
    type: 'disability',
    name: 'Disability Certificate (UDID)',
    reason: 'Mandatory only for Divyangjan / PwD scholarship reservations.',
    howToObtain: 'Issued by the District Medical Board via the Unique Disability ID portal (swavlambancard.gov.in).'
  },
  {
    type: 'sportsQuota',
    name: 'Sports Quota Certificate',
    reason: 'Required to claim sports reservation quotas & awards (District, State, National level).',
    howToObtain: 'Issued by SDAT, SGFI, Association or State Olympic Body.'
  },
  {
    type: 'firstGraduate',
    name: 'First Graduate Certificate',
    reason: 'Required for first-generation college graduate fee concessions and grants.',
    howToObtain: 'Issued by the Revenue Department / Tahsildar via e-Sevai portal.'
  },
  {
    type: 'ncc',
    name: 'NCC Certificate',
    reason: 'Required for NCC cadet preference, state youth grants & special admissions.',
    howToObtain: 'Issued by the Directorate General NCC / Commanding Officer.'
  },
  {
    type: 'nss',
    name: 'NSS Certificate',
    reason: 'Required for NSS volunteer reservation and community service excellence awards.',
    howToObtain: 'Issued by the NSS Programme Coordinator & University.'
  },
  {
    type: 'minority',
    name: 'Minority Certificate',
    reason: 'Required for religious and linguistic minority welfare scholarships.',
    howToObtain: 'Issued by the Revenue Divisional Officer / Tahsildar.'
  }
];

/**
 * Deterministically compute the student's journey state from live data.
 */
export const calculateJourneyState = ({
  profile,
  documents = [],
  scholarships = [],
  applications = [],
  agentState = null,
  ocrData = null
}) => {
  // 1. Profile Completeness Evaluation
  const requiredFields = ['fullName', 'gender', 'age', 'state', 'annualIncome', 'category', 'degree', 'cgpa', 'tenthMarks', 'twelfthMarks'];
  const missingFields = [];
  const completedFields = [];

  if (!profile) {
    missingFields.push('All profile details');
  } else {
    if (!profile.fullName && !profile.name) missingFields.push('Full Name'); else completedFields.push('Full Name');
    if (!profile.gender) missingFields.push('Gender'); else completedFields.push('Gender');
    if (!profile.age && profile.age !== 0) missingFields.push('Age'); else completedFields.push('Age');
    if (!profile.state) missingFields.push('State Domicile'); else completedFields.push('State Domicile');
    if (profile.annualIncome === null || profile.annualIncome === undefined || profile.annualIncome === '') missingFields.push('Annual Family Income'); else completedFields.push('Annual Family Income');
    if (!profile.category) missingFields.push('Category / Caste'); else completedFields.push('Category / Caste');
    if (!profile.degree) missingFields.push('Degree / Course'); else completedFields.push('Degree / Course');
    if (!profile.cgpa && profile.cgpa !== 0) missingFields.push('Current CGPA'); else completedFields.push('Current CGPA');

    const hasTenth = (profile.tenthPercentage !== null && profile.tenthPercentage !== undefined && profile.tenthPercentage !== '') ||
                     (profile.tenthMarks !== null && profile.tenthMarks !== undefined && profile.tenthMarks !== '');
    if (!hasTenth) missingFields.push('10th Marks'); else completedFields.push('10th Marks');

    const hasTwelfth = (profile.twelfthPercentage !== null && profile.twelfthPercentage !== undefined && profile.twelfthPercentage !== '') ||
                       (profile.twelfthMarks !== null && profile.twelfthMarks !== undefined && profile.twelfthMarks !== '');
    if (!hasTwelfth) missingFields.push('12th Marks'); else completedFields.push('12th Marks');
  }

  const calculatedPercent = profile ? Math.max(0, Math.min(100, Math.round((completedFields.length / requiredFields.length) * 100))) : 0;
  const profileCompletion = (profile?.completionScore !== undefined && profile?.completionScore !== null)
    ? Math.max(calculatedPercent, Number(profile.completionScore))
    : calculatedPercent;
  const isProfileComplete = profileCompletion >= 80 && completedFields.length >= 7;

  // 2. Documents Evaluation
  const normalizeDocKey = (k) => {
    if (!k) return '';
    const s = String(k).toLowerCase().replace(/[_\-\s]/g, '');
    if (s === 'sports' || s === 'sportsquota') return 'sportsquota';
    if (s === 'firstgraduate' || s === 'firstgrad') return 'firstgraduate';
    if (s === 'disability' || s === 'pwd' || s === 'physicallychallenged') return 'disability';
    if (s === 'college' || s === 'bonafide' || s === 'collegeid') return 'college';
    if (s === 'tenth' || s === '10th' || s === 'tenthmarksheet') return 'tenth';
    if (s === 'twelfth' || s === '12th' || s === 'twelfthmarksheet') return 'twelfth';
    return s;
  };

  const docsList = Array.isArray(documents) ? documents : [];
  const docsByType = {};
  docsList.forEach(d => {
    if (d && d.document_type) {
      const raw = String(d.document_type);
      const lower = raw.toLowerCase();
      const norm = normalizeDocKey(raw);
      docsByType[raw] = d;
      docsByType[lower] = d;
      docsByType[norm] = d;
    }
  });

  // Determine needed documents based on profile
  const requiredDocTypes = ['aadhaar', 'tenth', 'twelfth', 'college'];
  if (profile?.annualIncome && Number(profile.annualIncome) < 800000) {
    requiredDocTypes.push('income');
  }
  if (profile?.category && !['general', 'oc', 'open', 'all'].includes(String(profile.category).toLowerCase())) {
    requiredDocTypes.push('community');
  }
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

  if (hasDisability) requiredDocTypes.push('disability');
  if (hasSportsQuota) requiredDocTypes.push('sportsQuota');
  if (hasFirstGraduate) requiredDocTypes.push('firstGraduate');
  if (hasNcc) requiredDocTypes.push('ncc');
  if (hasNss) requiredDocTypes.push('nss');
  if (hasMinority) requiredDocTypes.push('minority');

  const requiredDocuments = requiredDocTypes.map(type => {
    const def = MANDATORY_DOC_DEFINITIONS.find(d => d.type === type || normalizeDocKey(d.type) === normalizeDocKey(type)) || {
      type,
      name: `${type.toUpperCase()} Certificate`,
      reason: 'Required for scholarship verification.',
      howToObtain: 'Obtain from your official educational institution or government portal.'
    };

    const uploadedDoc =
      docsByType[type] ||
      docsByType[type.toLowerCase()] ||
      docsByType[normalizeDocKey(type)];
    let status = 'Missing';
    let isVerified = false;

    if (uploadedDoc) {
      const docStatus = String(uploadedDoc.status || '').toUpperCase();
      if (['VERIFIED', 'VALID', 'READY'].includes(docStatus)) {
        status = 'Verified';
        isVerified = true;
      } else if (['MISMATCH', 'CORRECTION_REQUIRED'].includes(docStatus)) {
        status = 'Mismatch';
      } else if (['OCR_FAILED', 'REJECTED'].includes(docStatus)) {
        status = 'Rejected';
      } else {
        status = 'Uploaded';
      }
    }

    return {
      ...def,
      status,
      isVerified,
      uploadedDoc,
      fileUrl: uploadedDoc?.file_path || uploadedDoc?.fileUrl || null
    };
  });

  const missingDocs = requiredDocuments.filter(d => d.status === 'Missing');
  const uploadedDocs = requiredDocuments.filter(d => d.status !== 'Missing');
  const verifiedDocs = requiredDocuments.filter(d => d.status === 'Verified');
  const mismatchDocs = requiredDocuments.filter(d => d.status === 'Mismatch');
  const hasMismatches = mismatchDocs.length > 0 || (agentState?.mismatches && agentState.mismatches.length > 0);

  const areAllRequiredUploaded = missingDocs.length === 0;
  const areAllRequiredVerified = areAllRequiredUploaded && verifiedDocs.length >= requiredDocuments.length && !hasMismatches;

  // 3. Eligibility & Recommendations Evaluation
  const schList = Array.isArray(scholarships) ? scholarships : [];
  const eligibleSchs = schList.filter(s => s.eligible || s.status === 'Eligible' || s.status === 'Partially Eligible');
  const eligibleCount = eligibleSchs.length;

  // 4. Applications Evaluation
  const appsList = Array.isArray(applications) ? applications : [];
  const submittedApps = appsList.filter(a => String(a.status || '').toUpperCase() === 'SUBMITTED');
  const hasSubmittedApp = submittedApps.length > 0;
  const submittedSchIds = new Set(submittedApps.map(a => Number(a.scholarship_id)));

  const selectedScholarshipId = agentState?.scholarship_id || (appsList.length > 0 ? appsList[0].scholarship_id : null);
  const selectedScholarship = schList.find(s => Number(s.id) === Number(selectedScholarshipId)) || null;
  const isSelectedSubmitted = selectedScholarshipId && submittedSchIds.has(Number(selectedScholarshipId));

  // ─────────────────────────────────────────────────────────────
  // 5. Compute Active Step (1 to 9)
  // ─────────────────────────────────────────────────────────────
  let stepIndex = 0; // 0 = Profile (Step 1), 8 = Tracking (Step 9)
  let nextAction = null;
  let blockedReason = null;

  if (!isProfileComplete) {
    // Step 1: Profile
    stepIndex = 0;
    nextAction = {
      title: 'Complete your student profile',
      description: 'Fill in your academic and socio-economic details to calculate scholarship eligibility.',
      buttonText: 'Complete Profile →',
      route: '/dashboard/profile',
      badge: `${profileCompletion}% Complete`,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      iconName: 'User'
    };
    if (missingFields.length > 0) {
      blockedReason = `Missing required fields: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`;
    }
  } else if (uploadedDocs.length === 0) {
    // Step 2: Required Documents
    stepIndex = 1;
    nextAction = {
      title: 'Review your required documents',
      description: `Based on your profile, ScholarAI identified ${requiredDocuments.length} mandatory documents needed for verification.`,
      buttonText: 'View Required Documents →',
      route: '/dashboard/documents',
      badge: `${requiredDocuments.length} Documents Required`,
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
      iconName: 'FileSearch'
    };
  } else if (!areAllRequiredUploaded) {
    // Step 3: Document Upload
    stepIndex = 2;
    nextAction = {
      title: `Upload missing documents (${missingDocs.length} remaining)`,
      description: `Please upload: ${missingDocs.map(d => d.name).join(', ')}.`,
      buttonText: 'Upload Documents →',
      route: '/dashboard/documents',
      badge: `${missingDocs.length} Missing`,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
      iconName: 'Upload'
    };
  } else if (!areAllRequiredVerified || hasMismatches) {
    // Step 4: Verification
    stepIndex = 3;
    if (hasMismatches) {
      blockedReason = 'Verification Agent flagged discrepancies between certificate OCR and profile data.';
      nextAction = {
        title: 'Review document discrepancies',
        description: 'One or more extracted fields do not match your profile details. Review and resolve mismatches.',
        buttonText: 'Review Discrepancies →',
        route: '/dashboard/eligibility',
        badge: 'Discrepancy Found',
        badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        iconName: 'AlertTriangle'
      };
    } else {
      nextAction = {
        title: 'Document verification in progress',
        description: 'Certificates are uploaded. Confirm OCR extraction matches before running eligibility rules.',
        buttonText: 'Review Verification →',
        route: '/dashboard/documents',
        badge: 'OCR Processing',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
        iconName: 'ShieldCheck'
      };
    }
  } else if (eligibleCount === 0 && schList.length === 0) {
    // Step 5: Scholarship Matching
    stepIndex = 4;
    nextAction = {
      title: 'Run scholarship matching',
      description: 'Analyze verified student profile against government and private scholarship databases.',
      buttonText: 'Match Scholarships →',
      route: '/dashboard/eligibility',
      badge: 'Ready for Analysis',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      iconName: 'Brain'
    };
  } else if (!selectedScholarshipId) {
    // Step 6: Review Scholarship
    stepIndex = 5;
    nextAction = {
      title: `Review matching scholarships (${eligibleCount || schList.length} matches)`,
      description: 'Review scholarship eligibility, requirements, deadline, and matching details.',
      buttonText: 'Review Scholarships →',
      route: '/dashboard/recommendations',
      badge: `${eligibleCount || schList.length} Matches Ready`,
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
      iconName: 'Award'
    };
  } else {
    // A target scholarship is selected
    const hasMissingDocs = missingDocs.length > 0 || (agentState?.missing_documents && agentState.missing_documents.length > 0);
    const isAppPrepared = (typeof window !== 'undefined' && window.localStorage?.getItem(`scholarverse_app_prepared_${selectedScholarshipId}`) === 'true') || hasSubmittedApp;

    if (hasMissingDocs) {
      // Step 7: Complete Missing Documents
      stepIndex = 6;
      nextAction = {
        title: `Complete remaining documents (${missingDocs.length} missing)`,
        description: 'Identify and complete any remaining required documents.',
        buttonText: 'Complete Missing Documents →',
        route: '/dashboard/documents',
        badge: `${missingDocs.length} Documents Missing`,
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        iconName: 'FileText'
      };
    } else if (!isAppPrepared && !hasSubmittedApp) {
      // Step 8: Prepare Application
      stepIndex = 7;
      nextAction = {
        title: `Prepare application for ${selectedScholarship?.scholarship_name || 'selected scholarship'}`,
        description: 'Automatically prepare the scholarship application using verified information.',
        buttonText: 'Prepare Application →',
        route: '/dashboard/journey',
        badge: 'Ready to Prepare',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
        iconName: 'Cpu'
      };
    } else if (!hasSubmittedApp) {
      // Step 9: Submit Application
      stepIndex = 8;
      nextAction = {
        title: `Review & submit application for ${selectedScholarship?.scholarship_name || 'selected scholarship'}`,
        description: 'Review the final application and explicitly confirm before submission.',
        buttonText: 'Review & Submit Application',
        route: '/dashboard/journey',
        badge: 'Ready for Submission',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        iconName: 'Send'
      };
    } else {
      // Application Submitted (All 9 steps completed)
      stepIndex = 8;
      nextAction = {
        title: 'Application submitted & under committee review',
        description: `Your application for "${submittedApps[0]?.scholarship?.scholarship_name || selectedScholarship?.scholarship_name || 'Scholarship'}" has been transmitted.`,
        buttonText: 'Track Application →',
        route: '/dashboard/applications',
        badge: 'Submitted & Under Review',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        iconName: 'Clock'
      };
    }
  }

  const currentStep = JOURNEY_STEPS[stepIndex];
  // Calculate percentage: Step 1 = 11%, Step 9 (submitted) = 100%
  const progressPercentage = hasSubmittedApp ? 100 : Math.round(((stepIndex + 1) / JOURNEY_STEPS.length) * 100);

  const completedSteps = hasSubmittedApp
    ? JOURNEY_STEPS.map(s => s.id)
    : JOURNEY_STEPS.slice(0, stepIndex).map(s => s.id);
  const pendingSteps = hasSubmittedApp
    ? []
    : JOURNEY_STEPS.slice(stepIndex + 1).map(s => s.id);

  return {
    currentStep,
    stepIndex,
    stepNumber: stepIndex + 1,
    totalSteps: JOURNEY_STEPS.length,
    progressPercentage,
    completedSteps,
    pendingSteps,
    nextAction,
    blockedReason,
    profileStatus: {
      completionPercentage: profileCompletion,
      missingFields,
      completedFields,
      isComplete: isProfileComplete
    },
    requiredDocuments,
    documentStatus: {
      totalRequired: requiredDocuments.length,
      uploadedCount: uploadedDocs.length,
      verifiedCount: verifiedDocs.length,
      missingCount: missingDocs.length,
      hasMismatches
    },
    eligibilityStatus: {
      eligibleCount,
      totalScholarships: schList.length || 54
    },
    applicationStatus: {
      hasSubmittedApp,
      submittedCount: submittedApps.length,
      latestApplication: submittedApps[0] || null,
      selectedScholarshipId,
      selectedScholarship
    }
  };
};
