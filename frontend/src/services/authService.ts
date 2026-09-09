import apiClient from '../api/client';
import type { User, AuthUser } from '../types';

interface LoginPayload { email: string; password: string; }
interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'tutor';
  trialVideoUrl?: string;
  highestQualification?: string;
  experienceYears?: number;
  documentUrl?: string;
  subjects?: string[];
  bio?: string;
}

// Backend returns { user, token } inside the envelope (envelope stripped by interceptor)
interface AuthResponse { user: User; token: string; }

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload);
    const { user, token } = res.data;
    const authUser: AuthUser = { ...user, token, avatarUrl: user.profilePic ?? undefined };
    return authUser;
  },

  async register(payload: RegisterPayload): Promise<AuthUser> {
    const res = await apiClient.post<AuthResponse>('/auth/register', payload);
    const { user, token } = res.data;
    const authUser: AuthUser = { ...user, token, avatarUrl: user.profilePic ?? undefined };
    return authUser;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    return { ...res.data, avatarUrl: res.data.profilePic ?? undefined };
  },

  async logout(): Promise<void> {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
  },
};
