/**
 * Curated Predefined Professions Catalog & Validation for Irookee
 */

export const PREDEFINED_PROFESSIONS: readonly string[] = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile App Developer',
  'DevOps Engineer',
  'Cloud Architect',
  'Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'AI / Prompt Engineer',
  'Cybersecurity Specialist',
  'UI/UX Designer',
  'Product Designer',
  'Product Manager',
  'Engineering Manager',
  'Solutions Architect',
  'QA / Test Automation Engineer',
  'Startup Founder',
  'Startup Mentor',
  'Financial Analyst',
  'Investment Advisor',
  'Chartered Accountant',
  'Tax Consultant',
  'Legal Consultant / Attorney',
  'Corporate Lawyer',
  'Marketing Strategist',
  'Digital Marketing Consultant',
  'Content Creator',
  'Brand Strategist',
  'SEO / SEM Specialist',
  'Career Coach',
  'Executive Coach',
  'Life Coach',
  'Fitness Coach / Personal Trainer',
  'Nutritionist / Dietitian',
  'Mental Health Counselor',
  'Education & Study Abroad Consultant',
  'Immigration Consultant',
  'HR & Talent Acquisition Consultant',
  'Sales & Business Development Lead',
  'Public Relations (PR) Specialist',
  'Blockchain & Web3 Specialist',
] as const;

export const OTHER_PROFESSION_VALUE = '+ Other';

export interface ProfessionValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

/**
 * Filter predefined professions case-insensitively with partial matching
 */
export function filterProfessions(query: string, list: readonly string[] = PREDEFINED_PROFESSIONS): string[] {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return [...list];
  }
  return list.filter((p) => p.toLowerCase().includes(normalizedQuery));
}

/**
 * Validate custom profession input
 */
export function validateCustomProfession(input: string): ProfessionValidationResult {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Profession must be text' };
  }

  const trimmed = input.trim();

  if (!trimmed || trimmed.length === 0) {
    return { isValid: false, error: 'Please enter your profession' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Profession must be at least 2 characters long' };
  }

  if (trimmed.length > 80) {
    return { isValid: false, error: 'Profession must not exceed 80 characters' };
  }

  // Reject numeric-only
  if (/^[0-9\s\-_, .()]+$/.test(trimmed)) {
    return { isValid: false, error: 'Profession cannot be numeric only' };
  }

  // Reject dangerous characters/code symbols
  if (/[<>={}[\]/\\^%$@#*~`|]/.test(trimmed)) {
    return { isValid: false, error: 'Profession contains invalid symbols' };
  }

  // Reject excessive whitespace within string
  const sanitized = trimmed.replace(/\s+/g, ' ');

  return {
    isValid: true,
    sanitizedValue: sanitized,
  };
}
