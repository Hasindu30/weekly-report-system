import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../api/reports';
import { ReportStatus, type WeeklyReport } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
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
    }

    loadDashboardData();
  }, []);

  const latestReport = reports.length > 0 ? reports[0] : null;
  const approvedCount = reports.filter((r) => r.status === ReportStatus.APPROVED).length;
  const correctionCount = reports.filter((r) => r.status === ReportStatus.NEEDS_CORRECTION).length;
  const draftCount = reports.filter((r) => r.status === ReportStatus.DRAFT).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your weekly reports, tasks, deliverables, and submissions.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/reports/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            + Create New Report
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Total Submissions
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{totalRecords}</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-emerald-600 font-medium uppercase tracking-wider">
            Approved Reports
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{approvedCount}</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-amber-600 font-medium uppercase tracking-wider">
            Needs Correction
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{correctionCount}</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-indigo-600 font-medium uppercase tracking-wider">
            Active Drafts
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2">{draftCount}</div>
        </div>
      </div>

      {/* Latest Report Callout */}
      {latestReport && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Latest Submission
                </span>
                <StatusBadge status={latestReport.status} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-1">
                Week: {latestReport.weekStart} – {latestReport.weekEnd}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Project: <span className="font-semibold">{latestReport.project?.name || '—'}</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {latestReport.status === ReportStatus.NEEDS_CORRECTION ||
              latestReport.status === ReportStatus.DRAFT ? (
                <Link
                  to={`/reports/${latestReport.id}/edit`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Edit & Resubmit
                </Link>
              ) : null}
              <Link
                to={`/reports/${latestReport.id}`}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Reports Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Reports</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Your latest submitted and draft reports.
            </p>
          </div>
          <Link
            to="/reports/history"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All History →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 font-medium">Loading reports...</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-gray-400 text-4xl">📝</div>
            <h3 className="text-base font-semibold text-gray-900">No Reports Created Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Get started by creating your first weekly report for your assigned project.
            </p>
            <div className="pt-2">
              <Link
                to="/reports/new"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                + Create Report
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">Week Range</th>
                  <th className="py-3.5 px-6">Project</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Tasks Count</th>
                  <th className="py-3.5 px-6">Submitted Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => {
                  const canEdit =
                    report.status === ReportStatus.DRAFT ||
                    report.status === ReportStatus.NEEDS_CORRECTION;

                  return (
                    <tr key={report.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-4 px-6 text-gray-900 font-medium whitespace-nowrap">
                        {report.weekStart} – {report.weekEnd}
                      </td>
                      <td className="py-4 px-6 text-gray-800 whitespace-nowrap">
                        {report.project?.name || '—'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                        {report.tasks?.length || 0} tasks
                      </td>
                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {report.submittedAt
                          ? new Date(report.submittedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                        {canEdit && (
                          <Link
                            to={`/reports/${report.id}/edit`}
                            className="font-medium px-3 py-1.5 rounded-md text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            Edit
                          </Link>
                        )}
                        <Link
                          to={`/reports/${report.id}`}
                          className="font-medium px-3 py-1.5 rounded-md text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
