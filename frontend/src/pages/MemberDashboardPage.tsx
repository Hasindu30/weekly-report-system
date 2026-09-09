import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../api/reports';
import { ReportStatus, type WeeklyReport } from '../types';
import StatusBadge from '../components/StatusBadge';
import {
  PageHeader,
  MetricCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  DataTable,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
  ErrorState,
  LoadingState,
  EmptyState,
} from '../components/ui';

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getMyReports(1, 5);
      setReports(response.data);
      setTotalRecords(response.meta.totalRecords);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to load your dashboard data.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading && reports.length === 0) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  const latestReport = reports.length > 0 ? reports[0] : null;
  const approvedCount = reports.filter((r) => r.status === ReportStatus.APPROVED).length;
  const correctionCount = reports.filter(
    (r) => r.status === ReportStatus.NEEDS_CORRECTION,
  ).length;
  const draftCount = reports.filter((r) => r.status === ReportStatus.DRAFT).length;

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Team Member'}!`}
        description="Track your weekly work submissions, deliverables, tasks, and manager reviews."
        actions={
          <Link to="/reports/new">
            <Button variant="primary" size="md">
              + Create Weekly Report
            </Button>
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={loadDashboardData} />}

      {/* 2. Executive Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 min-w-0">
        <MetricCard
          label="Total Reports"
          value={totalRecords}
          subtext="Lifetime submissions"
          tone="neutral"
        />
        <MetricCard
          label="Approved"
          value={approvedCount}
          subtext="Reviewed & accepted"
          tone="emerald"
        />
        <MetricCard
          label="Needs Correction"
          value={correctionCount}
          subtext="Awaiting revision"
          tone={correctionCount > 0 ? 'amber' : 'neutral'}
        />
        <MetricCard
          label="Active Drafts"
          value={draftCount}
          subtext="Work in progress"
          tone="indigo"
        />
      </div>

      {/* 3. Latest Report Spotlight */}
      {latestReport && (
        <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-sky-50/30 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Latest Submission Spotlight
                </span>
                <StatusBadge status={latestReport.status} size="sm" />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                Week: {latestReport.weekStart} – {latestReport.weekEnd}
              </h2>

              <p className="text-xs text-slate-600">
                Project:{' '}
                <span className="font-semibold text-slate-900">
                  {latestReport.project?.name || 'Unassigned'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {latestReport.status === ReportStatus.NEEDS_CORRECTION ||
              latestReport.status === ReportStatus.DRAFT ? (
                <Link to={`/reports/${latestReport.id}/edit`}>
                  <Button variant="primary" size="sm">
                    Edit & Resubmit
                  </Button>
                </Link>
              ) : null}
              <Link to={`/reports/${latestReport.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Recent Reports Table */}
      <Card className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Your latest submitted and draft reports.
            </CardDescription>
          </div>
          <Link
            to="/reports/history"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View All History →
          </Link>
        </CardHeader>

        <CardContent>
          {reports.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No reports created yet"
              description="Start authoring your first weekly report for your current sprint or project."
              action={{
                label: '+ Create First Report',
                to: '/reports/new',
                variant: 'primary',
              }}
            />
          ) : (
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Week Range</TableHeaderCell>
                  <TableHeaderCell>Project</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Tasks Count</TableHeaderCell>
                  <TableHeaderCell>Submitted Date</TableHeaderCell>
                  <TableHeaderCell align="right">Action</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {reports.map((report) => {
                  const canEdit =
                    report.status === ReportStatus.DRAFT ||
                    report.status === ReportStatus.NEEDS_CORRECTION;

                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium text-slate-900">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
