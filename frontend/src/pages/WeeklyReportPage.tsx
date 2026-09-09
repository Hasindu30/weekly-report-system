import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReportStatus, type WeeklyReport } from '../types';
import { reportsApi } from '../api/reports';
import ReportForm from '../components/ReportForm';
import {
  PageHeader,
  Card,
  Button,
  LoadingState,
  ErrorState,
} from '../components/ui';

export default function WeeklyReportPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadReport() {
      try {
        const data = await reportsApi.getReportById(id!);
        setReport(data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Failed to load report for editing.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading report data..." />;
  }

  if (error) {
    return (
      <div className="space-y-4 min-w-0">
        <ErrorState message={error} />
        <div>
          <Link to="/reports/history">
            <Button variant="outline" size="sm">
              ← Back to Report History
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (
    isEdit &&
    report &&
    report.status !== ReportStatus.DRAFT &&
    report.status !== ReportStatus.NEEDS_CORRECTION
  ) {
    return (
      <Card className="text-center p-8 sm:p-12 space-y-4 max-w-lg mx-auto min-w-0">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto">
          🔒
        </div>
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Report Locked from Editing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            This report is currently in{' '}
            <strong className="text-slate-800">{report.status}</strong> status
            and cannot be modified directly.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link to={`/reports/${report.id}`}>
            <Button variant="primary" size="sm">
              View Report
            </Button>
          </Link>
          <Link to="/reports/history">
            <Button variant="outline" size="sm">
              Report History
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header */}
      <PageHeader
        backLink={{
          to: '/reports/history',
          label: 'Report History',
        }}
        title={isEdit ? 'Edit Weekly Report' : 'New Weekly Report'}
        description={
          isEdit
            ? 'Update your draft tasks, deliverables, or resubmission notes below.'
            : 'Capture and structure your weekly tasks, deliverables, achievements, blockers, and hours.'
        }
      />

      <ReportForm initialReport={report || undefined} isEdit={isEdit} />
    </div>
  );
}
