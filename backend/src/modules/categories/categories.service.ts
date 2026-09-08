import { prisma } from '../../config/database';
import { z } from 'zod';
import { NotFoundError } from '../../utils/AppError';

export const categoryService = {
  async list() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  },

  async getById(categoryId: number) {
    const cat = await prisma.category.findUnique({ where: { categoryId } });
    if (!cat) throw new NotFoundError('Category');
    return cat;
  },
};
