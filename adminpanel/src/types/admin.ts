// =====================================================
// StudyBuddy Admin Panel — Core Data Models
// Aligns directly with StudyBuddy DB concepts
// =====================================================

export type UserRole = 'student' | 'tutor' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type SkillProficiency = 'beginner' | 'intermediate' | 'expert';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile_pic?: string;
  is_verified: boolean;
  created_at: string;
  last_activity?: string;
  suspension_reason?: string;
  suspension_duration?: string;
  ban_reason?: string;
  counts?: {
    enrollments?: number;
    courses?: number;
    uploadedResources?: number;
    groupMemberships?: number;
    courseReviews?: number;
  };
}

export interface TutorSkill {
  skill_id: number;
  tutor_id: number;
  skill_name: string;
  proficiency: SkillProficiency;
}

export interface TutorDocument {
  doc_id: number;
  application_id: number;
  document_url: string;
  document_type: string;
  file_name: string;
  file_size?: string;
  uploaded_at: string;
}

export interface TutorApplication {
  application_id: number;
  user_id: number;
  user: User;
  institute_name: string;
  experience_years: number;
  bio: string;
  trial_video_url: string;
  status: ApplicationStatus;
  skills: TutorSkill[];
  documents: TutorDocument[];
  admin_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  applied_at: string;
}

export interface TutorCourseItem {
  courseId: number;
  title: string;
  description?: string;
  price: number | string;
  isPublished: boolean;
  createdAt: string;
  category?: { categoryId: number; name: string };
  enrollmentCount?: number;
  ratingAverage?: number;
  reviewCount?: number;
}

export interface TutorResourceItem {
  resourceId: number;
  filename: string;
  fileType: string;
  fileUrl?: string;
  price: number | string;
  isLocked: boolean;
  status: string;
  createdAt: string;
  categoryName?: string;
  courseTitle?: string;
}

export interface TutorBundleItem {
  bundleId: number;
  title: string;
  description?: string;
  price: number | string;
  isPublished: boolean;
  createdAt: string;
  bundleItems?: Array<{
    resource?: {
      resourceId: number;
      filename: string;
      fileType: string;
      price: number | string;
    };
  }>;
}

export interface TutorEarningsData {
  totalEarned: number;
  totalEarnings: number;
  currentBalance: number;
  availableBalance: number;
  pendingPayout: number;
  pendingEarnings: number;
  completedEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  nextPayoutDate?: string;
  transactions?: Array<{
    id?: number;
    paymentId?: number;
    orderId?: string;
    amount: number | string;
    grossAmount?: number | string;
    netAmount?: number | string;
    platformFee?: number | string;
    status: string;
    paidAt?: string;
    date?: string;
    createdAt?: string;
    buyerName?: string;
    resourceTitle?: string;
    student?: { id: number; name: string; email: string };
    course?: { courseId: number; title: string };
    resource?: { resourceId: number; filename: string };
    bundle?: { bundleId: number; title: string };
  }>;
}

export interface TutorProfile {
  profile_id: number;
  tutor_id: number;
  user: User;
  bio: string;
  institute_name: string;
  experience_years: number;
  skills: TutorSkill[];
  application_id: number;
  application_status: ApplicationStatus;
  is_verified: boolean;
  average_rating: number;
  review_count: number;
  student_count: number;
  created_at: string;
  courses?: TutorCourseItem[];
  resources?: TutorResourceItem[];
  bundles?: TutorBundleItem[];
  earnings?: TutorEarningsData;
}

export interface ActivityLogItem {
  id: number;
  user_name: string;
  user_avatar?: string;
  user_email?: string;
  action_type: 
    | 'user_registered' 
    | 'application_submitted' 
    | 'application_approved' 
    | 'application_rejected' 
    | 'user_suspended' 
    | 'user_reactivated' 
    | 'user_banned';
  description: string;
  timestamp: string;
  status: 'info' | 'success' | 'warning' | 'danger';
}

export interface DashboardKPICard {
  id: string;
  title: string;
  metric: number | string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  comparisonText: string;
  statusType: 'neutral' | 'success' | 'warning' | 'danger' | 'suspended';
  icon: string;
}

export interface DashboardMetrics {
  total_users: number;
  active_users: number;
  suspended_users: number;
  banned_users: number;
  total_tutors: number;
  pending_applications: number;
  approved_tutors: number;
  rejected_applications: number;
}

export interface UserGrowthDataPoint {
  date: string;
  students: number;
  tutors: number;
  total: number;
}

export interface DistributionDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface UserFilterParams {
  search?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  is_verified?: 'all' | 'verified' | 'unverified';
  sort_by?: 'name' | 'email' | 'created_at' | 'last_activity';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TutorFilterParams {
  search?: string;
  application_status?: ApplicationStatus | 'all';
  account_status?: UserStatus | 'all';
  is_verified?: 'all' | 'verified' | 'unverified';
  sort_by?: 'name' | 'experience' | 'applied_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'application' | 'user_status' | 'system';
  link?: string;
}
