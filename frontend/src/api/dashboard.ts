import apiClient from './api-client';
import type { ManagerDashboardData } from '../types';

export const dashboardApi = {
  async getManagerDashboard(weekStart?: string): Promise<ManagerDashboardData> {
    const response = await apiClient.get<ManagerDashboardData>('/manager/dashboard', {
      params: weekStart ? { weekStart } : undefined,
    });
    return response.data;
  },
};