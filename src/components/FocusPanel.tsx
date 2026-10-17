import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Target,
  Timer,
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
}

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

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
}) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const currentTask =
    activeTodos.find((t) => t.id === focusedTaskId) ?? activeTodos[0] ?? null;

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  const handleSwitchMode = (nextMode: 'focus' | 'break') => {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(nextMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  return (
    <aside
      aria-label="Focus session timer and project workload"
      className="w-full xl:w-80 shrink-0 space-y-5"
    >
      {/* Hardware-Inspired Deep Work Timer Module */}
      <section
        aria-labelledby="focus-timer-heading"
        className="bg-slate-900 text-white rounded-xl p-5 space-y-4 border border-slate-800"
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

          <div
            role="group"
            aria-label="Timer mode"
            className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg shrink-0"
          >
            <button
              type="button"
              onClick={() => handleSwitchMode('focus')}
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
              onClick={() => handleSwitchMode('break')}
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

        {/* Segmented Monospace Readout */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl py-5 px-4 text-center space-y-1">
          <div
            aria-live="polite"
            className="text-4xl font-mono font-semibold tracking-wider text-white tabular-nums"
          >
            {formatTimerDisplay(secondsLeft)}
          </div>
          <p className="text-xs text-slate-400">
            {mode === 'focus'
              ? 'Deep work interval'
              : 'Short restorative break'}
          </p>
        </div>

        {/* Active Focus Task Selector */}
        {currentTask ? (
          <div className="space-y-2 pt-1">
            <label
              htmlFor="focus-task-select"
              className="text-xs text-slate-400 flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Focused Deliverable</span>
            </label>
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
            onClick={() => setIsRunning((prev) => !prev)}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pause Timer</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Start Timer</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleResetTimer}
            aria-label="Reset focus timer"
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
