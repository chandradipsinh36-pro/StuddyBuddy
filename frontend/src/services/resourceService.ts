import apiClient from '../api/client';
import type { Resource, ResourceFilters, PaginatedResponse } from '../types';
import { normalizeResource } from '../types';

export const resourceService = {
  // ── Public ──────────────────────────────────────────────────────
  async getResources(filters: ResourceFilters = {}): Promise<PaginatedResponse<Resource>> {
    const res = await apiClient.get<PaginatedResponse<Resource>>('/resources', { params: filters });
    const rawList = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.data || [];

    const pagination = (res.data as any)?.pagination || {
      page: 1,
      limit: rawList.length,
      total: rawList.length,
      totalPages: 1,
    };

    return {
      data: rawList.map(normalizeResource),
      pagination,
    };
  },

  async getResource(id: number): Promise<Resource> {
    const res = await apiClient.get<Resource>(`/resources/${id}`);
    return normalizeResource(res.data);
  },

  async getTutorResources(tutorId?: number): Promise<Resource[]> {
    const res = await this.getResources({ uploadedBy: tutorId });
    return res.data;
  },

  // ── Tutor-owned ──────────────────────────────────────────────────
  async getMyResources(filters: ResourceFilters = {}): Promise<PaginatedResponse<Resource>> {
    const res = await apiClient.get<PaginatedResponse<Resource>>('/tutor/resources', { params: filters });
    const rawList = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.data || [];

    const pagination = (res.data as any)?.pagination || {
      page: 1,
      limit: rawList.length,
      total: rawList.length,
      totalPages: 1,
    };

    return {
      data: rawList.map(normalizeResource),
      pagination,
    };
  },

  async getMyResource(id: number): Promise<Resource> {
    const res = await apiClient.get<Resource>(`/tutor/resources/${id}`);
    return normalizeResource(res.data);
  },

  async createResource(data: any): Promise<Resource> {
    if (data instanceof FormData) {
      const res = await apiClient.post<Resource>('/tutor/resources', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return normalizeResource(res.data);
    }

    const payload = {
      filename: data.filename || data.title || 'Untitled Resource',
      fileType: data.fileType || data.type || 'pdf',
      fileUrl: data.fileUrl,
      courseId: data.courseId ? Number(data.courseId) : undefined,
      isLocked: data.isLocked ?? (data.accessType === 'premium'),
      price: Number(data.price || 0),
      categoryName: data.category,
      moderationNotes: JSON.stringify({
        title: data.filename || data.title,
        description: data.description,
        subject: data.subject,
        category: data.category,
        difficulty: data.difficulty,
      }),
    };

    const res = await apiClient.post<Resource>('/tutor/resources', payload);
    return normalizeResource(res.data);
  },

  async updateResource(id: number, data: any): Promise<Resource> {
    if (data instanceof FormData) {
      const res = await apiClient.patch<Resource>(`/tutor/resources/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return normalizeResource(res.data);
    }

    const res = await apiClient.patch<Resource>(`/tutor/resources/${id}`, data);
    return normalizeResource(res.data);
  },

  async deleteResource(id: number): Promise<void> {
    await apiClient.delete(`/tutor/resources/${id}`);
  },

  // ── Categories ───────────────────────────────────────────────────
  async addCategory(resourceId: number, categoryId: number): Promise<void> {
    await apiClient.post(`/resources/${resourceId}/categories/${categoryId}`);
  },

  async removeCategory(resourceId: number, categoryId: number): Promise<void> {
    await apiClient.delete(`/resources/${resourceId}/categories/${categoryId}`);
  },

  async upsertVideoMetadata(resourceId: number, data: {
    youtubeVideoId: string;
    title?: string;
    durationSeconds?: number;
    isEmbeddable?: boolean;
  }) {
    const res = await apiClient.put(`/tutor/resources/${resourceId}/video-metadata`, data);
    return res.data;
  },

  async purchaseResource(resourceId: number, amount: number = 0) {
    const res = await apiClient.post('/payments/resource', { resourceId, amount });
    return res.data;
  },
};
