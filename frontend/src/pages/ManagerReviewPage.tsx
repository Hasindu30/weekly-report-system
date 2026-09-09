import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ReportStatus,
  ReviewAction,
  type WeeklyReport,
  type ReportVersion,
} from '../types';
import { reportsApi } from '../api/reports';
import StatusBadge from '../components/StatusBadge';
import {
  PageHeader,
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
  Modal,
  ConfirmDialog,
  FormField,
  Textarea,
  ErrorState,
  LoadingState,
} from '../components/ui';

export default function ManagerReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Review action state
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals & Forms
  const [showApproveConfirm, setShowApproveConfirm] = useState<boolean>(false);
  const [showChangesModal, setShowChangesModal] = useState<boolean>(false);
  const [changesComment, setChangesComment] = useState<string>('');
  const [commentError, setCommentError] = useState<string | null>(null);

  // Version snapshot viewing state
  const [viewingVersion, setViewingVersion] = useState<ReportVersion | null>(null);
  const [versionLoading, setVersionLoading] = useState<boolean>(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!id) return;
    try {
      const data = await reportsApi.getManagerReportById(id);
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

  const handleApprove = async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await reportsApi.approveReport(id);
      setShowApproveConfirm(false);
      setActionSuccess('Report approved successfully.');
      await loadReport();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to approve report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || actionLoading) return;
    if (!changesComment.trim()) {
      setCommentError('Please provide a comment explaining what needs correction.');
      return;
    }
    setCommentError(null);
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await reportsApi.requestReportChanges(id, changesComment.trim());
      setShowChangesModal(false);
      setChangesComment('');
      setActionSuccess('Changes requested. The team member has been notified.');
      await loadReport();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to request changes.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewVersion = async (versionNumber: number) => {
    if (!id) return;
    setVersionLoading(true);
    setVersionError(null);
    try {
      const versionData = await reportsApi.getReportVersion(id, versionNumber);
      setViewingVersion(versionData);
    } catch (err: any) {
      setVersionError(
        err?.response?.data?.message || `Failed to load version ${versionNumber}.`,
      );
    } finally {
      setVersionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading report review details..." />;
  }

  if (error || !report) {
    return (
      <div className="space-y-4 min-w-0">
        <ErrorState
          title="Report Not Found"
          message={error || 'Unable to retrieve team submission.'}
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

  const isSubmitted = report.status === ReportStatus.SUBMITTED;
  const isApproved = report.status === ReportStatus.APPROVED;
  const isNeedsCorrection = report.status === ReportStatus.NEEDS_CORRECTION;

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header */}
      <PageHeader
        backLink={{
          to: '/manager/reports',
          label: 'Team Reports',
        }}
        title={`Review Report: ${report.user?.firstName} ${report.user?.lastName}`}
        description={`Week: ${report.weekStart} – ${report.weekEnd} • Project: ${
          report.project?.name || 'Unassigned'
        }`}
        badge={<StatusBadge status={report.status} size="sm" />}
        actions={
          isSubmitted ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowChangesModal(true);
                  setCommentError(null);
                }}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                Request Changes
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => setShowApproveConfirm(true)}
              >
                Approve Report
              </Button>
            </div>
          ) : undefined
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

      {actionError && <ErrorState message={actionError} />}
      {versionError && <ErrorState message={versionError} />}

      {/* Status Indicators */}
      {isSubmitted && (
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl text-xs sm:text-sm text-sky-800 flex items-center gap-2 min-w-0">
          <span>ℹ️</span>
          <span>
            <strong>Awaiting Manager Decision:</strong> Review the work items, deliverables, and blockers below. You may approve the report or request changes with specific feedback.
          </span>
        </div>
      )}

      {isApproved && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2 min-w-0">
          <span>✅</span>
          <span>
            <strong>Approved Report:</strong> This report was accepted by management
            {report.approvedAt && ` on ${new Date(report.approvedAt).toLocaleString()}`}.
          </span>
        </div>
      )}

      {isNeedsCorrection && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs sm:text-sm text-amber-800 flex items-center gap-2 min-w-0">
          <span>⚠️</span>
          <span>
            <strong>Changes Requested:</strong> This report was returned to the author for revision and is currently awaiting their resubmission.
          </span>
        </div>
      )}

      {/* Member & Project Metadata Card */}
      <Card className="min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Author
            </span>
            <Link
              to={`/manager/team-members/${report.user?.id}`}
              className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline"
            >
              {report.user?.firstName} {report.user?.lastName}
            </Link>
            <div className="text-[11px] text-slate-400">{report.user?.email}</div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Project
            </span>
            <div className="font-semibold text-slate-900">
              {report.project?.name || '—'}
            </div>
            <div className="text-[11px] text-slate-400">
              Week: {report.weekStart} to {report.weekEnd}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Submission Info
            </span>
            <div className="font-medium text-slate-700">
              Submitted: {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'Not submitted'}
            </div>
            <div className="text-[11px] text-slate-400">
              Last Updated: {new Date(report.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Notes / Summary */}
      {report.notes && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Member Notes & Summary</CardTitle>
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
                        (plan {task.plannedPercentage}%)
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

      {/* Version History & Reviews Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Version Snapshots */}
        <Card className="min-w-0 flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>
                Version Snapshots ({report.versions?.length || 0})
              </CardTitle>
              <CardDescription>
                Historical submission snapshots captured at time of submission.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {!report.versions || report.versions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No version snapshots recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {report.versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        Version {ver.versionNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(ver.submittedAt).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewVersion(ver.versionNumber)}
                      disabled={versionLoading}
                    >
                      View Snapshot
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Audit History */}
        <Card className="min-w-0 flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>
                Review Decisions ({report.reviews?.length || 0})
              </CardTitle>
              <CardDescription>
                Logged manager reviews, approvals, and revision feedback.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {!report.reviews || report.reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No review records logged yet.</p>
            ) : (
              <div className="space-y-2.5">
                {report.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {rev.action === ReviewAction.APPROVED ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            Approved v{rev.reportVersion}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                            Changes Requested (v{rev.reportVersion})
                          </span>
                        )}
                        {rev.reviewer && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            by {rev.reviewer.firstName} {rev.reviewer.lastName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 whitespace-pre-wrap">
                        {rev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <ConfirmDialog
          isOpen={showApproveConfirm}
          onClose={() => setShowApproveConfirm(false)}
          onConfirm={handleApprove}
          title="Approve Weekly Report"
          message={
            <div className="space-y-2">
              <p>
                Are you sure you want to approve the weekly submission for{' '}
                <span className="font-semibold text-slate-900">
                  {report.user?.firstName} {report.user?.lastName}
                </span>{' '}
                ({report.weekStart} to {report.weekEnd})?
              </p>
              <p className="text-xs text-slate-500">
                Once approved, this report will be marked as APPROVED and permanently locked from further changes.
              </p>
            </div>
          }
          confirmLabel="Yes, Approve Report"
          variant="success"
          isLoading={actionLoading}
        />
      )}

      {/* Request Changes Modal */}
      {showChangesModal && (
        <Modal
          isOpen={showChangesModal}
          onClose={() => {
            setShowChangesModal(false);
            setCommentError(null);
          }}
          title="Request Revisions"
          description={`Specify what corrections or updates are required from ${report.user?.firstName} ${report.user?.lastName}.`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowChangesModal(false);
                  setCommentError(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestChanges}
                isLoading={actionLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Send Revision Request
              </Button>
            </>
          }
        >
          <form onSubmit={handleRequestChanges} className="space-y-4">
            <FormField
              label="Correction Feedback"
              htmlFor="change-comment"
              required
              error={commentError || undefined}
            >
              <Textarea
                id="change-comment"
                rows={4}
                required
                value={changesComment}
                onChange={(e) => {
                  setChangesComment(e.target.value);
                  if (e.target.value.trim()) setCommentError(null);
                }}
                placeholder="E.g. Please clarify deliverable status for Task 2 and verify the hours breakdown..."
              />
            </FormField>
          </form>
        </Modal>
      )}

      {/* View Version Snapshot Modal */}
      {viewingVersion && (
        <Modal
          isOpen={Boolean(viewingVersion)}
          onClose={() => setViewingVersion(null)}
          title={`Snapshot Data: Version ${viewingVersion.versionNumber}`}
          description={`Captured at ${new Date(
            viewingVersion.submittedAt,
          ).toLocaleString()}`}
          maxWidth="2xl"
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingVersion(null)}
            >
              Close Snapshot
            </Button>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {viewingVersion.snapshot && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900">
                    Week: {viewingVersion.snapshot.weekStart} –{' '}
                    {viewingVersion.snapshot.weekEnd}
                  </div>
                  {viewingVersion.snapshot.notes && (
                    <div className="mt-1 text-slate-600">
                      Notes: {viewingVersion.snapshot.notes}
                    </div>
                  )}
                </div>

                {viewingVersion.snapshot.tasks && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">
                      Tasks ({viewingVersion.snapshot.tasks.length})
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                      {viewingVersion.snapshot.tasks.map((t: any, i: number) => (
                        <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800">{t.taskName}</span>
                          <span className="text-slate-500">
                            {t.status} • {t.actualPercentage}% • {t.spentMinutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}