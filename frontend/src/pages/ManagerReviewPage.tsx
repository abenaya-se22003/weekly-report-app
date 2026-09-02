import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Report, ReviewAction } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { TaskStatusBadge } from '../components/common/TaskStatusBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles,
  FolderKanban,
  User,
  AlertCircle,
} from 'lucide-react';

export const ManagerReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [action, setAction] = useState<ReviewAction>('APPROVED');
  const [comment, setComment] = useState<string>('Great work this week! Deliverables and progress look solid.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
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

  const handleTemplate = (text: string, actionType: ReviewAction) => {
    setComment(text);
    setAction(actionType);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!comment.trim()) {
      setError('Please provide a review comment before submitting.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await api.reviewReport(id, { action, comment });
      navigate(`/reports/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-surface-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading report for executive review...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="p-6 bg-surface-900 border border-surface-800 rounded-2xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Unable to Load Report</h2>
          <p className="text-xs text-surface-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-xs font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const latestVersion = report?.versions?.[0];
  const content = latestVersion?.content || {};
  const tasks = latestVersion?.tasks || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-surface-900 hover:bg-surface-800 border border-surface-800 rounded-xl text-surface-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-semibold mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Executive Review Desk
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Review Report by {report?.user?.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report && <StatusBadge status={report.status} />}
          <span className="text-xs font-mono bg-surface-900 border border-surface-800 text-surface-300 px-2.5 py-1 rounded-full">
            Version {report?.version}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Review Action Form */}
        <div className="lg:col-span-1 space-y-6">
          <form
            onSubmit={handleSubmitReview}
            className="bg-surface-900/80 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-6 sticky top-24"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" /> Review Decision
            </h3>

            {/* Decision Radio Selectors */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-surface-300">Select Decision</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('APPROVED')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    action === 'APPROVED'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-surface-950 border-surface-800 text-surface-400 hover:text-surface-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Approve Report
                  </span>
                  {action === 'APPROVED' && <span className="text-[10px] uppercase">Selected</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setAction('REQUEST_CHANGES')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    action === 'REQUEST_CHANGES'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-surface-950 border-surface-800 text-surface-400 hover:text-surface-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Request Changes
                  </span>
                  {action === 'REQUEST_CHANGES' && <span className="text-[10px] uppercase">Selected</span>}
                </button>
              </div>
            </div>

            {/* Feedback Comment */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-300">
                Review Feedback &amp; Notes
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write specific feedback for the team member..."
                className="w-full bg-surface-950/80 border border-surface-700 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Pre-filled Feedback Templates */}
            <div className="space-y-2">
              <span className="text-[11px] text-surface-400 font-semibold block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Quick Templates:
              </span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    handleTemplate('Great work this week! Deliverables and progress look solid.', 'APPROVED')
                  }
                  className="w-full text-left p-2 rounded-lg bg-surface-950/60 hover:bg-surface-800 border border-surface-800 text-[11px] text-surface-300 transition-colors"
                >
                  ✅ "Great work this week! Deliverables look solid."
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleTemplate(
                      'Please add more detail regarding the blockers and update deliverable links before resubmitting.',
                      'REQUEST_CHANGES'
                    )
                  }
                  className="w-full text-left p-2 rounded-lg bg-surface-950/60 hover:bg-surface-800 border border-surface-800 text-[11px] text-surface-300 transition-colors"
                >
                  ⚠️ "Please add more detail regarding blockers & deliverables."
                </button>
              </div>
            </div>

            {/* Submit Review Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                action === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
              }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {action === 'APPROVED' ? 'Confirm Approval' : 'Send Revision Request'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Submitted Report Content to Review */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-900/60 border border-surface-700/80 rounded-2xl p-4 backdrop-blur-sm text-xs">
            <div>
              <span className="text-[10px] text-surface-400 uppercase font-semibold block">Author</span>
              <div className="font-bold text-white flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                {report?.user?.name}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-surface-400 uppercase font-semibold block">Project</span>
              <div className="font-bold text-white flex items-center gap-1 mt-0.5">
                <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
                {report?.project?.name}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-surface-400 uppercase font-semibold block">Submitted</span>
              <div className="font-mono text-surface-200 mt-0.5">
                {latestVersion?.submittedAt ? new Date(latestVersion.submittedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">Submitted Tasks ({tasks.length})</h4>
            <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-800/80 text-surface-400 font-medium text-[10px] uppercase border-b border-surface-700/80">
                  <tr>
                    <th className="py-3 px-3">Task Name</th>
                    <th className="py-3 px-2">Priority</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-3 w-36">Progress</th>
                    <th className="py-3 px-3 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/80 text-surface-200">
                  {tasks.map((t, idx) => (
                    <tr key={idx} className="hover:bg-surface-800/30">
                      <td className="p-3">
                        <div className="font-semibold text-white">{t.taskName}</div>
                        {t.deliverable && (
                          <div className="text-[11px] text-primary-400 truncate max-w-xs">
                            {t.deliverable}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <PriorityBadge priority={t.priority} size="sm" />
                      </td>
                      <td className="p-2">
                        <TaskStatusBadge status={t.status} />
                      </td>
                      <td className="p-3">
                        <ProgressBar value={t.actualPercent} max={t.plannedPercent || 100} size="sm" />
                      </td>
                      <td className="p-3 text-right font-mono text-xs">
                        {t.timeSpent}h / {t.timePlanned}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Blockers & Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-900/60 border border-surface-700/80 rounded-2xl space-y-1.5">
              <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Blockers:
              </div>
              <p className="text-xs text-surface-300">{content.blockers || 'None reported.'}</p>
            </div>

            <div className="p-4 bg-surface-900/60 border border-surface-700/80 rounded-2xl space-y-1.5">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Achievements:
              </div>
              <p className="text-xs text-surface-300">{content.achievements || 'None reported.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
