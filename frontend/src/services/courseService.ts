import apiClient from '../api/client';
import type { Course, CourseFilters, CourseLesson, PaginatedResponse } from '../types';

export const courseService = {
  // ── Public ──────────────────────────────────────────────────────
  async getCourses(filters: CourseFilters = {}): Promise<PaginatedResponse<Course>> {
    const res = await apiClient.get<PaginatedResponse<Course>>('/courses', { params: filters });
    return res.data;
  },

  async getCourse(id: number): Promise<Course> {
    const res = await apiClient.get<Course>(`/courses/${id}`);
    return res.data;
  },

  // ── Tutor-owned ──────────────────────────────────────────────────
  async getMyCourses(): Promise<Course[]> {
    const res = await apiClient.get<Course[]>('/tutor/courses');
    return res.data;
  },

  async getMyCourse(id: number): Promise<Course> {
    const res = await apiClient.get<Course>(`/tutor/courses/${id}`);
    return res.data;
  },

  async createCourse(data: {
    title: string;
    description?: string;
    price?: number;
    categoryId?: number;
    resourceIds?: number[];
    lessons?: CourseLesson[];
  }): Promise<Course> {
    const res = await apiClient.post<Course>('/tutor/courses', data);
    return res.data;
  },

  async updateCourse(id: number, data: Partial<{
    title: string;
    description: string;
    price: number;
    categoryId: number | null;
    isPublished: boolean;
    resourceIds: number[];
    lessons: CourseLesson[];
  }>): Promise<Course> {
    const res = await apiClient.patch<Course>(`/tutor/courses/${id}`, data);
    return res.data;
  },

  async publishCourse(id: number, isPublished: boolean): Promise<Course> {
    const res = await apiClient.patch<Course>(`/tutor/courses/${id}/publish`, { isPublished });
    return res.data;
  },

  async deleteCourse(id: number): Promise<void> {
    await apiClient.delete(`/tutor/courses/${id}`);
  },
};
