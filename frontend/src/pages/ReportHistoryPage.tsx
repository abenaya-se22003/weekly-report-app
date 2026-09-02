import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Report, Project } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  History,
  PlusCircle,
  FolderKanban,
  Calendar,
  ArrowUpRight,
  Edit3,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const ReportHistoryPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalReports, setTotalReports] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getProjects().then((res) => setProjects(res.projects)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.getMyReports({
          status: statusFilter || undefined,
          projectId: projectFilter || undefined,
          page,
          limit: 8,
        });
        setReports(res.reports);
        setTotalPages(res.pagination.totalPages);
        setTotalReports(res.pagination.total);
      } catch (err: any) {
        setError(err.message || 'Failed to load report history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [statusFilter, projectFilter, page]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            Personal History
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Weekly Reports
          </h1>
          <p className="text-xs sm:text-sm text-surface-400 mt-1">
            Track, review, and resubmit your weekly report submissions and manager feedback.
          </p>
        </div>

        <Link
          to="/reports/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> New Weekly Report
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-4 backdrop-blur-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Status Filter */}
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>

        {/* Project Filter */}
        <div className="w-full sm:w-56">
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-surface-400">
          Showing <span className="text-white font-semibold">{reports.length}</span> of{' '}
          <span className="text-white font-semibold">{totalReports}</span> reports
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Table / List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-400">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading report history...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-surface-900/40 border border-dashed border-surface-700/80 rounded-2xl p-12 text-center">
          <FileText className="w-10 h-10 text-surface-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No reports found</h3>
          <p className="text-xs text-surface-400 max-w-sm mx-auto mb-5">
            {statusFilter || projectFilter
              ? 'Try adjusting your filters to find existing reports.'
              : 'You have not submitted any weekly reports yet. Create your first report to get started.'}
          </p>
          <Link
            to="/reports/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" /> Create New Report
          </Link>
        </div>
      ) : (
        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-800/80 text-surface-400 font-medium text-[10px] uppercase tracking-wider border-b border-surface-700/80">
                <tr>
                  <th className="py-3.5 px-4">Week &amp; Dates</th>
                  <th className="py-3.5 px-3">Project</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3 text-center">Version</th>
                  <th className="py-3.5 px-3 text-center">Tasks</th>
                  <th className="py-3.5 px-3">Manager Feedback</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/80 text-surface-200">
                {reports.map((report) => {
                  const startStr = new Date(report.weekStartDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                  const endStr = new Date(report.weekEndDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const latestVersion = report.versions?.[0];
                  const taskCount = latestVersion?.tasks?.length || 0;
                  const latestReview = report.reviews?.[0];
                  const canEdit = ['DRAFT', 'NEEDS_CORRECTION'].includes(report.status);

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-surface-800/40 transition-colors group"
                    >
                      <td className="p-4">
                        <Link
                          to={`/reports/${report.id}`}
                          className="font-semibold text-white group-hover:text-primary-300 transition-colors flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5 text-primary-400" />
                          {startStr} – {endStr}
                        </Link>
                        <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                          Updated {new Date(report.updatedAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-800/80 border border-surface-700 rounded-lg text-xs font-medium text-surface-200">
                          <FolderKanban className="w-3 h-3 text-primary-400" />
                          {report.project?.name || 'General'}
                        </span>
                      </td>

                      <td className="p-3">
                        <StatusBadge status={report.status} />
                      </td>

                      <td className="p-3 text-center font-mono text-xs">
                        <span className="px-2 py-0.5 bg-surface-950 rounded text-surface-300 border border-surface-800">
                          v{report.version}
                        </span>
                      </td>

                      <td className="p-3 text-center font-mono text-xs text-surface-300">
                        {taskCount} item{taskCount !== 1 ? 's' : ''}
                      </td>

                      <td className="p-3 max-w-xs">
                        {latestReview ? (
                          <div className="text-[11px] truncate text-surface-300">
                            <span className="font-semibold text-white">
                              {latestReview.action === 'APPROVED' ? 'Approved' : 'Correction'}:
                            </span>{' '}
                            {latestReview.comment}
                          </div>
                        ) : (
                          <span className="text-[11px] text-surface-500 italic">No reviews yet</span>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {canEdit && (
                          <Link
                            to={`/reports/${report.id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </Link>
                        )}
                        <Link
                          to={`/reports/${report.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white rounded-lg text-xs transition-colors"
                        >
                          View <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-surface-950/60 border-t border-surface-800 flex items-center justify-between text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-surface-800 hover:bg-surface-700 disabled:opacity-40 rounded-lg text-surface-300 transition-colors"
              >
                Previous
              </button>
              <span className="text-surface-400">
                Page <span className="text-white font-semibold">{page}</span> of{' '}
                <span className="text-white font-semibold">{totalPages}</span>
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-surface-800 hover:bg-surface-700 disabled:opacity-40 rounded-lg text-surface-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
