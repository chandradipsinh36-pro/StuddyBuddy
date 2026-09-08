import apiClient from '../api/client';
import type { Enrollment } from '../types';

export const enrollmentService = {
  async enroll(courseId: number): Promise<Enrollment> {
    const res = await apiClient.post<Enrollment>(`/courses/${courseId}/enroll`);
    return res.data;
  },

  async getMyEnrollments(): Promise<Enrollment[]> {
    const res = await apiClient.get<Enrollment[]>('/students/me/enrollments');
    return res.data;
  },

  async getMyEnrollment(enrollmentId: number): Promise<Enrollment> {
    const res = await apiClient.get<Enrollment>(`/students/me/enrollments/${enrollmentId}`);
    return res.data;
  },
};
