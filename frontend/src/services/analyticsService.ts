import apiClient from '../api/client';
import type { TutorAnalytics } from '../types';
import { MOCK_MODE } from '../constants';

const mockDelay = () => new Promise(r => setTimeout(r, 700));

function generateChartData(days: number, base: number, variance: number) {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const val = Math.floor(base + Math.random() * variance);
    data.push({
      date: date.toISOString().split('T')[0],
      value: val,
      views: val,
      amount: val,
    });
  }
  return data;
}

export const analyticsService = {
  async getAnalytics(): Promise<TutorAnalytics> {
    if (MOCK_MODE) {
      await mockDelay();
      return {
        totalViews: 8420,
        totalPurchases: 312,
        conversionRate: 3.7,
        averageRating: 4.85,
        totalRevenue: 48420,
        studentEngagement: 78,
        viewsOverTime: generateChartData(30, 200, 150),
        salesOverTime: generateChartData(30, 8, 12),
        revenueOverTime: generateChartData(30, 1800, 1200),
        topResources: [
          { resource: { id: 1, title: 'Complete Calculus Notes', type: 'pdf' as const }, views: 1240, purchases: 312, revenue: 93288 },
          { resource: { id: 4, title: 'Statistics Practice Test', type: 'test_paper' as const }, views: 567, purchases: 145, revenue: 28855 },
          { resource: { id: 2, title: 'DSA Master Course', type: 'youtube' as const }, views: 3420, purchases: 0, revenue: 0 },
        ],
      };
    }
    const res = await apiClient.get<TutorAnalytics>('/tutor/analytics');
    return res.data;
  },
};
