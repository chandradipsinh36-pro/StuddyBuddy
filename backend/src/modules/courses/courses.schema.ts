import { z } from 'zod';

export const courseLessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(250),
  videoUrl: z.string().min(1).max(1000),
  resourceIds: z.array(z.coerce.number().int().positive()).default([]),
});

export const createCourseSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(20000).optional(),
  price: z.coerce.number().min(0).default(0),
  resourceIds: z.array(z.coerce.number().int().positive()).optional(),
  lessons: z.array(courseLessonSchema).optional(),
});

export const updateCourseSchema = createCourseSchema.extend({
  isPublished: z.boolean().optional(),
}).partial();

export const courseQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  tutorId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQuery = z.infer<typeof courseQuerySchema>;
