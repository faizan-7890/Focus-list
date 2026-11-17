import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Flag, Plus } from 'lucide-react';
import type { TodoItem } from '../utils/todoLogic';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  formatMonthLabel,
  getMonthOfIsoDate,
  groupTodosByDueDate,
  isDateInMonth,
  shiftMonth,
  type CalendarMonth,
} from '../utils/calendarLogic';

interface CalendarViewProps {
  todos: TodoItem[];
  todayDate: string;
  onEditTodo: (todo: TodoItem) => void;
  onAddTodoOnDate: (isoDate: string) => void;
}

/** How many tasks a day shows before collapsing the rest behind "+N more". */
const MAX_TASKS_PER_DAY = 3;

function formatFullDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getChipClass(todo: TodoItem, todayDate: string): string {
  if (todo.completed) {
    return 'bg-stone-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 line-through hover:bg-stone-200 dark:hover:bg-slate-700';
  }
  if (todo.dueDate < todayDate) {
    return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60';
  }
  if (todo.priority === 'high') {
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700';
}

type ChipMarker = 'overdue' | 'high' | null;

/** Non-color cue for chips, so overdue/high priority don't rely on tint alone. */
function getChipMarker(todo: TodoItem, todayDate: string): ChipMarker {
  if (todo.completed) return null;
  if (todo.dueDate < todayDate) return 'overdue';
  if (todo.priority === 'high') return 'high';
  return null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  todos,
  todayDate,
  onEditTodo,
  onAddTodoOnDate,
}) => {
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() =>
    getMonthOfIsoDate(todayDate)
  );
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const weeks = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const todosByDate = useMemo(() => groupTodosByDueDate(todos), [todos]);
  const undatedCount = todos.filter((t) => !t.dueDate).length;
  const monthLabel = formatMonthLabel(visibleMonth);

  const goToMonth = (next: CalendarMonth) => {
    setVisibleMonth(next);
    setExpandedDate(null);
  };

  return (
    <section
      aria-label={`Calendar for ${monthLabel}`}
      className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-200/80 dark:border-slate-800">
        <h2
          aria-live="polite"
          className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display"
        >
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToMonth(shiftMonth(visibleMonth, -1))}
            aria-label="Previous month"
            className="icon-btn text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(getMonthOfIsoDate(todayDate))}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goToMonth(shiftMonth(visibleMonth, 1))}
            aria-label="Next month"
            className="icon-btn text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-stone-200/80 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/50">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1 py-1.5 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {weeks.flat().map((date, idx) => {
          const dayTodos = todosByDate.get(date) ?? [];
          const inMonth = isDateInMonth(date, visibleMonth);
          const isToday = date === todayDate;
          const isExpanded = expandedDate === date;
          const shownTodos = isExpanded
            ? dayTodos
            : dayTodos.slice(0, MAX_TASKS_PER_DAY);
          const hiddenCount = dayTodos.length - shownTodos.length;
          const isLastColumn = idx % 7 === 6;
          const isLastRow = idx >= (weeks.length - 1) * 7;

          return (
            <div
              key={date}
              className={`min-w-0 min-h-20 sm:min-h-24 p-1 sm:p-1.5 space-y-1 border-stone-200/80 dark:border-slate-800 ${
                isLastColumn ? '' : 'border-r'
              } ${isLastRow ? '' : 'border-b'} ${
                inMonth ? 'bg-white dark:bg-slate-900' : 'bg-stone-50/70 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onAddTodoOnDate(date)}
                  aria-label={`Add task on ${formatFullDate(date)}`}
                  title="Add task on this day"
                  className="hit-area inline-flex items-center justify-center w-5 h-5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span
                  aria-label={formatFullDate(date)}
                  aria-current={isToday ? 'date' : undefined}
                  className={`inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-mono tabular-nums ${
                    isToday
                      ? 'bg-slate-900 text-white dark:bg-slate-700 font-semibold'
                      : inMonth
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {Number(date.slice(8))}
                </span>
              </div>

              {shownTodos.length > 0 && (
                <ul className="space-y-0.5">
                  {shownTodos.map((todo) => (
                    <li key={todo.id}>
                      <button
                        type="button"
                        onClick={() => onEditTodo(todo)}
                        title={todo.title}
                        aria-label={`Edit '${todo.title}'${
                          todo.completed
                            ? ' (completed)'
                            : getChipMarker(todo, todayDate) === 'overdue'
                            ? ' (overdue)'
                            : getChipMarker(todo, todayDate) === 'high'
                            ? ' (high priority)'
                            : ''
                        }`}
                        className={`block w-full truncate text-left text-[11px] leading-tight px-1 sm:px-1.5 py-0.5 rounded transition-colors ${getChipClass(
                          todo,
                          todayDate
                        )}`}
                      >
                        {getChipMarker(todo, todayDate) === 'overdue' && (
                          <AlertCircle
                            className="inline w-3 h-3 mr-0.5 -mt-0.5"
                            aria-hidden="true"
                          />
                        )}
                        {getChipMarker(todo, todayDate) === 'high' && (
                          <Flag
                            className="inline w-3 h-3 mr-0.5 -mt-0.5 fill-current"
                            aria-hidden="true"
                          />
                        )}
                        {todo.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {(hiddenCount > 0 || isExpanded) && (
                <button
                  type="button"
                  onClick={() => setExpandedDate(isExpanded ? null : date)}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? `Show fewer tasks for ${formatFullDate(date)}`
                      : `Show ${hiddenCount} more tasks for ${formatFullDate(date)}`
                  }
                  className="block w-full text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-1 sm:px-1.5 rounded"
                >
                  {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {undatedCount > 0 && (
        <p className="px-4 py-2.5 border-t border-stone-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          {undatedCount} {undatedCount === 1 ? 'task has' : 'tasks have'} no due
          date and {undatedCount === 1 ? "isn't" : "aren't"} shown on the
          calendar.
        </p>
      )}
    </section>
  );
};
