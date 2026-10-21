/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  CheckCircle2,
  Command,
  Download,
  Edit3,
  Flag,
  Kanban,
  LayoutList,
  ListChecks,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  addSubtask,
  applyImportedTodos,
  clearCompletedTodos,
  computeTodoStats,
  createTodo,
  deleteSubtask,
  deleteTodo,
  exportTodosToCsv,
  exportTodosToJson,
  filterAndSortTodos,
  formatDueDateLabel,
  getInitialDemoTodos,
  getTodayIsoDate,
  incrementPomodoro,
  moveTodoOrder,
  toggleAllTodos,
  toggleSubtask,
  toggleTodo,
  updateTodo,
  type Category,
  type CreateTodoInput,
  type ImportMode,
  type Priority,
  type SortBy,
  type StatusFilter,
  type TodoItem,
  type ViewFilter,
} from './utils/todoLogic';
import { Sidebar } from './components/Sidebar';
import { TaskInput } from './components/TaskInput';
import { TaskItem } from './components/TaskItem';
import { EditTaskModal } from './components/EditTaskModal';
import { FocusPanel } from './components/FocusPanel';
import { CommandPalette } from './components/CommandPalette';
import { PortabilityModal } from './components/PortabilityModal';
import { ZenModeModal } from './components/ZenModeModal';
import { useFocusTimer } from './hooks/useFocusTimer';
import { playTaskCompleteSound } from './utils/soundEffects';

const STORAGE_KEY = 'focuslist_todos_v1';

const VIEW_TITLES: Record<ViewFilter, { title: string; subtitle: string }> = {
  all: {
    title: 'All Tasks',
    subtitle: 'Complete overview across every project and schedule',
  },
  today: {
    title: 'Due Today',
    subtitle: 'Tasks scheduled for today or overdue for immediate attention',
  },
  upcoming: {
    title: 'Scheduled',
    subtitle: 'Upcoming deadlines ordered across your calendar',
  },
  'high-priority': {
    title: 'High Priority',
    subtitle: 'Critical deliverables and time-sensitive priorities',
  },
  Work: {
    title: 'Work Project',
    subtitle: 'Professional deliverables, meetings, and roadmap items',
  },
  Personal: {
    title: 'Personal Project',
    subtitle: 'Home, health, appointments, and personal goals',
  },
  Errands: {
    title: 'Errands & Shopping',
    subtitle: 'Local pickups, groceries, and household supplies',
  },
  Study: {
    title: 'Study & Learning',
    subtitle: 'Reading lists, courses, and technical practice',
  },
};

const BOARD_COLUMNS: Array<{
  priority: Priority;
  title: string;
  accentText: string;
}> = [
  {
    priority: 'high',
    title: 'High Priority',
    accentText: 'text-red-700',
  },
  {
    priority: 'medium',
    title: 'Medium Priority',
    accentText: 'text-amber-700',
  },
  {
    priority: 'low',
    title: 'Low Priority',
    accentText: 'text-slate-600',
  },
];

