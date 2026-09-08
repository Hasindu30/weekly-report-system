import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { type User, UserRole } from '../types';
import { adminUsersApi } from '../api/admin-users';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const limit = 10;

  // Modals state
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>(UserRole.TEAM_MEMBER);
  const [roleUpdating, setRoleUpdating] = useState<boolean>(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [statusModalUser, setStatusModalUser] = useState<User | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminUsersApi.getUsers({
        page,
        limit,
        role: (roleFilter as UserRole) || undefined,
        isActive:
          statusFilter === 'active'
            ? true
            : statusFilter === 'inactive'
            ? false
            : undefined,
        search: search.trim() || undefined,
      });

      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalRecords(response.meta.totalRecords);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to load users. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, statusFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const openRoleModal = (targetUser: User) => {
    setRoleModalUser(targetUser);
    setNewSelectedRole(targetUser.role);
    setRoleError(null);
  };

  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    if (roleModalUser.id === currentUser?.id && newSelectedRole !== UserRole.ADMIN) {
      setRoleError('You cannot remove your own ADMIN role.');
      return;
    }

    setRoleUpdating(true);
    setRoleError(null);
    try {
      await adminUsersApi.updateUserRole(roleModalUser.id, newSelectedRole);
      setActionSuccess(
        `Role for ${roleModalUser.firstName} ${roleModalUser.lastName} updated to ${newSelectedRole}.`,
      );
      setRoleModalUser(null);
      fetchUsers();
    } catch (err: any) {
      setRoleError(err?.response?.data?.message || 'Failed to update role.');
    } finally {
      setRoleUpdating(false);
    }
  };

  const openStatusModal = (targetUser: User) => {
    setStatusModalUser(targetUser);
    setStatusError(null);
  };

  const handleToggleStatus = async () => {
    if (!statusModalUser) return;
    const newStatus = !statusModalUser.isActive;

    if (statusModalUser.id === currentUser?.id && !newStatus) {
      setStatusError('You cannot deactivate your own account.');
      return;
    }

    setStatusUpdating(true);
    setStatusError(null);
    try {
      await adminUsersApi.updateUserStatus(statusModalUser.id, newStatus);
      setActionSuccess(
        `User ${statusModalUser.firstName} ${statusModalUser.lastName} is now ${
          newStatus ? 'Active' : 'Inactive'
        }.`,
      );
      setStatusModalUser(null);
      fetchUsers();
    } catch (err: any) {
      setStatusError(err?.response?.data?.message || 'Failed to update user status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case UserRole.MANAGER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.TEAM_MEMBER:
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage system users, update administrative roles, and activate or deactivate accounts.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-green-600 hover:text-green-800 font-bold ml-4 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="text-sm font-semibold text-gray-800">Filter & Search Users</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search-user" className="block text-xs font-medium text-gray-600 mb-1">
              Search (Name or Email)
            </label>
            <input
              id="search-user"
              type="text"
              placeholder="e.g. Alex or alex@example.com"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label htmlFor="role-filter" className="block text-xs font-medium text-gray-600 mb-1">
              Role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Roles</option>
              <option value={UserRole.ADMIN}>ADMIN</option>
              <option value={UserRole.MANAGER}>MANAGER</option>
              <option value={UserRole.TEAM_MEMBER}>TEAM_MEMBER</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {(search || roleFilter || statusFilter) && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 font-medium">Loading users...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-gray-400 text-4xl">👥</div>
            <h3 className="text-base font-semibold text-gray-900">No Users Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              No user accounts match your search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Created Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span>
                            {u.firstName} {u.lastName}
                          </span>
                          {isSelf && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-normal">{u.email}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(
                            u.role,
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => openRoleModal(u)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                        >
                          Change Role
                        </button>
                        <button
                          type="button"
                          onClick={() => openStatusModal(u)}
                          disabled={isSelf && u.isActive !== false}
                          title={
                            isSelf && u.isActive !== false
                              ? 'You cannot deactivate your own account'
                              : undefined
                          }
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                            isSelf && u.isActive !== false
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : u.isActive !== false
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {u.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && users.length > 0 && (
          <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * limit, totalRecords)}</span> of{' '}
              <span className="font-medium">{totalRecords}</span> users
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 text-xs text-gray-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Change User Role</h3>
            <p className="text-sm text-gray-600">
              Select a new role for{' '}
              <span className="font-semibold text-gray-900">
                {roleModalUser.firstName} {roleModalUser.lastName}
              </span>{' '}
              ({roleModalUser.email}).
            </p>

            {roleError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {roleError}
              </div>
            )}

            <div>
              <label htmlFor="role-select" className="block text-xs font-semibold text-gray-700 mb-1">
                New Role
              </label>
              <select
                id="role-select"
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value as UserRole)}
                className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={UserRole.TEAM_MEMBER}>TEAM_MEMBER</option>
                <option value={UserRole.MANAGER}>MANAGER</option>
                <option value={UserRole.ADMIN}>ADMIN</option>
              </select>
              {roleModalUser.id === currentUser?.id && newSelectedRole !== UserRole.ADMIN && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Note: You cannot remove your own ADMIN role.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                disabled={roleUpdating}
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  roleUpdating ||
                  (roleModalUser.id === currentUser?.id && newSelectedRole !== UserRole.ADMIN)
                }
                onClick={handleSaveRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-50 flex items-center space-x-1"
              >
                {roleUpdating ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {statusModalUser.isActive !== false ? 'Deactivate User Account' : 'Activate User Account'}
            </h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to{' '}
              <span className="font-semibold">
                {statusModalUser.isActive !== false ? 'deactivate' : 'activate'}
              </span>{' '}
              the account for{' '}
              <span className="font-semibold text-gray-900">
                {statusModalUser.firstName} {statusModalUser.lastName}
              </span>{' '}
              ({statusModalUser.email})?
            </p>

            {statusModalUser.isActive !== false && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md">
                Deactivated users will not be able to log in to the application.
              </div>
            )}

            {statusError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {statusError}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => setStatusModalUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-white rounded-md text-sm font-medium cursor-pointer disabled:opacity-50 ${
                  statusModalUser.isActive !== false
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusUpdating
                  ? 'Updating...'
                  : statusModalUser.isActive !== false
                  ? 'Deactivate Account'
                  : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
