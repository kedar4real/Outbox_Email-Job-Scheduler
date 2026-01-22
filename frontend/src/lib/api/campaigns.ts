import { apiClient } from './client';
import type { Campaign } from '@/types/campaign';
import type { CampaignCreateRequest } from '@/types/api';
import type { CampaignTimelineResponse } from '@/types/timeline';
import { isDemoMode } from '@/lib/utils/demo';

/** listCampaigns helper. */
export async function listCampaigns(): Promise<Campaign[]> {
  if (isDemoMode()) {
    const now = Date.now();
    return [
      {
        id: 'demo-campaign-1',
        subject: 'Welcome to the demo',
        body: 'Thanks for checking out the scheduler.',
        senderId: 'demo-sender-1',
        scheduledStartAt: new Date(now + 1000 * 60 * 45).toISOString(),
        delayBetweenEmails: 2,
        hourlyLimit: 200,
        totalRecipients: 120,
        createdAt: new Date(now - 1000 * 60 * 10).toISOString()
      },
      {
        id: 'demo-campaign-2',
        subject: 'Quarterly update',
        body: 'Sharing our latest product updates and metrics.',
        senderId: 'demo-sender-2',
        scheduledStartAt: new Date(now + 1000 * 60 * 120).toISOString(),
        delayBetweenEmails: 3,
        hourlyLimit: 150,
        totalRecipients: 80,
        createdAt: new Date(now - 1000 * 60 * 60).toISOString()
      }
    ];
  }
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
  if (isDemoMode()) {
    return {
      id: `demo-campaign-${Date.now()}`,
      subject: payload.subject,
      body: payload.body,
      senderId: payload.senderId,
      scheduledStartAt: payload.scheduledStartAt,
      delayBetweenEmails: payload.delayBetweenEmails,
      hourlyLimit: payload.hourlyLimit,
      totalRecipients: payload.recipients.length,
      createdAt: new Date().toISOString()
    };
  }
  const { data } = await apiClient.post('/api/campaigns', payload);
  return data.campaign ?? data?.data?.campaign ?? data;
}

/** getCampaign helper. */
export async function getCampaign(id: string): Promise<Campaign> {
  if (isDemoMode()) {
    return {
      id,
      subject: 'Demo campaign details',
      body: 'This is a sample campaign content.',
      senderId: 'demo-sender-1',
      scheduledStartAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      delayBetweenEmails: 2,
      hourlyLimit: 200,
      totalRecipients: 42,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    };
  }
  const { data } = await apiClient.get(`/api/campaigns/${id}`);
  return data.campaign ?? data?.data?.campaign ?? data;
}

/** getCampaignTimeline helper. */
export async function getCampaignTimeline(
  id: string,
  params?: { limit?: number }
): Promise<CampaignTimelineResponse> {
  if (isDemoMode()) {
    const now = Date.now();
    return {
      campaignId: id,
      events: [
        {
          id: 'demo-event-1',
          type: 'campaign_created',
          message: 'Campaign created',
          at: new Date(now - 1000 * 60 * 12).toISOString()
        },
        {
          id: 'demo-event-2',
          type: 'campaign_scheduled',
          message: 'Campaign scheduled',
          at: new Date(now - 1000 * 60 * 8).toISOString()
        },
        {
          id: 'demo-event-3',
          type: 'job_scheduled',
          message: '120 jobs queued',
          at: new Date(now - 1000 * 60 * 5).toISOString(),
          meta: { total: 120 }
        }
      ]
    };
  }
  const { data } = await apiClient.get(`/api/campaigns/${id}/timeline`, {
    params: params?.limit ? { limit: params.limit } : undefined
  });
  return data?.timeline ?? data?.data?.timeline ?? data?.data ?? data;
}
