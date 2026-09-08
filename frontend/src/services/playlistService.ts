import apiClient from '../api/client';
import type { Playlist } from '../types';
import { MOCK_MODE } from '../constants';
import { MOCK_PLAYLISTS } from '../mock/data';

const mockDelay = () => new Promise(r => setTimeout(r, 500));

export const playlistService = {
  async getPlaylists(params?: { subject?: string; difficulty?: string; search?: string }): Promise<Playlist[]> {
    if (MOCK_MODE) {
      await mockDelay();
      let results = MOCK_PLAYLISTS.filter(p => p.isPublished !== false);
      if (params?.search) {
        const q = params.search.toLowerCase();
        results = results.filter(p => (p.name || p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
      }
      if (params?.subject) results = results.filter(p => p.subject === params.subject);
      if (params?.difficulty) results = results.filter(p => p.difficulty === params.difficulty);
      return results;
    }
    const res = await apiClient.get<Playlist[]>('/playlists', { params });
    return res.data;
  },

  async getPlaylist(id: number): Promise<Playlist> {
    if (MOCK_MODE) {
      await mockDelay();
      const p = MOCK_PLAYLISTS.find(p => p.id === id);
      if (!p) throw new Error('Playlist not found');
      return p;
    }
    const res = await apiClient.get<Playlist>(`/playlists/${id}`);
    return res.data;
  },

  async getTutorPlaylists(): Promise<Playlist[]> {
    if (MOCK_MODE) {
      await mockDelay();
      return MOCK_PLAYLISTS;
    }
    const res = await apiClient.get<Playlist[]>('/tutor/playlists');
    return res.data;
  },

  async createPlaylist(data: Partial<Playlist>): Promise<Playlist> {
    if (MOCK_MODE) {
      await mockDelay();
      return { ...MOCK_PLAYLISTS[0], id: Date.now(), ...data } as Playlist;
    }
    const res = await apiClient.post<Playlist>('/playlists', data);
    return res.data;
  },

  async updatePlaylist(id: number, data: Partial<Playlist>): Promise<Playlist> {
    if (MOCK_MODE) {
      await mockDelay();
      const p = MOCK_PLAYLISTS.find(p => p.id === id);
      return { ...p!, ...data };
    }
    const res = await apiClient.put<Playlist>(`/playlists/${id}`, data);
    return res.data;
  },

  async reorderResources(id: number, resourceIds: number[]): Promise<void> {
    if (MOCK_MODE) { await mockDelay(); return; }
    await apiClient.put(`/playlists/${id}/reorder`, { resourceIds });
  },

  async markResourceComplete(playlistId: number, resourceId: number): Promise<void> {
    if (MOCK_MODE) { await mockDelay(); return; }
    await apiClient.post(`/playlists/${playlistId}/resources/${resourceId}/complete`);
  },
};
