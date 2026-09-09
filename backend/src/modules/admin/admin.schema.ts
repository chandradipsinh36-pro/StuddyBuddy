import { z } from 'zod';

// ============================================================
// Shared query param helpers
// ============================================================

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

// ============================================================
// User list query
// ============================================================

export const UserQuerySchema = z.object({
  page:      pageSchema,
  limit:     limitSchema,
  search:    z.string().optional(),
  role:      z.enum(['student', 'tutor', 'admin']).optional(),
  status:    z.enum(['active', 'suspended', 'banned']).optional(),
  verified:  z.enum(['true', 'false']).optional(),
  sortBy:    z.enum(['created_at', 'name', 'email']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UserQuery = z.infer<typeof UserQuerySchema>;

// ============================================================
// Tutor list query
// ============================================================

export const TutorQuerySchema = z.object({
  page:              pageSchema,
  limit:             limitSchema,
  search:            z.string().optional(),
  applicationStatus: z.enum(['pending', 'under_review', 'approved', 'rejected', 'needs_changes']).optional(),
  status:            z.enum(['active', 'suspended', 'banned']).optional(),
  verified:          z.enum(['true', 'false']).optional(),
  sortBy:            z.enum(['created_at', 'name', 'email']).default('created_at'),
  sortOrder:         z.enum(['asc', 'desc']).default('desc'),
});

export type TutorQuery = z.infer<typeof TutorQuerySchema>;

// ============================================================
// Application list query
// ============================================================

export const ApplicationQuerySchema = z.object({
  page:      pageSchema,
  limit:     limitSchema,
  status:    z.enum(['pending', 'under_review', 'approved', 'rejected', 'needs_changes']).optional(),
  search:    z.string().optional(),
  sortBy:    z.enum(['applied_at', 'reviewed_at']).default('applied_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ApplicationQuery = z.infer<typeof ApplicationQuerySchema>;

// ============================================================
// User action schemas
// ============================================================

export const SuspendUserSchema = z.object({
  reason:   z.string().min(1, 'Reason is required').max(1000),
  duration: z.enum(['indefinite', '1_day', '7_days', '30_days']).default('indefinite'),
});
export type SuspendUserInput = z.infer<typeof SuspendUserSchema>;

export const BanUserSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(1000),
});
export type BanUserInput = z.infer<typeof BanUserSchema>;

// ============================================================
// Tutor application action schemas
// ============================================================

export const ApproveTutorSchema = z.object({
  admin_note: z.string().max(2000).optional(),
});
export type ApproveTutorInput = z.infer<typeof ApproveTutorSchema>;

export const RejectTutorSchema = z.object({
  admin_note: z.string().min(1, 'A rejection reason (admin_note) is required').max(2000),
});
export type RejectTutorInput = z.infer<typeof RejectTutorSchema>;

// ============================================================
// Dashboard period query
// ============================================================

export const DashboardPeriodSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});
export type DashboardPeriodQuery = z.infer<typeof DashboardPeriodSchema>;
