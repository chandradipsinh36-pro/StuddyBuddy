import apiClient from '../api/client';
import type { Payment, Refund, Bundle } from '../types';

export interface PayCoursePayload {
  courseId: number;
  amount: number;
  paymentMethod?: string;
  transactionRef?: string;
  couponCode?: string;
}

export interface PayBundlePayload {
  bundleId: number;
  amount: number;
  paymentMethod?: string;
  transactionRef?: string;
  couponCode?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  couponCode: string;
  originalAmount: number;
  discount: number;
  finalAmount: number;
  message: string;
}

export const paymentService = {
  // ── Payments ────────────────────────────────────────────────────
  async payCourse(
    courseIdOrPayload: number | PayCoursePayload,
    maybeAmount?: number,
    opts?: { paymentMethod?: string; transactionRef?: string; couponCode?: string }
  ): Promise<{
    payment: Payment;
    enrollment: unknown;
    courseTitle?: string;
    transactionRef?: string;
    paymentMethod?: string;
    amount?: number;
  }> {
    let payload: PayCoursePayload;
    if (typeof courseIdOrPayload === 'object') {
      payload = courseIdOrPayload;
    } else {
      payload = {
        courseId: courseIdOrPayload,
        amount: maybeAmount ?? 0,
        ...opts,
      };
    }
    const res = await apiClient.post('/payments/course', payload);
    return res.data;
  },

  async payResource(
    resourceId: number,
    amount: number,
    paymentMethod?: string,
    transactionRef?: string
  ): Promise<Payment> {
    const res = await apiClient.post<Payment>('/payments/resource', {
      resourceId,
      amount,
      paymentMethod,
      transactionRef,
    });
    return res.data;
  },

  async payBundle(
    bundleIdOrPayload: number | PayBundlePayload,
    maybeAmount?: number,
    opts?: { paymentMethod?: string; transactionRef?: string; couponCode?: string }
  ): Promise<{
    payment: Payment;
    bundleTitle?: string;
    transactionRef?: string;
    paymentMethod?: string;
    amount?: number;
    itemsUnlocked?: number;
  }> {
    let payload: PayBundlePayload;
    if (typeof bundleIdOrPayload === 'object') {
      payload = bundleIdOrPayload;
    } else {
      payload = {
        bundleId: bundleIdOrPayload,
        amount: maybeAmount ?? 0,
        ...opts,
      };
    }
    const res = await apiClient.post('/payments/bundle', payload);
    return res.data;
  },

  async validateCoupon(couponCode: string, amount: number): Promise<CouponValidationResult> {
    const res = await apiClient.post<CouponValidationResult>('/payments/validate-coupon', { couponCode, amount });
    return res.data;
  },

  async getMyPurchasedBundles(): Promise<Bundle[]> {
    const res = await apiClient.get<Bundle[]>('/payments/me/bundles');
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

