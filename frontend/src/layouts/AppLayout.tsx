import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

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
        { path: '/member', label: 'Dashboard' },
        { path: '/reports/new', label: 'New Report' },
        { path: '/reports/history', label: 'Report History' },
        { path: '/projects', label: 'Projects' },
      ]
    : [
        { path: '/manager', label: 'Manager Dashboard' },
        { path: '/manager/reports', label: 'Team Reports' },
        { path: '/projects', label: 'Projects' },
        ...(user?.role === UserRole.ADMIN
          ? [{ path: '/admin/users', label: 'User Management' }]
          : []),
      ];

  const roleBadgeColor =
    user?.role === UserRole.ADMIN
      ? 'bg-purple-100 text-purple-800'
      : user?.role === UserRole.MANAGER
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar Area */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-200">
          <Link
            to={isTeamMember ? '/member' : '/manager'}
            className="text-xl font-bold text-indigo-600 tracking-tight"
          >
            Weekly Report
          </Link>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            type="button"
            className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Area */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="text-sm font-medium text-gray-500">
            Weekly Report Generator & Team Dashboard
          </div>
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor}`}
              >
                {user.role}
              </span>
            </div>
          )}
        </header>

        {/* Page Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}