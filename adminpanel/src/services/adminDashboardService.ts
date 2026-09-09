// =====================================================
// StudyBuddy Admin Panel — Dashboard Service
// Wired to real backend: /api/admin/dashboard/*
// =====================================================

import apiClient from '../api/client';
import type {
  DashboardKPICard,
  UserGrowthDataPoint,
  DistributionDataPoint,
  ActivityLogItem,
  TutorApplication,
  AdminNotification,
} from '../types/admin';

export const adminDashboardService = {
  /**
   * GET /api/admin/dashboard/overview
   * Returns total counts: users, tutors, applications by status
   */
  async getOverview(): Promise<{
    users: { total: number; active: number; suspended: number; banned: number };
    tutors: { total: number; approved: number; pending: number; rejected: number };
    roles: { students: number; tutors: number; admins: number };
  }> {
    const { data } = await apiClient.get('/admin/dashboard/overview');
    return data.data;
  },

  async getKPICards(): Promise<DashboardKPICard[]> {
    const d = await this.getOverview();

    return [
      {
        id: 'total_users',
        title: 'Total Users',
        metric: d.users.total.toLocaleString(),
        trend: '',
        trendDirection: 'neutral',
        comparisonText: 'registered accounts',
        statusType: 'neutral',
        icon: 'Users',
      },
      {
        id: 'active_users',
        title: 'Active Users',
        metric: d.users.active.toLocaleString(),
        trend: '',
        trendDirection: 'neutral',
        comparisonText: 'of total users',
        statusType: 'success',
        icon: 'UserCheck',
      },
      {
        id: 'suspended_users',
        title: 'Suspended Users',
        metric: d.users.suspended.toLocaleString(),
        trend: '',
        trendDirection: 'neutral',
        comparisonText: 'currently suspended',
        statusType: 'suspended',
        icon: 'UserMinus',
      },
      {
        id: 'banned_users',
        title: 'Banned Users',
        metric: d.users.banned.toLocaleString(),
        trend: '',
        trendDirection: 'neutral',
        comparisonText: 'permanently banned',
        statusType: 'danger',
        icon: 'UserX',
      },
      {
        id: 'total_tutors',
        title: 'Total Tutors',
        metric: d.roles.tutors.toLocaleString(),
        trend: '',
        trendDirection: 'neutral',
        comparisonText: 'tutor accounts',
        statusType: 'neutral',
        icon: 'GraduationCap',
      },
      {
        id: 'pending_applications',
        title: 'Pending Applications',
        metric: d.tutors.pending.toLocaleString(),
        trend: 'Needs Action',
        trendDirection: 'neutral',
        comparisonText: 'requires review',
        statusType: 'warning',
        icon: 'Clock',
      },
      {
        id: 'approved_tutors',
        title: 'Approved Tutors',
        metric: d.tutors.approved.toLocaleString(),
        trend: '',
        trendDirection: 'up',
        comparisonText: 'verified tutors',
        statusType: 'success',
        icon: 'CheckCircle2',
      },
      {
        id: 'rejected_applications',
        title: 'Rejected Applications',
        metric: d.tutors.rejected.toLocaleString(),
        trend: '',
        trendDirection: 'neutral',
        comparisonText: 'rejected',
        statusType: 'danger',
        icon: 'XCircle',
      },
    ];
  },

  /**
   * GET /api/admin/dashboard/user-growth?period=7d|30d|90d|1y
   */
  async getUserGrowth(period: 'daily' | 'weekly' | 'monthly'): Promise<UserGrowthDataPoint[]> {
    const periodMap: Record<string, string> = {
      daily:   '7d',
      weekly:  '30d',
      monthly: '1y',
    };
    const { data } = await apiClient.get(`/admin/dashboard/user-growth?period=${periodMap[period] ?? '30d'}`);
    return (data.data as Array<{ date: string; count: number }>).map((row) => ({
      date:     row.date,
      students: row.count,
      tutors:   0,
      total:    row.count,
    }));
  },

  /**
   * GET /api/admin/dashboard/overview — derive distributions from overview counts
   */
  async getStatusDistribution(): Promise<DistributionDataPoint[]> {
    const { data } = await apiClient.get('/admin/dashboard/overview');
    const u = data.data.users;
    return [
      { name: 'Active Users',    value: u.active,    color: '#10B981' },
      { name: 'Suspended Users', value: u.suspended,  color: '#F97316' },
      { name: 'Banned Users',    value: u.banned,     color: '#EF4444' },
    ];
  },

  async getRoleDistribution(): Promise<DistributionDataPoint[]> {
    const { data } = await apiClient.get('/admin/dashboard/overview');
    const r = data.data.roles;
    return [
      { name: 'Students', value: r.students, color: '#2563EB' },
      { name: 'Tutors',   value: r.tutors,   color: '#10B981' },
      { name: 'Admins',   value: r.admins,   color: '#6366F1' },
    ];
  },

  async getApplicationDistribution(): Promise<DistributionDataPoint[]> {
    const { data } = await apiClient.get('/admin/dashboard/tutor-applications');
    const a = data.data;
    return [
      { name: 'Approved',      value: a.approved,     color: '#10B981' },
      { name: 'Pending Review', value: a.pending + a.under_review, color: '#F59E0B' },
      { name: 'Rejected',      value: a.rejected,     color: '#EF4444' },
    ];
  },

  /**
   * GET /api/admin/dashboard/recent-activity
   */
  async getRecentActivity(): Promise<ActivityLogItem[]> {
    const { data } = await apiClient.get('/admin/dashboard/recent-activity');
    const d = data.data;
    const items: ActivityLogItem[] = [];

    (d.recentRegistrations ?? []).forEach((u: { id: number; name: string; role: string; createdAt: string }, i: number) => {
      items.push({
        id: i + 1,
        user_name: u.name,
        user_email: '',
        user_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`,
        action_type: 'user_registered',
        description: `Registered as a new ${u.role}.`,
        timestamp: new Date(u.createdAt).toLocaleString(),
        status: 'info',
      });
    });

    return items.slice(0, 10);
  },

  /**
   * Pending applications quick view from tutor-applications endpoint
   */
  async getPendingTutorApplications(): Promise<TutorApplication[]> {
    const { data } = await apiClient.get('/admin/tutor-applications?status=pending&limit=5');
    return (data.data ?? []).map((app: Record<string, unknown>) => {
      const user = (app.user as Record<string, unknown>) ?? {};
      const profile = (user.tutorProfile as Record<string, unknown>) ?? {};
      const skills = (user.tutorSkills as Record<string, unknown>[]) ?? [];
      const docs = (app.documents as Record<string, unknown>[]) ?? [];

      return {
        application_id:   (app.applicationId as number) ?? 0,
        user_id:          (user.id as number) ?? 0,
        user: {
          id:          (user.id as number) ?? 0,
          name:        (user.name as string) ?? '',
          email:       (user.email as string) ?? '',
          profile_pic: (user.profilePic as string) ?? undefined,
          role:        'tutor',
          status:      'active',
          is_verified: false,
          created_at:  '',
        },
        institute_name:   (profile.instituteName as string) ?? '',
        experience_years: (profile.experienceYears as number) ?? 0,
        bio:              (profile.bio as string) ?? '',
        trial_video_url:  (app.trialVideoUrl as string) ?? '',
        status:           (app.status as any) || 'pending',
        applied_at:       (app.appliedAt as string) ?? '',
        skills:           skills.map((s, i) => ({
          skill_id:    (s.skillId as number) ?? i,
          tutor_id:    (user.id as number) ?? 0,
          skill_name:  (s.skillName as string) ?? '',
          proficiency: (s.proficiency as any) || 'intermediate',
        })),
        documents:        docs.map((d) => ({
          doc_id:        (d.docId as number) ?? 0,
          application_id: (app.applicationId as number) ?? 0,
          document_url:  (d.documentUrl as string) ?? '',
          document_type: (d.documentType as any) || 'credential',
          file_name:     (d.documentUrl as string) ?? '',
          file_size:     '',
          uploaded_at:   (d.uploadedAt as string) ?? '',
        })),
      };
    });
  },

  /**
   * Notifications — derived from pending applications count
   */
  async getNotifications(): Promise<AdminNotification[]> {
    const { data } = await apiClient.get('/admin/dashboard/tutor-applications');
    const pending = data.data?.pending ?? 0;
    const notifications: AdminNotification[] = [];

    if (pending > 0) {
      notifications.push({
        id: 1,
        title: 'Tutor Applications Pending',
        message: `${pending} tutor application${pending > 1 ? 's' : ''} waiting for review.`,
        timestamp: 'Now',
        read: false,
        type: 'application',
        link: '/tutors/applications',
      });
    }

    return notifications;
  },
};
