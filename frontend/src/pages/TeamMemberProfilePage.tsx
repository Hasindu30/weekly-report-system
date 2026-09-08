import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { TeamMemberProfileResponse } from '../types';
import { teamMembersApi } from '../api/team-members';
import StatusBadge from '../components/StatusBadge';

export default function TeamMemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<TeamMemberProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await teamMembersApi.getProfile(id);
        setProfile(data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Failed to load team member profile.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex flex-col items-start space-y-3">
          <div className="font-semibold text-base">Error Loading Profile</div>
          <p>{error || 'Member not found.'}</p>
          <button
            type="button"
            onClick={() => navigate('/manager/reports')}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition cursor-pointer"
          >
            ← Back to Team Reports
          </button>
        </div>
      </div>
    );
  }

  const { user, summary, recentReports } = profile;

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link
          to="/manager/reports"
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
        >
          <span>← Team Reports</span>
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">
          {user.firstName} {user.lastName}
        </span>
      </div>

      {/* Member Profile Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-2xl">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                {user.role}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  user.isActive !== false
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {user.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 md:text-right">
          <div>Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Total Reports</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{summary.totalReports}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-emerald-600 font-medium">Approved</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{summary.approvedReports}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-amber-600 font-medium">Needs Correction</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summary.needsCorrectionReports}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Latest Status</div>
          <div className="mt-2">
            {summary.currentReportStatus ? (
              <StatusBadge status={summary.currentReportStatus} />
            ) : (
              <span className="text-xs text-gray-400 font-medium">No Reports</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-indigo-600 font-medium">Completed Tasks</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{summary.totalCompletedTasks}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-rose-600 font-medium">Total Blockers</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{summary.totalBlockers}</div>
        </div>
      </div>

      {/* Recent Weekly Reports */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Recent Weekly Reports</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            History of reports submitted by {user.firstName} {user.lastName}.
          </p>
        </div>

        {recentReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-gray-400 text-4xl">📄</div>
            <h3 className="text-base font-semibold text-gray-900">No Reports Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              This team member has not created or submitted any weekly reports yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">Week Range</th>
                  <th className="py-3.5 px-6">Project</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Hours Spent</th>
                  <th className="py-3.5 px-6">Submitted At</th>
                  <th className="py-3.5 px-6">Approved At</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-4 px-6 text-gray-900 font-medium whitespace-nowrap">
                      {report.weekStart} – {report.weekEnd}
                    </td>
                    <td className="py-4 px-6 text-gray-800 whitespace-nowrap">
                      {report.project?.name || '—'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-medium whitespace-nowrap">
                      {report.totalHoursSpent !== undefined ? `${report.totalHoursSpent} hrs` : '—'}
                    </td>
                    <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                      {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                      {report.approvedAt ? new Date(report.approvedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <Link
                        to={`/manager/reports/${report.id}`}
                        className="font-semibold px-3 py-1.5 rounded-md text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        View / Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
