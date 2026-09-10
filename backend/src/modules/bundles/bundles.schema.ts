import { z } from 'zod';

export const createBundleSchema = z.object({
  title: z.string().trim().min(3, 'Bundle title must be at least 3 characters').max(150, 'Bundle title cannot exceed 150 characters'),
  description: z.string().trim().max(5000, 'Description cannot exceed 5000 characters').optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(100000, 'Price cannot exceed ₹1,00,000').default(0),
  originalPrice: z.coerce.number().min(0, 'Original price cannot be negative').max(100000, 'Original price cannot exceed ₹1,00,000').optional(),
  discountPercent: z.coerce.number().min(0, 'Discount percent cannot be negative').max(100, 'Discount percent cannot exceed 100%').optional(),
  resourceIds: z.array(z.coerce.number()).optional(),
});

export const updateBundleSchema = createBundleSchema.partial();

export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleSchema>;

