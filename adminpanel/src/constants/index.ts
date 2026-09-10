// =====================================================
// StudyBuddy Admin Panel — Application Constants
// =====================================================

export const APP_NAME = 'StudyBuddy Admin';
export const APP_DESCRIPTION = 'Education Platform Administration & Verification Console';

export const ROUTES = {
  DASHBOARD: '/',
  USERS: '/users',
  USER_DETAIL: (id: string | number) => `/users/${id}`,
  TUTORS: '/tutors',
  TUTOR_APPLICATIONS: '/tutors/applications',
  TUTOR_APPLICATION_REVIEW: (id: string | number) => `/tutors/applications/${id}`,
  TUTOR_PROFILE: (id: string | number) => `/tutors/${id}`,
  COURSES: '/courses',
  BUNDLES: '/bundles',
  RESOURCES: '/resources',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  LOGIN: '/login',
} as const;

export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const STATUS_COLORS = {
  active: {
    bg: 'var(--color-success-light)',
    text: 'var(--color-success-dark)',
    border: 'var(--color-success-border)',
    dot: 'var(--color-success)',
    label: 'Active',
  },
  approved: {
    bg: 'var(--color-success-light)',
    text: 'var(--color-success-dark)',
    border: 'var(--color-success-border)',
    dot: 'var(--color-success)',
    label: 'Approved',
  },
  pending: {
    bg: 'var(--color-warning-light)',
    text: 'var(--color-warning-dark)',
    border: 'var(--color-warning-border)',
    dot: 'var(--color-warning)',
    label: 'Pending Review',
  },
  suspended: {
    bg: 'var(--color-suspended-light)',
    text: 'var(--color-suspended-dark)',
    border: 'var(--color-suspended-border)',
    dot: 'var(--color-suspended)',
    label: 'Suspended',
  },
  banned: {
    bg: 'var(--color-danger-light)',
    text: 'var(--color-danger-dark)',
    border: 'var(--color-danger-border)',
    dot: 'var(--color-danger)',
    label: 'Banned',
  },
  rejected: {
    bg: 'var(--color-danger-light)',
    text: 'var(--color-danger-dark)',
    border: 'var(--color-danger-border)',
    dot: 'var(--color-danger)',
    label: 'Rejected',
  },
  unverified: {
    bg: 'var(--color-gray-100)',
    text: 'var(--color-gray-600)',
    border: 'var(--color-gray-200)',
    dot: 'var(--color-gray-400)',
    label: 'Unverified',
  },
  verified: {
    bg: 'var(--color-primary-50)',
    text: 'var(--color-primary-600)',
    border: 'var(--color-primary-200)',
    dot: 'var(--color-primary-500)',
    label: 'Verified',
  },
} as const;

export const SUSPENSION_DURATIONS = [
  { value: '1_day', label: '1 Day' },
  { value: '7_days', label: '7 Days' },
  { value: '30_days', label: '30 Days' },
  { value: 'indefinite', label: 'Indefinite' },
];
