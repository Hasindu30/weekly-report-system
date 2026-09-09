import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReportStatus, ReviewAction, type WeeklyReport } from '../types';
import { reportsApi } from '../api/reports';
import StatusBadge from '../components/StatusBadge';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
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
} from '../components/ui';

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
    return <LoadingState message="Loading report details..." />;
  }

  if (error || !report) {
    return (
      <div className="space-y-4 min-w-0">
        <ErrorState
          title="Report Not Found"
          message={error || 'Unable to retrieve report details.'}
        />
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

  const isDraft = report.status === ReportStatus.DRAFT;
  const isNeedsCorrection = report.status === ReportStatus.NEEDS_CORRECTION;
  const isSubmitted = report.status === ReportStatus.SUBMITTED;
  const isApproved = report.status === ReportStatus.APPROVED;

  // Find latest review requesting changes
  const latestCorrectionReview = report.reviews?.find(
    (r) => r.action === ReviewAction.REQUEST_CHANGES,
  );

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header with Back Link and Action Buttons */}
      <PageHeader
        backLink={{
          to: '/reports/history',
          label: 'Report History',
        }}
        title={`Weekly Report: ${report.weekStart} – ${report.weekEnd}`}
        description={`Project: ${report.project?.name || 'Unassigned'} • Last updated ${new Date(
          report.updatedAt,
        ).toLocaleDateString()}`}
        badge={<StatusBadge status={report.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {isDraft && (
              <>
                <Link to={`/reports/${report.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    Edit Draft
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  isLoading={submitting}
                >
                  Submit for Review
                </Button>
              </>
            )}

            {isNeedsCorrection && (
              <>
                <Link to={`/reports/${report.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    Edit Corrections
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  isLoading={submitting}
                >
                  Resubmit for Review
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between min-w-0">
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {submitError && <ErrorState message={submitError} />}

      {/* Manager Feedback Banner if NEEDS_CORRECTION */}
      {isNeedsCorrection && latestCorrectionReview && (
        <div className="bg-amber-50/90 border border-amber-200 p-5 rounded-xl space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <span>⚠️ Action Required: Manager Requested Corrections</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 text-[10px] font-bold">
                v{latestCorrectionReview.reportVersion}
              </span>
            </span>
            <span className="text-[11px] text-amber-700">
              {new Date(latestCorrectionReview.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 bg-white p-3.5 rounded-lg border border-amber-200/80 whitespace-pre-wrap">
            {latestCorrectionReview.comment || 'Please update report details.'}
          </div>

          {latestCorrectionReview.reviewer && (
            <div className="text-[11px] text-amber-800 font-medium">
              Reviewer: {latestCorrectionReview.reviewer.firstName}{' '}
              {latestCorrectionReview.reviewer.lastName}
            </div>
          )}
        </div>
      )}

      {/* Lock status callout for SUBMITTED / APPROVED */}
      {isSubmitted && (
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl text-xs sm:text-sm text-sky-800 flex items-center gap-2 min-w-0">
          <span>ℹ️</span>
          <span>
            <strong>Submitted for Review:</strong> This report is locked while awaiting manager review.
            {report.submittedAt && ` (Submitted on ${new Date(report.submittedAt).toLocaleString()})`}
          </span>
        </div>
      )}

      {isApproved && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2 min-w-0">
          <span>✅</span>
          <span>
            <strong>Report Approved:</strong> This submission has been accepted by management and is permanently locked.
            {report.approvedAt && ` (Approved on ${new Date(report.approvedAt).toLocaleString()})`}
          </span>
        </div>
      )}

      {/* Notes / Summary */}
      {report.notes && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Notes & Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">
              {report.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tasks Completed Section */}
      <Card padding="none" className="min-w-0 overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 mb-0">
          <CardTitle>
            Tasks Completed / Worked On ({report.tasks?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!report.tasks || report.tasks.length === 0 ? (
            <p className="p-5 text-xs text-slate-400 italic">No tasks listed.</p>
          ) : (
            <DataTable className="border-none shadow-none rounded-none">
              <TableHead>
                <tr>
                  <TableHeaderCell>Task Name</TableHeaderCell>
                  <TableHeaderCell>Priority</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Progress</TableHeaderCell>
                  <TableHeaderCell>Time (Plan / Spent)</TableHeaderCell>
                  <TableHeaderCell>Deliverable</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {report.tasks.map((task, idx) => (
                  <TableRow key={task.id || idx}>
                    <TableCell className="font-semibold text-slate-900">
                      {task.taskName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.priority} size="sm" />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {task.actualPercentage}%{' '}
                      <span className="text-[11px] text-slate-400 font-normal">
                        (planned {task.plannedPercentage}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">
                      {task.spentMinutes}m{' '}
                      <span className="text-[11px] text-slate-400 font-normal">
                        / {task.plannedMinutes}m
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {task.deliverable || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>

      {/* Next Week Tasks */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            Next Week Planned Tasks ({report.nextWeekTasks?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!report.nextWeekTasks || report.nextWeekTasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No planned tasks listed.</p>
          ) : (
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700">
              {report.nextWeekTasks.map((nt, idx) => (
                <li key={nt.id || idx}>{nt.taskName}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Blockers & Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
        {/* Blockers */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Blockers & Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            {!report.blockers || report.blockers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No blockers recorded.</p>
            ) : (
              <div className="space-y-2">
                {report.blockers.map((blocker, idx) => (
                  <div
                    key={blocker.id || idx}
                    className={`p-3 rounded-lg border text-xs sm:text-sm ${
                      blocker.isKeyIssue
                        ? 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{blocker.description}</span>
                      {blocker.isKeyIssue && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                          KEY ISSUE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Key Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {!report.achievements || report.achievements.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No achievements recorded.</p>
            ) : (
              <div className="space-y-2">
                {report.achievements.map((ach, idx) => (
                  <div
                    key={ach.id || idx}
                    className={`p-3 rounded-lg border text-xs sm:text-sm ${
                      ach.isKeyAchievement
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{ach.description}</span>
                      {ach.isKeyAchievement && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                          KEY ACHIEVEMENT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hour Breakdown */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Hour Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {!report.hourBreakdowns || report.hourBreakdowns.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hours logged.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 min-w-0">
              {report.hourBreakdowns.map((hb, idx) => (
                <div
                  key={hb.id || idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center min-w-0"
                >
                  <div className="text-[11px] font-semibold text-slate-500 uppercase truncate">
                    {hb.taskType}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {hb.hours} hrs
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review History */}
      {report.reviews && report.reviews.length > 0 && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Review & Revision Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2 text-xs sm:text-sm"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {rev.action === ReviewAction.APPROVED ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                          Approved v{rev.reportVersion}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                          Changes Requested on v{rev.reportVersion}
                        </span>
                      )}
                      {rev.reviewer && (
                        <span className="text-xs text-slate-500 font-medium">
                          by {rev.reviewer.firstName} {rev.reviewer.lastName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {rev.comment && (
                    <p className="text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}