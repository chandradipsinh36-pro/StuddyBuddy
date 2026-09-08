import apiClient from '../api/client';
import type { Payment, Refund } from '../types';

export const paymentService = {
  // ── Payments ────────────────────────────────────────────────────
  async payCourse(courseId: number, amount: number): Promise<{ payment: Payment; enrollment: unknown }> {
    const res = await apiClient.post('/payments/course', { courseId, amount });
    return res.data;
  },

  async payResource(resourceId: number, amount: number): Promise<Payment> {
    const res = await apiClient.post<Payment>('/payments/resource', { resourceId, amount });
    return res.data;
  },

  async payBundle(bundleId: number, amount: number): Promise<Payment> {
    const res = await apiClient.post<Payment>('/payments/bundle', { bundleId, amount });
    return res.data;
  },

  async getMyPayments(): Promise<Payment[]> {
    const res = await apiClient.get<Payment[]>('/payments/me');
    return res.data;
  },

  async getMyPayment(id: number): Promise<Payment> {
    const res = await apiClient.get<Payment>(`/payments/me/${id}`);
    return res.data;
  },

  // ── Refunds ──────────────────────────────────────────────────────
  async createRefund(paymentId: number, reason: string): Promise<Refund> {
    const res = await apiClient.post<Refund>('/refunds', { paymentId, reason });
    return res.data;
  },

  async getMyRefunds(): Promise<Refund[]> {
    const res = await apiClient.get<Refund[]>('/refunds/me');
    return res.data;
  },
};
