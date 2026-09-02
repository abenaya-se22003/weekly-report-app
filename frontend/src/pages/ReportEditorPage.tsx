import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Project, TaskEntry, ReportContent, HoursBreakdown } from '../types';
import { TaskTableEditor } from '../components/reports/TaskTableEditor';
import { HoursBreakdownView } from '../components/reports/HoursBreakdownView';
import {
  Calendar,
  FolderKanban,
  Save,
  Send,
  AlertTriangle,
  Award,
  ArrowRight,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const ReportEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [weekStartDate, setWeekStartDate] = useState<string>(() => {
    // Default to current week's Monday
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  });
  const [weekEndDate, setWeekEndDate] = useState<string>(() => {
    // Default to current week's Friday
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 4;
    const friday = new Date(d.setDate(diff));
    return friday.toISOString().split('T')[0];
  });

  const [tasks, setTasks] = useState<TaskEntry[]>([
    {
      taskName: '',
      priority: 'MEDIUM',
      plannedPercent: 100,
      actualPercent: 0,
      status: 'IN_PROGRESS',
      timePlanned: 8,
      timeSpent: 0,
      deliverable: '',
    },
  ]);

  const [blockers, setBlockers] = useState('');
  const [isBlockerKeyIssue, setIsBlockerKeyIssue] = useState(false);
  const [achievements, setAchievements] = useState('');
  const [isAchievementKey, setIsAchievementKey] = useState(false);
  const [tasksPlannedNextWeek, setTasksPlannedNextWeek] = useState('');
  const [notes, setNotes] = useState('');
  const [hoursBreakdown, setHoursBreakdown] = useState<HoursBreakdown>({
    development: 20,
    meetings: 5,
    codeReview: 4,
    documentation: 3,
    learning: 2,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string>('DRAFT');
  const [reportVersion, setReportVersion] = useState<number>(1);
  const [latestReviewComment, setLatestReviewComment] = useState<string | null>(null);

  // Load Projects and initial report data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await api.getProjects();
        setProjects(projRes.projects);
        if (projRes.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projRes.projects[0].id);
        }

        if (id) {
          const reportRes = await api.getReport(id);
          const rep = reportRes.report;
          setSelectedProjectId(rep.projectId);
          setWeekStartDate(new Date(rep.weekStartDate).toISOString().split('T')[0]);
          setWeekEndDate(new Date(rep.weekEndDate).toISOString().split('T')[0]);
          setReportStatus(rep.status);
          setReportVersion(rep.version);

          if (rep.reviews && rep.reviews.length > 0) {
            setLatestReviewComment(rep.reviews[0].comment);
          }

          const latestVersion = rep.versions?.[0];
          if (latestVersion) {
            if (latestVersion.tasks) {
              setTasks(latestVersion.tasks);
            }
            if (latestVersion.content) {
              const c = latestVersion.content;
              setBlockers(c.blockers || '');
              setIsBlockerKeyIssue(Boolean(c.isBlockerKeyIssue));
              setAchievements(c.achievements || '');
              setIsAchievementKey(Boolean(c.isAchievementKey));
              setTasksPlannedNextWeek(c.tasksPlannedNextWeek || '');
              setNotes(c.notes || '');
              if (c.hoursBreakdown) {
                setHoursBreakdown(c.hoursBreakdown);
              }
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const buildPayload = () => {
    const content: ReportContent = {
      blockers,
      isBlockerKeyIssue,
      achievements,
      isAchievementKey,
      tasksPlannedNextWeek,
      notes,
      hoursBreakdown,
    };

    return {
      projectId: selectedProjectId,
      weekStartDate,
      weekEndDate,
      content,
      tasks,
    };
  };

  const validate = () => {
    if (!selectedProjectId) {
      setError('Please select an active project.');
      return false;
    }
    if (!weekStartDate || !weekEndDate) {
      setError('Please specify both week start and end dates.');
      return false;
    }
    if (new Date(weekStartDate) >= new Date(weekEndDate)) {
      setError('Week start date must be before week end date.');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setError(null);
    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (isEditing && id) {
        await api.updateReport(id, payload);
      } else {
        await api.createReport(payload);
      }
      setSuccessMessage('Report saved as draft successfully!');
      setTimeout(() => {
        navigate('/reports/mine');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!validate()) return;
    setError(null);
    setIsSaving(true);
    try {
      const payload = buildPayload();
      let targetId = id;

      if (!isEditing || !targetId) {
        // Create draft first
        const createRes = await api.createReport(payload);
        targetId = createRes.report.id;
      } else {
        // Update draft first
        await api.updateReport(targetId, payload);
      }

      // Submit for manager review
      if (targetId) {
        await api.submitReport(targetId, payload);
        setSuccessMessage('Report submitted for manager review!');
        setTimeout(() => {
          navigate(`/reports/${targetId}`);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-surface-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading report workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            {isEditing ? `Editing Report (v${reportVersion})` : 'New Weekly Report'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEditing ? 'Update Weekly Report' : 'Draft Weekly Report'}
          </h1>
          <p className="text-xs sm:text-sm text-surface-400 mt-1">
            Fill out your tasks, achievements, and time breakdown for manager review.
          </p>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Save as Draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmitForReview}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Submit for Review
          </button>
        </div>
      </div>

      {/* Needs Correction Notice (if applicable) */}
      {reportStatus === 'NEEDS_CORRECTION' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" /> Manager Requested Revisions
          </div>
          <p className="text-surface-200">
            {latestReviewComment || 'Please revise your task details, deliverables, or hour breakdowns and resubmit.'}
          </p>
          <div className="text-[11px] text-amber-400/80 font-medium">
            Submitting will create a new Version {reportVersion + 1} snapshot.
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metadata Section: Dates & Project */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-900/60 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm">
        {/* Project Tag */}
        <div>
          <label className="block text-xs font-semibold text-surface-300 mb-1.5 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-primary-400" /> Target Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Week Start Date (Monday) */}
        <div>
          <label className="block text-xs font-semibold text-surface-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary-400" /> Week Start (Monday)
          </label>
          <input
            type="date"
            value={weekStartDate}
            onChange={(e) => setWeekStartDate(e.target.value)}
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Week End Date (Friday) */}
        <div>
          <label className="block text-xs font-semibold text-surface-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary-400" /> Week End (Friday)
          </label>
          <input
            type="date"
            value={weekEndDate}
            onChange={(e) => setWeekEndDate(e.target.value)}
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Task Table Editor */}
      <TaskTableEditor tasks={tasks} onChange={setTasks} />

      {/* Blockers & Achievements Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blockers & Challenges */}
        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Blockers &amp; Impediments</h3>
            </div>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-rose-300 font-medium">
              <input
                type="checkbox"
                checked={isBlockerKeyIssue}
                onChange={(e) => setIsBlockerKeyIssue(e.target.checked)}
                className="rounded border-surface-700 bg-surface-950 text-rose-500 focus:ring-0"
              />
              Flag as Key Issue
            </label>
          </div>
          <textarea
            rows={3}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="Detail any technical blockers, API dependencies, or external waiting points..."
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Key Achievements & Wins */}
        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Major Achievements &amp; Highlights</h3>
            </div>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-300 font-medium">
              <input
                type="checkbox"
                checked={isAchievementKey}
                onChange={(e) => setIsAchievementKey(e.target.checked)}
                className="rounded border-surface-700 bg-surface-950 text-amber-500 focus:ring-0"
              />
              Flag as Key Win
            </label>
          </div>
          <textarea
            rows={3}
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            placeholder="Highlight shipped features, performance milestones, or key milestones reached..."
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Hours Breakdown View & Editor */}
      <HoursBreakdownView
        hours={hoursBreakdown}
        editable={true}
        onChange={setHoursBreakdown}
      />

      {/* Upcoming Roadmap & General Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Tasks Planned for Next Week</h3>
          </div>
          <textarea
            rows={3}
            value={tasksPlannedNextWeek}
            onChange={(e) => setTasksPlannedNextWeek(e.target.value)}
            placeholder="Bullet list of deliverables, PRs, or goals slated for next sprint..."
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Submission Notes &amp; Links</h3>
          </div>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context, Figma links, Loom videos, or notes for your manager..."
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-6 bg-surface-900/90 backdrop-blur-md border border-surface-700/80 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
        <div className="text-xs text-surface-400">
          Ready to submit? Your manager will receive an immediate notification for review.
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmitForReview}
            className="px-5 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
};
