import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Report } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { TaskStatusBadge } from '../components/common/TaskStatusBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { VersionTimeline } from '../components/reports/VersionTimeline';
import { HoursBreakdownView } from '../components/reports/HoursBreakdownView';
import {
  ArrowLeft,
  Calendar,
  FolderKanban,
  User,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Award,
  Link as LinkIcon,
  MessageSquare,
  FileText,
} from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.getReport(id);
        setReport(res.report);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-surface-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading report details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="p-6 bg-surface-900 border border-surface-800 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Could Not Load Report</h2>
          <p className="text-xs text-surface-400 mb-6">{error || 'Report not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === report.userId;
  const isManager = role === 'MANAGER';
  const canEdit = isOwner && ['DRAFT', 'NEEDS_CORRECTION'].includes(report.status);
  const latestVersion = report.versions?.[0];
  const content = latestVersion?.content || {};
  const tasks = latestVersion?.tasks || [];
  const latestReview = report.reviews?.[0];

  const startStr = new Date(report.weekStartDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endStr = new Date(report.weekEndDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Navigation Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isManager ? '/reports' : '/reports/mine')}
            className="p-2 bg-surface-900 hover:bg-surface-800 border border-surface-800 rounded-xl text-surface-400 hover:text-white transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={report.status} />
              <span className="text-xs font-mono bg-surface-900 border border-surface-800 text-surface-300 px-2 py-0.5 rounded-full">
                Version {report.version}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              Week of {startStr} – {endStr}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {canEdit && (
            <Link
              to={`/reports/${report.id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/20 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Report
            </Link>
          )}
          {isManager && (
            <Link
              to={`/reports/${report.id}/review`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Review / Approve
            </Link>
          )}
        </div>
      </div>

      {/* Needs Correction Notice with Manager Comment */}
      {report.status === 'NEEDS_CORRECTION' && latestReview && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" /> Manager Requested Changes
            </div>
            {latestReview.reviewer && (
              <span className="text-[11px] text-amber-400/80">
                by {latestReview.reviewer.name} on {new Date(latestReview.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-surface-100 bg-surface-950/40 p-3 rounded-xl border border-amber-500/20 font-medium">
            "{latestReview.comment}"
          </p>
          {isOwner && (
            <div className="pt-2">
              <Link
                to={`/reports/${report.id}/edit`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-surface-950 font-bold rounded-xl text-xs transition-all shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" /> Revise &amp; Resubmit Report
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Metadata Info Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm">
        <div>
          <span className="text-[11px] text-surface-400 block mb-1">Author</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <User className="w-3.5 h-3.5 text-primary-400" />
            {report.user?.name || 'Unknown'}
          </div>
          <div className="text-[10px] text-surface-400 truncate">{report.user?.email}</div>
        </div>

        <div>
          <span className="text-[11px] text-surface-400 block mb-1">Project</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <FolderKanban className="w-3.5 h-3.5 text-primary-400" />
            {report.project?.name || 'General'}
          </div>
        </div>

        <div>
          <span className="text-[11px] text-surface-400 block mb-1">Last Updated</span>
          <div className="text-xs font-semibold text-surface-200">
            {new Date(report.updatedAt).toLocaleString()}
          </div>
        </div>

        <div>
          <span className="text-[11px] text-surface-400 block mb-1">Total Tasks</span>
          <div className="text-xs font-semibold text-white">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} listed
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tasks Breakdown (Current Version)
        </h3>
        {tasks.length === 0 ? (
          <div className="p-8 bg-surface-900/40 border border-surface-800 rounded-2xl text-center text-xs text-surface-400">
            No specific tasks listed in this version snapshot.
          </div>
        ) : (
          <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-800/80 text-surface-400 font-medium text-[10px] uppercase tracking-wider border-b border-surface-700/80">
                  <tr>
                    <th className="py-3.5 px-4">Task Name &amp; Deliverable</th>
                    <th className="py-3.5 px-3">Priority</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 w-48">Progress (Act vs Plan)</th>
                    <th className="py-3.5 px-3 text-right">Time Spent / Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/80 text-surface-200">
                  {tasks.map((task, idx) => (
                    <tr key={idx} className="hover:bg-surface-800/30">
                      <td className="p-4">
                        <div className="font-semibold text-white">{task.taskName}</div>
                        {task.deliverable && (
                          <div className="flex items-center gap-1.5 text-[11px] text-primary-400 mt-1">
                            <LinkIcon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-sm">{task.deliverable}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="p-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="p-4">
                        <ProgressBar
                          value={task.actualPercent}
                          max={task.plannedPercent || 100}
                          color={task.status === 'COMPLETED' ? 'emerald' : 'indigo'}
                        />
                      </td>
                      <td className="p-3 text-right font-mono text-xs">
                        <span className="font-bold text-white">{task.timeSpent}h</span> /{' '}
                        <span className="text-surface-400">{task.timePlanned}h</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Blockers & Achievements Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blockers */}
        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Blockers &amp; Challenges
            </div>
            {content.isBlockerKeyIssue && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                Key Issue
              </span>
            )}
          </div>
          <p className="text-xs text-surface-300 whitespace-pre-wrap leading-relaxed">
            {content.blockers || 'None reported this week.'}
          </p>
        </div>

        {/* Achievements */}
        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Award className="w-4 h-4 text-amber-400" /> Key Achievements &amp; Wins
            </div>
            {content.isAchievementKey && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                Major Win
              </span>
            )}
          </div>
          <p className="text-xs text-surface-300 whitespace-pre-wrap leading-relaxed">
            {content.achievements || 'None reported this week.'}
          </p>
        </div>
      </div>

      {/* Hours Allocation Breakdown */}
      {content.hoursBreakdown && (
        <HoursBreakdownView hours={content.hoursBreakdown} editable={false} />
      )}

      {/* Next Week Roadmap & Notes */}
      {(content.tasksPlannedNextWeek || content.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.tasksPlannedNextWeek && (
            <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" /> Tasks Planned Next Week
              </h4>
              <p className="text-xs text-surface-300 whitespace-pre-wrap leading-relaxed">
                {content.tasksPlannedNextWeek}
              </p>
            </div>
          )}

          {content.notes && (
            <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" /> Notes &amp; External Links
              </h4>
              <p className="text-xs text-surface-300 whitespace-pre-wrap leading-relaxed">
                {content.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Multi-Version Audit History & Review Trail */}
      {report.versions && report.versions.length > 0 && (
        <VersionTimeline versions={report.versions} />
      )}
    </div>
  );
};
