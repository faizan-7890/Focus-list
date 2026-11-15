import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMonthGrid,
  formatMonthLabel,
  getMonthOfIsoDate,
  groupTodosByDueDate,
  isDateInMonth,
  shiftMonth,
} from './calendarLogic.ts';
import { createTodo } from './todoLogic.ts';

test('buildMonthGrid pads a month to full Monday-to-Sunday weeks', () => {
  // October 2026 starts on a Thursday and ends on a Saturday.
  const grid = buildMonthGrid({ year: 2026, month: 9 });
  assert.equal(grid.length, 5);
  assert.ok(grid.every((week) => week.length === 7));
  assert.equal(grid[0][0], '2026-09-28');
  assert.equal(grid[0][3], '2026-10-01');
  assert.equal(grid[4][5], '2026-10-31');
  assert.equal(grid[4][6], '2026-11-01');
});

test('buildMonthGrid needs no padding when a month fills exactly four weeks', () => {
  // February 2027 starts on a Monday and has 28 days.
  const grid = buildMonthGrid({ year: 2027, month: 1 });
  assert.equal(grid.length, 4);
  assert.equal(grid[0][0], '2027-02-01');
  assert.equal(grid[3][6], '2027-02-28');
});

test('buildMonthGrid handles leap days, six-week months, and year boundaries', () => {
  const leapFebruary = buildMonthGrid({ year: 2028, month: 1 }).flat();
  assert.ok(leapFebruary.includes('2028-02-29'));

  // August 2026 starts on a Saturday, so its 31 days spill into six weeks.
  const august = buildMonthGrid({ year: 2026, month: 7 });
  assert.equal(august.length, 6);
  assert.equal(august[5][0], '2026-08-31');

  // January 2027 starts on a Friday: the first row reaches back into 2026.
  const january = buildMonthGrid({ year: 2027, month: 0 });
  assert.equal(january[0][0], '2026-12-28');
  assert.equal(january[0][4], '2027-01-01');
});

test('shiftMonth, getMonthOfIsoDate, and isDateInMonth navigate between months', () => {
  assert.deepEqual(shiftMonth({ year: 2026, month: 11 }, 1), { year: 2027, month: 0 });
  assert.deepEqual(shiftMonth({ year: 2027, month: 0 }, -1), { year: 2026, month: 11 });
  assert.deepEqual(shiftMonth({ year: 2026, month: 5 }, 0), { year: 2026, month: 5 });

  assert.deepEqual(getMonthOfIsoDate('2026-10-17'), { year: 2026, month: 9 });

  assert.equal(isDateInMonth('2026-10-17', { year: 2026, month: 9 }), true);
  assert.equal(isDateInMonth('2026-11-01', { year: 2026, month: 9 }), false);
  assert.equal(isDateInMonth('2027-10-17', { year: 2026, month: 9 }), false);

  assert.equal(formatMonthLabel({ year: 2026, month: 9 }), 'October 2026');
});

test('groupTodosByDueDate buckets tasks by date and skips undated ones', () => {
  let list = createTodo([], { title: 'No date' });
  list = createTodo(list, { title: 'Second on the 17th', dueDate: '2026-10-17' });
  list = createTodo(list, { title: 'On the 20th', dueDate: '2026-10-20' });
  list = createTodo(list, { title: 'First on the 17th', dueDate: '2026-10-17' });

  const grouped = groupTodosByDueDate(list);
  assert.equal(grouped.size, 2);
  assert.deepEqual(
    grouped.get('2026-10-17')?.map((t) => t.title),
    ['First on the 17th', 'Second on the 17th']
  );
  assert.equal(grouped.get('2026-10-20')?.length, 1);
  assert.equal(grouped.get('2026-10-18'), undefined);
});
