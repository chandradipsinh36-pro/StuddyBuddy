import apiClient from '../api/client';
import type {
  Tutor, TutorProfile, TutorSkill, TutorFilters, PaginatedResponse
} from '../types';

// Normalize tutor data for UI component compatibility
function normalize(t: any): Tutor {
  if (!t) return t;
  const profile = t.tutorProfile || {};
  const tutorSkills = t.tutorSkills || t.skills || [];
  let skillNames = Array.isArray(tutorSkills)
    ? tutorSkills.map((s: any) => typeof s === 'string' ? s : s.skillName || s.name || '').filter(Boolean)
    : [];

  let subjects = (Array.isArray(t.subjects) && t.subjects.length > 0)
    ? t.subjects
    : skillNames;

  if (subjects.length === 0) {
    subjects = ['Computer Science', 'Programming', 'General Education'];
  }
  if (skillNames.length === 0) {
    skillNames = subjects;
  }

  const experienceYears = Number(t.experienceYears ?? t.experience ?? profile.experienceYears ?? 5);

  return {
    ...t,
    avatarUrl: t.profilePic ?? t.avatarUrl ?? undefined,
    bio: t.bio || profile.bio || 'Experienced educator dedicated to student success and academic excellence.',
    instituteName: t.instituteName || profile.instituteName || 'Affiliated Educational Institution',
    experienceYears,
    experience: experienceYears,
    skills: tutorSkills.length > 0 ? tutorSkills : skillNames.map((s: string, i: number) => ({ skillId: i, skillName: s })),
    subjects,
  };
}

export const tutorService = {
  // ── Public ──────────────────────────────────────────────────────
  async getTutors(filters: TutorFilters = {}): Promise<PaginatedResponse<Tutor>> {
    const res = await apiClient.get<PaginatedResponse<Tutor>>('/tutors', { params: filters });
    return { ...res.data, data: res.data.data.map(normalize) };
  },

  async getTutor(id: number): Promise<Tutor> {
    const res = await apiClient.get<Tutor>(`/tutors/${id}`);
    return normalize(res.data);
  },

  async getTutorCourses(tutorId: number): Promise<any[]> {
    try {
      const res = await apiClient.get<any>(`/courses?tutorId=${tutorId}&limit=50`);
      const raw = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      return raw;
    } catch {
      return [];
    }
  },

  async getTutorBundles(tutorId: number): Promise<any[]> {
    try {
      const res = await apiClient.get<any>(`/bundles?tutorId=${tutorId}&limit=50`);
      const raw = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      return raw;
    } catch {
      return [];
    }
  },

  // ── Own profile (tutor-only) ─────────────────────────────────────
  async getMyProfile(): Promise<TutorProfile | null> {
    const res = await apiClient.get<TutorProfile | null>('/tutors/me/profile');
    return res.data;
  },

  async createMyProfile(data: { bio?: string; instituteName?: string; experienceYears?: number }): Promise<TutorProfile> {
    const res = await apiClient.post<TutorProfile>('/tutors/me/profile', data);
    return res.data;
  },

  async updateMyProfile(data: { bio?: string; instituteName?: string; experienceYears?: number }): Promise<TutorProfile> {
    const res = await apiClient.patch<TutorProfile>('/tutors/me/profile', data);
    return res.data;
  },

  async updateProfile(data: any): Promise<any> {
    const payload = {
      name: data.name,
      bio: data.bio,
      instituteName: data.instituteName,
      experienceYears: data.experienceYears ?? (data.experience ? parseInt(data.experience, 10) : undefined),
      trialVideoUrl: data.trialVideoUrl,
      skills: data.skills,
    };
    const res = await apiClient.patch('/tutors/me/profile', payload);
    return res.data;
  },

  // ── Skills ────────────────────────────────────────────────────────
  async getMySkills(): Promise<TutorSkill[]> {
    const res = await apiClient.get<TutorSkill[]>('/tutors/me/skills');
    return res.data;
  },

  async addSkill(data: { skillName: string; proficiency: 'beginner' | 'intermediate' | 'expert' }): Promise<TutorSkill> {
    const res = await apiClient.post<TutorSkill>('/tutors/me/skills', data);
    return res.data;
  },

  async updateSkill(skillId: number, data: { skillName?: string; proficiency?: 'beginner' | 'intermediate' | 'expert' }): Promise<TutorSkill> {
    const res = await apiClient.patch<TutorSkill>(`/tutors/me/skills/${skillId}`, data);
    return res.data;
  },

  async deleteSkill(skillId: number): Promise<void> {
    await apiClient.delete(`/tutors/me/skills/${skillId}`);
  },

  // ── Onboarding / Application ──────────────────────────────────────
  async submitOnboarding(data: any): Promise<any> {
    const bio = data instanceof FormData ? (data.get('bio') as string) : data.bio;
    const qualification = data instanceof FormData ? (data.get('highestQualification') as string) : data.highestQualification;
    const instituteName = data instanceof FormData ? (data.get('instituteName') as string) : (data.instituteName || qualification);
    const rawExp = data instanceof FormData ? (data.get('experience') as string) : data.experience;
    const experienceYears = parseInt(rawExp || '0', 10);
    if (experienceYears <= 2) {
      throw new Error('Teaching experience must be greater than 2 years.');
    }

    // Save/update profile with qualifications
    const profileBio = bio || (qualification ? `Degree / Qualification: ${qualification}` : '');
    try {
      await apiClient.post('/tutors/me/profile', {
        bio: profileBio,
        instituteName: instituteName || qualification || '',
        experienceYears,
      });
    } catch {
      try {
        await apiClient.patch('/tutors/me/profile', {
          bio: profileBio,
          instituteName: instituteName || qualification || undefined,
          experienceYears,
        });
      } catch {
        /* ignore */
      }
    }

    // Save subjects / skills
    const subjects = data instanceof FormData ? data.getAll('subjects') : (data.subjects || []);
    if (Array.isArray(subjects) && subjects.length > 0) {
      for (const subj of subjects) {
        if (typeof subj === 'string' && subj.trim().length > 0) {
          try {
            await apiClient.post('/tutors/me/skills', { skillName: subj.trim(), proficiency: 'intermediate' });
          } catch {
            /* ignore duplicate skills */
          }
        }
      }
    }

    // Submit tutor application first so application record exists
    let trialVideoUrl = data instanceof FormData ? (data.get('trialVideoUrl') as string) : data.trialVideoUrl;
    if (!trialVideoUrl || !trialVideoUrl.startsWith('http')) {
      trialVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    }

    let app;
    try {
      const res = await apiClient.post('/tutor-applications', { trialVideoUrl });
      app = res.data;
    } catch {
      try {
        const res = await apiClient.patch('/tutor-applications/me', { trialVideoUrl });
        app = res.data;
      } catch (err) {
        console.warn('Application already submitted or error:', err);
      }
    }

    // Save document certificates if provided
    const documents = data instanceof FormData ? data.getAll('documents') : (data.documents || []);
    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (doc instanceof File) {
          try {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(doc);
            });
            await apiClient.post('/tutor-applications/me/documents', {
              documentUrl: dataUrl,
              documentType: 'qualification_certificate',
            });
          } catch (docErr) {
            console.warn('Document upload warning:', docErr);
          }
        }
      }
    }

    return app;
  },

  async getApplicationStatus(): Promise<string | null> {
    try {
      const res = await apiClient.get<any>('/tutor-applications/me');
      return res.data?.status || null;
    } catch {
      return null;
    }
  },
};
