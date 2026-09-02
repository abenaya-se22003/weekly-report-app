import React from 'react';
import type { TaskEntry, TaskPriority, TaskStatus } from '../../types';
import { Plus, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface TaskTableEditorProps {
  tasks: TaskEntry[];
  onChange: (tasks: TaskEntry[]) => void;
  disabled?: boolean;
}

export const TaskTableEditor: React.FC<TaskTableEditorProps> = ({
  tasks,
  onChange,
  disabled = false,
}) => {
  const addTask = () => {
    const newTask: TaskEntry = {
      taskName: '',
      priority: 'MEDIUM',
      plannedPercent: 100,
      actualPercent: 0,
      status: 'IN_PROGRESS',
      timePlanned: 8,
      timeSpent: 0,
      deliverable: '',
    };
    onChange([...tasks, newTask]);
  };

  const removeTask = (index: number) => {
    const updated = tasks.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateTask = (index: number, field: keyof TaskEntry, value: any) => {
    const updated = tasks.map((task, i) => {
      if (i === index) {
        return { ...task, [field]: value };
      }
      return task;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Task-Level Breakdown</h3>
          <p className="text-xs text-surface-400">
            Detail the specific tasks completed or worked on this week.
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={addTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Task Row
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="bg-surface-900/60 border border-dashed border-surface-700/80 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-surface-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-surface-300 font-medium">No tasks added yet</p>
          <p className="text-xs text-surface-400 mt-1 mb-4">
            Add task rows to break down planned hours, actual progress, and deliverables.
          </p>
          {!disabled && (
            <button
              type="button"
              onClick={addTask}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg text-xs border border-surface-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Task
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto border border-surface-700/80 rounded-xl bg-surface-900/60 backdrop-blur-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-800/80 text-surface-300 font-medium border-b border-surface-700/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 min-w-[220px]">Task Name & Deliverable</th>
                <th className="py-3 px-2 w-28">Priority</th>
                <th className="py-3 px-2 w-32">Status</th>
                <th className="py-3 px-2 w-28 text-center">Planned vs Act %</th>
                <th className="py-3 px-2 w-28 text-center">Time (Plan/Act hrs)</th>
                {!disabled && <th className="py-3 px-2 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/80 text-surface-200">
              {tasks.map((task, index) => (
                <tr key={index} className="hover:bg-surface-800/30 transition-colors">
                  {/* Task Name & Deliverable */}
                  <td className="p-3 space-y-1.5">
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="e.g. Implement OAuth2 endpoints"
                      value={task.taskName}
                      onChange={(e) => updateTask(index, 'taskName', e.target.value)}
                      className="w-full bg-surface-800/80 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                    <div className="flex items-center gap-1.5">
                      <LinkIcon className="w-3 h-3 text-surface-400 flex-shrink-0" />
                      <input
                        type="text"
                        disabled={disabled}
                        placeholder="Deliverable URL, PR link, or artifact note"
                        value={task.deliverable || ''}
                        onChange={(e) => updateTask(index, 'deliverable', e.target.value)}
                        className="w-full bg-surface-950/40 border border-surface-800 rounded px-2 py-1 text-[11px] text-surface-300 placeholder-surface-600 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="p-2">
                    <select
                      disabled={disabled}
                      value={task.priority}
                      onChange={(e) => updateTask(index, 'priority', e.target.value as TaskPriority)}
                      className="w-full bg-surface-800/80 border border-surface-700 rounded-lg px-2 py-1.5 text-xs text-surface-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="p-2">
                    <select
                      disabled={disabled}
                      value={task.status}
                      onChange={(e) => updateTask(index, 'status', e.target.value as TaskStatus)}
                      className="w-full bg-surface-800/80 border border-surface-700 rounded-lg px-2 py-1.5 text-xs text-surface-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="DEFERRED">Deferred</option>
                    </select>
                  </td>

                  {/* Planned vs Actual % */}
                  <td className="p-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="text-center">
                        <span className="text-[10px] text-surface-400 block">Plan</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={disabled}
                          value={task.plannedPercent}
                          onChange={(e) => updateTask(index, 'plannedPercent', Number(e.target.value))}
                          className="w-12 text-center bg-surface-800/80 border border-surface-700 rounded px-1 py-1 text-xs text-white"
                        />
                      </div>
                      <span className="text-surface-500 self-end mb-1">/</span>
                      <div className="text-center">
                        <span className="text-[10px] text-surface-400 block">Act</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={disabled}
                          value={task.actualPercent}
                          onChange={(e) => updateTask(index, 'actualPercent', Number(e.target.value))}
                          className="w-12 text-center bg-surface-800/80 border border-surface-700 rounded px-1 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Time Planned vs Spent */}
                  <td className="p-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="text-center">
                        <span className="text-[10px] text-surface-400 block">Plan h</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          disabled={disabled}
                          value={task.timePlanned}
                          onChange={(e) => updateTask(index, 'timePlanned', Number(e.target.value))}
                          className="w-12 text-center bg-surface-800/80 border border-surface-700 rounded px-1 py-1 text-xs text-white"
                        />
                      </div>
                      <span className="text-surface-500 self-end mb-1">/</span>
                      <div className="text-center">
                        <span className="text-[10px] text-surface-400 block">Spent h</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          disabled={disabled}
                          value={task.timeSpent}
                          onChange={(e) => updateTask(index, 'timeSpent', Number(e.target.value))}
                          className="w-12 text-center bg-surface-800/80 border border-surface-700 rounded px-1 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  {!disabled && (
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        className="p-1.5 text-surface-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete task row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
