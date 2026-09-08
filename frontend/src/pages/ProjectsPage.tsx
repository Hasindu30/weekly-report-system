import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, type Project } from '../types';
import { projectsApi } from '../api/projects';

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
        description: editDesc.trim() || null,
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
      const msg =
        err?.response?.data?.message ||
        'This project is used by existing reports and cannot be deleted. Mark it inactive instead.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects & Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isManagerOrAdmin
              ? 'Create, update, and manage project categories available for weekly report assignments.'
              : 'Browse active project categories available for your weekly reports.'}
          </p>
        </div>

        {isManagerOrAdmin && (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
          >
            + Add Project
          </button>
        )}
      </div>

      {/* Global Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center justify-between shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="font-bold text-base ml-4 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadProjects}
            className="text-xs font-bold underline ml-4 hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Projects Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 font-medium">Loading projects...</span>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-gray-400 text-4xl">📁</div>
            <h3 className="text-base font-semibold text-gray-900">No Projects Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {isManagerOrAdmin
                ? 'No project categories have been created yet. Click "+ Add Project" to get started.'
                : 'No projects are currently available.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-6">Project Name</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Last Updated</th>
                  {isManagerOrAdmin && (
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 whitespace-nowrap">
                      {project.name}
                    </td>
                    <td className="py-4 px-6 text-gray-600 max-w-md">
                      {project.description || (
                        <span className="text-gray-400 italic">No description provided</span>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {project.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>
                    {isManagerOrAdmin && (
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-3">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(project)}
                          className="font-medium text-indigo-600 hover:text-indigo-900 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingProject(project);
                          }}
                          className="font-medium text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add New Project</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="create-name"
                  className="block text-xs font-semibold text-gray-700 mb-1 uppercase"
                >
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-name"
                  type="text"
                  required
                  maxLength={150}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="E.g. Mobile Application"
                  className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="create-desc"
                  className="block text-xs font-semibold text-gray-700 mb-1 uppercase"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="create-desc"
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Describe the scope or purpose of this project..."
                  className="w-full text-sm rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Edit Project</h3>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-xs font-semibold text-gray-700 mb-1 uppercase"
                >
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  maxLength={150}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-desc"
                  className="block text-xs font-semibold text-gray-700 mb-1 uppercase"
                >
                  Description
                </label>
                <textarea
                  id="edit-desc"
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-sm rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="edit-isactive"
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="edit-isactive"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Active (Available for weekly report selection)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Delete Project</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete project{' '}
              <strong>"{deletingProject.name}"</strong>?
            </p>

            {deleteError ? (
              <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-md font-medium leading-relaxed">
                ⚠️ {deleteError}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                This action cannot be undone. If this project is already associated with existing weekly reports, it cannot be deleted.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingProject(null);
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              {!deleteError && (
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete Project'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}