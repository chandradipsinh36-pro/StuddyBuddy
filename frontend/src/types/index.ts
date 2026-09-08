// =====================================================
// StudyBuddy — Core TypeScript Types
// Aligned with actual backend API responses (Prisma schema)
// =====================================================

// ---- Enums ----

export type UserRole = 'student' | 'tutor';

export type TutorApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type ResourceType =
  | 'pdf'
  | 'image'
  | 'ppt'
  | 'audio'
  | 'youtube'
  | 'test_paper';

export type ResourceStatus =
  | 'draft'
  | 'processing'
  | 'under_review'
  | 'published'
  | 'needs_changes'
  | 'rejected';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type ResourceAccessType = 'free' | 'premium';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export type RefundStatus = 'pending' | 'approved' | 'rejected';

export type EnrollmentStatus = 'active' | 'refunded' | 'expired';

export type MemberRole = 'admin' | 'member';

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'expert';

// ---- User (matches backend /auth/me response) ----

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  profilePic?: string | null;   // backend field name
  avatarUrl?: string | null;    // alias for components (mapped in services)
  isVerified?: boolean;
  status?: 'active' | 'suspended' | 'banned';
  emailVerified?: boolean;
  createdAt?: string;
}

export interface AuthUser extends User {
  token: string;
}

// ---- Tutor Profile ----

export interface TutorProfile {
  tutorId: number;
  name?: string;
  bio?: string | null;
  instituteName?: string | null;
  experienceYears: number;
  experience?: string | number;
  trialVideo?: string;
  subjects?: string[];
  skills?: string[] | TutorSkill[];
  createdAt: string;
}

export interface TutorSkill {
  skillId: number;
  tutorId: number;
  skillName: string;
  proficiency: ProficiencyLevel;
}

// Full tutor (public listing response)
export interface Tutor {
  id: number;
  userId?: number;            // compatibility alias
  name: string;
  email: string;
  profilePic?: string | null;
  avatarUrl?: string | null;   // alias
  isVerified: boolean;
  createdAt: string;
  bio?: string | null;
  subjects?: string[];
  skills?: any[];
  studentCount?: number;
  experience?: string | number;
  reviewCount?: number;
  averageRating?: number;
  trialVideo?: any;
  tutorProfile?: TutorProfile | null;
  tutorSkills?: TutorSkill[];
  applicationStatus?: TutorApplicationStatus | string;
  _count?: {
    tutorReviewsReceived?: number;
    courses?: number;
    enrollments?: number;
  };
  // Populated on detail page
  courses?: Course[];
  tutorReviewsReceived?: TutorReview[];
}

// ---- Tutor Application ----

export interface TutorApplicationDocument {
  docId: number;
  applicationId: number;
  documentUrl: string;
  documentType: string;
  uploadedAt: string;
}

export interface TutorApplication {
  applicationId: number;
  userId: number;
  status: TutorApplicationStatus;
  trialVideoUrl?: string | null;
  appliedAt: string;
  reviewedAt?: string | null;
  adminNote?: string | null;
  documents: TutorApplicationDocument[];
}

// ---- Category ----

export interface Category {
  categoryId?: number;
  id?: number;                 // compatibility alias
  name: string;
  slug?: string;
  icon?: string;
  description?: string | null;
  resourceCount?: number;
  createdAt?: string;
}

// ---- Course ----

export interface Course {
  courseId: number;
  tutorId: number;
  categoryId?: number | null;
  title: string;
  description?: string | null;
  price: number;
  isPublished: boolean;
  createdAt: string;
  tutor?: Pick<User, 'id' | 'name' | 'profilePic' | 'isVerified'>;
  category?: Pick<Category, 'categoryId' | 'name'> | null;
  _count?: {
    enrollments?: number;
    reviews?: number;
    resources?: number;
  };
  resources?: Resource[];
}

// ---- Resource ----

export interface VideoMetadata {
  resourceId: number;
  youtubeVideoId: string;
  title?: string | null;
  durationSeconds?: number | null;
  isEmbeddable: boolean;
}

