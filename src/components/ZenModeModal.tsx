/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  Check,
  CheckCircle2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  formatTimerDisplay,
  type TodoItem,
} from '../utils/todoLogic';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ZenModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo: TodoItem | null;
  mode: 'focus' | 'break';
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSwitchMode: (mode: 'focus' | 'break') => void;
  onCompleteTask: (id: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ZenModeModal: React.FC<ZenModeModalProps> = ({
  isOpen,
  onClose,
  todo,
  mode,
  secondsLeft,
  totalSeconds,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onSwitchMode,
  onCompleteTask,
  onToggleSubtask,
  soundEnabled,
  onToggleSound,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(modalRef, isOpen);

  // Keyboard shortcuts inside Zen Mode
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'BUTTON')) {
          return;
        }
        e.preventDefault();
        onToggleTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onResetTimer();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onToggleTimer, onResetTimer, onToggleSound]);

  if (!isOpen) return null;

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Zen Deep Work Mode"
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-10 backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* Top Bar */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            {isRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isRunning ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </span>
          <span className="text-xs uppercase tracking-widest font-mono text-slate-400 font-medium">
            Zen Focus Mode · {mode === 'focus' ? 'Deep Work' : 'Restorative Break'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Mute/Unmute */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound chimes' : 'Enable sound chimes'}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" aria-hidden="true" />
            )}
          </button>

          {/* Close Zen Mode */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit Zen Mode (Esc)"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <Minimize2 className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Exit (Esc)</span>
          </button>
        </div>
      </header>

      {/* Main Focus Stage */}
      <main className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center my-auto py-8 text-center space-y-8">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onSwitchMode('focus')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'focus'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            25m Deep Work
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('break')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'break'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5m Short Break
          </button>
        </div>

        {/* Circular Progress Ring & Time Readout */}
        <div className="relative flex items-center justify-center">
          <svg className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90 transform" aria-hidden="true">
            {/* Background Track */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="text-slate-900 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className={`${
                mode === 'focus' ? 'text-emerald-500' : 'text-sky-500'
              } stroke-current transition-all duration-300 ease-linear`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time text centered inside ring */}
          <div className="absolute flex flex-col items-center justify-center space-y-1">
            <span className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-white tabular-nums">
              {formatTimerDisplay(secondsLeft)}
            </span>
            <span className="text-xs uppercase tracking-widest font-mono text-slate-400">
              {isRunning ? 'Interval Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTimer}
            className={`px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2 shadow-xl ${
              isRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-emerald-950'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" aria-hidden="true" />
                <span>Pause (Space)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Start Focus (Space)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onResetTimer}
            aria-label="Reset timer"
            title="Reset timer (R)"
            className="p-3.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Current Focused Task Card */}
        {todo ? (
          <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 text-left space-y-3.5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                    {todo.category}
                  </span>
                  {todo.completedPomodoros ? (
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      <span>🍅</span>
                      <span>{todo.completedPomodoros} completed</span>
                    </span>
                  ) : null}
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-white leading-snug">
                  {todo.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onCompleteTask(todo.id)}
                className="py-1.5 px-3 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Done</span>
              </button>
            </div>

            {todo.notes && (
              <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-2.5">
                {todo.notes}
              </p>
            )}

            {/* Checklist of Subtasks */}
            {todo.subtasks.length > 0 && (
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Checklist ({todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length})
                </span>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {todo.subtasks.map((st) => (
                    <li
                      key={st.id}
                      className="flex items-center gap-2.5 text-xs p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={st.completed}
                        aria-label={`Toggle subtask '${st.title}'`}
                        onClick={() => onToggleSubtask(todo.id, st.id)}
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          st.completed
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => onToggleSubtask(todo.id, st.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onToggleSubtask(todo.id, st.id);
                          }
                        }}
                        className={`cursor-pointer select-none rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-400 ${
                          st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {st.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-500 font-mono">
            No specific task selected. Enjoy your focus time!
          </div>
        )}
      </main>

      {/* Footer Shortcut Hints */}
      <footer className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Space
          </kbd>
          Play / Pause
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            R
          </kbd>
          Reset
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            M
          </kbd>
          Mute / Unmute
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Esc
          </kbd>
          Exit Zen
        </span>
      </footer>
    </div>
  );
};