export default function App() {
  const todayDate = useMemo(() => getTodayIsoDate(), []);

  const formattedBannerDate = useMemo(() => {
    const parts = todayDate.split('-').map(Number);
    const d =
      parts.length === 3
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [todayDate]);

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fall back to deterministic seed tasks
    }
    return getInitialDemoTodos(todayDate);
  });

  const [activeView, setActiveView] = useState<ViewFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('manual');
  const [layoutMode, setLayoutMode] = useState<'list' | 'board'>('list');
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);

  const timer = useFocusTimer((completedMode) => {
    if (completedMode === 'focus') {
      const targetId = focusedTaskId ?? (todos.find((t) => !t.completed)?.id);
      if (targetId) {
        setTodos((prev) => incrementPomodoro(prev, targetId));
      }
    }
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [portabilityModalState, setPortabilityModalState] = useState<{
    isOpen: boolean;
    tab: 'export' | 'import';
  }>({ isOpen: false, tab: 'export' });
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const taskInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Ignore storage quota errors in restricted frames
    }
  }, [todos]);

  const showTransientNotice = (msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Global keyboard shortcuts: Cmd/Ctrl+K opens Command Palette; '/' focuses search; 'n' focuses new task input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (
        !isInputFocused &&
        !isCommandPaletteOpen &&
        !portabilityModalState.isOpen &&
        !editingTodo
      ) {
        if (e.key === '/') {
          e.preventDefault();
          searchInputRef.current?.focus();
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          taskInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, portabilityModalState.isOpen, editingTodo]);

  const stats = useMemo(
    () => computeTodoStats(todos, todayDate),
    [todos, todayDate]
  );

  const visibleTodos = useMemo(
    () =>
      filterAndSortTodos(todos, {
        status: statusFilter,
        view: activeView,
        searchQuery,
        sortBy,
        todayDate,
      }),
    [todos, statusFilter, activeView, searchQuery, sortBy, todayDate]
  );

  const activeTodos = useMemo(
    () => todos.filter((t) => !t.completed),
    [todos]
  );

  const handleAddTodo = (input: CreateTodoInput) => {
    setTodos((prev) => createTodo(prev, input));
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target && !target.completed && timer.soundEnabled) {
        playTaskCompleteSound();
      }
      return toggleTodo(prev, id);
    });
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => deleteTodo(prev, id));
  };

  const handleUpdateTodo = (
    id: string,
    updates: {
      title: string;
      notes: string;
      category: Category;
      priority: TodoItem['priority'];
      dueDate: string;
    }
  ) => {
    setTodos((prev) => updateTodo(prev, id, updates));
  };

  const handleClearCompleted = () => {
    setTodos((prev) => clearCompletedTodos(prev));
  };

  const handleToggleAll = () => {
    const allCompleted = todos.length > 0 && todos.every((t) => t.completed);
    setTodos((prev) => toggleAllTodos(prev, !allCompleted));
  };

  const handleResetDemo = () => {
    setTodos(getInitialDemoTodos(todayDate));
    setStatusFilter('all');
    setActiveView('all');
    setSearchQuery('');
    showTransientNotice('Restored sample workspace tasks.');
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    setTodos((prev) => moveTodoOrder(prev, id, direction));
  };

  const handleAddSubtask = (todoId: string, title: string) => {
    setTodos((prev) => addSubtask(prev, todoId, title));
  };

  const handleToggleSubtask = (todoId: string, subtaskId: string) => {
    setTodos((prev) => toggleSubtask(prev, todoId, subtaskId));
  };

  const handleDeleteSubtask = (todoId: string, subtaskId: string) => {
    setTodos((prev) => deleteSubtask(prev, todoId, subtaskId));
  };

  const triggerFileDownload = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore if restricted in sandboxed frame
    }
  };

  const handleExportJson = () => {
    const content = exportTodosToJson(todos);
    triggerFileDownload(
      content,
      `focuslist-backup-${todayDate}.json`,
      'application/json'
    );
    showTransientNotice(`Exported ${todos.length} tasks to JSON backup.`);
  };

  const handleExportCsv = () => {
    const content = exportTodosToCsv(todos);
    triggerFileDownload(
      content,
      `focuslist-tasks-${todayDate}.csv`,
      'text/csv;charset=utf-8;'
    );
    showTransientNotice(`Exported ${todos.length} tasks to CSV spreadsheet.`);
  };

  const handleConfirmImport = (
    importedTodos: TodoItem[],
    mode: ImportMode
  ) => {
    setTodos((prev) => applyImportedTodos(prev, importedTodos, mode));
    showTransientNotice(
      `Imported ${importedTodos.length} ${
        importedTodos.length === 1 ? 'task' : 'tasks'
      } (${mode === 'merge' ? 'merged with workspace' : 'replaced workspace'}).`
    );
  };

  const currentHeader = VIEW_TITLES[activeView];
  const defaultCategoryForNewTask: Category =
    activeView === 'Work' ||
    activeView === 'Personal' ||
    activeView === 'Errands' ||
    activeView === 'Study'
      ? activeView
      : 'Work';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F0] text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-stone-200/90 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('all');
            setStatusFilter('all');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          Focuslist
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary view navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveView('all')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'all'
                ? 'text-slate-900 underline underline-offset-4'
                : ''
            }`}
          >
            All Tasks
          </button>
          <button
            type="button"
            onClick={() => setActiveView('today')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'today'
                ? 'text-slate-900 underline underline-offset-4'
                : ''
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setActiveView('upcoming')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'upcoming'
                ? 'text-slate-900 underline underline-offset-4'
                : ''
            }`}
          >
            Scheduled
          </button>
          <button
            type="button"
            onClick={() => setActiveView('high-priority')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'high-priority'
                ? 'text-slate-900 underline underline-offset-4'
                : ''
            }`}
          >
            High Priority
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => taskInputRef.current?.focus()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Executive Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row w-full">
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          stats={stats}
          onClearCompleted={handleClearCompleted}
          onResetDemo={handleResetDemo}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenPortability={(tab) =>
            setPortabilityModalState({ isOpen: true, tab })
          }
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1160px] w-full mx-auto">
          <div className="flex flex-col xl:flex-row items-start gap-6">
            {/* Primary Center Workspace Column */}
            <div className="flex-1 w-full min-w-0 space-y-5">
              {/* Inline Confirmation Notice */}
              {statusBanner && (
                <div
                  role="status"
                  aria-live="polite"
                  className="bg-emerald-950 text-emerald-100 border border-emerald-800 rounded-xl px-4 py-2.5 text-xs flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{statusBanner}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusBanner(null)}
                    aria-label="Dismiss notification"
                    className="text-emerald-300 hover:text-white p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Architectural Daily Briefing Banner */}
              <section
                aria-label="Workspace overview banner"
                className="relative overflow-hidden rounded-xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800"
              >
                {/* Bespoke Architectural Geometric SVG Backdrop */}
                <svg
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-full w-1/2 opacity-20 pointer-events-none"
                  viewBox="0 0 400 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="320"
                    cy="40"
                    r="110"
                    stroke="url(#grad1)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="320"
                    cy="40"
                    r="70"
                    stroke="url(#grad1)"
                    strokeWidth="1"
                  />
                  <line
                    x1="140"
                    y1="200"
                    x2="380"
                    y2="0"
                    stroke="url(#grad1)"
                    strokeWidth="1"
                  />
                  <line
                    x1="200"
                    y1="200"
                    x2="400"
                    y2="30"
                    stroke="url(#grad1)"
                    strokeWidth="1"
                  />
                  <defs>
                    <linearGradient
                      id="grad1"
                      x1="0"
                      y1="0"
                      x2="400"
                      y2="200"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#34D399" />
                      <stop offset="1" stopColor="#6366F1" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-emerald-400 tracking-wide">
                      {formattedBannerDate}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
                      {currentHeader.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                      {currentHeader.subtitle}
                    </p>
                  </div>

                  {/* Unboxed Tabular KPI Strip */}
                  <div className="flex flex-wrap items-center gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 text-xs font-mono tabular-nums shrink-0">
                    <div>
                      <span className="block text-lg font-semibold text-white">
                        {stats.active}
                      </span>
                      <span className="text-slate-400">Active</span>
                    </div>
                    <div className="h-7 w-px bg-slate-800" aria-hidden="true" />
                    <div>
                      <span className="block text-lg font-semibold text-amber-400">
                        {stats.dueTodayOrOverdue}
                      </span>
                      <span className="text-slate-400">Due Today</span>
                    </div>
                    <div className="h-7 w-px bg-slate-800" aria-hidden="true" />
                    <div>
                      <span className="block text-lg font-semibold text-emerald-400">
                        {stats.completionRate}%
                      </span>
                      <span className="text-slate-400">Done</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Task Capture Form */}
              <TaskInput
                key={defaultCategoryForNewTask}
                onAddTodo={handleAddTodo}
                todayDate={todayDate}
                defaultCategory={defaultCategoryForNewTask}
                defaultDueDate={activeView === 'today' ? todayDate : ''}
                inputRef={taskInputRef}
              />

              {/* Filter, Search, Sort & Layout Switcher Bar */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Segmented Status Filter Controls */}
                    <div
                      role="group"
                      aria-label="Filter tasks by completion status"
                      className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg"
                    >
                      {(
                        ['all', 'active', 'completed'] as StatusFilter[]
                      ).map((status) => {
                        const label =
                          status === 'all'
                            ? `All (${stats.total})`
                            : status === 'active'
                            ? `Active (${stats.active})`
                            : `Completed (${stats.completed})`;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                              statusFilter === status
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* List vs Priority Board Switcher */}
                    <div
                      role="group"
                      aria-label="Switch layout view"
                      className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => setLayoutMode('list')}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                          layoutMode === 'list'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LayoutList className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLayoutMode('board')}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                          layoutMode === 'board'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Kanban className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Board</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions: Import/Export & Complete All */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="lg:hidden px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-stone-200/90 hover:bg-stone-50 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Command className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Commands</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPortabilityModalState({
                          isOpen: true,
                          tab: 'export',
                        })
                      }
                      aria-label="Export or Import Tasks"
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-stone-200/90 hover:bg-stone-50 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Import / Export</span>
                    </button>

                    {todos.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleAll}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-stone-200/90 hover:bg-stone-50 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <CheckCheck
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                        <span>
                          {todos.every((t) => t.completed)
                            ? 'Mark All Active'
                            : 'Complete All'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search & Sort Controls Row */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search
                      className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <label htmlFor="search-tasks-input" className="sr-only">
                      Search tasks
                    </label>
                    <input
                      ref={searchInputRef}
                      id="search-tasks-input"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks by title, notes, project, or subtask... (/)"
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-stone-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search query"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label
                      htmlFor="sort-tasks-select"
                      className="text-xs text-slate-500 font-medium whitespace-nowrap"
                    >
                      Sort by:
                    </label>
                    <select
                      id="sort-tasks-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="text-xs bg-white border border-stone-200/90 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-slate-400"
                    >
                      <option value="manual">Manual Order</option>
                      <option value="priority">Priority (High-Low)</option>
                      <option value="dueDate">Due Date (Soonest)</option>
                      <option value="alphabetical">Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Task List View vs Priority Board View */}
              {visibleTodos.length > 0 ? (
                layoutMode === 'list' ? (
                  <div className="bg-white border border-stone-200/90 rounded-xl overflow-hidden">
                    <ul
                      aria-label="Task list"
                      className="divide-y divide-stone-200/80"
                    >
                      {visibleTodos.map((todo, idx) => (
                        <TaskItem
                          key={todo.id}
                          todo={todo}
                          todayDate={todayDate}
                          isFirst={idx === 0}
                          isLast={idx === visibleTodos.length - 1}
                          canReorder={sortBy === 'manual'}
                          onToggle={handleToggleTodo}
                          onEdit={setEditingTodo}
                          onDelete={handleDeleteTodo}
                          onMoveOrder={handleMoveOrder}
                          onAddSubtask={handleAddSubtask}
                          onToggleSubtask={handleToggleSubtask}
                          onDeleteSubtask={handleDeleteSubtask}
                        />
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div
                    aria-label="Priority board view"
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {BOARD_COLUMNS.map((col) => {
                      const colTodos = visibleTodos.filter(
                        (t) => t.priority === col.priority
                      );
                      return (
                        <div
                          key={col.priority}
                          className="bg-white border border-stone-200/90 rounded-xl p-4 space-y-3 flex flex-col"
                        >
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                            <span
                              className={`text-xs font-semibold inline-flex items-center gap-1.5 ${col.accentText}`}
                            >
                              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{col.title}</span>
                            </span>
                            <span className="text-xs font-mono text-slate-500 tabular-nums">
                              {colTodos.length}
                            </span>
                          </div>

                          {colTodos.length > 0 ? (
                            <ul className="space-y-2.5">
                              {colTodos.map((todo) => {
                                const dueInfo = formatDueDateLabel(
                                  todo.dueDate,
                                  todayDate
                                );
                                return (
                                  <li
                                    key={todo.id}
                                    className="p-3 rounded-lg bg-stone-50/80 border border-stone-200/70 space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-2 min-w-0">
                                        <button
                                          type="button"
                                          role="checkbox"
                                          aria-checked={todo.completed}
                                          aria-label={`Toggle '${todo.title}'`}
                                          onClick={() =>
                                            handleToggleTodo(todo.id)
                                          }
                                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                            todo.completed
                                              ? 'bg-emerald-600 border-emerald-600 text-white'
                                              : 'border-slate-300 bg-white hover:border-slate-500'
                                          }`}
                                        >
                                          {todo.completed && (
                                            <Check
                                              className="w-3 h-3"
                                              aria-hidden="true"
                                            />
                                          )}
                                        </button>
                                        <span
                                          onClick={() =>
                                            handleToggleTodo(todo.id)
                                          }
                                          className={`text-xs font-medium cursor-pointer break-words ${
                                            todo.completed
                                              ? 'line-through text-slate-400'
                                              : 'text-slate-900'
                                          }`}
                                        >
                                          {todo.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setEditingTodo(todo)}
                                          aria-label={`Edit '${todo.title}'`}
                                          className="p-1 text-slate-400 hover:text-slate-800 rounded"
                                        >
                                          <Edit3
                                            className="w-3.5 h-3.5"
                                            aria-hidden="true"
                                          />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteTodo(todo.id)
                                          }
                                          aria-label={`Delete '${todo.title}'`}
                                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                                        >
                                          <Trash2
                                            className="w-3.5 h-3.5"
                                            aria-hidden="true"
                                          />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 pl-6">
                                      <span className="font-medium text-slate-700">
                                        {todo.category}
                                      </span>
                                      {dueInfo.label && (
                                        <>
                                          <span aria-hidden="true">·</span>
                                          <span className="font-mono tabular-nums">
                                            {dueInfo.label}
                                          </span>
                                        </>
                                      )}
                                      {todo.subtasks.length > 0 && (
                                        <>
                                          <span aria-hidden="true">·</span>
                                          <span className="font-mono tabular-nums">
                                            {
                                              todo.subtasks.filter(
                                                (s) => s.completed
                                              ).length
                                            }
                                            /{todo.subtasks.length} steps
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400 py-6 text-center">
                              No {col.title.toLowerCase()} tasks
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="bg-white border border-stone-200/90 rounded-xl p-10 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 text-slate-600 flex items-center justify-center mx-auto">
                    <ListChecks className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h2 className="text-base font-semibold text-slate-900 font-display">
                      {todos.length === 0
                        ? 'Your task list is clear'
                        : 'No tasks match your current filters'}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {todos.length === 0
                        ? 'Add a new task above to start planning your day, or restore sample tasks to explore project lists and subtasks.'
                        : 'Try clearing your search query or switching back to All Tasks.'}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2.5">
                    {todos.length === 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => taskInputRef.current?.focus()}
                          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Create First Task
                        </button>
                        <button
                          type="button"
                          onClick={handleResetDemo}
                          className="px-4 py-2 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Load Sample Tasks
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setActiveView('all');
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Companion Focus Timer & Workload Breakdown Column */}
            <FocusPanel
              activeTodos={activeTodos}
              focusedTaskId={focusedTaskId}
              onSelectFocusTask={setFocusedTaskId}
              onCompleteTask={handleToggleTodo}
              stats={stats}
              activeView={activeView}
              onSelectView={setActiveView}
              mode={timer.mode}
              secondsLeft={timer.secondsLeft}
              isRunning={timer.isRunning}
              onToggleTimer={timer.toggleTimer}
              onResetTimer={timer.resetTimer}
              onSwitchMode={timer.switchMode}
              onOpenZenMode={() => {
                timer.requestNotificationPermission();
                setIsZenModeOpen(true);
              }}
              soundEnabled={timer.soundEnabled}
              onToggleSound={timer.toggleSound}
            />
          </div>
        </main>
      </div>

      {/* Edit Task Modal */}
      {editingTodo && (
        <EditTaskModal
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSave={handleUpdateTodo}
        />
      )}

      {/* Command Palette (Cmd/Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        todos={todos}
        onSelectView={setActiveView}
        onSelectStatus={setStatusFilter}
        onSelectLayout={setLayoutMode}
        onFocusNewTask={() => taskInputRef.current?.focus()}
        onQuickCreateTask={(title) => {
          handleAddTodo({
            title,
            category: defaultCategoryForNewTask,
            priority: 'medium',
          });
          showTransientNotice(`Added task "${title}".`);
        }}
        onToggleTodo={handleToggleTodo}
        onToggleAll={handleToggleAll}
        onClearCompleted={handleClearCompleted}
        onResetDemo={handleResetDemo}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        onOpenImportModal={() =>
          setPortabilityModalState({ isOpen: true, tab: 'import' })
        }
      />

      {/* JSON & CSV Import / Export Portability Modal */}
      <PortabilityModal
        isOpen={portabilityModalState.isOpen}
        initialTab={portabilityModalState.tab}
        onClose={() =>
          setPortabilityModalState((prev) => ({ ...prev, isOpen: false }))
        }
        todos={todos}
        onDownloadJson={handleExportJson}
        onDownloadCsv={handleExportCsv}
        onConfirmImport={handleConfirmImport}
      />

      {/* Fullscreen Zen Deep Work Mode */}
      <ZenModeModal
        isOpen={isZenModeOpen}
        onClose={() => setIsZenModeOpen(false)}
        todo={activeTodos.find((t) => t.id === focusedTaskId) ?? activeTodos[0] ?? null}
        mode={timer.mode}
        secondsLeft={timer.secondsLeft}
        totalSeconds={timer.totalSeconds}
        isRunning={timer.isRunning}
        onToggleTimer={timer.toggleTimer}
        onResetTimer={timer.resetTimer}
        onSwitchMode={timer.switchMode}
        onCompleteTask={(id) => {
          handleToggleTodo(id);
        }}
        onToggleSubtask={handleToggleSubtask}
        soundEnabled={timer.soundEnabled}
        onToggleSound={timer.toggleSound}
      />
      />
    </div>
  );
}
