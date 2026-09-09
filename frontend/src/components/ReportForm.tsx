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
import {
  Card,
  SectionHeader,
  FormField,
  Input,
  Select,
  Textarea,
  Button,
  ErrorState,
} from './ui';

interface ReportFormProps {
  initialReport?: WeeklyReport;
  isEdit?: boolean;
}

export default function ReportForm({
  initialReport,
  isEdit = false,
}: ReportFormProps) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [projectId, setProjectId] = useState<string>(
    initialReport?.project?.id || '',
  );
  const [weekStart, setWeekStart] = useState<string>(
    initialReport?.weekStart || '',
  );
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
      ? initialReport.hourBreakdowns.map((h) => ({
          ...h,
          hours: Number(h.hours),
        }))
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
  }, []);

  // Task handlers
  const handleAddTask = () => {
    setTasks([
      ...tasks,
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
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (
    index: number,
    field: keyof ReportTask,
    value: any,
  ) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  // Next Week Task handlers
  const handleAddNextWeekTask = () => {
    setNextWeekTasks([...nextWeekTasks, { taskName: '' }]);
  };

  const handleRemoveNextWeekTask = (index: number) => {
    setNextWeekTasks(nextWeekTasks.filter((_, i) => i !== index));
  };

  const handleNextWeekTaskChange = (index: number, value: string) => {
    const updated = [...nextWeekTasks];
    updated[index] = { ...updated[index], taskName: value };
    setNextWeekTasks(updated);
  };

  // Blocker handlers
  const handleAddBlocker = () => {
    setBlockers([
      ...blockers,
      { description: '', isKeyIssue: false },
    ]);
  };

  const handleRemoveBlocker = (index: number) => {
    setBlockers(blockers.filter((_, i) => i !== index));
  };

  const handleBlockerChange = (
    index: number,
    field: keyof ReportBlocker,
    value: any,
  ) => {
    const updated = [...blockers];
    updated[index] = { ...updated[index], [field]: value };
    setBlockers(updated);
  };

  const handleKeyIssueToggle = (index: number) => {
    const updated = blockers.map((b, i) => ({
      ...b,
      isKeyIssue: i === index ? !b.isKeyIssue : false,
    }));
    setBlockers(updated);
  };

  // Achievement handlers
  const handleAddAchievement = () => {
    setAchievements([
      ...achievements,
      { description: '', isKeyAchievement: false },
    ]);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleAchievementChange = (index: number, value: string) => {
    const updated = [...achievements];
    updated[index] = { ...updated[index], description: value };
    setAchievements(updated);
  };

  const handleKeyAchievementToggle = (index: number) => {
    const updated = achievements.map((a, i) => ({
      ...a,
      isKeyAchievement: i === index ? !a.isKeyAchievement : false,
    }));
    setAchievements(updated);
  };

  // Hour breakdown handlers
  const handleAddHourBreakdown = () => {
    setHourBreakdowns([
      ...hourBreakdowns,
      { taskType: TaskType.OTHER, hours: 0 },
    ]);
  };

  const handleRemoveHourBreakdown = (index: number) => {
    setHourBreakdowns(hourBreakdowns.filter((_, i) => i !== index));
  };

  const handleHourBreakdownChange = (
    index: number,
    field: keyof ReportHourBreakdown,
    value: any,
  ) => {
    const updated = [...hourBreakdowns];
    updated[index] = { ...updated[index], [field]: value };
    setHourBreakdowns(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!projectId) {
      setError('Please select a project');
      return;
    }
    if (!weekStart || !weekEnd) {
      setError('Please select both Week Start and Week End dates');
      return;
    }
    if (new Date(weekEnd) < new Date(weekStart)) {
      setError('Week End cannot be earlier than Week Start');
      return;
    }

    // Filter valid entries
    const validTasks = tasks.filter((t) => t.taskName.trim() !== '');
    const validNextWeekTasks = nextWeekTasks.filter(
      (n) => n.taskName.trim() !== '',
    );
    const validBlockers = blockers.filter((b) => b.description.trim() !== '');
    const validAchievements = achievements.filter(
      (a) => a.description.trim() !== '',
    );
    const validHourBreakdowns = hourBreakdowns.map((h) => ({
      taskType: h.taskType,
      hours: Number(h.hours) || 0,
    }));

    const payload: CreateWeeklyReportPayload = {
      projectId,
      weekStart,
      weekEnd,
      notes: notes.trim() || undefined,
      tasks: validTasks,
      nextWeekTasks: validNextWeekTasks,
      blockers: validBlockers,
      achievements: validAchievements,
      hourBreakdowns: validHourBreakdowns,
    };

    setSubmitting(true);
    try {
      if (isEdit && initialReport) {
        await reportsApi.updateReport(initialReport.id, payload);
        navigate(`/reports/${initialReport.id}`);
      } else {
        const created = await reportsApi.createReport(payload);
        navigate(`/reports/${created.id}`);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Failed to save weekly report.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
      {error && <ErrorState message={error} />}

      {/* 1. Week Range & Project Selection */}
      <Card className="min-w-0">
        <SectionHeader
          title="Period & Project"
          description="Specify the reporting date range and assigned project initiative."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
          <FormField label="Assigned Project" htmlFor="project" required>
            <Select
              id="project"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loadingProjects}
            >
              <option value="">Select an active project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.isActive}>
                  {p.name} {!p.isActive ? '(Inactive)' : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Week Start" htmlFor="weekStart" required>
            <Input
              id="weekStart"
              type="date"
              required
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </FormField>

          <FormField label="Week End" htmlFor="weekEnd" required>
            <Input
              id="weekEnd"
              type="date"
              required
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
            />
          </FormField>
        </div>
      </Card>

      {/* 2. Tasks Completed / Worked On */}
      <Card className="min-w-0">
        <SectionHeader
          title="Completed & In-Progress Tasks"
          description="Log key work items, status, percentage completion, and planned vs. spent minutes."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddTask}
            >
              + Add Task
            </Button>
          }
        />

        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No tasks added yet.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3 min-w-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Task #{idx + 1}
                  </span>
                  {tasks.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTask(idx)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs py-1 px-2"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <FormField label="Task Name" required>
                      <Input
                        type="text"
                        required
                        value={task.taskName}
                        onChange={(e) =>
                          handleTaskChange(idx, 'taskName', e.target.value)
                        }
                        placeholder="e.g. Implement authentication middleware"
                      />
                    </FormField>
                  </div>

                  <FormField label="Priority">
                    <Select
                      value={task.priority}
                      onChange={(e) =>
                        handleTaskChange(
                          idx,
                          'priority',
                          e.target.value as TaskPriority,
                        )
                      }
                    >
                      <option value={TaskPriority.HIGH}>High</option>
                      <option value={TaskPriority.MEDIUM}>Medium</option>
                      <option value={TaskPriority.LOW}>Low</option>
                    </Select>
                  </FormField>

                  <FormField label="Status">
                    <Select
                      value={task.status}
                      onChange={(e) =>
                        handleTaskChange(
                          idx,
                          'status',
                          e.target.value as TaskStatus,
                        )
                      }
                    >
                      <option value={TaskStatus.TODO}>To Do</option>
                      <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                      <option value={TaskStatus.COMPLETED}>Completed</option>
                      <option value={TaskStatus.BLOCKED}>Blocked</option>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FormField label="Plan Progress (%)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={task.plannedPercentage}
                      onChange={(e) =>
                        handleTaskChange(
                          idx,
                          'plannedPercentage',
                          Number(e.target.value),
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Actual Progress (%)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={task.actualPercentage}
                      onChange={(e) =>
                        handleTaskChange(
                          idx,
                          'actualPercentage',
                          Number(e.target.value),
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Plan Minutes">
                    <Input
                      type="number"
                      min={0}
                      value={task.plannedMinutes}
                      onChange={(e) =>
                        handleTaskChange(
                          idx,
                          'plannedMinutes',
                          Number(e.target.value),
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Spent Minutes">
                    <Input
                      type="number"
                      min={0}
                      value={task.spentMinutes}
                      onChange={(e) =>
                        handleTaskChange(
                          idx,
                          'spentMinutes',
                          Number(e.target.value),
                        )
                      }
                    />
                  </FormField>
                </div>

                <FormField label="Deliverable / Notes (Optional)">
                  <Input
                    type="text"
                    value={task.deliverable || ''}
                    onChange={(e) =>
                      handleTaskChange(idx, 'deliverable', e.target.value)
                    }
                    placeholder="PR link, document, release tag..."
                  />
                </FormField>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3. Next Week Planned Tasks */}
      <Card className="min-w-0">
        <SectionHeader
          title="Next Week Planned Commitments"
          description="Outline key deliverables planned for the upcoming week."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddNextWeekTask}
            >
              + Add Next Week Task
            </Button>
          }
        />

        <div className="space-y-3">
          {nextWeekTasks.map((nt, idx) => (
            <div key={idx} className="flex items-center gap-2.5 min-w-0">
              <Input
                type="text"
                value={nt.taskName}
                onChange={(e) =>
                  handleNextWeekTaskChange(idx, e.target.value)
                }
                placeholder="Planned task description..."
                className="flex-1"
              />
              {nextWeekTasks.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveNextWeekTask(idx)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 shrink-0"
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Blockers & Challenges */}
      <Card className="min-w-0">
        <SectionHeader
          title="Blockers & Impediments"
          description="Log any blockers encountered (select at most one as the Key Issue)."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddBlocker}
            >
              + Add Blocker
            </Button>
          }
        />

        {blockers.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No blockers recorded.</p>
        ) : (
          <div className="space-y-3">
            {blockers.map((blocker, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <Input
                    type="text"
                    value={blocker.description}
                    onChange={(e) =>
                      handleBlockerChange(idx, 'description', e.target.value)
                    }
                    placeholder="Describe the blocker or bottleneck..."
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={blocker.isKeyIssue}
                      onChange={() => handleKeyIssueToggle(idx)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span>Key Blocker</span>
                  </label>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBlocker(idx)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 5. Key Achievements */}
      <Card className="min-w-0">
        <SectionHeader
          title="Key Achievements"
          description="Highlight milestone completions and wins (select at most one as Key Achievement)."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddAchievement}
            >
              + Add Achievement
            </Button>
          }
        />

        {achievements.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No achievements recorded.</p>
        ) : (
          <div className="space-y-3">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <Input
                    type="text"
                    value={achievement.description}
                    onChange={(e) =>
                      handleAchievementChange(idx, e.target.value)
                    }
                    placeholder="Describe the milestone or achievement..."
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={achievement.isKeyAchievement}
                      onChange={() => handleKeyAchievementToggle(idx)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Key Achievement</span>
                  </label>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAchievement(idx)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 6. Hour Breakdown */}
      <Card className="min-w-0">
        <SectionHeader
          title="Hour Breakdown by Activity"
          description="Distribution of hours logged across activity categories."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddHourBreakdown}
            >
              + Add Category
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 min-w-0">
          {hourBreakdowns.map((hb, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 min-w-0"
            >
              <div className="flex-1 min-w-0">
                <Select
                  value={hb.taskType}
                  onChange={(e) =>
                    handleHourBreakdownChange(
                      idx,
                      'taskType',
                      e.target.value as TaskType,
                    )
                  }
                >
                  {Object.values(TaskType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="w-24 shrink-0">
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={hb.hours}
                  onChange={(e) =>
                    handleHourBreakdownChange(
                      idx,
                      'hours',
                      Number(e.target.value),
                    )
                  }
                  className="text-right"
                  placeholder="0.0"
                />
              </div>

              <span className="text-xs text-slate-500 font-medium shrink-0">
                hrs
              </span>

              {hourBreakdowns.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveHourBreakdown(idx)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-1.5 shrink-0"
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 7. Notes & Summary */}
      <Card className="min-w-0">
        <SectionHeader
          title="Weekly Summary & Notes"
          description="General overview or context for the reviewer."
        />

        <FormField label="Summary Notes" htmlFor="notes">
          <Textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any overall context, blockers clarification, or comments for the weekly review..."
          />
        </FormField>
      </Card>

      {/* 8. Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/reports/history')}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={submitting}
        >
          {isEdit ? 'Update Report Draft' : 'Save Report Draft'}
        </Button>
      </div>
    </form>
  );
}
