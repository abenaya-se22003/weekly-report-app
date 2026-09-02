import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type {
  DashboardSummary,
  DashboardCharts,
  Report,
  Project,
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileCheck2,
  Calendar,
  ArrowUpRight,
  Layers,
  Activity,
} from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#38bdf8', '#34d399', '#fbbf24', '#c084fc', '#f43f5e'];

export const ManagerDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters for the reports table
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, chartRes, projRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getDashboardCharts(),
          api.getProjects(),
        ]);
        setSummary(sumRes.summary);
        setCharts(chartRes.charts);
        setProjects(projRes.projects);
      } catch (err: any) {
        console.error('Failed to load dashboard metrics', err);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.getAllReports({
          status: statusFilter || undefined,
          projectId: projectFilter || undefined,
          page,
          limit: 10,
        });
        setReports(res.reports);
        setTotalPages(res.pagination.totalPages);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [statusFilter, projectFilter, page]);

  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-surface-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading management dashboard analytics...</p>
      </div>
    );
  }

  // Format time allocation pie data
  const timePieData = charts?.timeByTaskType
    ? [
        { name: 'Development', value: charts.timeByTaskType.development },
        { name: 'Meetings', value: charts.timeByTaskType.meetings },
        { name: 'Code Review', value: charts.timeByTaskType.codeReview },
        { name: 'Documentation', value: charts.timeByTaskType.documentation },
        { name: 'Learning & R&D', value: charts.timeByTaskType.learning },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-semibold mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Executive Oversight
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Team Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-surface-400 mt-1">
            Real-time compliance, task delivery velocity, and weekly report review hub.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all"
          >
            <FileCheck2 className="w-4 h-4" /> Review Submissions
          </Link>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Submissions This Week */}
          <div className="bg-surface-900/70 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-surface-400">Submitted This Week</span>
              <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono mb-1">
              {summary.submittedThisWeek}
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{summary.complianceRate}% Team Compliance</span>
            </div>
          </div>

          {/* Needs Correction Alert */}
          <div className="bg-surface-900/70 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-surface-400">Needs Correction</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-300 font-mono mb-1">
              {summary.needsCorrectionCount}
            </div>
            <div className="text-xs text-surface-400">
              Pending revision resubmissions
            </div>
          </div>

          {/* Open Blockers */}
          <div className="bg-surface-900/70 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-surface-400">Open Blockers</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-rose-300 font-mono mb-1">
              {summary.openBlockersCount}
            </div>
            <div className="text-xs text-rose-400/80">
              {summary.blockedTasksCount} blocked task items
            </div>
          </div>

          {/* Active Projects & Team */}
          <div className="bg-surface-900/70 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-surface-400">Organization Scale</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono mb-1">
              {summary.totalTeamMembers} <span className="text-sm font-normal text-surface-400">members</span>
            </div>
            <div className="text-xs text-purple-400">
              Across {summary.totalActiveProjects} active projects
            </div>
          </div>
        </div>
      )}

      {/* 4 Interactive Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tasks Completion Trend */}
        <div className="bg-surface-900/70 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Task Completion Velocity Trend
              </h3>
              <p className="text-[11px] text-surface-400">Completed vs In-Progress tasks by week</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {charts?.tasksTrend && charts.tasksTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.tasksTrend}>
                  <defs>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} tickFormatter={(w) => w.slice(5)} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#34d399" fill="url(#gradCompleted)" strokeWidth={2} />
                  <Area type="monotone" dataKey="inProgress" name="In Progress" stroke="#6366f1" fill="url(#gradProgress)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-surface-500">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Status Breakdown by Team Member */}
        <div className="bg-surface-900/70 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Report Status by Team Member
              </h3>
              <p className="text-[11px] text-surface-400">Approved, Needs Correction, Submitted breakdown</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {charts?.statusByTeamMember && charts.statusByTeamMember.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.statusByTeamMember}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickFormatter={(n) => n.split(' ')[0]} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="APPROVED" name="Approved" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="SUBMITTED" name="Submitted" fill="#0284c7" stackId="a" />
                  <Bar dataKey="NEEDS_CORRECTION" name="Needs Corr" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="DRAFT" name="Draft" fill="#64748b" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-surface-500">
                No status data available
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Workload by Project */}
        <div className="bg-surface-900/70 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-sky-400" /> Workload &amp; Hours by Project
              </h3>
              <p className="text-[11px] text-surface-400">Total planned vs spent hours logged</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {charts?.workloadByProject && charts.workloadByProject.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.workloadByProject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="projectName" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="totalHoursPlanned" name="Planned Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalHoursSpent" name="Spent Hours" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-surface-500">
                No project workload data
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Time Breakdown by Task Type */}
        <div className="bg-surface-900/70 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Time Spent by Task Category
              </h3>
              <p className="text-[11px] text-surface-400">Cumulative hours distribution</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {timePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {timePieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-surface-500">No time categorization data</div>
            )}
          </div>
        </div>
      </div>

      {/* Filterable All Reports Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-400" /> All Team Reports
            </h3>
            <p className="text-xs text-surface-400">
              Filter across team members, project assignments, and review status.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-4 backdrop-blur-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted (Pending Review)</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="APPROVED">Approved</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Project Filter */}
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

          {/* Direct Member Filter */}
          <input
            type="text"
            placeholder="Search team member name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-950/80 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Table Content */}
        <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-800/80 text-surface-400 font-medium text-[10px] uppercase tracking-wider border-b border-surface-700/80">
                <tr>
                  <th className="py-3.5 px-4">Team Member</th>
                  <th className="py-3.5 px-3">Week Dates</th>
                  <th className="py-3.5 px-3">Project</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3 text-center">Version</th>
                  <th className="py-3.5 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/80 text-surface-200">
                {reports
                  .filter((r) =>
                    searchQuery ? r.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
                  )
                  .map((rep) => {
                    const startStr = new Date(rep.weekStartDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    const endStr = new Date(rep.weekEndDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const isReviewable = rep.status === 'SUBMITTED';

                    return (
                      <tr key={rep.id} className="hover:bg-surface-800/40 transition-colors">
                        <td className="p-4">
                          <Link
                            to={`/team/${rep.userId}`}
                            className="font-bold text-white hover:text-primary-300 transition-colors"
                          >
                            {rep.user?.name || 'Unknown'}
                          </Link>
                          <div className="text-[10px] text-surface-400">{rep.user?.email}</div>
                        </td>

                        <td className="p-3 font-medium text-surface-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-400" />
                            {startStr} – {endStr}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-800 border border-surface-700 rounded text-xs text-surface-300">
                            {rep.project?.name}
                          </span>
                        </td>

                        <td className="p-3">
                          <StatusBadge status={rep.status} />
                        </td>

                        <td className="p-3 text-center font-mono text-xs">
                          v{rep.version}
                        </td>

                        <td className="p-4 text-right space-x-2">
                          {isReviewable ? (
                            <Link
                              to={`/reports/${rep.id}/review`}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-500/20 transition-all"
                            >
                              Review <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <Link
                              to={`/reports/${rep.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white rounded-lg text-xs transition-colors"
                            >
                              View <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
      </div>
    </div>
  );
};
