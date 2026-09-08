import { z } from 'zod';

const ratingSchema = z.coerce.number().int().min(1, 'Rating must be between 1-5').max(5, 'Rating must be between 1-5');

export const createCourseReviewSchema = z.object({
  rating: ratingSchema,
  comment: z.string().max(2000).optional(),
});

export const updateCourseReviewSchema = createCourseReviewSchema.partial();

export const createTutorReviewSchema = z.object({
  rating: ratingSchema,
  comment: z.string().max(2000).optional(),
});

export const updateTutorReviewSchema = createTutorReviewSchema.partial();

export type CreateCourseReviewInput = z.infer<typeof createCourseReviewSchema>;
export type UpdateCourseReviewInput = z.infer<typeof updateCourseReviewSchema>;
export type CreateTutorReviewInput = z.infer<typeof createTutorReviewSchema>;
export type UpdateTutorReviewInput = z.infer<typeof updateTutorReviewSchema>;
