import React from 'react';
import type { TaskPriority } from '../../types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const getStyles = () => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      case 'HIGH':
        return 'bg-orange-500/15 border-orange-500/30 text-orange-300';
      case 'MEDIUM':
        return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300';
      case 'LOW':
      default:
        return 'bg-slate-500/15 border-slate-500/30 text-slate-400';
    }
  };

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center font-semibold uppercase tracking-wider border rounded ${getStyles()} ${sizeClasses}`}>
      {priority}
    </span>
  );
};
