/** Founder's Repository — dropdown values aligned with backend */

export const FOUNDER_INDUSTRIES = [
  'Fintech',
  'Edtech',
  'Healthtech',
  'Agritech',
  'Logistics',
  'E-commerce',
  'Media & Content',
  'Climate Tech',
  'SaaS/B2B',
  'AI/ML',
  'Hardware',
  'Other',
] as const;

export const FOUNDER_STAGES = [
  { value: 'idea', label: 'Idea' },
  { value: 'pre-mvp', label: 'Pre-MVP' },
  { value: 'mvp', label: 'MVP' },
  { value: 'early-traction', label: 'Early Traction' },
  { value: 'growth', label: 'Growth' },
  { value: 'scaling', label: 'Scaling' },
] as const;

export const FOUNDER_REGIONS = [
  'Niger Delta',
  'South-South',
  'South-East',
  'South-West',
  'North-Central',
  'North-East',
  'North-West',
] as const;

/** Nigerian states grouped by macro-region (brief: state filtered by region) */
export const FOUNDER_STATES_BY_REGION: Record<string, string[]> = {
  'Niger Delta': [
    'Akwa Ibom',
    'Bayelsa',
    'Cross River',
    'Delta',
    'Edo',
    'Rivers',
  ],
  'South-South': [
    'Akwa Ibom',
    'Bayelsa',
    'Cross River',
    'Delta',
    'Edo',
    'Rivers',
  ],
  'South-East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
  'South-West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo'],
  'North-Central': ['Benue', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau', 'FCT'],
  'North-East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
  'North-West': ['Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara'],
};

export const FOUNDER_FUNDING_STAGES = [
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b-plus', label: 'Series B+' },
] as const;

export type FounderRecord = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  profile_photo_url?: string | null;
  linkedin_url?: string | null;
  twitter_handle?: string | null;
  startup_name: string;
  startup_website?: string | null;
  startup_logo_url?: string | null;
  industry: string[];
  stage: string;
  region: string;
  state: string;
  year_founded: number;
  one_liner: string;
  what_building: string;
  problem_solving: string;
  is_funded: 'yes' | 'no' | 'bootstrapped';
  funding_stage?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  slug?: string | null;
  rejection_reason?: string | null;
  approved_at?: unknown;
  created_at?: unknown;
};
