import type { User } from './user';
import type { Project } from './project';

export const ReportStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  NEEDS_CORRECTION: 'NEEDS_CORRECTION',
  APPROVED: 'APPROVED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ReviewAction = {
  APPROVED: 'APPROVED',
  REQUEST_CHANGES: 'REQUEST_CHANGES',
} as const;
export type ReviewAction = (typeof ReviewAction)[keyof typeof ReviewAction];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskType = {
  DEVELOPMENT: 'DEVELOPMENT',
  TESTING: 'TESTING',
  MEETINGS: 'MEETINGS',
  DOCUMENTATION: 'DOCUMENTATION',
  OTHER: 'OTHER',
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export interface ReportTask {
  id?: string;
  taskName: string;
  priority: TaskPriority;
  plannedPercentage: number;
  actualPercentage: number;
  status: TaskStatus;
  plannedMinutes: number;
  spentMinutes: number;
  deliverable?: string | null;
}

export interface NextWeekTask {
  id?: string;
  taskName: string;
}

export interface ReportBlocker {
  id?: string;
  description: string;
  isKeyIssue: boolean;
}

export interface ReportAchievement {
  id?: string;
  description: string;
  isKeyAchievement: boolean;
}

export interface ReportHourBreakdown {
  id?: string;
  taskType: TaskType;
  hours: number;
}

export interface ReportReview {
  id: string;
  action: ReviewAction;
  comment: string | null;
  reportVersion: number;
  createdAt: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ReportVersionMetadata {
  id: string;
  versionNumber: number;
  submittedAt: string;
  createdAt: string;
}

export interface ReportVersionSnapshot {
  weekStart: string;
  weekEnd: string;
  notes: string | null;
  project: {
    id: string;
    name: string;
    description?: string | null;
  };
  tasks: ReportTask[];
  nextWeekTasks: NextWeekTask[];
  blockers: ReportBlocker[];
  achievements: ReportAchievement[];
  hourBreakdowns: ReportHourBreakdown[];
}

export interface ReportVersion {
  id: string;
  versionNumber: number;
  snapshot: ReportVersionSnapshot;
  submittedAt: string;
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  user?: User;
  project: Project;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  notes: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: ReportTask[];
  nextWeekTasks: NextWeekTask[];
  blockers: ReportBlocker[];
  achievements: ReportAchievement[];
  hourBreakdowns: ReportHourBreakdown[];
  reviews?: ReportReview[];
  versions?: ReportVersionMetadata[];
}

export interface CreateWeeklyReportPayload {
  projectId: string;
  weekStart: string;
  weekEnd: string;
  notes?: string;
  tasks?: ReportTask[];
  nextWeekTasks?: NextWeekTask[];
  blockers?: ReportBlocker[];
  achievements?: ReportAchievement[];
  hourBreakdowns?: ReportHourBreakdown[];
}

export interface UpdateWeeklyReportPayload {
  projectId?: string;
  weekStart?: string;
  weekEnd?: string;
  notes?: string;
  tasks?: ReportTask[];
  nextWeekTasks?: NextWeekTask[];
  blockers?: ReportBlocker[];
  achievements?: ReportAchievement[];
  hourBreakdowns?: ReportHourBreakdown[];
}

export interface PaginatedReportsResponse {
  data: WeeklyReport[];
  meta: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface ManagerReportQuery {
  page?: number;
  limit?: number;
  teamMemberId?: string;
  projectId?: string;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
}

export interface ManagerReportsResponse {
  data: WeeklyReport[];
  meta: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}