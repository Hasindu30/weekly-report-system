import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ReportStatus, type WeeklyReport, type Project } from '../types';
import { reportsApi } from '../api/reports';
import { projectsApi } from '../api/projects';
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
  Select,
  Input,
  FormField,
  ErrorState,
  LoadingState,
  EmptyState,
} from '../components/ui';

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

  // Load Projects for filter dropdown
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

  const hasActiveFilters =
    Boolean(selectedProject) ||
    Boolean(selectedStatus) ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header */}
      <PageHeader
        title="Team Weekly Reports"
        description="Review, approve, or request revisions on weekly submissions across all team members."
      />

      {error && <ErrorState message={error} onRetry={loadReports} />}

      {/* 2. Filter Bar Card */}
      <Card className="min-w-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Filter Reports
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Clear all filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 min-w-0">
            {/* Project Filter */}
            <FormField label="Project" htmlFor="filter-project">
              <Select
                id="filter-project"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Status Filter */}
            <FormField label="Review Status" htmlFor="filter-status">
              <Select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value={ReportStatus.SUBMITTED}>Submitted (Pending Review)</option>
                <option value={ReportStatus.NEEDS_CORRECTION}>Needs Correction</option>
                <option value={ReportStatus.APPROVED}>Approved</option>
                <option value={ReportStatus.DRAFT}>Draft</option>
              </Select>
            </FormField>

            {/* Start Date */}
            <FormField label="From Date" htmlFor="filter-start-date">
              <Input
                id="filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </FormField>

            {/* End Date */}
            <FormField label="To Date" htmlFor="filter-end-date">
              <Input
                id="filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </FormField>
          </div>
        </div>
      </Card>

      {/* 3. Reports Table */}
      <Card padding="none" className="min-w-0 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading team submissions..." />
        ) : reports.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No reports match your filters"
            description="Try clearing or adjusting your search parameters to view team submissions."
            action={
              hasActiveFilters
                ? {
                    label: 'Clear Filters',
                    onClick: handleClearFilters,
                    variant: 'secondary',
                  }
                : undefined
            }
          />
        ) : (
          <div>
            <DataTable className="border-none shadow-none rounded-none">
              <TableHead>
                <tr>
                  <TableHeaderCell>Team Member</TableHeaderCell>
                  <TableHeaderCell>Week Range</TableHeaderCell>
                  <TableHeaderCell>Project</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Submitted Date</TableHeaderCell>
                  <TableHeaderCell align="right">Action</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {reports.map((report) => {
                  const isPendingReview = report.status === ReportStatus.SUBMITTED;

                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {report.user?.id ? (
                          <Link
                            to={`/manager/team-members/${report.user.id}`}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold block"
                          >
                            {report.user?.firstName} {report.user?.lastName}
                          </Link>
                        ) : (
                          <div>
                            {report.user?.firstName} {report.user?.lastName}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 font-normal">
                          {report.user?.email}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium text-slate-800">
                        {report.weekStart} – {report.weekEnd}
                      </TableCell>

                      <TableCell className="font-medium text-slate-700">
                        {report.project?.name || '—'}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={report.status} size="sm" />
                      </TableCell>

                      <TableCell className="text-slate-500">
                        {report.submittedAt
                          ? new Date(report.submittedAt).toLocaleDateString()
                          : '—'}
                      </TableCell>

                      <TableCell align="right">
                        <Link to={`/manager/reports/${report.id}`}>
                          <Button
                            variant={isPendingReview ? 'primary' : 'outline'}
                            size="sm"
                          >
                            {isPendingReview ? 'Review Report' : 'View Report'}
                          </Button>
                        </Link>
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