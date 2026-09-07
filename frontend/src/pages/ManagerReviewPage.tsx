import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ReportStatus,
  ReviewAction,
  type WeeklyReport,
  type ReportVersion,
} from '../types';
import { reportsApi } from '../api/reports';
import StatusBadge from '../components/StatusBadge';

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
      setVersionError(err?.response?.data?.message || `Failed to load version ${versionNumber}.`);
    } finally {
      setVersionLoading(false);
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
          to="/manager/reports"
          className="inline-block px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Team Reports
        </Link>
      </div>
    );
  }

  const isSubmitted = report.status === ReportStatus.SUBMITTED;

  // Active data to display (either snapshot or current report)
  const displayNotes = viewingVersion ? viewingVersion.snapshot.notes : report.notes;
  const displayTasks = viewingVersion ? viewingVersion.snapshot.tasks : report.tasks;
  const displayNextWeekTasks = viewingVersion
    ? viewingVersion.snapshot.nextWeekTasks
    : report.nextWeekTasks;
  const displayBlockers = viewingVersion ? viewingVersion.snapshot.blockers : report.blockers;
  const displayAchievements = viewingVersion
    ? viewingVersion.snapshot.achievements
    : report.achievements;
  const displayHourBreakdowns = viewingVersion
    ? viewingVersion.snapshot.hourBreakdowns
    : report.hourBreakdowns;
  const displayProjectName = viewingVersion
    ? viewingVersion.snapshot.project?.name
    : report.project?.name;

  return (
    <div className="space-y-6">
      {/* Action Notifications */}
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

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {versionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-center justify-between">
          <span>{versionError}</span>
          <button
            type="button"
            onClick={() => setVersionError(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Snapshot Viewing Notice Banner */}
      {viewingVersion && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <div>
              <div className="text-sm font-bold text-indigo-900">
                Viewing Snapshot: Version {viewingVersion.versionNumber}
              </div>
              <div className="text-xs text-indigo-700">
                Submitted on {new Date(viewingVersion.submittedAt).toLocaleString()}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setViewingVersion(null)}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-300 rounded-md hover:bg-indigo-100 shadow-sm cursor-pointer"
          >
            ← Return to Current Report View
          </button>
        </div>
      )}

      {/* Header & Meta Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              Weekly Report: {report.weekStart} – {report.weekEnd}
            </h1>
            <StatusBadge status={report.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600 pt-1">
            <div>
              Team Member:{' '}
              <strong className="text-gray-900">
                {report.user?.firstName} {report.user?.lastName}
              </strong>{' '}
              <span className="text-xs text-gray-400">({report.user?.email})</span>
            </div>
            <div>
              Project: <strong className="text-gray-900">{displayProjectName || '—'}</strong>
            </div>
            <div>
              Submitted:{' '}
              <span className="text-gray-900">
                {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'Not submitted yet'}
              </span>
            </div>
            {report.approvedAt && (
              <div>
                Approved:{' '}
                <span className="text-gray-900">
                  {new Date(report.approvedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (Approve / Request Changes) */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            to="/manager/reports"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm cursor-pointer"
          >
            ← Back to List
          </Link>

          {isSubmitted && !viewingVersion && (
            <>
              <button
                type="button"
                onClick={() => {
                  setCommentError(null);
                  setShowChangesModal(true);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                Request Changes
              </button>
              <button
                type="button"
                onClick={() => setShowApproveConfirm(true)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                Approve Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notes Section */}
      {displayNotes && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Notes & Summary
          </h2>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{displayNotes}</p>
        </div>
      )}

      {/* Tasks Completed Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Tasks Completed / Worked On ({displayTasks?.length || 0})
        </h2>

        {!displayTasks || displayTasks.length === 0 ? (
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
                {displayTasks.map((task, idx) => (
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
          Next Week Planned Tasks ({displayNextWeekTasks?.length || 0})
        </h2>
        {!displayNextWeekTasks || displayNextWeekTasks.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No tasks planned for next week.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-800">
            {displayNextWeekTasks.map((nt, idx) => (
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
          {!displayBlockers || displayBlockers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No blockers recorded.</p>
          ) : (
            <div className="space-y-2">
              {displayBlockers.map((blocker, idx) => (
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
          {!displayAchievements || displayAchievements.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No achievements recorded.</p>
          ) : (
            <div className="space-y-2">
              {displayAchievements.map((ach, idx) => (
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
        {!displayHourBreakdowns || displayHourBreakdowns.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hour breakdown provided.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {displayHourBreakdowns.map((hb, idx) => (
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

      {/* Version History & Review History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submitted Version History */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Submitted Version History ({report.versions?.length || 0})
          </h2>

          {!report.versions || report.versions.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No submission snapshots stored yet.</p>
          ) : (
            <div className="space-y-3">
              {report.versions.map((ver) => {
                const isSelected = viewingVersion?.versionNumber === ver.versionNumber;
                return (
                  <div
                    key={ver.id}
                    className={`p-3.5 rounded-lg border flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Version {ver.versionNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        Submitted: {new Date(ver.submittedAt).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      {isSelected ? (
                        <button
                          type="button"
                          onClick={() => setViewingVersion(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
                        >
                          Viewing
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={versionLoading}
                          onClick={() => handleViewVersion(ver.versionNumber)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded hover:bg-indigo-50 shadow-sm cursor-pointer"
                        >
                          View Snapshot
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Review History */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Review History ({report.reviews?.length || 0})
          </h2>

          {!report.reviews || report.reviews.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No manager reviews recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {report.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-lg border border-gray-200 bg-gray-50 space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
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
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-2.5 rounded border border-gray-200">
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Approve */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Approve Weekly Report</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to approve this report for{' '}
              <strong>
                {report.user?.firstName} {report.user?.lastName}
              </strong>{' '}
              ({report.weekStart} – {report.weekEnd})?
            </p>
            <p className="text-xs text-gray-500">
              Once approved, this report will be marked as APPROVED and locked from further edits.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveConfirm(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Approving...' : 'Yes, Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Request Changes */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Request Changes</h3>
            <p className="text-sm text-gray-600">
              Specify what corrections or updates are required from{' '}
              <strong>
                {report.user?.firstName} {report.user?.lastName}
              </strong>
              .
            </p>
            <form onSubmit={handleRequestChanges} className="space-y-4">
              <div>
                <label
                  htmlFor="change-comment"
                  className="block text-xs font-semibold text-gray-700 mb-1 uppercase"
                >
                  Correction Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="change-comment"
                  rows={4}
                  required
                  value={changesComment}
                  onChange={(e) => {
                    setChangesComment(e.target.value);
                    if (e.target.value.trim()) setCommentError(null);
                  }}
                  placeholder="E.g. Please clarify deliverable status for Task 2 and include the hours breakdown..."
                  className="w-full text-sm rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
                {commentError && (
                  <p className="text-xs text-red-600 mt-1">{commentError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangesModal(false);
                    setCommentError(null);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Submitting...' : 'Send Correction Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}