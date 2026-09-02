import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';
import { Modal } from '../components/common/Modal';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { role } = useAuth();
  const isManager = role === 'MANAGER';

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProjects(true); // include inactive for managers
      setProjects(res.projects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description || '');
    setIsActive(proj.isActive);
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
        });
      } else {
        await api.createProject({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (proj: Project) => {
    if (!window.confirm(`Are you sure you want to deactivate or delete "${proj.name}"?`)) {
      return;
    }
    try {
      await api.deleteProject(proj.id);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-xs font-semibold mb-2">
            <FolderKanban className="w-3.5 h-3.5" />
            Portfolio Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Projects Management
          </h1>
          <p className="text-xs sm:text-sm text-surface-400 mt-1">
            Browse and manage organizational initiatives and report categories.
          </p>
        </div>

        {isManager && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Project
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-400">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center text-surface-400 bg-surface-900/40 rounded-2xl border border-surface-800">
          No projects configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between hover:border-surface-600 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-primary-300 transition-colors">
                      {proj.name}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      proj.isActive
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {proj.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" /> Archived
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-surface-300 line-clamp-3 mb-4 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-surface-800/80 flex items-center justify-between">
                <div className="text-xs text-surface-400 flex items-center gap-1.5 font-mono">
                  <FileText className="w-3.5 h-3.5 text-surface-500" />
                  <span>{proj._count?.reports || 0} reports linked</span>
                </div>

                {isManager && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(proj)}
                      className="p-1.5 text-surface-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Deactivate / Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? `Edit ${editingProject.name}` : 'Create New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Redesign"
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1.5">
              Description &amp; Goals
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project scope, objectives, or client overview..."
              className="w-full bg-surface-950 border border-surface-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {editingProject && (
            <div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-surface-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-surface-700 bg-surface-950 text-primary-600 focus:ring-0"
                />
                Active (available for weekly report selection)
              </label>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
