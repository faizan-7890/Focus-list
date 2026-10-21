import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTodo,
  toggleTodo,
  updateTodo,
  deleteTodo,
  incrementPomodoro,
  clearCompletedTodos,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  filterAndSortTodos,
  computeTodoStats,
  formatDueDateLabel,
  moveTodoOrder,
  formatTimerDisplay,
  getTomorrowIsoDate,
  exportTodosToJson,
  exportTodosToCsv,
  parseImportedTasks,
  applyImportedTodos,
  type TodoItem,
} from './todoLogic.ts';

const TODAY = '2026-10-17';

test('createTodo adds a valid task to the top of the list and ignores blank input', () => {
  const initial: TodoItem[] = [];
  const afterEmpty = createTodo(initial, { title: '   ' });
  assert.equal(afterEmpty.length, 0);

  const afterFirst = createTodo(initial, {
    title: '  Buy milk  ',
    priority: 'high',
    category: 'Errands',
    dueDate: TODAY,
  });
  assert.equal(afterFirst.length, 1);
  assert.equal(afterFirst[0].title, 'Buy milk');
  assert.equal(afterFirst[0].priority, 'high');
  assert.equal(afterFirst[0].category, 'Errands');
  assert.equal(afterFirst[0].completed, false);

  const afterSecond = createTodo(afterFirst, {
    title: 'Write unit tests',
    priority: 'medium',
    category: 'Work',
  });
  assert.equal(afterSecond.length, 2);
  assert.equal(afterSecond[0].title, 'Write unit tests');
  assert.ok(afterSecond[0].order < afterSecond[1].order);
});

test('toggleTodo, updateTodo, deleteTodo, and clearCompletedTodos manage task lifecycle', () => {
  let list = createTodo([], { title: 'Task A', priority: 'low' });
  list = createTodo(list, { title: 'Task B', priority: 'high' });

  const idB = list[0].id;
  const idA = list[1].id;

  // Toggle Task B completed
  list = toggleTodo(list, idB);
  assert.equal(list.find((t) => t.id === idB)?.completed, true);

  // Update Task A title and priority
  list = updateTodo(list, idA, {
    title: '  Task A Updated ',
    priority: 'high',
    notes: 'Detailed note',
  });
  const updatedA = list.find((t) => t.id === idA)!;
  assert.equal(updatedA.title, 'Task A Updated');
  assert.equal(updatedA.priority, 'high');
  assert.equal(updatedA.notes, 'Detailed note');

  // Empty title update is ignored
  list = updateTodo(list, idA, { title: '   ' });
  assert.equal(list.find((t) => t.id === idA)?.title, 'Task A Updated');

  // Clear completed removes Task B
  list = clearCompletedTodos(list);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, idA);

  // Delete removes Task A
  list = deleteTodo(list, idA);
  assert.equal(list.length, 0);
});

test('incrementPomodoro tracks focus session count accurately', () => {
  let list = createTodo([], { title: 'Deep work target' });
  const id = list[0].id;
  assert.equal(list[0].completedPomodoros, 0);

  list = incrementPomodoro(list, id);
  assert.equal(list[0].completedPomodoros, 1);

  list = incrementPomodoro(list, id);
  assert.equal(list[0].completedPomodoros, 2);
});

test('subtask operations add, toggle, and delete subtasks cleanly', () => {
  let list = createTodo([], { title: 'Parent task' });
  const taskId = list[0].id;

  list = addSubtask(list, taskId, '  First step ');
  list = addSubtask(list, taskId, 'Second step');
  assert.equal(list[0].subtasks.length, 2);
  assert.equal(list[0].subtasks[0].title, 'First step');

  const subId = list[0].subtasks[0].id;
  list = toggleSubtask(list, taskId, subId);
  assert.equal(list[0].subtasks[0].completed, true);

  list = deleteSubtask(list, taskId, subId);
  assert.equal(list[0].subtasks.length, 1);
  assert.equal(list[0].subtasks[0].title, 'Second step');
});

test('filterAndSortTodos filters by status, view, search query, and sorts accurately', () => {
  let list: TodoItem[] = [];
  list = createTodo(list, {
    title: 'Charlie low task',
    priority: 'low',
    category: 'Personal',
    dueDate: '2026-10-20',
  });
  list = createTodo(list, {
    title: 'Alpha high task',
    priority: 'high',
    category: 'Work',
    dueDate: TODAY,
  });
  list = createTodo(list, {
    title: 'Bravo medium task',
    priority: 'medium',
    category: 'Work',
    dueDate: '2026-10-18',
    notes: 'Contains keyword espresso',
  });

  // Mark Charlie completed
  const charlieId = list.find((t) => t.title.startsWith('Charlie'))!.id;
  list = toggleTodo(list, charlieId);

  // Filter active only
  const activeOnly = filterAndSortTodos(list, {
    status: 'active',
    view: 'all',
    searchQuery: '',
    sortBy: 'manual',
    todayDate: TODAY,
  });
  assert.equal(activeOnly.length, 2);

  // Filter today view
  const todayTasks = filterAndSortTodos(list, {
    status: 'all',
    view: 'today',
    searchQuery: '',
    sortBy: 'manual',
    todayDate: TODAY,
  });
  assert.equal(todayTasks.length, 1);
  assert.equal(todayTasks[0].title, 'Alpha high task');

  // Search query matches notes
  const searchMatch = filterAndSortTodos(list, {
    status: 'all',
    view: 'all',
    searchQuery: 'ESPRESSO',
    sortBy: 'manual',
    todayDate: TODAY,
  });
  assert.equal(searchMatch.length, 1);
  assert.equal(searchMatch[0].title, 'Bravo medium task');

  // Sort by priority
  const byPriority = filterAndSortTodos(list, {
    status: 'all',
    view: 'all',
    searchQuery: '',
    sortBy: 'priority',
    todayDate: TODAY,
  });
  assert.deepEqual(
    byPriority.map((t) => t.priority),
    ['high', 'medium', 'low']
  );

  // Sort alphabetically
  const byAlpha = filterAndSortTodos(list, {
    status: 'all',
    view: 'all',
    searchQuery: '',
    sortBy: 'alphabetical',
    todayDate: TODAY,
  });
  assert.deepEqual(
    byAlpha.map((t) => t.title),
    ['Alpha high task', 'Bravo medium task', 'Charlie low task']
  );
});

