import { z } from 'zod';

export const createCourseSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0).default(0),
});

export const updateCourseSchema = createCourseSchema.partial();

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
