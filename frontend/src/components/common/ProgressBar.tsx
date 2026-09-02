import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  showText?: boolean;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showText = true,
  color = 'indigo',
  size = 'md',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorClasses = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }[color];

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className="w-full flex items-center gap-2">
      <div className={`flex-1 bg-surface-800 rounded-full overflow-hidden ${heightClasses} border border-surface-700/50`}>
        <div
          className={`${colorClasses} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && (
        <span className="text-xs font-mono font-medium text-surface-300 w-10 text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
};
