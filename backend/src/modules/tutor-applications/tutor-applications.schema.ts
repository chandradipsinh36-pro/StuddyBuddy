import { z } from 'zod';

export const createApplicationSchema = z.object({
  trialVideoUrl: z.string().url('Must be a valid URL').optional(),
});

export const updateApplicationSchema = z.object({
  trialVideoUrl: z.string().url('Must be a valid URL').optional(),
});

export const addDocumentSchema = z.object({
  documentUrl: z.string().url('Must be a valid URL'),
  documentType: z.string().min(1).max(100),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type AddDocumentInput = z.infer<typeof addDocumentSchema>;
