// =====================================================
// StudyBuddy Admin Panel — Resource Management Service
// Wired to /api/admin/resources/*
// =====================================================

import apiClient from '../api/client';
import type { AdminResource, ResourceFilterParams, PaginatedResult } from '../types/admin';

export const adminResourceService = {
  /**
   * GET /api/admin/resources
   */
  async getResources(params: ResourceFilterParams = {}): Promise<PaginatedResult<AdminResource>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params.file_type && params.file_type !== 'all') {
      query.set('fileType', params.file_type);
    }
    if (params.is_locked && params.is_locked !== 'all') {
      query.set('isLocked', params.is_locked === 'locked' ? 'true' : 'false');
    }
    if (params.sort_by) query.set('sortBy', params.sort_by);
    if (params.sort_order) query.set('sortOrder', params.sort_order);

    const { data } = await apiClient.get(`/admin/resources?${query.toString()}`);
    const items = (data.data || []) as AdminResource[];
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
   * GET /api/admin/resources/:id
   */
  async getResourceById(id: number): Promise<AdminResource | null> {
    try {
      const { data } = await apiClient.get(`/admin/resources/${id}`);
      return data.data as AdminResource;
    } catch {
      return null;
    }
  },

  /**
   * PATCH /api/admin/resources/:id/status
   */
  async updateStatus(id: number, status: string, notes?: string): Promise<AdminResource> {
    const { data } = await apiClient.patch(`/admin/resources/${id}/status`, { status, notes });
    return data.data as AdminResource;
  },

  /**
   * PATCH /api/admin/resources/:id/lock
   */
  async toggleLock(id: number): Promise<AdminResource> {
    const { data } = await apiClient.patch(`/admin/resources/${id}/lock`);
    return data.data as AdminResource;
  },

  /**
   * PATCH /api/admin/resources/:id
   */
  async updateResource(id: number, payload: Partial<AdminResource>): Promise<AdminResource> {
    const { data } = await apiClient.patch(`/admin/resources/${id}`, payload);
    return data.data as AdminResource;
  },

  /**
   * DELETE /api/admin/resources/:id
   */
  async deleteResource(id: number): Promise<void> {
    await apiClient.delete(`/admin/resources/${id}`);
  },
};
