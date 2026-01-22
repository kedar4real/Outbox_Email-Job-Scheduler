import { apiClient } from './client';
import type { User } from '@/types/user';
import { isDemoMode } from '@/lib/utils/demo';

/** getCurrentUser helper. */
export async function getCurrentUser(): Promise<User> {
  if (isDemoMode()) {
    return {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo.user@example.com',
      image: null
    };
  }
  const { data } = await apiClient.get('/api/auth/me');
  return data.user ?? data?.data?.user ?? data;
}

/** logout helper. */
export async function logout(): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  await apiClient.post('/api/auth/logout');
}
