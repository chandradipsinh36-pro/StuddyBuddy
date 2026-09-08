import apiClient from '../api/client';
import type { EarningRecord, EarningsSummary } from '../types';
import { MOCK_MODE } from '../constants';

const mockDelay = () => new Promise(r => setTimeout(r, 600));

export const earningsService = {
  async getSummary(): Promise<EarningsSummary> {
    if (MOCK_MODE) {
      await mockDelay();
      return {
        totalEarnings: 48420,
        currentBalance: 12350,
        pendingEarnings: 3200,
        completedEarnings: 45220,
        thisMonthEarnings: 8640,
        lastMonthEarnings: 7200,
      };
    }
    const res = await apiClient.get<EarningsSummary>('/tutor/earnings/summary');
    return res.data;
  },

  async getTransactions(): Promise<EarningRecord[]> {
    if (MOCK_MODE) {
      await mockDelay();
      return [
        { id: 1, tutorId: 1, purchaseId: 1, resourceId: 1, resource: { id: 1, title: 'Complete Calculus Notes', type: 'pdf' }, buyerName: 'Alex Johnson', grossAmount: 299, platformFee: 45, netAmount: 254, status: 'completed', createdAt: '2026-09-07T10:00:00Z' },
        { id: 2, tutorId: 1, purchaseId: 2, resourceId: 4, resource: { id: 4, title: 'Statistics Practice Test', type: 'test_paper' }, buyerName: 'Maria Santos', grossAmount: 199, platformFee: 30, netAmount: 169, status: 'completed', createdAt: '2026-09-07T09:00:00Z' },
        { id: 3, tutorId: 1, purchaseId: 3, resourceId: 1, resource: { id: 1, title: 'Complete Calculus Notes', type: 'pdf' }, buyerName: 'Tom Richards', grossAmount: 299, platformFee: 45, netAmount: 254, status: 'completed', createdAt: '2026-09-06T15:00:00Z' },
        { id: 4, tutorId: 1, purchaseId: 4, resourceId: 4, resource: { id: 4, title: 'Statistics Practice Test', type: 'test_paper' }, buyerName: 'Aisha Khan', grossAmount: 199, platformFee: 30, netAmount: 169, status: 'pending', createdAt: '2026-09-06T12:00:00Z' },
      ];
    }
    const res = await apiClient.get<EarningRecord[]>('/tutor/earnings/transactions');
    return res.data;
  },
};
