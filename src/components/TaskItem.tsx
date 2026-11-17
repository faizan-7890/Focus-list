import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Flag,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  formatDueDateLabel,
  type Priority,
  type TodoItem,
} from '../utils/todoLogic';

interface TaskItemProps {
  todo: TodoItem;
  todayDate: string;
  isFirst: boolean;
  isLast: boolean;
  canReorder: boolean;
  onToggle: (id: string) => void;
  onEdit: (todo: TodoItem) => void;
  onDelete: (id: string) => void;
  onMoveOrder: (id: string, direction: 'up' | 'down') => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

const PRIORITY_META: Record<
  Priority,
  { label: string; textClass: string }
> = {
  high: {
    label: 'High priority',
    textClass: 'text-red-700 dark:text-red-400 font-medium',
  },
  medium: {
    label: 'Medium priority',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
  low: {
    label: 'Low priority',
    textClass: 'text-slate-500 dark:text-slate-400',
  },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  todo,
  todayDate,
  isFirst,
  isLast,
  canReorder,
  onToggle,
  onEdit,
  onDelete,
  onMoveOrder,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const dueInfo = formatDueDateLabel(todo.dueDate, todayDate);
  const priorityInfo = PRIORITY_META[todo.priority];
  const completedSubtasks = todo.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = todo.subtasks.length;

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(todo.id, newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  return (
    <li className="bg-white dark:bg-slate-900 border-b last:border-b-0 border-slate-200 dark:border-slate-700 px-4 py-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox + Title + Unboxed Metadata */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            role="checkbox"
            aria-checked={todo.completed}
            aria-label={`Toggle '${todo.title}'`}
            onClick={() => onToggle(todo.id)}
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
              todo.completed
                ? 'bg-emerald-600 border-emerald-600 dark:border-emerald-500/60 text-white'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-slate-500 dark:hover:border-slate-400'
            }`}
          >
            {todo.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span
                role="button"
                tabIndex={0}
                onClick={() => onToggle(todo.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle(todo.id);
                  }
                }}
                className={`text-sm sm:text-base font-medium cursor-pointer select-none break-words rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                  todo.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {todo.title}
              </span>
            </div>

            {todo.notes && (
              <p
                className={`text-xs leading-relaxed break-words ${
                  todo.completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {todo.notes}
              </p>
            )}

            {/* Zero-Pill Unboxed Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="font-medium text-slate-700 dark:text-slate-300">{todo.category}</span>
              <span aria-hidden="true">·</span>
              <span className={`inline-flex items-center gap-1 ${priorityInfo.textClass}`}>
                <Flag className="w-3 h-3" aria-hidden="true" />
                <span>{priorityInfo.label}</span>
              </span>

              {dueInfo.label && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-mono tabular-nums inline-flex items-center gap-1 ${
                      dueInfo.isOverdue && !todo.completed
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : dueInfo.isToday && !todo.completed
                        ? 'text-amber-700 dark:text-amber-400 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {dueInfo.isOverdue && !todo.completed && (
                      <AlertCircle className="w-3 h-3" aria-hidden="true" />
                    )}
                    <span>{dueInfo.label}</span>
                  </span>
                </>
              )}

              {Boolean(todo.completedPomodoros && todo.completedPomodoros > 0) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    title={`${todo.completedPomodoros} focus session(s) completed`}
                    className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-[11px] font-medium font-mono"
                  >
                    <span>🍅</span>
                    <span>{todo.completedPomodoros}</span>
                  </span>
                </>
              )}

              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                aria-label={`Subtasks for '${todo.title}'`}
                className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span className="font-mono tabular-nums">
                  {totalSubtasks > 0
                    ? `${completedSubtasks}/${totalSubtasks} subtasks`
                    : 'Add subtasks'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {canReorder && (
            <>
              <button
                type="button"
                disabled={isFirst}
                onClick={() => onMoveOrder(todo.id, 'up')}
                aria-label={`Move '${todo.title}' up`}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={() => onMoveOrder(todo.id, 'down')}
                aria-label={`Move '${todo.title}' down`}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onEdit(todo)}
            aria-label={`Edit '${todo.title}'`}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <Edit3 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete '${todo.title}'`}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Expandable Subtasks Section */}
      {expanded && (
        <div className="mt-3 ml-8 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {todo.subtasks.length > 0 && (
            <ul className="space-y-1.5" aria-label={`Subtask list for ${todo.title}`}>
              {todo.subtasks.map((st) => (
                <li
                  key={st.id}
                  className="flex items-center justify-between gap-2 text-xs py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={st.completed}
                      aria-label={`Toggle subtask '${st.title}'`}
                      onClick={() => onToggleSubtask(todo.id, st.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        st.completed
                          ? 'bg-emerald-600 border-emerald-600 dark:border-emerald-500/60 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-slate-500 dark:hover:border-slate-400'
                      }`}
                    >
                      {st.completed && <Check className="w-3 h-3" aria-hidden="true" />}
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
                      className={`cursor-pointer select-none truncate rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                        st.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSubtask(todo.id, st.id)}
                    aria-label={`Remove subtask '${st.title}'`}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded"
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubtaskSubmit} className="flex items-center gap-2 pt-1">
            <label htmlFor={`subtask-input-${todo.id}`} className="sr-only">
              New subtask for {todo.title}
            </label>
            <input
              id={`subtask-input-${todo.id}`}
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a step or checklist item..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              <span>Add Step</span>
            </button>
          </form>
        </div>
      )}
    </li>
  );
};
