import apiClient from '../api/client';
import type { TutorApplication, TutorApplicationDocument } from '../types';

export const applicationService = {
  async submitApplication(data: { trialVideoUrl?: string }): Promise<TutorApplication> {
    const res = await apiClient.post<TutorApplication>('/tutor-applications', data);
    return res.data;
  },

  async getMyApplication(): Promise<TutorApplication> {
    const res = await apiClient.get<TutorApplication>('/tutor-applications/me');
    return res.data;
  },

  async updateMyApplication(data: { trialVideoUrl?: string }): Promise<TutorApplication> {
    const res = await apiClient.patch<TutorApplication>('/tutor-applications/me', data);
    return res.data;
  },

  async addDocument(data: { documentUrl: string; documentType: string }): Promise<TutorApplicationDocument> {
    const res = await apiClient.post<TutorApplicationDocument>('/tutor-applications/me/documents', data);
    return res.data;
  },

  async listDocuments(): Promise<TutorApplicationDocument[]> {
    const res = await apiClient.get<TutorApplicationDocument[]>('/tutor-applications/me/documents');
    return res.data;
  },

  async deleteDocument(docId: number): Promise<void> {
    await apiClient.delete(`/tutor-applications/me/documents/${docId}`);
  },
};
