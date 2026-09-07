import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReportStatus, type WeeklyReport } from '../types';
import { reportsApi } from '../api/reports';
import StatusBadge from '../components/StatusBadge';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      try {
        const data = await reportsApi.getReportById(id);
        setReport(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load report.');
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

  const isEditable =
    report.status === ReportStatus.DRAFT ||
    report.status === ReportStatus.NEEDS_CORRECTION;

  return (
    <div className="space-y-6">
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
          >
            ← Back
          </Link>
          {isEditable && (
            <Link
              to={`/reports/${report.id}/edit`}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm"
            >
              Edit Draft
            </Link>
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
                {report.tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
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
            {report.nextWeekTasks.map((nt) => (
              <li key={nt.id}>{nt.taskName}</li>
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
              {report.blockers.map((blocker) => (
                <div
                  key={blocker.id}
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
              {report.achievements.map((ach) => (
                <div
                  key={ach.id}
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
            {report.hourBreakdowns.map((hb) => (
              <div
                key={hb.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center"
              >
                <div className="text-xs font-medium text-gray-500 uppercase">{hb.taskType}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{hb.hours} hrs</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
