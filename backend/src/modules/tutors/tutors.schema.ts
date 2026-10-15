import { z } from 'zod';
import { isSafeEducationalContent } from '../../utils/contentModeration';

export const createProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).refine((val) => !val || isSafeEducationalContent(val).isSafe, {
    message: 'Bio contains inappropriate or adult language',
  }).optional(),
  instituteName: z.string().max(200).refine((val) => !val || isSafeEducationalContent(val).isSafe, {
    message: 'Qualification or institute contains inappropriate or adult language',
  }).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
  trialVideoUrl: z.string().url().or(z.string()).optional(),
  skills: z.union([z.array(z.string()), z.string()]).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const createSkillSchema = z.object({
  skillName: z.string()
    .min(2, 'Skill or subject must be at least 2 characters')
    .max(80, 'Skill or subject cannot exceed 80 characters')
    .refine((val) => isSafeEducationalContent(val).isSafe, {
      message: 'Inappropriate, adult, or vulgar language is not permitted',
    })
    .refine((val) => !/(https?:\/\/|www\.|\.com|@|[0-9]{7,})/i.test(val), {
      message: 'Links, emails, or phone numbers are not allowed as skill or subject names',
    }),
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
