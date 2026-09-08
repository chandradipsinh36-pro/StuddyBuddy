import { z } from 'zod';

export const createProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  instituteName: z.string().max(200).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
});

export const updateProfileSchema = createProfileSchema.partial();

export const createSkillSchema = z.object({
  skillName: z.string().min(1).max(100),
  proficiency: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate'),
});

export const updateSkillSchema = createSkillSchema.partial();

export const tutorListQuerySchema = z.object({
  search: z.string().optional(),
  skill: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
export type TutorListQuery = z.infer<typeof tutorListQuerySchema>;
