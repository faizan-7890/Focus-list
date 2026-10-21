/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  formatTimerDisplay,
  type Category,
  type TodoItem,
  type TodoStats,
  type ViewFilter,
} from '../utils/todoLogic';

interface FocusPanelProps {
  activeTodos: TodoItem[];
  focusedTaskId: string | null;
  onSelectFocusTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  stats: TodoStats;
  activeView: ViewFilter;
  onSelectView: (view: ViewFilter) => void;
  mode: 'focus' | 'break';
  secondsLeft: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSwitchMode: (mode: 'focus' | 'break') => void;
  onOpenZenMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const PROJECT_BARS: Array<{
  category: Category;
  barClass: string;
}> = [
  { category: 'Work', barClass: 'bg-indigo-600' },
  { category: 'Personal', barClass: 'bg-emerald-600' },
  { category: 'Errands', barClass: 'bg-amber-600' },
  { category: 'Study', barClass: 'bg-sky-600' },
];

export const FocusPanel: React.FC<FocusPanelProps> = ({
  activeTodos,
  focusedTaskId,
  onSelectFocusTask,
  onCompleteTask,
  stats,
  activeView,
  onSelectView,
  mode,
  secondsLeft,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onSwitchMode,
  onOpenZenMode,
  soundEnabled,
  onToggleSound,
}) => {
  const currentTask =
    activeTodos.find((t) => t.id === focusedTaskId) ?? activeTodos[0] ?? null;

  return (
    <aside
      aria-label="Focus session timer and project workload"
      className="w-full xl:w-80 shrink-0 space-y-5"
    >
      {/* Precision Deep Work Timer Module */}
      <section
        aria-labelledby="focus-timer-heading"
        className="bg-slate-900 text-white rounded-xl p-5 space-y-4 border border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Timer className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <h2
              id="focus-timer-heading"
              className="text-sm font-semibold font-display tracking-wide whitespace-nowrap"
            >
              Focus Session
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute sound chimes' : 'Enable sound chimes'}
              aria-label={soundEnabled ? 'Mute sound chimes' : 'Enable sound chimes'}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            <div
              role="group"
              aria-label="Timer mode"
              className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg shrink-0"
            >
              <button
                type="button"
                onClick={() => onSwitchMode('focus')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'focus'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                25m Focus
              </button>
              <button
                type="button"
                onClick={() => onSwitchMode('break')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'break'
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                5m Break
              </button>
            </div>
          </div>
        </div>

        {/* Segmented Monospace Readout & Zen Mode Button */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl py-4 px-4 text-center space-y-2 relative group">
          <button
            type="button"
            onClick={onOpenZenMode}
            title="Open distraction-free Zen Mode"
            className="absolute top-2.5 right-2.5 p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-mono"
          >
            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Zen Mode</span>
          </button>

          <div
            aria-live="polite"
            className="text-4xl font-mono font-semibold tracking-wider text-white tabular-nums"
          >
            {formatTimerDisplay(secondsLeft)}
          </div>

          <div className="flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <p className="text-xs text-slate-400">
              {mode === 'focus' ? 'Deep work interval' : 'Short restorative break'}
            </p>
          </div>
        </div>

        {/* Active Focus Task Selector */}
        {currentTask ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label
                htmlFor="focus-task-select"
                className="flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>Focused Deliverable</span>
              </label>
              {currentTask.completedPomodoros ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <span>🍅</span>
                  <span>{currentTask.completedPomodoros}</span>
                </span>
              ) : null}
            </div>
            <select
              id="focus-task-select"
              value={currentTask.id}
              onChange={(e) => onSelectFocusTask(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none focus:border-slate-500"
            >
              {activeTodos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-1">
            All tasks completed. Add a new task to begin a focus session.
          </p>
        )}

        {/* Timer Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onToggleTimer}
            className={`flex-1 py-2 px-3 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
              isRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pause Timer</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>Start Timer</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onResetTimer}
            aria-label="Reset focus timer"
            title="Reset timer"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {currentTask && (
          <button
            type="button"
            onClick={() => onCompleteTask(currentTask.id)}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>Complete Focused Task</span>
          </button>
        )}
      </section>

      {/* Active Workload Breakdown by Project */}
      <section
        aria-labelledby="workload-breakdown-heading"
        className="bg-white border border-stone-200/90 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2
            id="workload-breakdown-heading"
            className="text-sm font-semibold text-slate-900 font-display"
          >
            Active Workload by Project
          </h2>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {stats.active} open
          </span>
        </div>

        <div className="space-y-3">
          {PROJECT_BARS.map(({ category, barClass }) => {
            const count = stats.byCategory[category] ?? 0;
            const pct =
              stats.active > 0 ? Math.round((count / stats.active) * 100) : 0;
            const isSelected = activeView === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  onSelectView(isSelected ? 'all' : category)
                }
                className={`w-full text-left p-2 -mx-2 rounded-lg transition-colors ${
                  isSelected ? 'bg-stone-100' : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-800">{category}</span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {count} {count === 1 ? 'task' : 'tasks'} · {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barClass} transition-transform duration-200 origin-left`}
                    style={{ transform: `scaleX(${pct / 100})` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
};
