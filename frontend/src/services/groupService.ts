import apiClient from '../api/client';
import type { StudyGroup, GroupMessage, GroupMember, PaginatedResponse, GroupFilters } from '../types';
import { normalizeGroup, normalizeMessage } from '../types';

export const groupService = {
  // ── Groups Listing / Details ────────────────────────────────────
  async getGroups(params?: GroupFilters): Promise<StudyGroup[]> {
    const res = await apiClient.get<PaginatedResponse<StudyGroup> | StudyGroup[]>('/groups', { params });
    // Interceptor may return { data: StudyGroup[], pagination } or StudyGroup[] directly
    const rawList = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.data || [];

    return rawList.map(normalizeGroup);
  },

  async getGroup(id: number): Promise<StudyGroup> {
    const res = await apiClient.get<StudyGroup>(`/groups/${id}`);
    return normalizeGroup(res.data);
  },

  async createGroup(data: { name: string; courseId?: number; messageQuota?: number }): Promise<StudyGroup> {
    const res = await apiClient.post<StudyGroup>('/groups', data);
    return normalizeGroup(res.data);
  },

  async updateGroup(id: number, data: { name?: string; messageQuota?: number }): Promise<StudyGroup> {
    const res = await apiClient.patch<StudyGroup>(`/groups/${id}`, data);
    return normalizeGroup(res.data);
  },

  async deleteGroup(id: number): Promise<void> {
    await apiClient.delete(`/groups/${id}`);
  },

  // ── Membership ──────────────────────────────────────────────────
  async joinGroup(id: number): Promise<void> {
    await apiClient.post(`/groups/${id}/join`);
  },

  async leaveGroup(id: number): Promise<void> {
    await apiClient.post(`/groups/${id}/leave`);
  },

  async getMembers(id: number): Promise<GroupMember[]> {
    const res = await apiClient.get<GroupMember[]>(`/groups/${id}/members`);
    return res.data;
  },

  async removeMember(groupId: number, userId: number): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },

  // ── Messages (REST fallback / history) ───────────────────────────
  async getMessages(groupId: number, params?: { page?: number; limit?: number }): Promise<GroupMessage[]> {
    const res = await apiClient.get<PaginatedResponse<GroupMessage> | GroupMessage[]>(`/groups/${groupId}/messages`, { params });
    const rawList = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.data || [];

    return rawList.map(normalizeMessage);
  },

  async sendMessage(groupId: number, content: string): Promise<GroupMessage> {
    const res = await apiClient.post<GroupMessage>(`/groups/${groupId}/messages`, { content });
    return normalizeMessage(res.data);
  },

  async deleteMessage(groupId: number, messageId: number): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/messages/${messageId}`);
  },
};
