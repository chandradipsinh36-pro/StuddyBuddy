import apiClient from '../api/client';
import type { AIConversation, AIMessage, AIUsage } from '../types';

export const aiService = {
  async getConversations(): Promise<AIConversation[]> {
    const res = await apiClient.get<AIConversation[]>('/ai/conversations');
    return res.data;
  },

  async createConversation(firstMessage: string): Promise<{ conversation: AIConversation; reply: AIMessage }> {
    const res = await apiClient.post('/ai/conversations', { message: firstMessage });
    return res.data;
  },

  async getMessages(conversationId: number): Promise<AIMessage[]> {
    const res = await apiClient.get<AIMessage[]>(`/ai/conversations/${conversationId}/messages`);
    return res.data;
  },

  async sendMessage(conversationId: number, content: string): Promise<AIMessage> {
    const res = await apiClient.post<AIMessage>(`/ai/conversations/${conversationId}/messages`, { content });
    return res.data;
  },

  async getUsage(): Promise<AIUsage> {
    const res = await apiClient.get<AIUsage>('/ai/usage');
    return res.data;
  },

  async markHelpful(messageId: number, isHelpful: boolean): Promise<void> {
    await apiClient.post(`/ai/messages/${messageId}/feedback`, { isHelpful });
  },
};
