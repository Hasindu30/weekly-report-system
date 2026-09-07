import apiClient from './api-client';
import type {
  WeeklyReport,
  CreateWeeklyReportPayload,
  UpdateWeeklyReportPayload,
  PaginatedReportsResponse,
} from '../types';

export const reportsApi = {
  async createReport(payload: CreateWeeklyReportPayload): Promise<WeeklyReport> {
    const response = await apiClient.post<WeeklyReport>('/reports', payload);
    return response.data;
  },

  async getMyReports(page = 1, limit = 10): Promise<PaginatedReportsResponse> {
    const response = await apiClient.get<PaginatedReportsResponse>('/reports/my', {
      params: { page, limit },
    });
    return response.data;
  },

  async getReportById(id: string): Promise<WeeklyReport> {
    const response = await apiClient.get<WeeklyReport>(`/reports/${id}`);
    return response.data;
  },

  async updateReport(
    id: string,
    payload: UpdateWeeklyReportPayload,
  ): Promise<WeeklyReport> {
    const response = await apiClient.patch<WeeklyReport>(`/reports/${id}`, payload);
    return response.data;
  },
};
