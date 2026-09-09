import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ManagerDashboardData } from '../types';
import { dashboardApi } from '../api/dashboard';
import StatusBadge from '../components/StatusBadge';
import {
  PageHeader,
  MetricCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  ErrorState,
  LoadingState,
  EmptyState,
} from '../components/ui';

// Helper date functions
function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
}

const TASK_TYPE_COLORS: Record<string, string> = {
  DEVELOPMENT: '#4f46e5', // Indigo
  TESTING: '#0284c7', // Sky
  MEETINGS: '#d97706', // Amber
  DOCUMENTATION: '#059669', // Emerald
  OTHER: '#7c3aed', // Violet
};

export default function ManagerDashboardPage() {
  const [selectedWeek, setSelectedWeek] = useState<string>(getMondayOfCurrentWeek());
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getManagerDashboard(selectedWeek);
      setDashboardData(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load manager dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handlePrevWeek = () => {
    setSelectedWeek((current) => addDays(current, -7));
  };

  const handleNextWeek = () => {
    setSelectedWeek((current) => addDays(current, 7));
  };

  const handleCurrentWeek = () => {
    setSelectedWeek(getMondayOfCurrentWeek());
  };

  if (loading && !dashboardData) {
    return <LoadingState message="Loading manager analytics..." />;
  }

  const {
    summary,
    submissionStatusByMember = [],
    workloadByProject = [],
    timeByTaskType = [],
    tasksCompletedTrend = [],
    recentActivity = [],
  } = dashboardData || {};

  const totalTasks = workloadByProject.reduce((sum, p) => sum + p.taskCount, 0);
  const totalHours = timeByTaskType.reduce((sum, t) => sum + t.hours, 0);
  const totalCompletedTrendTasks = tasksCompletedTrend.reduce(
    (sum, t) => sum + t.completedTasks,
    0,
  );

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header with Week Controls */}
      <PageHeader
        title="Manager Dashboard"
        description="Weekly reporting metrics, submission compliance, workload analytics, and team activities."
        actions={
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-xs flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevWeek}
              title="Previous Week"
            >
              ←
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedWeek(e.target.value);
                  }
                }}
                className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
              />
              {summary && (
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  to {summary.selectedWeekEnd}
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextWeek}
              title="Next Week"
            >
              →
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCurrentWeek}
              className="text-xs"
            >
              This Week
            </Button>
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={loadDashboard} />}

      {/* 2. Executive Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 min-w-0">
          <MetricCard
            label="Submitted"
            value={`${summary.reportsSubmitted} / ${summary.totalTeamMembers}`}
            subtext="Total submissions"
            tone="neutral"
          />
          <MetricCard
            label="Compliance"
            value={`${summary.submissionComplianceRate}%`}
            subtext="On-time rate"
            tone="indigo"
          />
          <MetricCard
            label="Pending"
            value={summary.pendingReports}
            subtext="Awaiting review"
            tone="sky"
          />
          <MetricCard
            label="Late Reports"
            value={summary.lateReports}
            subtext="Past deadline"
            tone={summary.lateReports > 0 ? 'rose' : 'neutral'}
          />
          <MetricCard
            label="Correction"
            value={summary.needsCorrection}
            subtext="Changes requested"
            tone={summary.needsCorrection > 0 ? 'amber' : 'neutral'}
          />
          <MetricCard
            label="Blockers"
            value={summary.openBlockers}
            subtext="Reported issues"
            tone={summary.openBlockers > 0 ? 'rose' : 'neutral'}
          />
        </div>
      )}

      {/* 3. Primary Insights: Trend Chart */}
      <Card className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle>Tasks Completed Trend</CardTitle>
            <CardDescription>
              Completed task velocity across the last 8 weeks.
            </CardDescription>
          </div>
          <div className="text-xs font-medium text-slate-500">
            Total: {totalCompletedTrendTasks} tasks
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full min-w-0">
            {totalCompletedTrendTasks === 0 ? (
              <EmptyState
                icon="📈"
                title="No completed tasks recorded"
                description="Completed tasks across past weeks will appear here once logged."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={tasksCompletedTrend}
                  margin={{ top: 10, right: 20, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="weekStart"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    }}
                    formatter={(value: any) => [`${value} tasks`, 'Completed']}
                    labelFormatter={(label: any) => `Week of ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedTasks"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#4f46e5' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Secondary Insights: Workload by Project & Time by Task Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Workload by Project */}
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Workload by Project</CardTitle>
              <CardDescription>
                Tasks submitted across active projects this week.
              </CardDescription>
            </div>
            <div className="text-xs font-medium text-slate-500">
              {totalTasks} total tasks
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full min-w-0">
              {workloadByProject.length === 0 || totalTasks === 0 ? (
                <EmptyState
                  icon="📊"
                  title="No project tasks logged"
                  description="Tasks for the selected week will be displayed here."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadByProject}
                    margin={{ top: 10, right: 20, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="projectName"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      }}
                      formatter={(value: any) => [`${value} tasks`, 'Task Count']}
                    />
                    <Bar dataKey="taskCount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time by Task Type */}
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Time by Task Type</CardTitle>
              <CardDescription>
                Categorical hours breakdown across teams.
              </CardDescription>
            </div>
            <div className="text-xs font-medium text-slate-500">
              Total: {totalHours} hrs
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full min-w-0">
              {totalHours === 0 ? (
                <EmptyState
                  icon="⏱️"
                  title="No hours logged"
                  description="Hour breakdowns logged across task categories will appear here."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeByTaskType}
                      dataKey="hours"
                      nameKey="taskType"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {timeByTaskType.map((entry) => (
                        <Cell
                          key={entry.taskType}
                          fill={TASK_TYPE_COLORS[entry.taskType] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      }}
                      formatter={(value: any) => [`${value} hrs`, 'Logged Time']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-[11px] text-slate-700 font-medium">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Team Operations: Member Submission Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Member Submission Status */}
        <Card className="min-w-0 flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>Member Submission Status</CardTitle>
              <CardDescription>
                Submission status for all active team members this week.
              </CardDescription>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {submissionStatusByMember.length} Members
            </span>
          </CardHeader>

          <CardContent className="flex-1">
            {submissionStatusByMember.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No team members found"
                description="Team members assigned to your team will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {submissionStatusByMember.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50/70 rounded-lg transition-colors gap-3"
                  >
                    <Link
                      to={`/manager/team-members/${member.userId}`}
                      className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-600 hover:underline truncate"
                    >
                      {member.name}
                    </Link>
                    <StatusBadge status={member.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="min-w-0 flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Audit log of latest weekly submissions and manager reviews.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex-1">
            {recentActivity.length === 0 ? (
              <EmptyState
                icon="⚡"
                title="No recent activity recorded"
                description="Report submissions, reviews, and approvals will stream into this feed."
              />
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {recentActivity.map((activity, idx) => (
                  <div
                    key={`${activity.reportId}-${activity.timestamp}-${idx}`}
                    className="py-3 px-2 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-slate-800 font-medium">
                        {activity.message}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Link
                      to={`/manager/reports/${activity.reportId}`}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 hover:underline"
                    >
                      View Report →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}