import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('sb_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap backend envelope { success, data } and normalize errors
apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps all responses: { success: true, data: T }
    // If pagination is present, preserve { data: T[], pagination: {...} }
    // Otherwise unwrap directly to data
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if ('pagination' in response.data) {
        response.data = {
          data: response.data.data,
          pagination: response.data.pagination,
        };
      } else {
        response.data = response.data.data;
      }
    }
    return response;
  },
  (error: AxiosError<{ success: false; error: { code: string; message: string; details?: unknown } }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_user');
      // Avoid redirect loop on login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    // Normalize error message from backend envelope
    const backendMessage = error.response?.data?.error?.message;
    if (backendMessage && error.message !== backendMessage) {
      (error as AxiosError & { displayMessage: string }).displayMessage = backendMessage;
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Helper to extract error message from any caught error
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof AxiosError) {
    return (err as AxiosError & { displayMessage?: string }).displayMessage
      || err.response?.data?.error?.message
      || err.message
      || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
