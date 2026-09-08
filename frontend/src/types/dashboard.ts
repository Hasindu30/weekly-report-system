import type { TaskType } from './report';

export interface DashboardSummary {
  selectedWeekStart: string;
  selectedWeekEnd: string;
  totalTeamMembers: number;
  reportsSubmitted: number;
  submissionComplianceRate: number;
  pendingReports: number;
  lateReports: number;
  needsCorrection: number;
  openBlockers: number;
}

export interface MemberSubmissionStatus {
  userId: string;
  name: string;
  status: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
}

export interface ProjectWorkload {
  projectId: string;
  projectName: string;
  taskCount: number;
}

export interface TimeByTaskType {
  taskType: TaskType | string;
  hours: number;
}

export interface TaskCompletedTrendItem {
  weekStart: string;
  completedTasks: number;
}

export interface ActivityItem {
  type: 'REPORT_SUBMITTED' | 'CHANGES_REQUESTED' | 'REPORT_APPROVED';
  message: string;
  timestamp: string;
  reportId: string;
  userName: string;
}

export interface ManagerDashboardData {
  summary: DashboardSummary;
  submissionStatusByMember: MemberSubmissionStatus[];
  workloadByProject: ProjectWorkload[];
  timeByTaskType: TimeByTaskType[];
  tasksCompletedTrend: TaskCompletedTrendItem[];
  recentActivity: ActivityItem[];
}