import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ReportStatus, type WeeklyReport } from '../types';
import { reportsApi } from '../api/reports';
import StatusBadge from '../components/StatusBadge';
import {
  PageHeader,
  Card,
  DataTable,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Pagination,
  Button,
  ErrorState,
  LoadingState,
  EmptyState,
} from '../components/ui';

export default function ReportHistoryPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const limit = 10;

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getMyReports(page, limit);
      setReports(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalRecords(response.meta.totalRecords);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load report history.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header */}
      <PageHeader
        title="Report History"
        description="Comprehensive log of all weekly reports authored, submitted, and reviewed."
        actions={
          <Link to="/reports/new">
            <Button variant="primary" size="md">
              + New Weekly Report
            </Button>
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={loadReports} />}

      {/* 2. Main Data Table Card */}
      <Card padding="none" className="min-w-0 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading your report history..." />
        ) : reports.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No reports found"
            description="You haven't created any weekly reports yet. Click below to draft your first one."
            action={{
              label: '+ Create Weekly Report',
              to: '/reports/new',
              variant: 'primary',
            }}
          />
        ) : (
          <div>
            <DataTable className="border-none shadow-none rounded-none">
              <TableHead>
                <tr>
                  <TableHeaderCell>Week Range</TableHeaderCell>
                  <TableHeaderCell>Project</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Tasks</TableHeaderCell>
                  <TableHeaderCell>Submitted Date</TableHeaderCell>
                  <TableHeaderCell>Approved Date</TableHeaderCell>
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {reports.map((report) => {
                  const canEdit =
                    report.status === ReportStatus.DRAFT ||
                    report.status === ReportStatus.NEEDS_CORRECTION;

                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {report.weekStart} – {report.weekEnd}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {report.project?.name || '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {report.tasks?.length || 0} tasks
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {report.submittedAt
                          ? new Date(report.submittedAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {report.approvedAt
                          ? new Date(report.approvedAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Link to={`/reports/${report.id}/edit`}>
                              <Button variant="secondary" size="sm">
                                Edit
                              </Button>
                            </Link>
                          )}
                          <Link to={`/reports/${report.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
