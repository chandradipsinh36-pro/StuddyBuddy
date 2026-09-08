// =====================================================
// Application-wide constants
// =====================================================

export const MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true';

export const APP_NAME = 'StudyBuddy';
export const APP_TAGLINE = 'Making quality education accessible, safe & trustworthy for everyone.';

export const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English', 'History', 'Geography',
  'Economics', 'Accounting', 'Business Studies', 'Psychology',
  'Philosophy', 'Art', 'Music', 'Physical Education',
];

export const CATEGORIES = [
  'Study Notes', 'Practice Tests', 'Video Lectures', 'Worksheets',
  'Past Papers', 'Revision Guides', 'Project Templates', 'Reference Materials',
];

export const RESOURCE_TYPES = [
  { value: 'pdf',        label: 'PDF Document' },
  { value: 'image',      label: 'Image' },
  { value: 'ppt',        label: 'Presentation' },
  { value: 'audio',      label: 'Audio' },
  { value: 'youtube',    label: 'YouTube Video' },
  { value: 'test_paper', label: 'Test Paper' },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
] as const;

export const REVIEW_TAGS = [
  'Clear explanation', 'Well organized', 'Good examples',
  'Comprehensive', 'Easy to follow', 'Engaging content',
  'Highly recommended', 'Great value',
];

export const AI_FREE_LIMIT = 5;

export const MAX_FILE_SIZES: Record<string, number> = {
  pdf:   50 * 1024 * 1024,   // 50MB
  image: 10 * 1024 * 1024,   // 10MB
  ppt:   50 * 1024 * 1024,   // 50MB
  audio: 100 * 1024 * 1024,  // 100MB
  video: 500 * 1024 * 1024,  // 500MB (trial video)
};

export const ACCEPTED_FILE_TYPES: Record<string, string> = {
  pdf:   '.pdf',
  image: '.jpg,.jpeg,.png,.webp,.gif',
  ppt:   '.ppt,.pptx',
  audio: '.mp3,.wav,.ogg,.m4a',
  video: '.mp4,.mov,.webm',
};

export const PLATFORM_FEE_PERCENT = 15;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  EXPLORE: '/explore',
  TUTORS: '/tutors',
  TUTOR_PROFILE: (id: string | number) => `/tutors/${id}`,
  COURSES: '/courses',
  COURSE_DETAIL: (id: string | number) => `/courses/${id}`,
  RESOURCES: '/resources',
  RESOURCE_DETAIL: (id: string | number) => `/resources/${id}`,
  PLAYLISTS: '/playlists',
  PLAYLIST_DETAIL: (id: string | number) => `/playlists/${id}`,
  STUDY_GROUPS: '/study-groups',
  STUDY_GROUP_DETAIL: (id: string | number) => `/study-groups/${id}`,
  // Student
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_SETTINGS: '/student/settings',
  STUDENT_PURCHASES: '/student/purchases',
  STUDENT_SAVED: '/student/saved',
  STUDENT_REVIEWS: '/student/reviews',
  AI: '/ai',
  // Tutor
  TUTOR_DASHBOARD: '/tutor/dashboard',
  TUTOR_ONBOARDING: '/tutor/onboarding',
  TUTOR_PROFILE_EDIT: '/tutor/profile',
  TUTOR_COURSES: '/tutor/courses',
  TUTOR_COURSE_CREATE: '/tutor/courses/create',
  TUTOR_COURSE_EDIT: (id: string | number) => `/tutor/courses/${id}/edit`,
  TUTOR_RESOURCES: '/tutor/resources',
  TUTOR_RESOURCE_CREATE: '/tutor/resources/create',
  TUTOR_RESOURCE_EDIT: (id: string | number) => `/tutor/resources/${id}/edit`,
  TUTOR_PLAYLISTS: '/tutor/playlists',
  TUTOR_PLAYLIST_CREATE: '/tutor/playlists/create',
  TUTOR_BUNDLES: '/tutor/bundles',
  TUTOR_BUNDLE_CREATE: '/tutor/bundles/create',
  TUTOR_EARNINGS: '/tutor/earnings',
  TUTOR_ANALYTICS: '/tutor/analytics',
  TUTOR_REVIEWS: '/tutor/reviews',
  TUTOR_SETTINGS: '/tutor/settings',
} as const;
