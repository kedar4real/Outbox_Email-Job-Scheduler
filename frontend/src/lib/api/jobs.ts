import { apiClient } from './client';
import type { Job, JobStatus, PaginatedJobs } from '@/types/job';

function normalizeJob(raw: any): Job {
  const statusMap: Record<string, JobStatus> = {
    SCHEDULED: 'scheduled',
    RESCHEDULED: 'rescheduled',
    SENDING: 'sending',
    SENT: 'sent',
    FAILED: 'failed',
    CANCELED: 'canceled'
  };

  return {
    id: raw.id,
    email: raw.email ?? raw.recipientEmail ?? '',
    subject: raw.subject ?? raw.campaign?.subject ?? '',
    scheduledAt: raw.scheduledAt,
    sentAt: raw.sentAt,
    status: statusMap[String(raw.status).toUpperCase()] ?? 'scheduled',
    campaignId: raw.campaignId,
    attempts: raw.attempts ?? raw.attemptsMade ?? 0,
    lastError: raw.lastError ?? null
  };
}

function extractPaginatedJobs(data: any): PaginatedJobs {
  if (Array.isArray(data)) {
    const jobs = data.map(normalizeJob);
    return { jobs, total: jobs.length, page: 1, limit: jobs.length, totalPages: 1 };
  }
  if (Array.isArray(data?.jobs)) {
    const jobs = data.jobs.map(normalizeJob);
    return {
      jobs,
      total: data.total ?? jobs.length,
      page: data.page ?? 1,
      limit: data.limit ?? jobs.length,
      totalPages: data.totalPages ?? 1
    };
  }
  if (Array.isArray(data?.data)) {
    const jobs = data.data.map(normalizeJob);
    return {
      jobs,
      total: data.total ?? jobs.length,
      page: data.page ?? 1,
      limit: data.limit ?? jobs.length,
      totalPages: data.totalPages ?? 1
    };
  }
  if (Array.isArray(data?.data?.jobs)) {
    const jobs = data.data.jobs.map(normalizeJob);
    return {
      jobs,
      total: data.data.total ?? jobs.length,
      page: data.data.page ?? 1,
      limit: data.data.limit ?? jobs.length,
      totalPages: data.data.totalPages ?? 1
    };
  }
  if (Array.isArray(data?.data?.data)) {
    const jobs = data.data.data.map(normalizeJob);
    return {
      jobs,
      total: data.data.total ?? jobs.length,
      page: data.data.page ?? 1,
      limit: data.data.limit ?? jobs.length,
      totalPages: data.data.totalPages ?? 1
    };
  }
  return { jobs: [], total: 0, page: 1, limit: 0, totalPages: 1 };
}

/**
 * Fetch paginated scheduled jobs from the API.
 */
/** listScheduledJobs helper. */
export async function listScheduledJobs(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedJobs> {
  const { data } = await apiClient.get('/api/jobs/scheduled', { params });
  return extractPaginatedJobs(data);
}

/**
 * Fetch paginated sent/failed jobs from the API.
 */
/** listSentJobs helper. */
export async function listSentJobs(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedJobs> {
  const queryParams: Record<string, string | number> = {};
  if (params?.status) queryParams.status = params.status;
  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  const { data } = await apiClient.get('/api/jobs/sent', {
    params: Object.keys(queryParams).length ? queryParams : undefined
  });
  return extractPaginatedJobs(data);
}

/**
 * Cancel a scheduled job by id.
 */
export async function cancelJob(jobId: string): Promise<void> {
  await apiClient.delete(`/api/jobs/${jobId}`);
}
