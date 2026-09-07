import apiClient from './api-client';
import type { Project } from '../types';

export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data;
  },
};
