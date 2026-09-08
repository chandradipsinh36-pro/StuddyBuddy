import apiClient from '../api/client';
import type { AIConversation, AIMessage, AIUsage } from '../types';
import { MOCK_MODE, AI_FREE_LIMIT } from '../constants';

const mockDelay = () => new Promise(r => setTimeout(r, 800));

const mockConversations: AIConversation[] = [
  { id: 1, userId: 1, title: 'Understanding Derivatives', createdAt: '2026-09-07T08:00:00Z', updatedAt: '2026-09-07T08:30:00Z', messageCount: 6 },
  { id: 2, userId: 1, title: 'Organic Chemistry Mechanisms', createdAt: '2026-09-06T14:00:00Z', updatedAt: '2026-09-06T14:45:00Z', messageCount: 8 },
  { id: 3, userId: 1, title: 'Binary Search Trees', createdAt: '2026-09-05T10:00:00Z', updatedAt: '2026-09-05T10:20:00Z', messageCount: 4 },
];

const mockMessages: Record<number, AIMessage[]> = {
  1: [
    { id: 1, conversationId: 1, role: 'user', content: 'Can you explain what a derivative is in simple terms?', createdAt: '2026-09-07T08:00:00Z' },
    { id: 2, conversationId: 1, role: 'assistant', content: "Great question! A derivative is essentially the **rate of change** of a function at any given point.\n\nThink of it this way: if you're driving a car and your position changes over time, your **speed** is the derivative of your position with respect to time.\n\n**Formally:** The derivative of f(x) is defined as:\n```\nf'(x) = lim(h→0) [f(x+h) - f(x)] / h\n```\n\nThis measures how fast f(x) changes as x changes infinitesimally.\n\n**Simple example:** If f(x) = x², then f'(x) = 2x.\n- At x = 3, the rate of change is 2(3) = 6\n- This means the function is increasing 6 times faster than x at that point", createdAt: '2026-09-07T08:01:00Z' },
  ],
};

let usageCount = 3;

export const aiService = {
  async getConversations(): Promise<AIConversation[]> {
    if (MOCK_MODE) {
      await mockDelay();
      return mockConversations;
    }
    const res = await apiClient.get<AIConversation[]>('/ai/conversations');
    return res.data;
  },

  async createConversation(firstMessage: string): Promise<{ conversation: AIConversation; reply: AIMessage }> {
    if (MOCK_MODE) {
      await mockDelay();
      const conv: AIConversation = {
        id: Date.now(), userId: 1,
        title: firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : ''),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messageCount: 1,
      };
      const reply: AIMessage = {
        id: Date.now() + 1, conversationId: conv.id, role: 'assistant',
        content: "I'm StudyBuddy AI, your intelligent study companion! 🎓\n\nI'm here to help you understand complex topics, solve problems, and guide your learning journey.\n\nI've received your question and I'm analyzing it now. Here's what I can help you with:\n\n- **Concept explanations** — breaking down complex ideas\n- **Problem solving** — step-by-step solutions\n- **Study strategies** — personalized learning tips\n- **Examples** — real-world applications\n\nWhat subject would you like to explore today?",
        createdAt: new Date().toISOString(),
      };
      usageCount++;
      return { conversation: conv, reply };
    }
    const res = await apiClient.post('/ai/conversations', { message: firstMessage });
    return res.data;
  },

  async getMessages(conversationId: number): Promise<AIMessage[]> {
    if (MOCK_MODE) {
      await mockDelay();
      return mockMessages[conversationId] || [];
    }
    const res = await apiClient.get<AIMessage[]>(`/ai/conversations/${conversationId}/messages`);
    return res.data;
  },

  async sendMessage(conversationId: number, content: string): Promise<AIMessage> {
    if (MOCK_MODE) {
      await mockDelay();
      usageCount++;
      return {
        id: Date.now(), conversationId, role: 'assistant',
        content: `That's an excellent question about "${content.slice(0, 30)}..."!\n\nLet me break this down for you:\n\n**Key Concepts:**\n1. This topic involves understanding the fundamental principles\n2. The relationship between the variables is important\n3. Consider the context and constraints\n\n**Step-by-step approach:**\n- Start with what you know\n- Identify what you need to find\n- Apply the relevant formulas or concepts\n- Verify your answer\n\nWould you like me to elaborate on any specific aspect?`,
        createdAt: new Date().toISOString(),
      };
    }
    const res = await apiClient.post<AIMessage>(`/ai/conversations/${conversationId}/messages`, { content });
    return res.data;
  },

  async getUsage(): Promise<AIUsage> {
    if (MOCK_MODE) {
      await mockDelay();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return { used: usageCount, limit: AI_FREE_LIMIT, isPremium: false, resetsAt: tomorrow.toISOString() };
    }
    const res = await apiClient.get<AIUsage>('/ai/usage');
    return res.data;
  },

  async markHelpful(messageId: number, isHelpful: boolean): Promise<void> {
    if (MOCK_MODE) { await mockDelay(); return; }
    await apiClient.post(`/ai/messages/${messageId}/feedback`, { isHelpful });
  },
};
