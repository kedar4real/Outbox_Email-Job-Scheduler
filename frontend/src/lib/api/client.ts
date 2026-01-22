import axios from 'axios';
import { toast } from 'sonner';
import { clearAuthToken, getAuthToken } from '@/lib/auth/token';

const apiUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  'http://127.0.0.1:3001';

export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      clearAuthToken();
      toast.error('Session expired.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
