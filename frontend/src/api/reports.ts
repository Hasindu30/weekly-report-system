import apiClient from './api-client';
import type {
  WeeklyReport,
  CreateWeeklyReportPayload,
  UpdateWeeklyReportPayload,
  PaginatedReportsResponse,
  ManagerReportQuery,
  ManagerReportsResponse,
  ReportVersion,
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

  async submitReport(id: string): Promise<WeeklyReport> {
    const response = await apiClient.post<WeeklyReport>(`/reports/${id}/submit`);
    return response.data;
  },

  async getManagerReports(params?: ManagerReportQuery): Promise<ManagerReportsResponse> {
    const response = await apiClient.get<ManagerReportsResponse>('/manager/reports', {
      params,
    });
    return response.data;
  },

  async getManagerReportById(id: string): Promise<WeeklyReport> {
    const response = await apiClient.get<WeeklyReport>(`/manager/reports/${id}`);
    return response.data;
  },

  async getReportVersion(
    id: string,
    versionNumber: number,
  ): Promise<ReportVersion> {
    const response = await apiClient.get<ReportVersion>(
      `/manager/reports/${id}/versions/${versionNumber}`,
    );
    return response.data;
  },

  async requestReportChanges(
    id: string,
    comment: string,
  ): Promise<WeeklyReport> {
    const response = await apiClient.post<WeeklyReport>(
      `/manager/reports/${id}/request-changes`,
      { comment },
    );
    return response.data;
  },

  async approveReport(id: string): Promise<WeeklyReport> {
    const response = await apiClient.post<WeeklyReport>(
      `/manager/reports/${id}/approve`,
    );
    return response.data;
  },
};