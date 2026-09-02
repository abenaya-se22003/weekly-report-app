import React from 'react';
import type { HoursBreakdown } from '../../types';
import { Clock, Code2, Users, CheckSquare, BookOpen, GraduationCap } from 'lucide-react';

interface HoursBreakdownViewProps {
  hours?: HoursBreakdown;
  editable?: boolean;
  onChange?: (hours: HoursBreakdown) => void;
}

export const HoursBreakdownView: React.FC<HoursBreakdownViewProps> = ({
  hours = { development: 0, meetings: 0, codeReview: 0, documentation: 0, learning: 0 },
  editable = false,
  onChange,
}) => {
  const categories = [
    { key: 'development', label: 'Development', icon: Code2, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { key: 'meetings', label: 'Meetings', icon: Users, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { key: 'codeReview', label: 'Code Review', icon: CheckSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'documentation', label: 'Documentation', icon: BookOpen, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { key: 'learning', label: 'Learning / R&D', icon: GraduationCap, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ];

  const totalHours = Object.values(hours).reduce((a, b) => Number(a) + Number(b), 0);

  const handleUpdate = (key: keyof HoursBreakdown, val: number) => {
    if (onChange) {
      onChange({ ...hours, [key]: Math.max(0, val) });
    }
  };

  return (
    <div className="bg-surface-900/60 border border-surface-700/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-white">Time Allocation by Category</h3>
        </div>
        <div className="text-xs text-surface-300 font-mono bg-surface-800/80 px-2.5 py-1 rounded-lg border border-surface-700">
          Total: <span className="font-bold text-white">{Math.round(totalHours * 10) / 10} hrs</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const val = hours[cat.key as keyof HoursBreakdown] || 0;
          return (
            <div
              key={cat.key}
              className={`p-3 rounded-xl border flex flex-col justify-between ${cat.color}`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{cat.label}</span>
              </div>
              {editable ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={val}
                    onChange={(e) => handleUpdate(cat.key as keyof HoursBreakdown, Number(e.target.value))}
                    className="w-full bg-surface-950/80 border border-surface-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-surface-400">h</span>
                </div>
              ) : (
                <div className="font-mono text-base font-bold text-white">
                  {val} <span className="text-[10px] font-normal text-surface-400">hrs</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
