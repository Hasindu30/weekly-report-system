import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const isTeamMember = user?.role === UserRole.TEAM_MEMBER;

  const navItems = isTeamMember
    ? [
        { path: '/member', label: 'Dashboard', icon: '📊' },
        { path: '/reports/new', label: 'New Report', icon: '✍️' },
        { path: '/reports/history', label: 'Report History', icon: '📁' },
        { path: '/projects', label: 'Projects', icon: '🎯' },
      ]
    : [
        { path: '/manager', label: 'Manager Dashboard', icon: '📈' },
        { path: '/manager/reports', label: 'Team Reports', icon: '📋' },
        { path: '/projects', label: 'Projects', icon: '🎯' },
        ...(user?.role === UserRole.ADMIN
          ? [{ path: '/admin/users', label: 'User Management', icon: '👥' }]
          : []),
      ];

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Area */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 md:h-screen z-20">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <Link
            to={isTeamMember ? '/member' : '/manager'}
            className="flex items-center gap-2.5 text-slate-900 group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-indigo-700 transition-colors">
              WR
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                Weekly Report
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Team Dashboard
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3.5 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {isTeamMember ? 'Member Workspace' : 'Manager Workspace'}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50/90 text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`
              }
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Account / Sign Out Footer */}
        <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50">
          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg transition-colors cursor-pointer"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="text-xs sm:text-sm font-medium text-slate-500 truncate mr-4">
            {isTeamMember
              ? 'Individual Progress & Submission System'
              : 'Team Operations & Analytics Console'}
          </div>

          {user && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[11px] text-slate-400">{user.email}</div>
              </div>
              <StatusBadge status={user.role} size="sm" />
            </div>
          )}
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0 space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}