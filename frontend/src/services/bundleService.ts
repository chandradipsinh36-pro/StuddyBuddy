import apiClient from '../api/client';
import type { Bundle } from '../types';
import { normalizeResource } from '../types';

export function normalizeBundle(raw: any): Bundle {
  const b = raw?.data ?? raw ?? {};
  const items = b.bundleItems || [];
  const resources = b.resources || items.map((item: any) => {
    if (item.resource) {
      return normalizeResource(item.resource);
    }
    return {
      id: item.resourceId,
      resourceId: item.resourceId,
      title: `Resource #${item.resourceId}`,
      filename: `Resource #${item.resourceId}`,
      type: 'pdf',
      fileType: 'pdf',
      price: 0,
      accessType: 'premium',
    };
  });

  const priceNum = Number(b.price || b.finalPrice || 0);
  const origPrice = Number(b.originalPrice || (priceNum > 0 ? Math.round(priceNum / 0.75) : 499));
  const discPercent = b.discountPercent ?? (origPrice > priceNum ? Math.round(((origPrice - priceNum) / origPrice) * 100) : 25);

  return {
    ...b,
    id: b.bundleId ?? b.id,
    bundleId: b.bundleId ?? b.id,
    name: b.title || b.name || 'Untitled Bundle',
    title: b.title || b.name || 'Untitled Bundle',
    description: b.description || '',
    price: priceNum,
    originalPrice: origPrice,
    discountPercent: discPercent,
    finalPrice: priceNum > 0 ? priceNum : Math.round(origPrice * (1 - discPercent / 100)),
    resources,
    bundleItems: items,
    purchaseCount: b.purchaseCount ?? b.payments?.length ?? 0,
    isPublished: b.isPublished ?? true,
    createdAt: b.createdAt || new Date().toISOString(),
    tutor: b.tutor,
  };
}

export interface CreateBundlePayload {
  title: string;
  description?: string;
  price: number;
  resourceIds?: number[];
}

export const bundleService = {
  async getMyBundles(): Promise<Bundle[]> {
    const res = await apiClient.get<any>('/tutor/bundles');
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    return rawList.map(normalizeBundle);
  },

  async getPublicBundles(): Promise<Bundle[]> {
    const res = await apiClient.get<any>('/bundles');
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    return rawList.map(normalizeBundle);
  },

  async getBundleById(id: number): Promise<Bundle> {
    const res = await apiClient.get<any>(`/bundles/${id}`);
    const data = res.data?.data ?? res.data;
    return normalizeBundle(data);
  },

  async createBundle(payload: CreateBundlePayload): Promise<Bundle> {
    const res = await apiClient.post<any>('/tutor/bundles', payload);
    const data = res.data?.data ?? res.data;
    return normalizeBundle(data);
  },

  async updateBundle(bundleId: number, payload: Partial<CreateBundlePayload>): Promise<Bundle> {
    const res = await apiClient.patch<any>(`/tutor/bundles/${bundleId}`, payload);
    const data = res.data?.data ?? res.data;
    return normalizeBundle(data);
  },

  async deleteBundle(bundleId: number): Promise<void> {
    await apiClient.delete(`/tutor/bundles/${bundleId}`);
  },

  async addResourceToBundle(bundleId: number, resourceId: number): Promise<void> {
    await apiClient.post(`/tutor/bundles/${bundleId}/resources/${resourceId}`);
  },

  async removeResourceFromBundle(bundleId: number, resourceId: number): Promise<void> {
    await apiClient.delete(`/tutor/bundles/${bundleId}/resources/${resourceId}`);
  },
};
