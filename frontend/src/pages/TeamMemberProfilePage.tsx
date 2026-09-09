import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { TeamMemberProfileResponse } from '../types';
import { teamMembersApi } from '../api/team-members';
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

export default function TeamMemberProfilePage() {
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<TeamMemberProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await teamMembersApi.getProfile(id);
      setProfile(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to load team member profile.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading team member profile..." />;
  }

  if (error || !profile) {
    return (
      <div className="space-y-4 min-w-0">
        <ErrorState
          title="Profile Not Found"
          message={error || 'Unable to retrieve team member details.'}
          onRetry={loadProfile}
        />
        <div>
          <Link to="/manager/reports">
            <Button variant="outline" size="sm">
              ← Back to Team Reports
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { user, summary, recentReports } = profile;

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header with Back Link */}
      <PageHeader
        backLink={{
          to: '/manager/reports',
          label: 'Team Reports',
        }}
        title={`${user.firstName} ${user.lastName}`}
        description={`Team member performance profile and historical submission log for ${user.email}.`}
        badge={<StatusBadge status={user.role} size="sm" />}
      />

      {/* 2. Member Overview Card */}
      <Card className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base text-slate-900 truncate">
                  {user.firstName} {user.lastName}
                </span>
                <StatusBadge
                  status={user.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  size="sm"
                />
              </div>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <div className="text-xs text-slate-400 sm:text-right">
            Member since:{' '}
            <span className="font-medium text-slate-600">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 min-w-0">
        <MetricCard
          label="Total Reports"
          value={summary.totalReports}
          subtext="Submissions"
          tone="neutral"
        />
        <MetricCard
          label="Approved"
          value={summary.approvedReports}
          subtext="Accepted"
          tone="emerald"
        />
        <MetricCard
          label="Needs Correction"
          value={summary.needsCorrectionReports}
          subtext="Revisions"
          tone={summary.needsCorrectionReports > 0 ? 'amber' : 'neutral'}
        />
        <MetricCard
          label="Latest Status"
          value={
            summary.currentReportStatus ? (
              <StatusBadge status={summary.currentReportStatus} size="sm" />
            ) : (
              'None'
            )
          }
          subtext="Most recent"
          tone="neutral"
        />
        <MetricCard
          label="Completed Tasks"
          value={summary.totalCompletedTasks}
          subtext="Lifetime tasks"
          tone="indigo"
        />
        <MetricCard
          label="Total Blockers"
          value={summary.totalBlockers}
          subtext="Encountered"
          tone={summary.totalBlockers > 0 ? 'rose' : 'neutral'}
        />
      </div>

      {/* 4. Recent Weekly Reports Table */}
      <Card padding="none" className="min-w-0 overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 mb-0">
          <div>
            <CardTitle>Recent Weekly Reports</CardTitle>
            <CardDescription>
              Chronological submission history authored by {user.firstName}.
            </CardDescription>
          </div>
          <div className="text-xs font-medium text-slate-500">
            {recentReports.length} reports logged
          </div>
        </CardHeader>

        <CardContent>
          {recentReports.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No reports logged"
              description="This team member has not authored or submitted any weekly reports yet."
            />
          ) : (
            <DataTable className="border-none shadow-none rounded-none">
              <TableHead>
                <tr>
                  <TableHeaderCell>Week Range</TableHeaderCell>
                  <TableHeaderCell>Project</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Hours Spent</TableHeaderCell>
                  <TableHeaderCell>Submitted Date</TableHeaderCell>
                  <TableHeaderCell>Approved Date</TableHeaderCell>
                  <TableHeaderCell align="right">Action</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {recentReports.map((report) => (
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
                    <TableCell className="font-medium text-slate-700">
                      {report.totalHoursSpent !== undefined
                        ? `${report.totalHoursSpent} hrs`
                        : '—'}
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
                      <Link to={`/manager/reports/${report.id}`}>
                        <Button variant="outline" size="sm">
                          Review Report
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
