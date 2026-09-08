import apiClient from '../api/client';
import type { Category } from '../types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<Category[]>('/categories');
    return res.data;
  },

  async getCategory(id: number): Promise<Category> {
    const res = await apiClient.get<Category>(`/categories/${id}`);
    return res.data;
  },
};
