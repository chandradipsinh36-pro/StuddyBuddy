import { z } from 'zod';

export const createBundleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0).default(0),
  resourceIds: z.array(z.coerce.number()).optional(),
});

export const updateBundleSchema = createBundleSchema.partial();

export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleSchema>;