test('computeTodoStats and formatDueDateLabel return accurate metrics', () => {
  let list: TodoItem[] = [];
  list = createTodo(list, {
    title: 'Overdue high task',
    priority: 'high',
    category: 'Work',
    dueDate: '2026-10-15',
  });
  list = createTodo(list, {
    title: 'Today personal task',
    priority: 'medium',
    category: 'Personal',
    dueDate: TODAY,
  });
  list = toggleTodo(list, list[0].id); // complete Today personal task

  const stats = computeTodoStats(list, TODAY);
  assert.equal(stats.total, 2);
  assert.equal(stats.completed, 1);
  assert.equal(stats.active, 1);
  assert.equal(stats.completionRate, 50);
  assert.equal(stats.overdue, 1);
  assert.equal(stats.dueTodayOrOverdue, 1);
  assert.equal(stats.scheduledActive, 0);
  assert.equal(stats.highPriorityActive, 1);
  assert.equal(stats.byCategory.Work, 1);
  assert.equal(stats.byCategory.Personal, 0);

  const todayFmt = formatDueDateLabel(TODAY, TODAY);
  assert.equal(todayFmt.label, 'Due Today');
  assert.equal(todayFmt.isToday, true);

  const overdueFmt = formatDueDateLabel('2026-10-10', TODAY);
  assert.equal(overdueFmt.isOverdue, true);
});

test('moveTodoOrder swaps manual order of adjacent items', () => {
  let list = createTodo([], { title: 'First' });
  list = createTodo(list, { title: 'Second' }); // Second is at top (index 0)
  const secondId = list[0].id;

  const moved = moveTodoOrder(list, secondId, 'down');
  assert.equal(moved[1].id, secondId);
});

test('formatTimerDisplay and getTomorrowIsoDate format accurately', () => {
  assert.equal(formatTimerDisplay(1500), '25:00');
  assert.equal(formatTimerDisplay(65), '01:05');
  assert.equal(formatTimerDisplay(0), '00:00');
  assert.equal(getTomorrowIsoDate('2026-10-17'), '2026-10-18');
});

test('JSON and CSV export and import round-trip tasks, subtasks, and handle merge vs replace', () => {
  let list = createTodo([], {
    title: 'Prepare board deck, Q4',
    notes: 'Include revenue & retention charts',
    priority: 'high',
    category: 'Work',
    dueDate: TODAY,
    subtasks: [
      { title: 'Draft executive summary', completed: true },
      { title: 'Verify ARR table', completed: false },
    ],
  });

  // 1. JSON round-trip
  const jsonStr = exportTodosToJson(list);
  const parsedJson = parseImportedTasks(jsonStr, 'json');
  assert.equal(parsedJson.errors.length, 0);
  assert.equal(parsedJson.validTodos.length, 1);
  assert.equal(parsedJson.validTodos[0].title, 'Prepare board deck, Q4');
  assert.equal(parsedJson.totalSubtasks, 2);
  assert.equal(parsedJson.validTodos[0].subtasks[0].completed, true);

  // 2. CSV round-trip (with commas in title and pipe-encoded subtasks)
  const csvStr = exportTodosToCsv(list);
  const parsedCsv = parseImportedTasks(csvStr, 'csv');
  assert.equal(parsedCsv.errors.length, 0);
  assert.equal(parsedCsv.validTodos.length, 1);
  assert.equal(parsedCsv.validTodos[0].title, 'Prepare board deck, Q4');
  assert.equal(parsedCsv.validTodos[0].priority, 'high');
  assert.equal(parsedCsv.validTodos[0].category, 'Work');
  assert.equal(parsedCsv.totalSubtasks, 2);
  assert.equal(
    parsedCsv.validTodos[0].subtasks[0].title,
    'Draft executive summary'
  );
  assert.equal(parsedCsv.validTodos[0].subtasks[0].completed, true);

  // 3. Merge vs Replace mode
  const newImport = createTodo([], {
    title: 'Imported study task',
    priority: 'low',
    category: 'Study',
  });
  const merged = applyImportedTodos(list, newImport, 'merge');
  assert.equal(merged.length, 2);
  assert.equal(merged[0].title, 'Imported study task');

  const replaced = applyImportedTodos(list, newImport, 'replace');
  assert.equal(replaced.length, 1);
  assert.equal(replaced[0].title, 'Imported study task');

  // 4. Validation error reporting on malformed CSV row
  const badCsv = 'Title,Status,Priority\n,active,high\nValid Task,completed,low';
  const parsedWithError = parseImportedTasks(badCsv, 'csv');
  assert.equal(parsedWithError.validTodos.length, 1);
  assert.equal(parsedWithError.errors.length, 1);
  assert.ok(parsedWithError.errors[0].includes('Row 2'));
});
