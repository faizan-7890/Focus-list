import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  CornerDownLeft,
  Download,
  Folder,
  Kanban,
  Layers,
  LayoutList,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { StatusFilter, TodoItem, ViewFilter } from '../utils/todoLogic';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  todos: TodoItem[];
  onSelectView: (view: ViewFilter) => void;
  onSelectStatus: (status: StatusFilter) => void;
  onSelectLayout: (layout: 'list' | 'board') => void;
  onFocusNewTask: () => void;
  onQuickCreateTask: (title: string) => void;
  onToggleTodo: (id: string) => void;
  onToggleAll: () => void;
  onClearCompleted: () => void;
  onResetDemo: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onOpenImportModal: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface CommandItem {
  id: string;
  label: string;
  group: 'Quick Actions' | 'Navigation & Views' | 'Data Portability' | 'Tasks';
  keywords: string;
  shortcut?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  todos,
  onSelectView,
  onSelectStatus,
  onSelectLayout,
  onFocusNewTask,
  onQuickCreateTask,
  onToggleTodo,
  onToggleAll,
  onClearCompleted,
  onResetDemo,
  onExportJson,
  onExportCsv,
  onOpenImportModal,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  const allCommands = useMemo<CommandItem[]>(() => {
    const base: CommandItem[] = [
      {
        id: 'cmd-new-task',
        label: 'Create New Task',
        group: 'Quick Actions',
        keywords: 'add new task create deliverable',
        shortcut: 'N',
        icon: <Plus className="w-4 h-4 text-slate-600" aria-hidden="true" />,
        onSelect: () => {
          onClose();
          onFocusNewTask();
        },
      },
    ];

    if (canUndo && onUndo) {
      base.push({
        id: 'cmd-undo',
        label: 'Undo Last Action',
        group: 'Quick Actions',
        keywords: 'undo revert back previous restore cancel',
        shortcut: '⌘Z',
        icon: <RotateCcw className="w-4 h-4 text-amber-600" aria-hidden="true" />,
        onSelect: () => {
          onClose();
          onUndo();
        },
      });
    }

    if (canRedo && onRedo) {
      base.push({
        id: 'cmd-redo',
        label: 'Redo Last Action',
        group: 'Quick Actions',
        keywords: 'redo forward repeat again',
        shortcut: '⌘⇧Z',
        icon: <RotateCcw className="w-4 h-4 text-emerald-600 -scale-x-100 transform" aria-hidden="true" />,
        onSelect: () => {
          onClose();
          onRedo();
        },
      });
    }

    base.push(
      {
        id: 'cmd-layout-list',
        label: 'Switch to List View',
        group: 'Navigation & Views',
        keywords: 'view list rows checklist',
        icon: (
          <LayoutList className="w-4 h-4 text-slate-600" aria-hidden="true" />
        ),
        onSelect: () => {
          onSelectLayout('list');
          onClose();
        },
      },
      {
        id: 'cmd-layout-board',
        label: 'Switch to Priority Board View',
        group: 'Navigation & Views',
        keywords: 'view board kanban columns priority',
        icon: <Kanban className="w-4 h-4 text-slate-600" aria-hidden="true" />,
        onSelect: () => {
          onSelectLayout('board');
          onClose();
        },
      },
      {
        id: 'cmd-export-json',
        label: 'Export Tasks as JSON Backup',
        group: 'Data Portability',
        keywords: 'export download json backup file save',
        icon: (
          <Download className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        ),
        onSelect: () => {
          onExportJson();
          onClose();
        },
      },
      {
        id: 'cmd-export-csv',
        label: 'Export Tasks as CSV Spreadsheet',
        group: 'Data Portability',
        keywords: 'export download csv spreadsheet excel sheets',
        icon: (
          <Download className="w-4 h-4 text-indigo-600" aria-hidden="true" />
        ),
        onSelect: () => {
          onExportCsv();
          onClose();
        },
      },
      {
        id: 'cmd-open-import',
        label: 'Import Tasks from JSON or CSV',
        group: 'Data Portability',
        keywords: 'import upload restore json csv merge replace',
        icon: <Upload className="w-4 h-4 text-amber-600" aria-hidden="true" />,
        onSelect: () => {
          onClose();
          onOpenImportModal();
        },
      },
      {
        id: 'cmd-view-all',
        label: 'Go to All Tasks',
        group: 'Navigation & Views',
        keywords: 'view all tasks overview',
        icon: <Layers className="w-4 h-4 text-slate-600" aria-hidden="true" />,
        onSelect: () => {
          onSelectView('all');
          onSelectStatus('all');
          onClose();
        },
      },
      {
        id: 'cmd-view-today',
        label: 'Go to Due Today',
        group: 'Navigation & Views',
        keywords: 'view today overdue urgent schedule',
        icon: <Layers className="w-4 h-4 text-slate-600" aria-hidden="true" />,
        onSelect: () => {
          onSelectView('today');
          onClose();
        },
      },
      {
        id: 'cmd-view-scheduled',
        label: 'Go to Scheduled Tasks',
        group: 'Navigation & Views',
        keywords: 'view upcoming scheduled calendar',
        icon: <Layers className="w-4 h-4 text-slate-600" aria-hidden="true" />,
        onSelect: () => {
          onSelectView('upcoming');
          onClose();
        },
      },
      {
        id: 'cmd-view-high',
        label: 'Go to High Priority',
        group: 'Navigation & Views',
        keywords: 'view high priority critical flag',
        icon: <Layers className="w-4 h-4 text-slate-600" aria-hidden="true" />,
        onSelect: () => {
          onSelectView('high-priority');
          onClose();
        },
      },
      {
        id: 'cmd-project-work',
        label: 'Filter Project: Work',
        group: 'Navigation & Views',
        keywords: 'project work office career',
        icon: <Folder className="w-4 h-4 text-indigo-600" aria-hidden="true" />,
        onSelect: () => {
          onSelectView('Work');
          onClose();
        },
      },
      {
        id: 'cmd-project-personal',
        label: 'Filter Project: Personal',
        group: 'Navigation & Views',
        keywords: 'project personal home life',
        icon: (
          <Folder className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        ),
        onSelect: () => {
          onSelectView('Personal');
          onClose();
        },
      },
      {
        id: 'cmd-project-errands',
        label: 'Filter Project: Errands',
        group: 'Navigation & Views',
        keywords: 'project errands shopping groceries',
        icon: <Folder className="w-4 h-4 text-amber-600" aria-hidden="true" />,
        onSelect: () => {
          onSelectView('Errands');
          onClose();
        },
      },
      {
        id: 'cmd-project-study',
        label: 'Filter Project: Study',
        group: 'Navigation & Views',
        keywords: 'project study learning reading course',
        icon: <Folder className="w-4 h-4 text-sky-600" aria-hidden="true" />,
        onSelect: () => {
          onSelectView('Study');
          onClose();
        },
      },
      {
        id: 'cmd-toggle-all',
        label: 'Toggle Complete All Tasks',
        group: 'Quick Actions',
        keywords: 'complete all mark active bulk',
        icon: (
          <CheckCircle2 className="w-4 h-4 text-slate-600" aria-hidden="true" />
        ),
        onSelect: () => {
          onToggleAll();
          onClose();
        },
      },
      {
        id: 'cmd-clear-completed',
        label: 'Clear Completed Tasks',
        group: 'Quick Actions',
        keywords: 'clear delete remove completed done',
        icon: <Trash2 className="w-4 h-4 text-slate-600" aria-hidden="true" />,
        onSelect: () => {
          onClearCompleted();
          onClose();
        },
      },
      {
        id: 'cmd-restore-demo',
        label: 'Restore Sample Tasks',
        group: 'Quick Actions',
        keywords: 'restore reset demo sample seed',
        icon: (
          <RotateCcw className="w-4 h-4 text-slate-600" aria-hidden="true" />
        ),
        onSelect: () => {
          onResetDemo();
          onClose();
        },
      }
    );

    const taskCommands: CommandItem[] = todos.slice(0, 8).map((todo) => ({
      id: `cmd-task-${todo.id}`,
      label: `${todo.completed ? 'Mark Active:' : 'Complete:'} ${todo.title}`,
      group: 'Tasks',
      keywords: `${todo.title} ${todo.category} ${todo.priority} task toggle`,
      icon: (
        <CheckCircle2
          className={`w-4 h-4 ${
            todo.completed ? 'text-emerald-600' : 'text-slate-400'
          }`}
          aria-hidden="true"
        />
      ),
      onSelect: () => {
        onToggleTodo(todo.id);
        onClose();
      },
    }));

    return [...base, ...taskCommands];
  }, [
    todos,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onClose,
    onFocusNewTask,
    onSelectLayout,
    onExportJson,
    onExportCsv,
    onOpenImportModal,
    onSelectView,
    onSelectStatus,
    onToggleAll,
    onClearCompleted,
    onResetDemo,
    onToggleTodo,
  ]);

  const filteredCommands = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return allCommands;
    return allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(clean) ||
        cmd.group.toLowerCase().includes(clean) ||
        cmd.keywords.toLowerCase().includes(clean)
    );
  }, [allCommands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Ensure selected command is scrolled into view when navigating with keyboard
  useEffect(() => {
    if (!listRef.current) return;
    const selectedItem = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    if (selectedItem && typeof selectedItem.scrollIntoView === 'function') {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        setSelectedIndex(
          (prev) =>
            (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].onSelect();
      } else if (query.trim()) {
        onQuickCreateTask(query.trim());
        onClose();
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-start justify-center pt-16 sm:pt-24 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-heading"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="bg-white border border-stone-200 rounded-xl w-full max-w-xl shadow-lg overflow-hidden"
      >
        <h2 id="command-palette-heading" className="sr-only">
          Command Palette
        </h2>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-200">
          <Search
            className="w-4 h-4 text-slate-400 shrink-0"
            aria-hidden="true"
          />
          <label htmlFor="command-palette-input" className="sr-only">
            Type a command or search tasks
          </label>
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, view, export, or task name..."
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Command Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            <ul ref={listRef} role="listbox" aria-label="Available commands">
              {filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li key={cmd.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={cmd.onSelect}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left text-xs ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className={isSelected ? 'brightness-200' : ''}>
                          {cmd.icon}
                        </span>
                        <span className="font-medium truncate">
                          {cmd.label}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[11px] ${
                            isSelected ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {cmd.group}
                        </span>
                        {cmd.shortcut && (
                          <kbd
                            className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                              isSelected
                                ? 'border-slate-700 bg-slate-800 text-slate-200'
                                : 'border-stone-200 bg-stone-50 text-slate-500'
                            }`}
                          >
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 px-4 text-center space-y-3">
              <p className="text-xs text-slate-500">
                No matching command found for{' '}
                <strong className="text-slate-800">"{query}"</strong>.
              </p>
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickCreateTask(query.trim());
                    onClose();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Create task "{query.trim()}"</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Keyboard Navigation Legend */}
        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Up/Down to navigate · Enter to run · ESC to close</span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" aria-hidden="true" />
            <span>Execute</span>
          </span>
        </div>
      </div>
    </div>
  );
};
