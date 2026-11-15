import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    return 'bg-stone-100 text-slate-400 line-through hover:bg-stone-200';
  }
  if (todo.dueDate < todayDate) {
    return 'bg-red-50 text-red-700 hover:bg-red-100';
  }
  if (todo.priority === 'high') {
    return 'bg-amber-50 text-amber-800 hover:bg-amber-100';
  }
  return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  todos,
  todayDate,
  onEditTodo,
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
      className="bg-white border border-stone-200/90 rounded-xl overflow-hidden"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-200/80">
        <h2
          aria-live="polite"
          className="text-sm font-semibold text-slate-900 font-display"
        >
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToMonth(shiftMonth(visibleMonth, -1))}
            aria-label="Previous month"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(getMonthOfIsoDate(todayDate))}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goToMonth(shiftMonth(visibleMonth, 1))}
            aria-label="Next month"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-stone-200/80 bg-stone-50">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1 py-1.5 text-center text-[11px] font-medium text-slate-500"
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
              className={`min-w-0 min-h-20 sm:min-h-24 p-1 sm:p-1.5 space-y-1 border-stone-200/80 ${
                isLastColumn ? '' : 'border-r'
              } ${isLastRow ? '' : 'border-b'} ${
                inMonth ? 'bg-white' : 'bg-stone-50/70'
              }`}
            >
              <div className="flex justify-end">
                <span
                  aria-label={formatFullDate(date)}
                  aria-current={isToday ? 'date' : undefined}
                  className={`inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-mono tabular-nums ${
                    isToday
                      ? 'bg-slate-900 text-white font-semibold'
                      : inMonth
                      ? 'text-slate-700'
                      : 'text-slate-400'
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
                          todo.completed ? ' (completed)' : ''
                        }`}
                        className={`block w-full truncate text-left text-[11px] leading-tight px-1 sm:px-1.5 py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${getChipClass(
                          todo,
                          todayDate
                        )}`}
                      >
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
                  className="block w-full text-left text-[11px] font-medium text-slate-500 hover:text-slate-900 px-1 sm:px-1.5 rounded"
                >
                  {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {undatedCount > 0 && (
        <p className="px-4 py-2.5 border-t border-stone-200/80 text-xs text-slate-500">
          {undatedCount} {undatedCount === 1 ? 'task has' : 'tasks have'} no due
          date and {undatedCount === 1 ? "isn't" : "aren't"} shown on the
          calendar.
        </p>
      )}
    </section>
  );
};
