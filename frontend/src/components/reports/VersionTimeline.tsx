import React, { useState } from 'react';
import type { ReportVersion } from '../../types';
import { History, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';
import { TaskStatusBadge } from '../common/TaskStatusBadge';

interface VersionTimelineProps {
  versions: ReportVersion[];
}

export const VersionTimeline: React.FC<VersionTimelineProps> = ({ versions }) => {
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(
    versions.length > 0 ? versions[0].versionNum : 1
  );

  const selectedVersion = versions.find((v) => v.versionNum === selectedVersionNum) || versions[0];

  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-800 pb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary-400" />
          <h3 className="text-base font-bold text-white">Version History & Audit Log</h3>
          <span className="text-xs bg-primary-500/10 text-primary-300 border border-primary-500/20 px-2 py-0.5 rounded-full font-mono">
            {versions.length} version{versions.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Version Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-surface-950 p-1 rounded-xl border border-surface-800">
          {versions.map((ver) => (
            <button
              key={ver.id}
              onClick={() => setSelectedVersionNum(ver.versionNum)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedVersionNum === ver.versionNum
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800/60'
              }`}
            >
              v{ver.versionNum}
              <span className="text-[10px] ml-1 opacity-70">
                ({new Date(ver.submittedAt).toLocaleDateString()})
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedVersion && (
        <div className="space-y-6">
          {/* Version Header Meta */}
          <div className="flex items-center justify-between text-xs text-surface-400 bg-surface-950/40 p-3 rounded-xl border border-surface-800/80">
            <div>
              Snapshot of <span className="font-semibold text-white">Version {selectedVersion.versionNum}</span>
            </div>
            <div>
              Submitted on:{' '}
              <span className="font-mono text-surface-200">
                {new Date(selectedVersion.submittedAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Version Notes */}
          {selectedVersion.content?.notes && (
            <div className="text-xs bg-surface-800/40 p-3.5 rounded-xl border border-surface-700/60 text-surface-300">
              <span className="font-semibold text-white block mb-1">Submission Notes:</span>
              {selectedVersion.content.notes}
            </div>
          )}

          {/* Tasks in this version snapshot */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
              Tasks in Version {selectedVersion.versionNum} ({selectedVersion.tasks?.length || 0})
            </h4>
            <div className="border border-surface-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-950/60 text-surface-400 font-medium text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Task Name</th>
                    <th className="py-2.5 px-2">Priority</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2 text-center">Progress</th>
                    <th className="py-2.5 px-2 text-center">Hours (Plan/Act)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/60 text-surface-200">
                  {selectedVersion.tasks?.map((t, idx) => (
                    <tr key={idx} className="hover:bg-surface-800/20">
                      <td className="p-3">
                        <div className="font-medium text-white">{t.taskName}</div>
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
                      <td className="p-2 text-center font-mono text-xs">
                        {t.actualPercent}% / {t.plannedPercent}%
                      </td>
                      <td className="p-2 text-center font-mono text-xs">
                        {t.timeSpent}h / {t.timePlanned}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews on this version */}
          {selectedVersion.reviews && selectedVersion.reviews.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Manager Review History on Version {selectedVersion.versionNum}
              </h4>
              <div className="space-y-2">
                {selectedVersion.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      rev.action === 'APPROVED'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center gap-1.5">
                        {rev.action === 'APPROVED' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span>{rev.action === 'APPROVED' ? 'Approved by Manager' : 'Changes Requested by Manager'}</span>
                      </div>
                      <span className="text-[11px] opacity-75 font-mono">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-surface-200 pl-5">{rev.comment}</p>
                    {rev.reviewer && (
                      <div className="text-[10px] opacity-75 pl-5">
                        Reviewed by: {rev.reviewer.name} ({rev.reviewer.email})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
