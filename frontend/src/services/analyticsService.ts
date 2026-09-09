import apiClient from '../api/client';
import type { TutorAnalytics } from '../types';

export const analyticsService = {
  async getAnalytics(): Promise<TutorAnalytics> {
    const res = await apiClient.get<TutorAnalytics>('/tutor/analytics');
    return res.data;
  },
};
