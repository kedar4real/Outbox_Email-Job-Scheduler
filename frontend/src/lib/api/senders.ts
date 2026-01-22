import { apiClient } from './client';
import type { Sender } from '@/types/sender';
import { isDemoMode } from '@/lib/utils/demo';

function normalizeSender(raw: any): Sender {
  return {
    id: raw.id,
    name: raw.name ?? raw.displayName ?? '',
    email: raw.email,
    createdAt: raw.createdAt
  };
}

/** listSenders helper. */
export async function listSenders(): Promise<Sender[]> {
  if (isDemoMode()) {
    return [
      {
        id: 'demo-sender-1',
        name: 'Demo Campaigns',
        email: 'sender@example.com',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'demo-sender-2',
        name: 'Outbound Ops',
        email: 'ops@example.com',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      }
    ];
  }
  const { data } = await apiClient.get('/api/senders');
  if (Array.isArray(data)) {
    return data.map(normalizeSender);
  }
  if (Array.isArray(data?.senders)) {
    return data.senders.map(normalizeSender);
  }
  if (Array.isArray(data?.data)) {
    return data.data.map(normalizeSender);
  }
  if (Array.isArray(data?.data?.senders)) {
    return data.data.senders.map(normalizeSender);
  }
  return [];
}

/** createSender helper. */
export async function createSender(payload: Pick<Sender, 'name' | 'email'>): Promise<Sender> {
  if (isDemoMode()) {
    return {
      id: `demo-sender-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      createdAt: new Date().toISOString()
    };
  }
  const { data } = await apiClient.post('/api/senders', {
    displayName: payload.name,
    email: payload.email
  });
  const sender = data.sender ?? data?.data ?? data;
  return normalizeSender(sender);
}

/** deleteSender helper. */
export async function deleteSender(senderId: string): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  await apiClient.delete(`/api/senders/${senderId}`);
}
