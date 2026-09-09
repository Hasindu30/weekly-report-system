import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalRecords <= 0) return null;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  return (
    <div
      className={`bg-slate-50/80 px-4 sm:px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 rounded-b-xl ${className}`}
    >
      <div>
        Showing <span className="font-semibold text-slate-700">{startRecord}</span> to{' '}
        <span className="font-semibold text-slate-700">{endRecord}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalRecords}</span> entries
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        >
          Previous
        </Button>

        <span className="px-2 font-medium text-slate-600">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
