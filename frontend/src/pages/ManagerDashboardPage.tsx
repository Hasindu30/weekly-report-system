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
  DEVELOPMENT: '#6366f1', // Indigo
  TESTING: '#06b6d4', // Cyan
  MEETINGS: '#f59e0b', // Amber
  DOCUMENTATION: '#10b981', // Emerald
  OTHER: '#8b5cf6', // Violet
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
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 font-medium">Loading manager dashboard...</span>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-white p-8 rounded-lg border border-red-200 text-center space-y-4 shadow-sm max-w-lg mx-auto mt-8">
        <div className="text-red-600 font-medium">{error}</div>
        <button
          type="button"
          onClick={loadDashboard}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const submissionStatusByMember = dashboardData?.submissionStatusByMember || [];
  const workloadByProject = dashboardData?.workloadByProject || [];
  const timeByTaskType = dashboardData?.timeByTaskType || [];
  const tasksCompletedTrend = dashboardData?.tasksCompletedTrend || [];
  const recentActivity = dashboardData?.recentActivity || [];

  const totalHours = timeByTaskType.reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const totalTasks = workloadByProject.reduce((acc, curr) => acc + (curr.taskCount || 0), 0);
  const totalCompletedTrendTasks = tasksCompletedTrend.reduce(
    (acc, curr) => acc + (curr.completedTasks || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Top Header & Week Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Weekly team progress, compliance rate, workload distribution, and review activity.
          </p>
        </div>

        {/* Selected Week Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrevWeek}
            title="Previous Week"
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
          >
            ← Prev
          </button>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedWeek(e.target.value);
                }
              }}
              className="text-xs font-medium border border-gray-300 rounded py-1.5 px-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {summary && (
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                to {summary.selectedWeekEnd}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleNextWeek}
            title="Next Week"
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={handleCurrentWeek}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 cursor-pointer"
          >
            This Week
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadDashboard}
            className="text-xs font-bold underline ml-4 hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Summary Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Reports Submitted */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {summary.reportsSubmitted}{' '}
              <span className="text-xs font-normal text-gray-400">
                / {summary.totalTeamMembers}
              </span>
            </div>
            <div className="text-xs text-gray-400">Total team members: {summary.totalTeamMembers}</div>
          </div>

          {/* Submission Compliance */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Compliance
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {summary.submissionComplianceRate}%
            </div>
            <div className="text-xs text-gray-400">Submission rate</div>
          </div>

          {/* Pending Reports */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pending
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {summary.pendingReports}
            </div>
            <div className="text-xs text-gray-400">Awaiting submission</div>
          </div>

          {/* Late Reports */}
          <div
            className={`p-4 rounded-lg border shadow-sm space-y-1 ${
              summary.lateReports > 0
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`text-xs font-medium uppercase tracking-wider ${
                summary.lateReports > 0 ? 'text-rose-700' : 'text-gray-500'
              }`}
            >
              Late Reports
            </div>
            <div
              className={`text-2xl font-bold ${
                summary.lateReports > 0 ? 'text-rose-700' : 'text-gray-900'
              }`}
            >
              {summary.lateReports}
            </div>
            <div className="text-xs text-gray-400">Past deadline</div>
          </div>

          {/* Needs Correction */}
          <div
            className={`p-4 rounded-lg border shadow-sm space-y-1 ${
              summary.needsCorrection > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`text-xs font-medium uppercase tracking-wider ${
                summary.needsCorrection > 0 ? 'text-amber-700' : 'text-gray-500'
              }`}
            >
              Correction
            </div>
            <div
              className={`text-2xl font-bold ${
                summary.needsCorrection > 0 ? 'text-amber-700' : 'text-gray-900'
              }`}
            >
              {summary.needsCorrection}
            </div>
            <div className="text-xs text-gray-400">Changes requested</div>
          </div>

          {/* Open Blockers */}
          <div
            className={`p-4 rounded-lg border shadow-sm space-y-1 ${
              summary.openBlockers > 0
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`text-xs font-medium uppercase tracking-wider ${
                summary.openBlockers > 0 ? 'text-red-700' : 'text-gray-500'
              }`}
            >
              Blockers
            </div>
            <div
              className={`text-2xl font-bold ${
                summary.openBlockers > 0 ? 'text-red-700' : 'text-gray-900'
              }`}
            >
              {summary.openBlockers}
            </div>
            <div className="text-xs text-gray-400">Team obstacles</div>
          </div>
        </div>
      )}

      {/* 2. Charts Section: Tasks Completed Trend & Workload by Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Completed Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Tasks Completed Trend (8 Weeks)
            </h2>
            <span className="text-xs text-gray-500 font-medium">Team-wide completion</span>
          </div>

          <div className="h-64 w-full">
            {totalCompletedTrendTasks === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-2xl mb-1">📈</span>
                <p className="text-sm font-medium text-gray-600">No completed tasks recorded</p>
                <p className="text-xs text-gray-400">
                  Completed tasks across the last 8 weeks will appear here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={tasksCompletedTrend}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
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
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} tasks`, 'Completed']}
                    labelFormatter={(label: any) => `Week of ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedTasks"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Workload by Project */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Workload by Project
            </h2>
            <span className="text-xs text-gray-500 font-medium">Active week tasks</span>
          </div>

          <div className="h-64 w-full">
            {workloadByProject.length === 0 || totalTasks === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-2xl mb-1">📊</span>
                <p className="text-sm font-medium text-gray-600">No project tasks logged</p>
                <p className="text-xs text-gray-400">
                  Tasks submitted for the selected week will be displayed here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workloadByProject}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
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
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} tasks`, 'Task Count']}
                  />
                  <Bar dataKey="taskCount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. Charts & Lists: Time by Task Type & Submission Status by Member */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time by Task Type */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Time by Task Type
            </h2>
            <span className="text-xs text-gray-500 font-medium">Total: {totalHours} hrs</span>
          </div>

          <div className="h-64 w-full">
            {totalHours === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-2xl mb-1">⏱️</span>
                <p className="text-sm font-medium text-gray-600">No hour breakdown logged</p>
                <p className="text-xs text-gray-400">
                  Hours recorded across task categories will appear here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeByTaskType}
                    dataKey="hours"
                    nameKey="taskType"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {timeByTaskType.map((entry) => (
                      <Cell
                        key={`cell-${entry.taskType}`}
                        fill={TASK_TYPE_COLORS[entry.taskType] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} hrs`, 'Logged Time']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Submission Status by Team Member */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Member Submission Status
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {submissionStatusByMember.length} Members
            </span>
          </div>

          {submissionStatusByMember.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <span className="text-2xl mb-1">👥</span>
              <p className="text-sm font-medium text-gray-600">No team members found</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-64 space-y-2.5 pr-1">
              {submissionStatusByMember.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100/70 transition-colors"
                >
                  <Link
                    to={`/manager/team-members/${member.userId}`}
                    className="font-medium text-sm text-indigo-600 hover:text-indigo-900 hover:underline"
                  >
                    {member.name}
                  </Link>
                  <StatusBadge status={member.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Activity Feed */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          <span className="text-xs text-gray-500 font-medium">Latest submissions & reviews</span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-gray-400 space-y-1">
            <div className="text-2xl">⚡</div>
            <p className="text-sm font-medium text-gray-600">No recent activity recorded</p>
            <p className="text-xs text-gray-400">
              Submission and review actions will appear in this feed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentActivity.map((activity, idx) => {
              const isApproved = activity.type === 'REPORT_APPROVED';
              const isCorrection = activity.type === 'CHANGES_REQUESTED';

              const badgeStyle = isApproved
                ? 'bg-green-100 text-green-800 border-green-200'
                : isCorrection
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-blue-100 text-blue-800 border-blue-200';

              const badgeLabel = isApproved
                ? 'Approved'
                : isCorrection
                ? 'Correction'
                : 'Submitted';

              return (
                <div
                  key={`${activity.reportId}-${activity.timestamp}-${idx}`}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/50 rounded px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border shrink-0 ${badgeStyle}`}
                    >
                      {badgeLabel}
                    </span>
                    <span className="text-sm text-gray-800">{activity.message}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                    <span>{new Date(activity.timestamp).toLocaleString()}</span>
                    {activity.reportId && (
                      <Link
                        to={`/manager/reports/${activity.reportId}`}
                        className="font-medium text-indigo-600 hover:text-indigo-900 underline"
                      >
                        View Report →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}