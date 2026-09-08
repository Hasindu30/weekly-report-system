import apiClient from './api-client';
import type { TeamMemberProfileResponse } from '../types';

export const teamMembersApi = {
  async getProfile(id: string): Promise<TeamMemberProfileResponse> {
    const response = await apiClient.get<TeamMemberProfileResponse>(
      `/manager/team-members/${id}`,
    );
    return response.data;
  },
};
