import { apiClient } from './client';
import type { Campaign } from '@/types/campaign';
import type { CampaignCreateRequest } from '@/types/api';
import type { CampaignTimelineResponse } from '@/types/timeline';

/** listCampaigns helper. */
export async function listCampaigns(): Promise<Campaign[]> {
  const { data } = await apiClient.get('/api/campaigns');
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.campaigns)) {
    return data.campaigns;
  }
  if (Array.isArray(data?.data?.campaigns)) {
    return data.data.campaigns;
  }
  return [];
}

/** createCampaign helper. */
export async function createCampaign(payload: CampaignCreateRequest): Promise<Campaign> {
  const { data } = await apiClient.post('/api/campaigns', payload);
  return data.campaign ?? data?.data?.campaign ?? data;
}

/** getCampaign helper. */
export async function getCampaign(id: string): Promise<Campaign> {
  const { data } = await apiClient.get(`/api/campaigns/${id}`);
  return data.campaign ?? data?.data?.campaign ?? data;
}

/** getCampaignTimeline helper. */
export async function getCampaignTimeline(
  id: string,
  params?: { limit?: number }
): Promise<CampaignTimelineResponse> {
  const { data } = await apiClient.get(`/api/campaigns/${id}/timeline`, {
    params: params?.limit ? { limit: params.limit } : undefined
  });
  return data?.timeline ?? data?.data?.timeline ?? data?.data ?? data;
}
