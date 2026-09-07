import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReportStatus, type WeeklyReport } from '../types';
import { reportsApi } from '../api/reports';
import ReportForm from '../components/ReportForm';

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
        setError(err?.response?.data?.message || 'Failed to load report for editing.');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 font-medium">Loading report data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg border border-red-200 text-center space-y-4">
        <div className="text-red-600 font-medium">{error}</div>
        <Link
          to="/reports/history"
          className="inline-block px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Report History
        </Link>
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
      <div className="bg-white p-8 rounded-lg border border-amber-200 text-center space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Report Locked</h2>
        <p className="text-sm text-gray-600">
          This report is currently in <strong>{report.status}</strong> status and cannot be edited.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to={`/reports/${report.id}`}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            View Report
          </Link>
          <Link
            to="/reports/history"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Report History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Weekly Report' : 'New Weekly Report'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit
              ? 'Update your draft or resubmission details below.'
              : 'Fill in your weekly tasks, blockers, achievements, and hours.'}
          </p>
        </div>
        <Link
          to="/reports/history"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← View All Reports
        </Link>
      </div>

      <ReportForm initialReport={report || undefined} isEdit={isEdit} />
    </div>
  );
}
