import apiClient from './api-client';
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from '../types';

export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data;
  },

  async getProjectById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', payload);
    return response.data;
  },

  async updateProject(
    id: string,
    payload: UpdateProjectPayload,
  ): Promise<Project> {
    const response = await apiClient.patch<Project>(`/projects/${id}`, payload);
    return response.data;
  },

  async deleteProject(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/projects/${id}`,
    );
    return response.data;
  },
};