import { ReportStatus, TaskStatus, TaskPriority, UserRole } from '../types';
import { Badge } from './ui/Badge';

export interface StatusBadgeProps {
  status:
    | ReportStatus
    | TaskStatus
    | TaskPriority
    | UserRole
    | 'NOT_STARTED'
    | 'ACTIVE'
    | 'INACTIVE'
    | string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  switch (status) {
    // Report Statuses
    case ReportStatus.DRAFT:
      return (
        <Badge variant="neutral" size={size} dot>
          Draft
        </Badge>
      );
    case ReportStatus.SUBMITTED:
      return (
        <Badge variant="sky" size={size} dot>
          Submitted
        </Badge>
      );
    case ReportStatus.NEEDS_CORRECTION:
      return (
        <Badge variant="amber" size={size} dot>
          Needs Correction
        </Badge>
      );
    case ReportStatus.APPROVED:
      return (
        <Badge variant="emerald" size={size} dot>
          Approved
        </Badge>
      );
    case 'NOT_STARTED':
      return (
        <Badge variant="neutral" size={size} dot>
          Not Started
        </Badge>
      );

    // Task Statuses
    case TaskStatus.TODO:
      return (
        <Badge variant="neutral" size={size}>
          To Do
        </Badge>
      );
    case TaskStatus.IN_PROGRESS:
      return (
        <Badge variant="indigo" size={size}>
          In Progress
        </Badge>
      );
    case TaskStatus.COMPLETED:
      return (
        <Badge variant="emerald" size={size}>
          Completed
        </Badge>
      );
    case TaskStatus.BLOCKED:
      return (
        <Badge variant="rose" size={size}>
          Blocked
        </Badge>
      );

    // Priorities
    case TaskPriority.HIGH:
      return (
        <Badge variant="rose" size={size}>
          High
        </Badge>
      );
    case TaskPriority.MEDIUM:
      return (
        <Badge variant="amber" size={size}>
          Medium
        </Badge>
      );
    case TaskPriority.LOW:
      return (
        <Badge variant="neutral" size={size}>
          Low
        </Badge>
      );

    // User Roles
    case UserRole.ADMIN:
      return (
        <Badge variant="purple" size={size}>
          Admin
        </Badge>
      );
    case UserRole.MANAGER:
      return (
        <Badge variant="indigo" size={size}>
          Manager
        </Badge>
      );
    case UserRole.TEAM_MEMBER:
      return (
        <Badge variant="emerald" size={size}>
          Team Member
        </Badge>
      );

    // Active/Inactive
    case 'ACTIVE':
    case 'true':
    case true as any:
      return (
        <Badge variant="emerald" size={size} dot>
          Active
        </Badge>
      );
    case 'INACTIVE':
    case 'false':
    case false as any:
      return (
        <Badge variant="neutral" size={size} dot>
          Inactive
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" size={size}>
          {String(status)}
        </Badge>
      );
  }
}