// =====================================================
// StudyBuddy Admin Panel — Course Management Service
// Wired to /api/admin/courses/*
// =====================================================

import apiClient from '../api/client';
import type { AdminCourse, CourseFilterParams, PaginatedResult } from '../types/admin';

export const adminCourseService = {
  /**
   * GET /api/admin/courses
   */
  async getCourses(params: CourseFilterParams = {}): Promise<PaginatedResult<AdminCourse>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.is_published && params.is_published !== 'all') {
      query.set('isPublished', params.is_published === 'published' ? 'true' : 'false');
    }
    if (params.category_id && params.category_id !== 'all') {
      query.set('categoryId', String(params.category_id));
    }
    if (params.sort_by) query.set('sortBy', params.sort_by);
    if (params.sort_order) query.set('sortOrder', params.sort_order);

    const { data } = await apiClient.get(`/admin/courses?${query.toString()}`);
    const items = (data.data || []) as AdminCourse[];
    const pg = data.pagination;

    return {
      items,
      total: pg.total,
      page: pg.page,
      limit: pg.limit,
      total_pages: pg.totalPages,
    };
  },

  /**
   * GET /api/admin/courses/:id
   */
  async getCourseById(id: number): Promise<AdminCourse | null> {
    try {
      const { data } = await apiClient.get(`/admin/courses/${id}`);
      return data.data as AdminCourse;
    } catch {
      return null;
    }
  },

  /**
   * PATCH /api/admin/courses/:id/publish
   */
  async togglePublish(id: number): Promise<AdminCourse> {
    const { data } = await apiClient.patch(`/admin/courses/${id}/publish`);
    return data.data as AdminCourse;
  },

  /**
   * PATCH /api/admin/courses/:id
   */
  async updateCourse(id: number, payload: Partial<AdminCourse>): Promise<AdminCourse> {
    const { data } = await apiClient.patch(`/admin/courses/${id}`, payload);
    return data.data as AdminCourse;
  },

  /**
   * DELETE /api/admin/courses/:id
   */
  async deleteCourse(id: number): Promise<void> {
    await apiClient.delete(`/admin/courses/${id}`);
  },
};
