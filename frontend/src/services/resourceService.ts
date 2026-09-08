import apiClient from '../api/client';
import type { Resource, ResourceFilters, PaginatedResponse, ResourceType } from '../types';
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
    // If FormData was passed (from older UI code), convert to JSON payload
    let payload: {
      filename: string;
      fileType: ResourceType;
      fileUrl?: string;
      courseId?: number;
      isLocked?: boolean;
      price?: number;
    };

    if (data instanceof FormData) {
      const title = (data.get('title') as string) || (data.get('filename') as string) || 'Educational Resource';
      const type = (data.get('type') as string) || (data.get('fileType') as string) || 'pdf';
      const accessType = (data.get('accessType') as string) || 'free';
      const rawPrice = data.get('price');
      const price = accessType === 'premium' ? parseFloat(String(rawPrice || 0)) : 0;
      const file = data.get('file') as File | null;
      const youtubeUrl = data.get('youtubeUrl') as string | null;

      const validFileType = (['pdf', 'image', 'ppt', 'audio', 'youtube', 'test_paper'].includes(type)
        ? type
        : 'pdf') as ResourceType;

      const fileUrl = type === 'youtube' && youtubeUrl
        ? youtubeUrl
        : `https://storage.studybuddy.edu/uploads/${encodeURIComponent((file?.name || title).toLowerCase().replace(/\s+/g, '-'))}`;

      payload = {
        filename: title,
        fileType: validFileType,
        fileUrl,
        isLocked: accessType === 'premium',
        price,
      };
    } else {
      payload = {
        filename: data.filename || data.title || 'Untitled Resource',
        fileType: (['pdf', 'image', 'ppt', 'audio', 'youtube', 'test_paper'].includes(data.fileType || data.type)
          ? data.fileType || data.type
          : 'pdf') as ResourceType,
        fileUrl: data.fileUrl || `https://storage.studybuddy.edu/uploads/${encodeURIComponent((data.filename || data.title || 'doc').toLowerCase().replace(/\s+/g, '-'))}`,
        courseId: data.courseId ? Number(data.courseId) : undefined,
        isLocked: data.isLocked ?? (data.accessType === 'premium'),
        price: Number(data.price || 0),
      };
    }

    const res = await apiClient.post<Resource>('/tutor/resources', payload);
    return normalizeResource(res.data);
  },

  async updateResource(id: number, data: any): Promise<Resource> {
    const payload: Record<string, any> = {};
    if (data.filename || data.title) payload.filename = data.filename || data.title;
    if (data.fileUrl !== undefined) payload.fileUrl = data.fileUrl;
    if (data.isLocked !== undefined) payload.isLocked = Boolean(data.isLocked);
    if (data.price !== undefined) payload.price = Number(data.price);
    if (data.moderationNotes !== undefined) payload.moderationNotes = data.moderationNotes;

    const res = await apiClient.patch<Resource>(`/tutor/resources/${id}`, payload);
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
