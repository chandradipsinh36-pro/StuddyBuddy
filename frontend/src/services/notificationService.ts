import apiClient from '../api/client';
import type { Notification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const res = await apiClient.get<Notification[]>('/notifications');
    return res.data;
  },

  async markRead(id: number): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.put('/notifications/read-all');
  },

  getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => !n.isRead).length;
  },
};
