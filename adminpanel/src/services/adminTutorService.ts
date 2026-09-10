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
      const docUrl = typeof d.documentUrl === 'string' ? d.documentUrl : typeof d.document_url === 'string' ? d.document_url : '';
      const fullDocUrl = docUrl ? (docUrl.startsWith('http') || docUrl.startsWith('data:') ? docUrl : `http://localhost:5000${docUrl.startsWith('/') ? '' : '/'}${docUrl}`) : '';
      const docType = (d.documentType as string) ?? (d.document_type as string) ?? 'qualification_certificate';
      let fileName = docType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      if (docUrl.startsWith('http') || docUrl.startsWith('/resources/')) {
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
        document_url:  fullDocUrl,
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
  const counts  = (t._count as Record<string, number>) ?? {};

  // Courses
  const rawCourses = (t.courses as Record<string, any>[]) ?? [];
  const courses = rawCourses.map((c) => {
    let description = c.description as string | undefined;
    let lessonsCount = Array.isArray(c.lessons) ? c.lessons.length : undefined;

    if (description && typeof description === 'string' && description.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(description);
        if (parsed && typeof parsed === 'object') {
          if (parsed.overview !== undefined) {
            description = parsed.overview;
          }
          if (Array.isArray(parsed.lessons) && lessonsCount === undefined) {
            lessonsCount = parsed.lessons.length;
          }
        }
      } catch {
        // keep description as is
      }
    }

    return {
      courseId:        (c.courseId as number) ?? (c.id as number) ?? 0,
      title:           (c.title as string) ?? 'Untitled Course',
      description,
      lessonsCount,
      price:           c.price ?? 0,
      isPublished:     (c.isPublished as boolean) ?? true,
      createdAt:       (c.createdAt as string) ?? '',
      category:        c.category as { categoryId: number; name: string } | undefined,
      enrollmentCount: (c._count?.enrollments as number) ?? (c.enrollments?.length as number) ?? 0,
      ratingAverage:   (c.averageRating as number) ?? 0,
      reviewCount:     (c._count?.reviews as number) ?? 0,
    };
  });

  // Resources
  const rawResources = (t.resources as Record<string, any>[]) ?? [];
  const resources = rawResources.map((r) => {
    let meta: any = {};
    try {
      if (r.moderationNotes && typeof r.moderationNotes === 'string' && r.moderationNotes.startsWith('{')) {
        meta = JSON.parse(r.moderationNotes);
      }
    } catch {}

    const catName = meta.category || r.category || r.resourceCategories?.[0]?.category?.name || 'General';
    const title = meta.title || r.title || r.filename || 'Untitled Resource';

    return {
      resourceId:   (r.resourceId as number) ?? (r.id as number) ?? 0,
      filename:     title,
      fileType:     (r.fileType as string) ?? (r.type as string) ?? 'pdf',
      fileUrl:      r.fileUrl as string | undefined,
      price:        r.price ?? 0,
      isLocked:     (r.isLocked as boolean) ?? false,
      status:       (r.status as string) ?? 'published',
      createdAt:    (r.createdAt as string) ?? '',
      categoryName: catName,
      courseTitle:  r.course?.title as string | undefined,
    };
  });

  // Bundles
  const rawBundles = (t.bundles as Record<string, any>[]) ?? [];
  const bundles = rawBundles.map((b) => ({
    bundleId:    (b.bundleId as number) ?? (b.id as number) ?? 0,
    title:       (b.title as string) ?? (b.name as string) ?? 'Untitled Bundle',
    description: b.description as string | undefined,
    price:       b.price ?? 0,
    isPublished: (b.isPublished as boolean) ?? true,
    createdAt:   (b.createdAt as string) ?? '',
    bundleItems: b.bundleItems ?? [],
  }));

  // Earnings
  const earnings = t.earnings as any;

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
    review_count:        counts.courseReviews ?? 0,
    student_count:       counts.enrollments ?? 0,
    created_at:          t.createdAt as string,
    courses,
    resources,
    bundles,
    earnings,
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
    } catch (err) {
      console.error(`[adminTutorService.getApplicationById] Error loading application ${id}:`, err);
      throw err;
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

  /**
   * PATCH /api/admin/tutors/courses/:courseId/status
   */
  async updateCourseStatus(courseId: number, isPublished: boolean): Promise<void> {
    await apiClient.patch(`/admin/tutors/courses/${courseId}/status`, { isPublished });
  },

  /**
   * DELETE /api/admin/tutors/courses/:courseId
   */
  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.delete(`/admin/tutors/courses/${courseId}`);
  },

  /**
   * PATCH /api/admin/tutors/resources/:resourceId/status
   */
  async updateResourceStatus(resourceId: number, status: string): Promise<void> {
    await apiClient.patch(`/admin/tutors/resources/${resourceId}/status`, { status });
  },

  /**
   * DELETE /api/admin/tutors/resources/:resourceId
   */
  async deleteResource(resourceId: number): Promise<void> {
    await apiClient.delete(`/admin/tutors/resources/${resourceId}`);
  },

  /**
   * PATCH /api/admin/tutors/bundles/:bundleId/status
   */
  async updateBundleStatus(bundleId: number, isPublished: boolean): Promise<void> {
    await apiClient.patch(`/admin/tutors/bundles/${bundleId}/status`, { isPublished });
  },

  /**
   * DELETE /api/admin/tutors/bundles/:bundleId
   */
  async deleteBundle(bundleId: number): Promise<void> {
    await apiClient.delete(`/admin/tutors/bundles/${bundleId}`);
  },
};
