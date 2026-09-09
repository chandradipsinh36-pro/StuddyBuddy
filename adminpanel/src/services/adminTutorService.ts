// =====================================================
// StudyBuddy Admin Panel — Tutor Management Service
// Wired to real backend: /api/admin/tutors/* and /api/admin/tutor-applications/*
// =====================================================

import apiClient from '../api/client';
import type {
  TutorApplication,
  TutorProfile,
  TutorFilterParams,
  PaginatedResult,
  ApplicationStatus,
  UserStatus,
} from '../types/admin';

function mapApplication(app: Record<string, unknown>): TutorApplication {
  const user = (app.user as Record<string, unknown>) ?? {};
  const profile = (user.tutorProfile as Record<string, unknown>) ?? {};
  const skills = (user.tutorSkills as Record<string, unknown>[]) ?? [];

  return {
    application_id:   (app.applicationId as number) ?? (app.application_id as number) ?? 0,
    user_id:          (user.id as number) ?? 0,
    user: {
      id:          (user.id as number) ?? 0,
      name:        (user.name as string) ?? '',
      email:       (user.email as string) ?? '',
      role:        'tutor',
      status:      (user.status as UserStatus) ?? 'active',
      profile_pic: (user.profilePic as string) ?? (user.profile_pic as string) ?? undefined,
      is_verified: ((user.isVerified ?? user.is_verified) as boolean) ?? false,
      created_at:  (user.createdAt as string) ?? '',
    },
    institute_name:   (profile.instituteName as string) ?? (app.institute_name as string) ?? '',
    experience_years: (profile.experienceYears as number) ?? (app.experience_years as number) ?? 0,
    bio:              (profile.bio as string) ?? (app.bio as string) ?? '',
    trial_video_url:  (app.trialVideoUrl as string) ?? (app.trial_video_url as string) ?? '',
    status:           (app.status as ApplicationStatus) ?? 'pending',
    applied_at:       (app.appliedAt as string) ?? (app.applied_at as string) ?? '',
    reviewed_by:      (app.reviewer as Record<string, unknown>)?.name as string | undefined,
    reviewed_at:      (app.reviewedAt as string) ?? (app.reviewed_at as string) ?? undefined,
    admin_note:       (app.adminNote as string) ?? (app.admin_note as string) ?? undefined,
    skills:           skills.map((s, i) => ({
      skill_id:    (s.skillId as number) ?? (s.skill_id as number) ?? i,
      tutor_id:    (user.id as number) ?? 0,
      skill_name:  (s.skillName as string) ?? (s.skill_name as string) ?? '',
      proficiency: ((s.proficiency as string) || 'intermediate') as any,
    })),
    documents:        ((app.documents as Record<string, unknown>[]) ?? []).map((d) => {
      const docUrl = (d.documentUrl as string) ?? (d.document_url as string) ?? '';
      const docType = (d.documentType as string) ?? (d.document_type as string) ?? 'qualification_certificate';
      let fileName = docType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      if (docUrl.startsWith('http')) {
        const parts = docUrl.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length < 50 && lastPart.includes('.')) fileName = lastPart;
      } else if (docUrl.startsWith('data:image/')) {
        fileName = 'Qualification_Certificate.png';
      } else if (docUrl.startsWith('data:application/pdf')) {
        fileName = 'Qualification_Certificate.pdf';
      }
      return {
        doc_id:        (d.docId as number) ?? (d.doc_id as number) ?? 0,
        application_id: (app.applicationId as number) ?? (d.applicationId as number) ?? 0,
        document_url:  docUrl,
        document_type: docType,
        file_name:     fileName,
        file_size:     docUrl.startsWith('data:') ? `${Math.round(docUrl.length * 0.75 / 1024)} KB` : 'Attached Document',
        uploaded_at:   (d.uploadedAt as string) ?? (d.uploaded_at as string) ?? '',
      };
    }),
  };
}

