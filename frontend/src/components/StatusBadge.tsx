import { ReportStatus } from '../types';

interface StatusBadgeProps {
  status: ReportStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case ReportStatus.DRAFT:
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case ReportStatus.SUBMITTED:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case ReportStatus.NEEDS_CORRECTION:
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case ReportStatus.APPROVED:
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case ReportStatus.DRAFT:
        return 'Draft';
      case ReportStatus.SUBMITTED:
        return 'Submitted';
      case ReportStatus.NEEDS_CORRECTION:
        return 'Needs Correction';
      case ReportStatus.APPROVED:
        return 'Approved';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}
    >
      {getLabel()}
    </span>
  );
}
