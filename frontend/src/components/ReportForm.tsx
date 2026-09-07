import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  type Project,
  type WeeklyReport,
  type CreateWeeklyReportPayload,
  type ReportTask,
  type NextWeekTask,
  type ReportBlocker,
  type ReportAchievement,
  type ReportHourBreakdown,
} from '../types';
import { projectsApi } from '../api/projects';
import { reportsApi } from '../api/reports';

interface ReportFormProps {
  initialReport?: WeeklyReport;
  isEdit?: boolean;
}

export default function ReportForm({ initialReport, isEdit = false }: ReportFormProps) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [projectId, setProjectId] = useState<string>(initialReport?.project?.id || '');
  const [weekStart, setWeekStart] = useState<string>(initialReport?.weekStart || '');
  const [weekEnd, setWeekEnd] = useState<string>(initialReport?.weekEnd || '');
  const [notes, setNotes] = useState<string>(initialReport?.notes || '');

  const [tasks, setTasks] = useState<ReportTask[]>(
    initialReport?.tasks?.length
      ? initialReport.tasks.map((t) => ({ ...t }))
      : [
          {
            taskName: '',
            priority: TaskPriority.MEDIUM,
            plannedPercentage: 0,
            actualPercentage: 0,
            status: TaskStatus.TODO,
            plannedMinutes: 0,
            spentMinutes: 0,
            deliverable: '',
          },
        ],
  );

  const [nextWeekTasks, setNextWeekTasks] = useState<NextWeekTask[]>(
    initialReport?.nextWeekTasks?.length
      ? initialReport.nextWeekTasks.map((n) => ({ ...n }))
      : [{ taskName: '' }],
  );

  const [blockers, setBlockers] = useState<ReportBlocker[]>(
    initialReport?.blockers?.length
      ? initialReport.blockers.map((b) => ({ ...b }))
      : [],
  );

  const [achievements, setAchievements] = useState<ReportAchievement[]>(
    initialReport?.achievements?.length
      ? initialReport.achievements.map((a) => ({ ...a }))
      : [],
  );

  const [hourBreakdowns, setHourBreakdowns] = useState<ReportHourBreakdown[]>(
    initialReport?.hourBreakdowns?.length
      ? initialReport.hourBreakdowns.map((h) => ({ ...h, hours: Number(h.hours) }))
      : [
          {
            taskType: TaskType.DEVELOPMENT,
            hours: 0,
          },
        ],
  );

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await projectsApi.getProjects();
        setProjects(data);
        if (!projectId && data.length > 0) {
          const activeProjects = data.filter((p) => p.isActive);
          if (activeProjects.length > 0) {
            setProjectId(activeProjects[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [projectId]);

  // Tasks handlers
  const handleAddTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        taskName: '',
        priority: TaskPriority.MEDIUM,
        plannedPercentage: 0,
        actualPercentage: 0,
        status: TaskStatus.TODO,
        plannedMinutes: 0,
        spentMinutes: 0,
        deliverable: '',
      },
    ]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTaskChange = <K extends keyof ReportTask>(
    index: number,
    field: K,
    value: ReportTask[K],
  ) => {
    setTasks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Next Week Tasks handlers
  const handleAddNextWeekTask = () => {
    setNextWeekTasks((prev) => [...prev, { taskName: '' }]);
  };

  const handleRemoveNextWeekTask = (index: number) => {
    setNextWeekTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextWeekTaskChange = (index: number, taskName: string) => {
    setNextWeekTasks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], taskName };
      return updated;
    });
  };

  // Blockers handlers (enforces single key issue)
  const handleAddBlocker = () => {
    setBlockers((prev) => [...prev, { description: '', isKeyIssue: false }]);
  };

  const handleRemoveBlocker = (index: number) => {
    setBlockers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBlockerChange = (index: number, description: string) => {
    setBlockers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], description };
      return updated;
    });
  };

  const handleKeyIssueToggle = (index: number) => {
    setBlockers((prev) =>
      prev.map((b, i) => ({
        ...b,
        isKeyIssue: i === index ? !b.isKeyIssue : false,
      })),
    );
  };

  // Achievements handlers (enforces single key achievement)
  const handleAddAchievement = () => {
    setAchievements((prev) => [...prev, { description: '', isKeyAchievement: false }]);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAchievementChange = (index: number, description: string) => {
    setAchievements((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], description };
      return updated;
    });
  };

  const handleKeyAchievementToggle = (index: number) => {
    setAchievements((prev) =>
      prev.map((a, i) => ({
        ...a,
        isKeyAchievement: i === index ? !a.isKeyAchievement : false,
      })),
    );
  };

  // Hour Breakdowns handlers
  const handleAddHourBreakdown = () => {
    setHourBreakdowns((prev) => [
      ...prev,
      { taskType: TaskType.DEVELOPMENT, hours: 0 },
    ]);
  };

  const handleRemoveHourBreakdown = (index: number) => {
    setHourBreakdowns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHourBreakdownChange = <K extends keyof ReportHourBreakdown>(
    index: number,
    field: K,
    value: ReportHourBreakdown[K],
  ) => {
    setHourBreakdowns((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError('Please select a project.');
      return;
    }

    if (!weekStart || !weekEnd) {
      setError('Week start and week end dates are required.');
      return;
    }

    if (new Date(weekEnd) < new Date(weekStart)) {
      setError('Week end date cannot be before week start date.');
      return;
    }

    // Filter out completely blank tasks / items
    const cleanedTasks = tasks
      .filter((t) => t.taskName.trim().length > 0)
      .map((t) => ({
        taskName: t.taskName.trim(),
        priority: t.priority,
        plannedPercentage: Number(t.plannedPercentage) || 0,
        actualPercentage: Number(t.actualPercentage) || 0,
        status: t.status,
        plannedMinutes: Number(t.plannedMinutes) || 0,
        spentMinutes: Number(t.spentMinutes) || 0,
        deliverable: t.deliverable?.trim() || null,
      }));

    const cleanedNextWeekTasks = nextWeekTasks
      .filter((n) => n.taskName.trim().length > 0)
      .map((n) => ({ taskName: n.taskName.trim() }));

    const cleanedBlockers = blockers
      .filter((b) => b.description.trim().length > 0)
      .map((b) => ({ description: b.description.trim(), isKeyIssue: !!b.isKeyIssue }));

    const cleanedAchievements = achievements
      .filter((a) => a.description.trim().length > 0)
      .map((a) => ({
        description: a.description.trim(),
        isKeyAchievement: !!a.isKeyAchievement,
      }));

    const cleanedHourBreakdowns = hourBreakdowns.map((h) => ({
      taskType: h.taskType,
      hours: Number(h.hours) || 0,
    }));

    const payload: CreateWeeklyReportPayload = {
      projectId,
      weekStart,
      weekEnd,
      notes: notes.trim() || undefined,
      tasks: cleanedTasks,
      nextWeekTasks: cleanedNextWeekTasks,
      blockers: cleanedBlockers,
      achievements: cleanedAchievements,
      hourBreakdowns: cleanedHourBreakdowns,
    };

    setSubmitting(true);

    try {
      if (isEdit && initialReport) {
        await reportsApi.updateReport(initialReport.id, payload);
      } else {
        await reportsApi.createReport(payload);
      }
      navigate('/reports/history');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to save weekly report.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Report Details Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Report Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              disabled={loadingProjects}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
            >
              {loadingProjects ? (
                <option value="">Loading projects...</option>
              ) : projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id} disabled={!p.isActive}>
                    {p.name} {!p.isActive ? '(Inactive)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Week Start Date *
            </label>
            <input
              type="date"
              required
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Week End Date *
            </label>
            <input
              type="date"
              required
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            General Notes / Summary
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="High-level notes or highlights for the week..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Tasks Completed Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tasks Completed / Worked On</h2>
            <p className="text-xs text-gray-500">Track tasks planned vs actual progress and time spent</p>
          </div>
          <button
            type="button"
            onClick={handleAddTask}
            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
          >
            + Add Task
          </button>
        </div>

        <div className="space-y-4">
          {tasks.map((task, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 relative"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={task.taskName}
                    onChange={(e) => handleTaskChange(idx, 'taskName', e.target.value)}
                    placeholder="e.g. Implement user registration endpoint"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                  />
                </div>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(idx)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium pt-7"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={task.priority}
                    onChange={(e) =>
                      handleTaskChange(idx, 'priority', e.target.value as TaskPriority)
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white"
                  >
                    {Object.values(TaskPriority).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleTaskChange(idx, 'status', e.target.value as TaskStatus)
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white"
                  >
                    {Object.values(TaskStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Planned %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={task.plannedPercentage}
                    onChange={(e) =>
                      handleTaskChange(idx, 'plannedPercentage', Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Actual %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={task.actualPercentage}
                    onChange={(e) =>
                      handleTaskChange(idx, 'actualPercentage', Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Planned (Mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={task.plannedMinutes}
                    onChange={(e) =>
                      handleTaskChange(idx, 'plannedMinutes', Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Spent (Mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={task.spentMinutes}
                    onChange={(e) =>
                      handleTaskChange(idx, 'spentMinutes', Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Deliverable / PR / Link (Optional)
                </label>
                <input
                  type="text"
                  value={task.deliverable || ''}
                  onChange={(e) => handleTaskChange(idx, 'deliverable', e.target.value)}
                  placeholder="e.g. PR #104 or Figma link"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Week Tasks Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Next Week Planned Tasks</h2>
            <p className="text-xs text-gray-500">Key goals planned for next week</p>
          </div>
          <button
            type="button"
            onClick={handleAddNextWeekTask}
            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
          >
            + Add Planned Task
          </button>
        </div>

        <div className="space-y-3">
          {nextWeekTasks.map((nt, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                value={nt.taskName}
                onChange={(e) => handleNextWeekTaskChange(idx, e.target.value)}
                placeholder="e.g. Begin integration testing on payment gateway"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
              />
              {nextWeekTasks.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveNextWeekTask(idx)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blockers & Key Issue Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Blockers & Challenges</h2>
            <p className="text-xs text-gray-500">
              List blockers (select at most one as the <strong>Key Issue</strong>)
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddBlocker}
            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
          >
            + Add Blocker
          </button>
        </div>

        {blockers.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No blockers recorded for this week.</p>
        ) : (
          <div className="space-y-3">
            {blockers.map((blocker, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={blocker.description}
                    onChange={(e) => handleBlockerChange(idx, e.target.value)}
                    placeholder="Describe the blocker or bottleneck..."
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm bg-white"
                  />
                </div>
                <label className="flex items-center space-x-2 text-xs text-gray-700 font-medium shrink-0 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blocker.isKeyIssue}
                    onChange={() => handleKeyIssueToggle(idx)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Key Issue</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveBlocker(idx)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium pt-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements & Key Achievement Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Key Achievements</h2>
            <p className="text-xs text-gray-500">
              List major wins (select at most one as the <strong>Key Achievement</strong>)
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddAchievement}
            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
          >
            + Add Achievement
          </button>
        </div>

        {achievements.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No achievements recorded for this week.</p>
        ) : (
          <div className="space-y-3">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={achievement.description}
                    onChange={(e) => handleAchievementChange(idx, e.target.value)}
                    placeholder="Describe the milestone or achievement..."
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm bg-white"
                  />
                </div>
                <label className="flex items-center space-x-2 text-xs text-gray-700 font-medium shrink-0 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={achievement.isKeyAchievement}
                    onChange={() => handleKeyAchievementToggle(idx)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Key Achievement</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveAchievement(idx)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium pt-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hour Breakdown Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Hour Breakdown by Activity</h2>
            <p className="text-xs text-gray-500">Distribution of hours across activity types</p>
          </div>
          <button
            type="button"
            onClick={handleAddHourBreakdown}
            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
          >
            + Add Breakdown Row
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hourBreakdowns.map((hb, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200"
            >
              <div className="flex-1">
                <select
                  value={hb.taskType}
                  onChange={(e) =>
                    handleHourBreakdownChange(idx, 'taskType', e.target.value as TaskType)
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white"
                >
                  {Object.values(TaskType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  value={hb.hours}
                  onChange={(e) =>
                    handleHourBreakdownChange(idx, 'hours', Number(e.target.value))
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs bg-white text-right"
                  placeholder="Hours"
                />
              </div>
              <span className="text-xs text-gray-500">hrs</span>
              {hourBreakdowns.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveHourBreakdown(idx)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/reports/history')}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Report Draft' : 'Save Report Draft'}
        </button>
      </div>
    </form>
  );
}