function mapTutorProfile(t: Record<string, unknown>): TutorProfile {
  const profile = (t.tutorProfile as Record<string, unknown>) ?? {};
  const apps    = (t.tutorApplications as Record<string, unknown>[]) ?? [];
  const latestApp = apps[0] ?? {};
  const skills  = (t.tutorSkills as Record<string, unknown>[]) ?? [];

  return {
    profile_id:          (profile.profileId as number) ?? 0,
    tutor_id:            t.id as number,
    user: {
      id:          t.id as number,
      name:        t.name as string,
      email:       t.email as string,
      role:        'tutor',
      status:      (t.status as UserStatus) ?? 'active',
      profile_pic: t.profilePic as string | undefined,
      is_verified: t.isVerified as boolean,
      created_at:  t.createdAt as string,
    },
    bio:                 profile.bio as string ?? '',
    institute_name:      profile.instituteName as string ?? '',
    experience_years:    (profile.experienceYears as number) ?? 0,
    skills:              skills.map((s, i) => ({
      skill_id:    (s.skillId as number) ?? i,
      tutor_id:    t.id as number,
      skill_name:  s.skillName as string,
      proficiency: s.proficiency as 'beginner' | 'intermediate' | 'expert',
    })),
    application_id:      (latestApp.applicationId as number) ?? 0,
    application_status:  (latestApp.status as ApplicationStatus) || 'pending',
    is_verified:         (t.isVerified as boolean) ?? false,
    average_rating:      0,
    review_count:        0,
    student_count:       0,
    created_at:          t.createdAt as string,
  };
}

export const adminTutorService = {
  /**
   * GET /api/admin/tutors
   */
  async getTutors(params: TutorFilterParams = {}): Promise<PaginatedResult<TutorProfile>> {
    const query = new URLSearchParams();
    if (params.page)   query.set('page',  String(params.page));
    if (params.limit)  query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.application_status && params.application_status !== 'all') {
      query.set('applicationStatus', params.application_status);
    }
    if (params.account_status && params.account_status !== 'all') {
      query.set('status', params.account_status);
    }
    if (params.is_verified && params.is_verified !== 'all') {
      query.set('verified', params.is_verified === 'verified' ? 'true' : 'false');
    }

    const { data } = await apiClient.get(`/admin/tutors?${query.toString()}`);
    const items      = (data.data as Record<string, unknown>[]).map(mapTutorProfile);
    const pg         = data.pagination;

    return {
      items,
      total:       pg.total,
      page:        pg.page,
      limit:       pg.limit,
      total_pages: pg.totalPages,
    };
  },

  /**
   * GET /api/admin/tutors/:id
   */
  async getTutorById(id: number): Promise<TutorProfile | null> {
    try {
      const { data } = await apiClient.get(`/admin/tutors/${id}`);
      return mapTutorProfile(data.data as Record<string, unknown>);
    } catch {
      return null;
    }
  },

  /**
   * GET /api/admin/tutor-applications
   */
  async getApplications(
    statusTab: ApplicationStatus | 'all' = 'all',
    search: string = ''
  ): Promise<TutorApplication[]> {
    const query = new URLSearchParams();
    query.set('limit', '100');
    if (statusTab !== 'all') query.set('status', statusTab);
    if (search) query.set('search', search);

    const { data } = await apiClient.get(`/admin/tutor-applications?${query.toString()}`);
    return (data.data as Record<string, unknown>[]).map(mapApplication);
  },

  /**
   * GET /api/admin/tutor-applications/:id
   */
  async getApplicationById(id: number): Promise<TutorApplication | null> {
    try {
      const { data } = await apiClient.get(`/admin/tutor-applications/${id}`);
      return mapApplication(data.data as Record<string, unknown>);
    } catch {
      return null;
    }
  },

  /**
   * PATCH /api/admin/tutor-applications/:id/approve
   */
  async approveApplication(
    applicationId: number,
    adminNote: string = ''
  ): Promise<TutorApplication> {
    const { data } = await apiClient.patch(
      `/admin/tutor-applications/${applicationId}/approve`,
      { admin_note: adminNote }
    );
    return mapApplication(data.data as Record<string, unknown>);
  },

  /**
   * PATCH /api/admin/tutor-applications/:id/reject
   */
  async rejectApplication(
    applicationId: number,
    rejectionReason: string
  ): Promise<TutorApplication> {
    if (!rejectionReason || rejectionReason.trim() === '') {
      throw new Error('A rejection reason is required.');
    }
    const { data } = await apiClient.patch(
      `/admin/tutor-applications/${applicationId}/reject`,
      { admin_note: rejectionReason }
    );
    return mapApplication(data.data as Record<string, unknown>);
  },

  /**
   * DELETE /api/admin/users/:id (deletes tutor account and cascades)
   */
  async deleteTutor(id: number): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },
};
