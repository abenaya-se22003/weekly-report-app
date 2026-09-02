import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { StatusByTeamMember, Report } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Users,
  Mail,
  FileText,
  ArrowUpRight,
} from 'lucide-react';

export const TeamMembersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [membersStats, setMembersStats] = useState<StatusByTeamMember[]>([]);
  const [memberReports, setMemberReports] = useState<Report[]>([]);
  const [selectedMember, setSelectedMember] = useState<StatusByTeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const chartRes = await api.getDashboardCharts();
        setMembersStats(chartRes.charts.statusByTeamMember || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  // When id changes or member is selected, load reports
  useEffect(() => {
    if (id && membersStats.length > 0) {
      const match = membersStats.find((m) => m.userId === id);
      if (match) {
        setSelectedMember(match);
      }
    } else if (membersStats.length > 0 && !selectedMember) {
      setSelectedMember(membersStats[0]);
    }
  }, [id, membersStats]);

  useEffect(() => {
    if (!selectedMember) return;
    const fetchMemberReports = async () => {
      try {
        const res = await api.getAllReports({ userId: selectedMember.userId, limit: 20 });
        setMemberReports(res.reports);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMemberReports();
  }, [selectedMember]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-surface-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Loading team roster &amp; performance profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Title */}
      <div className="border-b border-surface-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-semibold mb-2">
          <Users className="w-3.5 h-3.5" />
          Team Directory
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Team Member Performance &amp; Reports
        </h1>
        <p className="text-xs sm:text-sm text-surface-400 mt-1">
          Inspect individual engineer weekly reports, compliance rate, and review track records.
        </p>
      </div>

      {/* Main Grid: Roster List on Left, Profile Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Team Members Roster */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-surface-400 px-1">
            Engineers &amp; Contributors ({membersStats.length})
          </h3>
          <div className="space-y-2">
            {membersStats.map((member) => {
              const isSelected = selectedMember?.userId === member.userId;
              const approvalRate =
                member.total > 0 ? Math.round((member.APPROVED / member.total) * 100) : 0;

              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-purple-600/15 border-purple-500/50 shadow-md shadow-purple-500/10'
                      : 'bg-surface-900/60 border-surface-800/80 hover:bg-surface-800/60 hover:border-surface-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono text-[10px]">
                        {member.name.charAt(0)}
                      </div>
                      <span>{member.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-950 border border-surface-800 text-surface-300">
                      {member.total} reports
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-surface-400 pl-8">
                    <span className="text-emerald-400 font-medium">{approvalRate}% Approved</span>
                    <span>{member.NEEDS_CORRECTION} corrections</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Selected Profile & Reports */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMember ? (
            <>
              {/* Profile Card Header */}
              <div className="bg-surface-900/80 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                      {selectedMember.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedMember.name}</h2>
                      <div className="flex items-center gap-1.5 text-xs text-surface-400 font-mono">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedMember.email}
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-surface-950 border border-surface-800 text-xs text-surface-300 font-medium">
                    Team Member
                  </span>
                </div>

                {/* Member Metric Cards */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-surface-800/80 text-center">
                  <div className="bg-surface-950/60 p-2.5 rounded-xl border border-surface-800">
                    <span className="text-[10px] text-surface-400 block font-semibold">Total Reports</span>
                    <span className="font-mono text-base font-bold text-white">{selectedMember.total}</span>
                  </div>
                  <div className="bg-surface-950/60 p-2.5 rounded-xl border border-surface-800">
                    <span className="text-[10px] text-emerald-400 block font-semibold">Approved</span>
                    <span className="font-mono text-base font-bold text-emerald-300">{selectedMember.APPROVED}</span>
                  </div>
                  <div className="bg-surface-950/60 p-2.5 rounded-xl border border-surface-800">
                    <span className="text-[10px] text-amber-400 block font-semibold">Needs Corr</span>
                    <span className="font-mono text-base font-bold text-amber-300">{selectedMember.NEEDS_CORRECTION}</span>
                  </div>
                  <div className="bg-surface-950/60 p-2.5 rounded-xl border border-surface-800">
                    <span className="text-[10px] text-sky-400 block font-semibold">Submitted</span>
                    <span className="font-mono text-base font-bold text-sky-300">{selectedMember.SUBMITTED}</span>
                  </div>
                </div>
              </div>

              {/* Reports Submitted by Member Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Weekly Report History ({memberReports.length})
                </h3>

                <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-800/80 text-surface-400 font-medium text-[10px] uppercase border-b border-surface-700/80">
                      <tr>
                        <th className="py-3 px-4">Week Dates</th>
                        <th className="py-3 px-3">Project</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-center">Version</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-800/80 text-surface-200">
                      {memberReports.map((rep) => {
                        const startStr = new Date(rep.weekStartDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                        const endStr = new Date(rep.weekEndDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                        return (
                          <tr key={rep.id} className="hover:bg-surface-800/30 transition-colors">
                            <td className="p-4 font-semibold text-white">
                              {startStr} – {endStr}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-surface-800 rounded border border-surface-700 text-xs">
                                {rep.project?.name}
                              </span>
                            </td>
                            <td className="p-3">
                              <StatusBadge status={rep.status} size="sm" />
                            </td>
                            <td className="p-3 text-center font-mono text-xs">v{rep.version}</td>
                            <td className="p-4 text-right">
                              <Link
                                to={`/reports/${rep.id}`}
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
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-surface-400 bg-surface-900/40 rounded-2xl border border-surface-800">
              Select a team member to inspect their profile and history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
