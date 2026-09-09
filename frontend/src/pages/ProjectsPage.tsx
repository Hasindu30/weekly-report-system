import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, type Project } from '../types';
import { projectsApi } from '../api/projects';
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
  Button,
  Modal,
  ConfirmDialog,
  FormField,
  Input,
  Textarea,
  Select,
  ErrorState,
  LoadingState,
  EmptyState,
} from '../components/ui';

export default function ProjectsPage() {
  const { user } = useAuth();
  const isManagerOrAdmin =
    user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);

  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setCreateError('Project name is required.');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    try {
      await projectsApi.createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNotification({
        type: 'success',
        message: 'Project created successfully.',
      });
      await loadProjects();
    } catch (err: any) {
      setCreateError(
        err?.response?.data?.message || 'Failed to create project.',
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStartEdit = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDesc(project.description || '');
    setEditIsActive(project.isActive);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editName.trim()) {
      setEditError('Project name is required.');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await projectsApi.updateProject(editingProject.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        isActive: editIsActive,
      });
      setEditingProject(null);
      setNotification({
        type: 'success',
        message: 'Project updated successfully.',
      });
      await loadProjects();
    } catch (err: any) {
      setEditError(
        err?.response?.data?.message || 'Failed to update project.',
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await projectsApi.deleteProject(deletingProject.id);
      setDeletingProject(null);
      setNotification({
        type: 'success',
        message: 'Project deleted successfully.',
      });
      await loadProjects();
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.message ||
          'Failed to delete project. Projects used by existing reports cannot be deleted.',
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Header */}
      <PageHeader
        title="Projects & Initiatives"
        description="Organizational projects and categories available for weekly work logs and reporting."
        actions={
          isManagerOrAdmin ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setShowCreateModal(true);
                setCreateError(null);
              }}
            >
              + Create Project
            </Button>
          ) : undefined
        }
      />

      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between min-w-0 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={loadProjects} />}

      {/* 2. Projects Data Table Card */}
      <Card padding="none" className="min-w-0 overflow-hidden">
        {loading ? (
          <LoadingState message="Loading projects..." />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No projects configured"
            description={
              isManagerOrAdmin
                ? 'Create your first active project to allow team members to submit weekly reports.'
                : 'No projects currently configured by management.'
            }
            action={
              isManagerOrAdmin
                ? {
                    label: '+ Create Project',
                    onClick: () => setShowCreateModal(true),
                    variant: 'primary',
                  }
                : undefined
            }
          />
        ) : (
          <DataTable className="border-none shadow-none rounded-none">
            <TableHead>
              <tr>
                <TableHeaderCell>Project Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Created Date</TableHeaderCell>
                {isManagerOrAdmin && (
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
                )}
              </tr>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {project.name}
                  </TableCell>
                  <TableCell className="text-slate-600 max-w-md truncate">
                    {project.description || '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={project.isActive ? 'ACTIVE' : 'INACTIVE'}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  {isManagerOrAdmin && (
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartEdit(project)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingProject(project);
                            setDeleteError(null);
                          }}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        )}
      </Card>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        description="Add a new project or initiative for weekly work tracking."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateSubmit}
              isLoading={createLoading}
            >
              Save Project
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {createError}
            </div>
          )}

          <FormField label="Project Name" htmlFor="new-name" required>
            <Input
              id="new-name"
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Core Platform 2.0"
            />
          </FormField>

          <FormField label="Description (Optional)" htmlFor="new-desc">
            <Textarea
              id="new-desc"
              rows={3}
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              placeholder="Brief description of the initiative scope..."
            />
          </FormField>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      {editingProject && (
        <Modal
          isOpen={Boolean(editingProject)}
          onClose={() => setEditingProject(null)}
          title="Edit Project"
          description={`Update details for ${editingProject.name}.`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProject(null)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEditSubmit}
                isLoading={editLoading}
              >
                Update Project
              </Button>
            </>
          }
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {editError}
              </div>
            )}

            <FormField label="Project Name" htmlFor="edit-name" required>
              <Input
                id="edit-name"
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </FormField>

            <FormField label="Description" htmlFor="edit-desc">
              <Textarea
                id="edit-desc"
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </FormField>

            <FormField label="Status" htmlFor="edit-status">
              <Select
                id="edit-status"
                value={editIsActive ? 'true' : 'false'}
                onChange={(e) => setEditIsActive(e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </FormField>
          </form>
        </Modal>
      )}

      {/* Delete Project Confirmation Dialog */}
      {deletingProject && (
        <ConfirmDialog
          isOpen={Boolean(deletingProject)}
          onClose={() => setDeletingProject(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Project"
          message={
            <div className="space-y-2">
              <p>
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-slate-900">
                  {deletingProject.name}
                </span>
                ?
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-md border border-amber-200">
                ⚠️ Note: Projects referenced in existing weekly reports cannot be
                deleted. Mark them inactive instead.
              </p>
            </div>
          }
          confirmLabel="Delete Project"
          variant="danger"
          isLoading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  );
}