import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
  courseId: z.coerce.number().int().positive().optional(),
  messageQuota: z.coerce.number().int().min(100).max(100000).default(1000),
});

export const updateGroupSchema = z.object({
  name: z.string().min(3).max(100).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

export const reportMessageSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason').max(1000),
});

export const groupPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  quotaAdded: z.coerce.number().int().positive(),
});

export const groupQuerySchema = z.object({
  courseId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const messageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.number().int().positive().optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ReportMessageInput = z.infer<typeof reportMessageSchema>;
export type GroupPaymentInput = z.infer<typeof groupPaymentSchema>;
export type GroupQuery = z.infer<typeof groupQuerySchema>;
export type MessageQuery = z.infer<typeof messageQuerySchema>;
