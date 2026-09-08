import apiClient from './api-client';
import { type User, type AdminUsersQuery, type AdminUsersResponse, UserRole } from '../types';

export const adminUsersApi = {
  async getUsers(query?: AdminUsersQuery): Promise<AdminUsersResponse> {
    const response = await apiClient.get<AdminUsersResponse>('/admin/users', {
      params: query,
    });
    return response.data;
  },

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${id}/role`, {
      role,
    });
    return response.data;
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${id}/status`, {
      isActive,
    });
    return response.data;
  },
};
