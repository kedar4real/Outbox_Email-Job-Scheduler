import { apiClient } from './client';
import type { User } from '@/types/user';

/** getCurrentUser helper. */
export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get('/api/auth/me');
  return data.user ?? data?.data?.user ?? data;
}

/** logout helper. */
export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}
