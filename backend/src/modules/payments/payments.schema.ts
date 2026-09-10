import { z } from 'zod';

export const payCourseSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0),
  paymentMethod: z.string().optional(),
  transactionRef: z.string().optional(),
  couponCode: z.string().optional(),
});

export const payResourceSchema = z.object({
  resourceId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0),
  paymentMethod: z.string().optional(),
  transactionRef: z.string().optional(),
});

export const payBundleSchema = z.object({
  bundleId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0),
  paymentMethod: z.string().optional(),
  transactionRef: z.string().optional(),
  couponCode: z.string().optional(),
});

export const validateCouponSchema = z.object({
  couponCode: z.string().min(1).max(50),
  amount: z.coerce.number().min(0),
});

export const createRefundSchema = z.object({
  paymentId: z.coerce.number().int().positive(),
  reason: z.string().min(10, 'Please provide a reason of at least 10 characters').max(1000),
});

export type PayCourseInput = z.infer<typeof payCourseSchema>;
export type PayResourceInput = z.infer<typeof payResourceSchema>;
export type PayBundleInput = z.infer<typeof payBundleSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;

