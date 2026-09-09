import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(['student', 'tutor'], { message: 'Role must be student or tutor' }),
  trialVideoUrl: z.string().optional(),
  highestQualification: z.string().optional(),
  experienceYears: z.coerce.number().optional(),
  documentUrl: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
