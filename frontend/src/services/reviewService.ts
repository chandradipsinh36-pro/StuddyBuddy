import apiClient from '../api/client';
import type { CourseReview, TutorReview } from '../types';

export const reviewService = {
  // ── Course Reviews ──────────────────────────────────────────────
  async getCourseReviews(courseId: number): Promise<CourseReview[]> {
    const res = await apiClient.get<CourseReview[]>(`/courses/${courseId}/reviews`);
    return res.data;
  },

  async createCourseReview(courseId: number, data: { rating: number; comment?: string }): Promise<CourseReview> {
    const res = await apiClient.post<CourseReview>(`/courses/${courseId}/reviews`, data);
    return res.data;
  },

  async updateCourseReview(reviewId: number, data: { rating?: number; comment?: string }): Promise<CourseReview> {
    const res = await apiClient.patch<CourseReview>(`/course-reviews/${reviewId}`, data);
    return res.data;
  },

  async deleteCourseReview(reviewId: number): Promise<void> {
    await apiClient.delete(`/course-reviews/${reviewId}`);
  },

  // ── Tutor Reviews ───────────────────────────────────────────────
  async getTutorReviews(tutorId: number): Promise<TutorReview[]> {
    const res = await apiClient.get<TutorReview[]>(`/tutors/${tutorId}/reviews`);
    return res.data;
  },

  async createTutorReview(tutorId: number, data: { rating: number; comment?: string }): Promise<TutorReview> {
    const res = await apiClient.post<TutorReview>(`/tutors/${tutorId}/reviews`, data);
    return res.data;
  },

  async updateTutorReview(reviewId: number, data: { rating?: number; comment?: string }): Promise<TutorReview> {
    const res = await apiClient.patch<TutorReview>(`/tutor-reviews/${reviewId}`, data);
    return res.data;
  },

  async deleteTutorReview(reviewId: number): Promise<void> {
    await apiClient.delete(`/tutor-reviews/${reviewId}`);
  },

  async getTutorReceivedReviews(): Promise<any[]> {
    try {
      const res = await apiClient.get<any>('/auth/me');
      const userId = res.data?.id;
      if (userId) {
        return await this.getTutorReviews(userId);
      }
    } catch {
      /* ignore */
    }
    return [];
  },

  async getResourceReviews(_resourceId: number): Promise<any[]> {
    return [];
  },

  async createReview(data: { rating: number; comment?: string; resourceId?: number; courseId?: number; tutorId?: number }): Promise<any> {
    if (data.courseId) return this.createCourseReview(data.courseId, data);
    if (data.tutorId) return this.createTutorReview(data.tutorId, data);
    return { id: Date.now(), ...data };
  },
};
