import { getTodayIsoDate, type TodoItem } from './todoLogic';

/** A calendar month. `month` is zero-based like JavaScript's Date (0 = January). */
export interface CalendarMonth {
  year: number;
  month: number;
}

/** Weekday headers in display order. Weeks start on Monday. */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Reads the month out of a YYYY-MM-DD string, falling back to the current month. */
export function getMonthOfIsoDate(isoDate: string): CalendarMonth {
  const parts = isoDate.split('-').map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    return { year: parts[0], month: parts[1] - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/** Moves forward (positive delta) or back (negative) by whole months. */
export function shiftMonth(current: CalendarMonth, delta: number): CalendarMonth {
  const shifted = new Date(current.year, current.month + delta, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

export function formatMonthLabel({ year, month }: CalendarMonth): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/** True when a YYYY-MM-DD date falls inside the given month. */
export function isDateInMonth(isoDate: string, { year, month }: CalendarMonth): boolean {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  return isoDate.startsWith(prefix);
}

/**
 * Builds the grid for one month: an array of weeks, each a row of seven
 * YYYY-MM-DD strings running Monday to Sunday. The first and last rows are
 * padded with days from the neighbouring months so every row is complete.
 */
export function buildMonthGrid({ year, month }: CalendarMonth): string[][] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // getDay() is 0 for Sunday; convert so Monday = 0 ... Sunday = 6.
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const weekCount = Math.ceil((leadingDays + daysInMonth) / 7);

  const weeks: string[][] = [];
  for (let week = 0; week < weekCount; week++) {
    const row: string[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const dayOfMonth = week * 7 + weekday - leadingDays + 1;
      // Date() normalises out-of-range days into the neighbouring months.
      row.push(getTodayIsoDate(new Date(year, month, dayOfMonth)));
    }
    weeks.push(row);
  }
  return weeks;
}

/** Groups tasks by due date, keeping their incoming order. Undated tasks are skipped. */
export function groupTodosByDueDate(todos: TodoItem[]): Map<string, TodoItem[]> {
  const byDate = new Map<string, TodoItem[]>();
  for (const todo of todos) {
    if (!todo.dueDate) continue;
    const existing = byDate.get(todo.dueDate);
    if (existing) {
      existing.push(todo);
    } else {
      byDate.set(todo.dueDate, [todo]);
    }
  }
  return byDate;
}
