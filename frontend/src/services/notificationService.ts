import apiClient from '../api/client';
import type { Notification } from '../types';
import { MOCK_MODE } from '../constants';
import { MOCK_NOTIFICATIONS } from '../mock/data';

const mockDelay = () => new Promise(r => setTimeout(r, 300));
let mockNotifs = [...MOCK_NOTIFICATIONS];

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    if (MOCK_MODE) {
      await mockDelay();
      return mockNotifs;
    }
    const res = await apiClient.get<Notification[]>('/notifications');
    return res.data;
  },

  async markRead(id: number): Promise<void> {
    if (MOCK_MODE) {
      await mockDelay();
      mockNotifs = mockNotifs.map(n => n.id === id ? { ...n, isRead: true } : n);
      return;
    }
    await apiClient.put(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    if (MOCK_MODE) {
      await mockDelay();
      mockNotifs = mockNotifs.map(n => ({ ...n, isRead: true }));
      return;
    }
    await apiClient.put('/notifications/read-all');
  },

  getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => !n.isRead).length;
  },
};
