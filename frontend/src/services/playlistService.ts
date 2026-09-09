import apiClient from '../api/client';
import type { Playlist } from '../types';

export const playlistService = {
  async getPlaylists(params?: { subject?: string; difficulty?: string; search?: string }): Promise<Playlist[]> {
    const res = await apiClient.get<Playlist[]>('/playlists', { params });
    return res.data;
  },

  async getPlaylist(id: number): Promise<Playlist> {
    const res = await apiClient.get<Playlist>(`/playlists/${id}`);
    return res.data;
  },

  async getTutorPlaylists(): Promise<Playlist[]> {
    const res = await apiClient.get<Playlist[]>('/tutor/playlists');
    return res.data;
  },

  async createPlaylist(data: Partial<Playlist>): Promise<Playlist> {
    const res = await apiClient.post<Playlist>('/playlists', data);
    return res.data;
  },

  async updatePlaylist(id: number, data: Partial<Playlist>): Promise<Playlist> {
    const res = await apiClient.put<Playlist>(`/playlists/${id}`, data);
    return res.data;
  },

  async reorderResources(id: number, resourceIds: number[]): Promise<void> {
    await apiClient.put(`/playlists/${id}/reorder`, { resourceIds });
  },

  async markResourceComplete(playlistId: number, resourceId: number): Promise<void> {
    await apiClient.post(`/playlists/${playlistId}/resources/${resourceId}/complete`);
  },
};
