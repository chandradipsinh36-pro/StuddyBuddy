// =====================================================
// StudyBuddy Admin Panel — Bundle Management Service
// Wired to /api/admin/bundles/*
// =====================================================

import apiClient from '../api/client';
import type { AdminBundle, BundleFilterParams, PaginatedResult } from '../types/admin';

export const adminBundleService = {
  /**
   * GET /api/admin/bundles
   */
  async getBundles(params: BundleFilterParams = {}): Promise<PaginatedResult<AdminBundle>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.is_published && params.is_published !== 'all') {
      query.set('isPublished', params.is_published === 'published' ? 'true' : 'false');
    }
    if (params.sort_by) query.set('sortBy', params.sort_by);
    if (params.sort_order) query.set('sortOrder', params.sort_order);

    const { data } = await apiClient.get(`/admin/bundles?${query.toString()}`);
    const items = (data.data || []) as AdminBundle[];
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
   * GET /api/admin/bundles/:id
   */
  async getBundleById(id: number): Promise<AdminBundle | null> {
    try {
      const { data } = await apiClient.get(`/admin/bundles/${id}`);
      return data.data as AdminBundle;
    } catch {
      return null;
    }
  },

  /**
   * PATCH /api/admin/bundles/:id/publish
   */
  async togglePublish(id: number): Promise<AdminBundle> {
    const { data } = await apiClient.patch(`/admin/bundles/${id}/publish`);
    return data.data as AdminBundle;
  },

  /**
   * PATCH /api/admin/bundles/:id
   */
  async updateBundle(id: number, payload: Partial<AdminBundle>): Promise<AdminBundle> {
    const { data } = await apiClient.patch(`/admin/bundles/${id}`, payload);
    return data.data as AdminBundle;
  },

  /**
   * DELETE /api/admin/bundles/:id
   */
  async deleteBundle(id: number): Promise<void> {
    await apiClient.delete(`/admin/bundles/${id}`);
  },
};
