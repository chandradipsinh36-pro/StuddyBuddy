import { z } from 'zod';

export const createResourceSchema = z.object({
  courseId: z.coerce.number().int().positive().optional(),
  filename: z.string().min(1).max(500),
  fileType: z.enum(['pdf', 'image', 'ppt', 'audio', 'youtube', 'test_paper']),
  fileUrl: z.string().url().optional(),
  isLocked: z.boolean().default(false),
  price: z.coerce.number().min(0).default(0),
  moderationNotes: z.string().optional(),
});

export const updateResourceSchema = z.object({
  filename: z.string().min(1).max(500).optional(),
  fileUrl: z.string().url().optional().nullable(),
  isLocked: z.boolean().optional(),
  price: z.coerce.number().min(0).optional(),
  moderationNotes: z.string().optional(),
});

export const resourceQuerySchema = z.object({
  courseId: z.coerce.number().int().positive().optional(),
  uploadedBy: z.coerce.number().int().positive().optional(),
  fileType: z.enum(['pdf', 'image', 'ppt', 'audio', 'youtube', 'test_paper']).optional(),
  isLocked: z.coerce.boolean().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Moderation log (storage only — no AI)
export const addModerationLogSchema = z.object({
  stepName: z.string().min(1).max(100),
  stepStatus: z.enum(['pass', 'fail', 'skip']),
  stepNotes: z.string().optional(),
});

// Extracted content (storage only — no AI)
export const addExtractedContentSchema = z.object({
  extractedText: z.string().optional(),
  extractionMethod: z.enum(['pdf_parse', 'ocr', 'youtube_api', 'manual']),
});

// Video metadata (storage only — no AI)
export const addVideoMetadataSchema = z.object({
  youtubeVideoId: z.string().min(1).max(50),
  title: z.string().max(500).optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  isEmbeddable: z.boolean().default(true),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ResourceQuery = z.infer<typeof resourceQuerySchema>;
export type AddModerationLogInput = z.infer<typeof addModerationLogSchema>;
export type AddExtractedContentInput = z.infer<typeof addExtractedContentSchema>;
export type AddVideoMetadataInput = z.infer<typeof addVideoMetadataSchema>;
