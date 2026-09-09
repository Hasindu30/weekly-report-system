import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { type User, UserRole } from '../types';
import { adminUsersApi } from '../api/admin-users';
import StatusBadge from '../components/StatusBadge';
import {
  PageHeader,
  Card,
  DataTable,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Pagination,
  Button,
  Modal,
  ConfirmDialog,
  FormField,
  Select,
  SearchInput,
  ErrorState,
  LoadingState,
  EmptyState,
} from '../components/ui';

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

  const hasActiveFilters = Boolean(search) || Boolean(roleFilter) || Boolean(statusFilter);

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header */}
      <PageHeader
        title="User Management"
        description="Manage organizational accounts, assign administrative privileges, and toggle activation status."
      />

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between min-w-0">
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={fetchUsers} />}

      {/* 2. Filter Bar */}
      <Card className="min-w-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Search & Filters
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Clear all filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 min-w-0">
            {/* Search */}
            <FormField label="Search User" htmlFor="search-user">
              <SearchInput
                id="search-user"
                placeholder="Name or email address..."
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
              />
            </FormField>

            {/* Role Filter */}
            <FormField label="Role Filter" htmlFor="role-filter">
              <Select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value={UserRole.ADMIN}>ADMIN</option>
                <option value={UserRole.MANAGER}>MANAGER</option>
                <option value={UserRole.TEAM_MEMBER}>TEAM_MEMBER</option>
              </Select>
            </FormField>

            {/* Status Filter */}
            <FormField label="Status Filter" htmlFor="status-filter">
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </div>
        </div>
      </Card>

      {/* 3. Users Data Table Card */}
      <Card padding="none" className="min-w-0 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading user accounts..." />
        ) : users.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No users found"
            description="No user accounts match your search and filter parameters."
            action={
              hasActiveFilters
                ? {
                    label: 'Clear Filters',
                    onClick: handleClearFilters,
                    variant: 'secondary',
                  }
                : undefined
            }
          />
        ) : (
          <div>
            <DataTable className="border-none shadow-none rounded-none">
              <TableHead>
                <tr>
                  <TableHeaderCell>User Details</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Created Date</TableHeaderCell>
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>
                            {u.firstName} {u.lastName}
                          </span>
                          {isSelf && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {u.email}
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={u.role} size="sm" />
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={u.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          size="sm"
                        />
                      </TableCell>

                      <TableCell className="text-slate-500">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : '—'}
                      </TableCell>

                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openRoleModal(u)}
                          >
                            Change Role
                          </Button>
                          <Button
                            variant={u.isActive !== false ? 'outline' : 'success'}
                            size="sm"
                            onClick={() => openStatusModal(u)}
                            disabled={isSelf && u.isActive !== false}
                            title={
                              isSelf && u.isActive !== false
                                ? 'You cannot deactivate your own account'
                                : undefined
                            }
                            className={
                              u.isActive !== false
                                ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                                : ''
                            }
                          >
                            {u.isActive !== false ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* Change Role Modal */}
      {roleModalUser && (
        <Modal
          isOpen={Boolean(roleModalUser)}
          onClose={() => setRoleModalUser(null)}
          title="Change User Role"
          description={`Update permission role for ${roleModalUser.firstName} ${roleModalUser.lastName} (${roleModalUser.email}).`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleModalUser(null)}
                disabled={roleUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRole}
                isLoading={roleUpdating}
                disabled={
                  roleModalUser.id === currentUser?.id &&
                  newSelectedRole !== UserRole.ADMIN
                }
              >
                Save Role
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {roleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {roleError}
              </div>
            )}

            <FormField label="Assigned Role" htmlFor="role-select">
              <Select
                id="role-select"
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value as UserRole)}
              >
                <option value={UserRole.TEAM_MEMBER}>TEAM_MEMBER</option>
                <option value={UserRole.MANAGER}>MANAGER</option>
                <option value={UserRole.ADMIN}>ADMIN</option>
              </Select>
            </FormField>

            {roleModalUser.id === currentUser?.id &&
              newSelectedRole !== UserRole.ADMIN && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  ⚠️ Note: Self-demotion guard: You cannot remove your own ADMIN role.
                </p>
              )}
          </div>
        </Modal>
      )}

      {/* Status Confirmation Modal */}
      {statusModalUser && (
        <ConfirmDialog
          isOpen={Boolean(statusModalUser)}
          onClose={() => setStatusModalUser(null)}
          onConfirm={handleToggleStatus}
          title={
            statusModalUser.isActive !== false
              ? 'Deactivate User Account'
              : 'Activate User Account'
          }
          message={
            <div className="space-y-2">
              <p>
                Are you sure you want to{' '}
                <span className="font-semibold text-slate-900">
                  {statusModalUser.isActive !== false ? 'deactivate' : 'activate'}
                </span>{' '}
                the account for{' '}
                <span className="font-semibold text-slate-900">
                  {statusModalUser.firstName} {statusModalUser.lastName}
                </span>{' '}
                ({statusModalUser.email})?
              </p>
              {statusModalUser.isActive !== false && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  ⚠️ Deactivated users will be blocked from logging into the platform.
                </p>
              )}
            </div>
          }
          confirmLabel={
            statusModalUser.isActive !== false ? 'Deactivate Account' : 'Activate Account'
          }
          variant={statusModalUser.isActive !== false ? 'danger' : 'success'}
          isLoading={statusUpdating}
          error={statusError}
        />
      )}
    </div>
  );
}
