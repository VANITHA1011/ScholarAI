// Recognized legitimate Internet Top-Level Domains (TLDs)
const VALID_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'in', 'co', 'io', 'ai', 'dev', 'app',
  'info', 'biz', 'tech', 'online', 'site', 'me', 'us', 'uk', 'ca', 'au', 'de', 'fr',
  'ac', 'xyz', 'global', 'link', 'cloud', 'club', 'pro', 'live', 'store', 'agency',
  'space', 'website', 'digital', 'world', 'network', 'media', 'center', 'international'
]);

// Well-known email providers and their allowed domains
const KNOWN_PROVIDERS = {
  gmail: ['gmail.com', 'gmail.co.in', 'gmail.in'],
  yahoo: ['yahoo.com', 'yahoo.co.in', 'yahoo.in', 'yahoo.co.uk'],
  outlook: ['outlook.com', 'outlook.in'],
  hotmail: ['hotmail.com', 'hotmail.co.uk'],
  icloud: ['icloud.com'],
  rediffmail: ['rediffmail.com'],
  zoho: ['zoho.com', 'zoho.in'],
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return 'Email address is required';
  }

  const trimmed = email.trim().toLowerCase();

  // Check general length
  if (trimmed.length > 254) {
    return 'Email address is too long';
  }

  // Check basic email structure (username@domain)
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return 'Please enter a valid email address (e.g. name@gmail.com)';
  }

  const [username, fullDomain] = parts;

  // Validate username
  if (!username || username.length < 1) {
    return 'Email username is required before "@"';
  }

  if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
    return 'Email username cannot start, end, or contain consecutive dots';
  }

  if (!/^[a-z0-9._%+-]+$/.test(username)) {
    return 'Email username contains invalid characters';
  }

  // Validate domain
  if (!fullDomain || fullDomain.length < 3) {
    return 'Email domain is incomplete (e.g. @gmail.com)';
  }

  if (fullDomain.startsWith('.') || fullDomain.endsWith('.') || fullDomain.includes('..') || fullDomain.includes('-.')) {
    return 'Invalid domain format';
  }

  const domainLabels = fullDomain.split('.');
  if (domainLabels.length < 2) {
    return 'Email must end with a valid domain extension like .com, .edu, or .in';
  }

  // Check provider-specific typos (e.g. user typed "gmail.comgttfy" or "gmail.cm")
  const providerName = domainLabels[0];
  if (KNOWN_PROVIDERS[providerName]) {
    const allowed = KNOWN_PROVIDERS[providerName];
    if (!allowed.includes(fullDomain)) {
      return `Invalid domain "@${fullDomain}". Did you mean "@${allowed[0]}"?`;
    }
  }

  // Check each domain label
  for (let i = 0; i < domainLabels.length; i++) {
    const label = domainLabels[i];
    if (!label || label.length === 0) {
      return 'Domain contains an empty segment';
    }
    if (!/^[a-z0-9-]+$/.test(label)) {
      return 'Domain contains invalid characters';
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return 'Domain segments cannot start or end with a hyphen';
    }
  }

  // Validate final TLD against recognized legitimate extensions
  const tld = domainLabels[domainLabels.length - 1];
  if (!VALID_TLDS.has(tld)) {
    // If it's a 2-letter country code (e.g. .in, .uk, .sg), allow it
    if (!/^[a-z]{2}$/.test(tld)) {
      return `Invalid domain extension ".${tld}". Please use a valid extension like .com, .edu, or .in`;
    }
  }

  return '';
};

export const validateFullName = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Full name is required';
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return 'Full name must be at least 2 characters';
  }
  if (trimmed.length > 70) {
    return 'Full name is too long (maximum 70 characters)';
  }
  // Allow letters, spaces, dots, hyphens, and apostrophes
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return 'Name can only contain alphabetic letters and spaces';
  }
  return '';
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'None', color: 'bg-slate-300' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 0:
    case 1:
      return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    case 2:
      return { score: 50, label: 'Medium', color: 'bg-amber-500' };
    case 3:
      return { score: 75, label: 'Strong', color: 'bg-sky-500' };
    case 4:
    default:
      return { score: 100, label: 'Very Strong', color: 'bg-emerald-500' };
  }
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
  if (!/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one number or special character';
  }
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  const clean = phone.replace(/[- )(]/g, '');
  if (!/^[6-9][0-9]{9}$/.test(clean)) {
    return 'Please enter a valid 10-digit mobile number';
  }
  return '';
};

export const validateCGPA = (cgpa) => {
  if (!cgpa && cgpa !== 0) return 'CGPA is required';
  const score = parseFloat(cgpa);
  if (isNaN(score) || score < 0 || score > 10) return 'CGPA must be a number between 0 and 10';
  return '';
};
