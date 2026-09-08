export const UserRole = {
  TEAM_MEMBER: 'TEAM_MEMBER',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface AdminUsersResponse {
  data: User[];
  meta: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface TeamMemberProfileSummary {
  totalReports: number;
  approvedReports: number;
  needsCorrectionReports: number;
  currentReportStatus: string | null;
  totalCompletedTasks: number;
  totalBlockers: number;
}

export interface TeamMemberRecentReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id?: string;
    name?: string;
  };
  totalHoursSpent?: number;
}

export interface TeamMemberProfileResponse {
  user: User;
  summary: TeamMemberProfileSummary;
  recentReports: TeamMemberRecentReport[];
}
