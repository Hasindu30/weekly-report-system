import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ReportStatus, type WeeklyReport, type Project } from '../types';
import { reportsApi } from '../api/reports';
import { projectsApi } from '../api/projects';
import StatusBadge from '../components/StatusBadge';

export default function ManagerReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const limit = 10;

  // Load Projects for filter
  useEffect(() => {
    async function loadProjects() {
      try {
        const projectList = await projectsApi.getProjects();
        setProjects(projectList);
      } catch {
        // Ignore filter load failure gracefully
      }
    }
    loadProjects();
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getManagerReports({
        page,
        limit,
        projectId: selectedProject || undefined,
        status: (selectedStatus as ReportStatus) || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReports(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalRecords(response.meta.totalRecords);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load manager reports.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedProject, selectedStatus, startDate, endDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleClearFilters = () => {
    setSelectedProject('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Weekly Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, approve, or request changes on weekly submissions from team members.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Filter Card */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="text-sm font-semibold text-gray-800">Filter Reports</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Project filter */}
          <div>
            <label htmlFor="filter-project" className="block text-xs font-medium text-gray-600 mb-1">
              Project
            </label>
            <select
              id="filter-project"
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value={ReportStatus.SUBMITTED}>Submitted (Pending Review)</option>
              <option value={ReportStatus.NEEDS_CORRECTION}>Needs Correction</option>
              <option value={ReportStatus.APPROVED}>Approved</option>
              <option value={ReportStatus.DRAFT}>Draft</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="filter-start-date" className="block text-xs font-medium text-gray-600 mb-1">
              From Date
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="filter-end-date" className="block text-xs font-medium text-gray-600 mb-1">
              To Date
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {(selectedProject || selectedStatus || startDate || endDate) && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Reports Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 font-medium">Loading submissions...</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-gray-400 text-4xl">📄</div>
            <h3 className="text-base font-semibold text-gray-900">No Reports Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              No weekly reports match your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">Team Member</th>
                  <th className="py-3.5 px-6">Week Range</th>
                  <th className="py-3.5 px-6">Project</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Submitted Date</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => {
                  const isPendingReview = report.status === ReportStatus.SUBMITTED;
                  return (
                    <tr key={report.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                        {report.user?.id ? (
                          <Link
                            to={`/manager/team-members/${report.user.id}`}
                            className="text-indigo-600 hover:text-indigo-900 hover:underline font-semibold block"
                          >
                            {report.user?.firstName} {report.user?.lastName}
                          </Link>
                        ) : (
                          <div>
                            {report.user?.firstName} {report.user?.lastName}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">{report.user?.email}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-800 whitespace-nowrap">
                        {report.weekStart} – {report.weekEnd}
                      </td>
                      <td className="py-4 px-6 text-gray-800 font-medium whitespace-nowrap">
                        {report.project?.name || '—'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Link
                          to={`/manager/reports/${report.id}`}
                          className={`font-semibold px-3 py-1.5 rounded-md text-xs transition-colors ${
                            isPendingReview
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isPendingReview ? 'Review' : 'View'}
                        </Link>
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