export interface ResourceCategory {
  resourceId: number;
  categoryId: number;
  category: Pick<Category, 'categoryId' | 'name'>;
}

export interface Resource {
  resourceId?: number;
  id?: number;                  // compatibility alias for resourceId
  courseId?: number | null;
  uploadedBy?: number;
  tutorId?: number;             // compatibility alias
  filename?: string;
  title?: string;               // compatibility alias for filename
  fileType?: ResourceType;
  type?: ResourceType;          // compatibility alias for fileType
  fileUrl?: string | null;
  thumbnailUrl?: string;
  isLocked?: boolean;
  accessType?: 'free' | 'premium'; // compatibility alias
  price?: number;
  status?: ResourceStatus;
  moderationNotes?: string | null;
  description?: string;
  subject?: string;
  category?: string;
  difficulty?: DifficultyLevel | string;
  youtubeUrl?: string;
  completed?: boolean;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  viewCount?: number;
  downloadCount?: number;
  purchaseCount?: number;
  tags?: string[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  uploader?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl' | 'isVerified'>;
  tutor?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl' | 'isVerified'> | Tutor;
  course?: Pick<Course, 'courseId' | 'title'> | null;
  resourceCategories?: ResourceCategory[];
  videoMetadata?: VideoMetadata | null;
  resource?: any;               // compatibility alias for nested objects
}

// ---- Bundle ----

export interface BundleItem {
  bundleId?: number;
  resourceId?: number;
  resource?: Pick<Resource, 'resourceId' | 'filename' | 'fileType'> | Resource | any;
}

export interface Bundle {
  bundleId?: number;
  id?: number;                  // compatibility alias
  tutorId?: number;
  title?: string;
  name?: string;                // compatibility alias
  description?: string | null;
  price?: number;
  originalPrice?: number;
  finalPrice?: number;
  discountPercent?: number;
  purchaseCount?: number;
  isPublished?: boolean;
  createdAt?: string;
  tutor?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl'>;
  bundleItems?: BundleItem[];
  resources?: Resource[];
}

// ---- Enrollment ----

export interface Enrollment {
  enrollmentId: number;
  studentId: number;
  courseId: number;
  priceAtEnrollment: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  course?: Course;
}

// ---- Payment ----

export interface Payment {
  paymentId: number;
  studentId: number;
  courseId?: number | null;
  resourceId?: number | null;
  bundleId?: number | null;
  amount: number;
  status: PaymentStatus;
  paidAt: string;
  course?: Pick<Course, 'courseId' | 'title'> | null;
  resource?: Pick<Resource, 'resourceId' | 'filename'> | null;
  bundle?: Pick<Bundle, 'bundleId' | 'title'> | null;
}

// ---- Refund ----

export interface Refund {
  refundId: number;
  paymentId: number;
  studentId: number;
  reason: string;
  status: RefundStatus;
  requestedAt: string;
  reviewedAt?: string | null;
  payment?: Payment;
}

// ---- Reviews ----

export interface CourseReview {
  reviewId?: number;
  id?: number;
  studentId?: number;
  courseId?: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  student?: Pick<User, 'id' | 'name' | 'profilePic'>;
}

export interface TutorReview {
  reviewId?: number;
  id?: number;
  studentId?: number;
  tutorId?: number;
  rating: number;
  comment?: string | null;
  tags?: string[];
  createdAt?: string;
  student?: Pick<User, 'id' | 'name' | 'profilePic'>;
}

// ---- Groups ----

export interface GroupMember {
  groupId: number;
  userId: number;
  role: MemberRole;
  joinedAt: string;
  user?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl'>;
}

export interface GroupMessage {
  messageId: number;
  id?: number;              // alias for messageId
  groupId: number;
  senderId: number;
  userId?: number;          // alias for senderId
  content: string;
  isDeleted?: boolean;
  sentAt?: string;
  createdAt: string;        // alias / standard
  sender?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl'>;
  user?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl'>;   // alias for sender
}

export interface GroupPayment {
  groupPaymentId: number;
  groupId: number;
  paidBy: number;
  amount: number;
  quotaAdded: number;
  paidAt: string;
  payer?: Pick<User, 'id' | 'name' | 'profilePic'>;
}

export interface StudyGroup {
  groupId?: number;
  id?: number;               // alias for groupId
  name: string;
  createdBy?: number;
  courseId?: number | null;
  messageQuota?: number;
  messagesUsed?: number;
  createdAt?: string;
  subject?: string;
  description?: string;
  imageUrl?: string;
  memberCount?: number;
  onlineCount?: number;
  isPremium?: boolean;
  creator?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl'>;
  _count?: {
    members?: number;
    messages?: number;
  };
  members?: GroupMember[];
}

// ---- API Responses ----

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// ---- Filter / Search ----

export interface ResourceFilters {
  search?: string;
  fileType?: ResourceType;
  type?: ResourceType;
  difficulty?: DifficultyLevel;
  accessType?: 'free' | 'premium';
  subject?: string;
  isLocked?: boolean;
  categoryId?: number;
  uploadedBy?: number;
  courseId?: number;
  page?: number;
  limit?: number;
}

export interface TutorFilters {
  search?: string;
  skill?: string;
  subject?: string;
  minRating?: number;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface CourseFilters {
  search?: string;
  categoryId?: number;
  tutorId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface GroupFilters {
  search?: string;
  subject?: string;
  courseId?: number;
  page?: number;
  limit?: number;
}

// ---- Field mapping helpers ----
export function normalizeUser(u: User): User {
  return { ...u, avatarUrl: u.profilePic ?? undefined };
}

export function normalizeTutor(t: Tutor): Tutor {
  return { ...t, avatarUrl: t.profilePic ?? undefined };
}

export function normalizeGroup(g: any): StudyGroup {
  return {
    ...g,
    id: g.id ?? g.groupId,
    groupId: g.groupId ?? g.id,
    subject: g.subject ?? 'General',
    description: g.description ?? 'Study group for peer collaboration and doubt solving.',
    imageUrl: g.imageUrl ?? `https://picsum.photos/seed/${g.groupId || g.id}/400/240`,
    memberCount: g.memberCount ?? g._count?.members ?? 1,
    onlineCount: g.onlineCount ?? 1,
    isPremium: g.isPremium ?? false,
    creator: g.creator ? { ...g.creator, avatarUrl: g.creator.profilePic ?? undefined } : undefined,
  };
}

export function normalizeMessage(m: any): GroupMessage {
  const u = m.user || m.sender;
  return {
    ...m,
    id: m.id ?? m.messageId,
    messageId: m.messageId ?? m.id,
    userId: m.userId ?? m.senderId,
    senderId: m.senderId ?? m.userId,
    createdAt: m.createdAt ?? m.sentAt ?? new Date().toISOString(),
    sentAt: m.sentAt ?? m.createdAt ?? new Date().toISOString(),
    user: u ? { ...u, avatarUrl: u.profilePic ?? u.avatarUrl ?? undefined } : undefined,
    sender: u ? { ...u, avatarUrl: u.profilePic ?? u.avatarUrl ?? undefined } : undefined,
  };
}

export function normalizeResource(r: any): Resource {
  const categoryName = r.resourceCategories?.[0]?.category?.name;
  return {
    ...r,
    id: r.id ?? r.resourceId,
    resourceId: r.resourceId ?? r.id,
    title: r.title ?? r.filename ?? 'Untitled Resource',
    filename: r.filename ?? r.title ?? 'Untitled Resource',
    type: r.type ?? r.fileType ?? 'pdf',
    fileType: r.fileType ?? r.type ?? 'pdf',
    accessType: r.accessType ?? (r.isLocked ? 'premium' : 'free'),
    isLocked: r.isLocked ?? (r.accessType === 'premium'),
    subject: r.subject ?? categoryName ?? 'General',
    category: r.category ?? categoryName ?? 'General',
    description: r.description ?? r.moderationNotes ?? 'Verified educational resource.',
    thumbnailUrl: r.thumbnailUrl ?? (r.fileType === 'youtube' && r.videoMetadata?.youtubeVideoId
      ? `https://img.youtube.com/vi/${r.videoMetadata.youtubeVideoId}/hqdefault.jpg`
      : undefined),
    rating: r.rating ?? 4.8,
    reviewCount: r.reviewCount ?? 12,
    viewCount: r.viewCount ?? 120,
    downloadCount: r.downloadCount ?? 45,
    uploader: r.uploader ? { ...r.uploader, avatarUrl: r.uploader.profilePic ?? r.uploader.avatarUrl ?? undefined } : undefined,
  };
}

export function normalizeCourse(c: any): Course {
  return {
    ...c,
    courseId: c.courseId ?? c.id,
    id: c.id ?? c.courseId,
    title: c.title ?? 'Untitled Course',
    description: c.description ?? 'Comprehensive learning curriculum.',
    price: c.price ?? 0,
    isPublished: c.isPublished ?? true,
    tutor: c.tutor ? { ...c.tutor, avatarUrl: c.tutor.profilePic ?? c.tutor.avatarUrl ?? undefined } : undefined,
  };
}

// ---- Auxiliary Types for Existing Dashboard & Shared Pages ----

export interface AIConversation {
  id: number;
  userId?: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  messagesCount?: number;
}

export interface AIMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AIUsage {
  used: number;
  limit: number;
  isPremium: boolean;
  resetsAt?: string;
}

export interface TutorAnalytics {
  views?: number;
  earnings?: number;
  students?: number;
  rating?: number;
  totalRevenue?: number;
  totalViews?: number;
  totalPurchases?: number;
  conversionRate?: number;
  averageRating?: number;
  revenueByMonth?: { month: string; amount: number }[];
  revenueOverTime?: { date: string; amount?: number; value?: number }[];
  viewsOverTime?: { date: string; views?: number; value?: number }[];
  popularResources?: any[];
  studentEngagement?: number;
  salesOverTime?: any[];
  topResources?: { resource: any; views: number; purchases: number; revenue: number }[];
}

export interface EarningRecord {
  id: number;
  tutorId?: number;
  purchaseId?: number;
  resourceId?: number;
  orderId?: string;
  date?: string;
  createdAt?: string;
  resourceTitle?: string;
  resource?: string | { id?: number; title?: string; name?: string; type?: string };
  buyerName?: string;
  grossAmount?: number;
  platformFee?: number;
  netAmount?: number;
  amount?: number;
  status: 'settled' | 'pending' | 'completed';
}

export interface EarningsSummary {
  totalEarned?: number;
  totalEarnings?: number;
  currentBalance?: number;
  availableBalance?: number;
  pendingPayout?: number;
  pendingEarnings?: number;
  completedEarnings?: number;
  thisMonthEarnings?: number;
  lastMonthEarnings?: number;
  nextPayoutDate?: string;
  records?: EarningRecord[];
}

export type NotificationType =
  | 'system'
  | 'message'
  | 'review'
  | 'payment'
  | 'new_resource'
  | 'group_activity'
  | 'purchase'
  | 'ai_usage';

export interface Notification {
  id: number;
  userId?: number;
  title: string;
  message: string;
  read?: boolean;
  isRead?: boolean;
  link?: string;
  createdAt: string;
  type?: NotificationType;
}

export interface Playlist {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  subject?: string;
  isPremium?: boolean;
  isPublished?: boolean;
  difficulty?: DifficultyLevel | string;
  coverUrl?: string;
  thumbnailUrl?: string;
  price?: number;
  userProgress?: number | {
    completedCount: number;
    totalCount: number;
    percentage: number;
    isCompleted?: boolean;
  };
  tutorId?: number;
  tutor?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl' | 'isVerified'>;
  resources?: Resource[];
  resourceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id?: number;
  reviewId?: number;
  studentId?: number;
  tutorId?: number;
  rating: number;
  comment?: string;
  authorName?: string;
  tags?: string[];
  student?: Pick<User, 'id' | 'name' | 'profilePic' | 'avatarUrl' | 'isVerified'>;
  createdAt?: string;
  resourceTitle?: string;
}


