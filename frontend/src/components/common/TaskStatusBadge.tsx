import React from 'react';
import type { TaskStatus } from '../../types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          label: 'Completed',
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
          label: 'In Progress',
        };
      case 'BLOCKED':
        return {
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          label: 'Blocked',
        };
      case 'DEFERRED':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          label: 'Deferred',
        };
      case 'NOT_STARTED':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          label: 'Not Started',
        };
    }
  };

  const config = getStyles();

  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${config.bg}`}>
      {config.label}
    </span>
  );
};
