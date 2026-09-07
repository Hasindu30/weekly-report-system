import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReportStatus, ReviewAction, type WeeklyReport } from '../types';
import { reportsApi } from '../api/reports';
import StatusBadge from '../components/StatusBadge';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!id) return;
    try {
      const data = await reportsApi.getReportById(id);
      setReport(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSubmit = async () => {
    if (!id || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setActionSuccess(null);
    try {
      await reportsApi.submitReport(id);
      setActionSuccess('Report submitted for review successfully.');
      await loadReport();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || 'Failed to submit report. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 font-medium">Loading report details...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-white p-8 rounded-lg border border-red-200 text-center space-y-4">
        <div className="text-red-600 font-medium">{error || 'Report not found.'}</div>
        <Link
          to="/reports/history"
          className="inline-block px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Report History
        </Link>
      </div>
    );
  }

  const isDraft = report.status === ReportStatus.DRAFT;
  const isNeedsCorrection = report.status === ReportStatus.NEEDS_CORRECTION;
  const isSubmitted = report.status === ReportStatus.SUBMITTED;
  const isApproved = report.status === ReportStatus.APPROVED;

  // Find latest review requesting changes
  const latestCorrectionReview = report.reviews?.find(
    (r) => r.action === ReviewAction.REQUEST_CHANGES,
  );

  return (
    <div className="space-y-6">
      {/* Action Success Notification */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Submit Error Notification */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-center justify-between">
          <span>{submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Latest Manager Feedback Banner (if NEEDS_CORRECTION) */}
      {isNeedsCorrection && latestCorrectionReview && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2">
              <span>⚠️ Action Required: Manager Requested Corrections</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                Version {latestCorrectionReview.reportVersion}
              </span>
            </h3>
            <span className="text-xs text-amber-700">
              {new Date(latestCorrectionReview.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-amber-950 font-medium whitespace-pre-wrap bg-white/70 p-3 rounded border border-amber-200">
            {latestCorrectionReview.comment || 'Please update your report as discussed.'}
          </p>
          {latestCorrectionReview.reviewer && (
            <div className="text-xs text-amber-800 font-medium">
              Reviewer: {latestCorrectionReview.reviewer.firstName} {latestCorrectionReview.reviewer.lastName}
            </div>
          )}
        </div>
      )}

      {/* Status Locked Notification for SUBMITTED */}
      {isSubmitted && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between text-blue-800 text-sm">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              <strong>Submitted for manager review:</strong> This report is locked while awaiting review.
              {report.submittedAt && (
                <span className="ml-1 text-blue-600">
                  (Submitted on {new Date(report.submittedAt).toLocaleString()})
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Status Locked Notification for APPROVED */}
      {isApproved && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center justify-between text-green-800 text-sm">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>
              <strong>Report Approved:</strong> This report has been approved by management and is locked.
              {report.approvedAt && (
                <span className="ml-1 text-green-600">
                  (Approved on {new Date(report.approvedAt).toLocaleString()})
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Weekly Report: {report.weekStart} – {report.weekEnd}
            </h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Project: <strong className="text-gray-800">{report.project?.name}</strong> • Last
            Updated: {new Date(report.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/reports/history"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm cursor-pointer"
          >
            ← Back
          </Link>

          {/* DRAFT actions */}
          {isDraft && (
            <>
              <Link
                to={`/reports/${report.id}/edit`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
              >
                Edit Draft
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </>
          )}

          {/* NEEDS_CORRECTION actions */}
          {isNeedsCorrection && (
            <>
              <Link
                to={`/reports/${report.id}/edit`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
              >
                Edit Report
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {submitting ? 'Resubmitting...' : 'Resubmit for Review'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notes Section (if present) */}
      {report.notes && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Notes & Summary
          </h2>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.notes}</p>
        </div>
      )}

      {/* Tasks Completed Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Tasks Completed / Worked On ({report.tasks?.length || 0})
        </h2>

        {!report.tasks || report.tasks.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No tasks listed.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Time (Plan / Spent)</th>
                  <th className="py-3 px-4">Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.tasks.map((task, idx) => (
                  <tr key={task.id || idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{task.taskName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-800 font-medium">
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 font-medium">
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {task.actualPercentage}%{' '}
                      <span className="text-xs text-gray-400">
                        (planned {task.plannedPercentage}%)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {task.spentMinutes}m{' '}
                      <span className="text-xs text-gray-400">
                        / {task.plannedMinutes}m
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {task.deliverable || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Next Week Tasks */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Next Week Planned Tasks ({report.nextWeekTasks?.length || 0})
        </h2>
        {!report.nextWeekTasks || report.nextWeekTasks.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No tasks planned for next week.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-800">
            {report.nextWeekTasks.map((nt, idx) => (
              <li key={nt.id || idx}>{nt.taskName}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Blockers & Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blockers */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Blockers & Challenges
          </h2>
          {!report.blockers || report.blockers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No blockers recorded.</p>
          ) : (
            <div className="space-y-2">
              {report.blockers.map((blocker, idx) => (
                <div
                  key={blocker.id || idx}
                  className={`p-3 rounded-lg border text-sm ${
                    blocker.isKeyIssue
                      ? 'bg-red-50 border-red-200 text-red-900 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{blocker.description}</span>
                    {blocker.isKeyIssue && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        KEY ISSUE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Key Achievements
          </h2>
          {!report.achievements || report.achievements.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No achievements recorded.</p>
          ) : (
            <div className="space-y-2">
              {report.achievements.map((ach, idx) => (
                <div
                  key={ach.id || idx}
                  className={`p-3 rounded-lg border text-sm ${
                    ach.isKeyAchievement
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{ach.description}</span>
                    {ach.isKeyAchievement && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        KEY ACHIEVEMENT
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hour Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Hour Breakdown
        </h2>
        {!report.hourBreakdowns || report.hourBreakdowns.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hour breakdown provided.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {report.hourBreakdowns.map((hb, idx) => (
              <div
                key={hb.id || idx}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center"
              >
                <div className="text-xs font-medium text-gray-500 uppercase">{hb.taskType}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{hb.hours} hrs</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review History Section (if any reviews exist) */}
      {report.reviews && report.reviews.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Review History
          </h2>
          <div className="space-y-3">
            {report.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rev.action === ReviewAction.APPROVED ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">
                        Approved Version {rev.reportVersion}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                        Changes Requested on Version {rev.reportVersion}
                      </span>
                    )}
                    {rev.reviewer && (
                      <span className="text-xs text-gray-600 font-medium">
                        by {rev.reviewer.firstName} {rev.reviewer.lastName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>
                {rev.comment && (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                    {rev.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}