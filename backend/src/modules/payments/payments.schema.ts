import { z } from 'zod';

export const payCourseSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0),
});

export const payResourceSchema = z.object({
  resourceId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0),
});

export const payBundleSchema = z.object({
  bundleId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0),
});

export const createRefundSchema = z.object({
  paymentId: z.coerce.number().int().positive(),
  reason: z.string().min(10, 'Please provide a reason of at least 10 characters').max(1000),
});

export type PayCourseInput = z.infer<typeof payCourseSchema>;
export type PayResourceInput = z.infer<typeof payResourceSchema>;
export type PayBundleInput = z.infer<typeof payBundleSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
