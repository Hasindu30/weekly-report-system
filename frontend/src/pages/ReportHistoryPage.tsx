import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ReportStatus, type WeeklyReport } from '../types';
import { reportsApi } from '../api/reports';
import StatusBadge from '../components/StatusBadge';

export default function ReportHistoryPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const limit = 10;

  useEffect(() => {
    async function loadReports() {
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
    }

    loadReports();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track, view, and manage your weekly report submissions.
          </p>
        </div>
        <Link
          to="/reports/new"
          className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm transition-colors"
        >
          + New Weekly Report
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Reports Table / Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 font-medium">Loading reports...</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-gray-400 text-4xl">📋</div>
            <h3 className="text-base font-semibold text-gray-900">No Weekly Reports Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              You haven't created any weekly reports yet. Click the button below to create your first report.
            </p>
            <div className="pt-2">
              <Link
                to="/reports/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 border border-indigo-200"
              >
                Create Your First Report
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
                  <th className="py-3.5 px-6">Last Updated</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => {
                  const isEditable =
                    report.status === ReportStatus.DRAFT ||
                    report.status === ReportStatus.NEEDS_CORRECTION;

                  return (
                    <tr key={report.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900 whitespace-nowrap">
                        {report.weekStart} – {report.weekEnd}
                      </td>
                      <td className="py-4 px-6 text-gray-800 font-medium whitespace-nowrap">
                        {report.project?.name || '—'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                        {report.tasks?.length ?? 0} tasks
                      </td>
                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {new Date(report.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-3">
                        <Link
                          to={`/reports/${report.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        {isEditable && (
                          <Link
                            to={`/reports/${report.id}/edit`}
                            className="font-medium text-amber-600 hover:text-amber-900"
                          >
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && reports.length > 0 && (
          <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * limit, totalRecords)}
              </span>{' '}
              of <span className="font-medium">{totalRecords}</span> reports
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 text-xs text-gray-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
