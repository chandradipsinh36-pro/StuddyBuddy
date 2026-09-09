import apiClient from '../api/client';
import type { EarningRecord, EarningsSummary } from '../types';

export const earningsService = {
  async getSummary(): Promise<EarningsSummary> {
    const res = await apiClient.get<EarningsSummary>('/tutor/earnings/summary');
    return res.data;
  },

  async getTransactions(): Promise<EarningRecord[]> {
    const res = await apiClient.get<EarningRecord[]>('/tutor/earnings/transactions');
    return res.data;
  },
};
