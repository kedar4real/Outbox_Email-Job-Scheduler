import { apiClient } from './client';
import { isDemoMode } from '@/lib/utils/demo';

export interface CsvValidationResult {
  total: number;
  valid: string[];
  invalid: string[];
  duplicates: number;
}

/** validateCsvFile helper. */
export async function validateCsvFile(file: File): Promise<CsvValidationResult> {
  if (isDemoMode()) {
    throw new Error('CSV validation not available in demo mode.');
  }
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/api/csv/validate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data?.data ?? data;
}
