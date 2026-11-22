/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { chunk, diffTodos, serializeTodo, sortByOrder } from './syncLogic.ts';
import type { TodoItem } from './todoLogic.ts';

const todo = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  id: 'a',
  title: 'Task',
  notes: '',
  completed: false,
  priority: 'medium',
  category: 'Work',
  dueDate: '',
  createdAt: 1,
  order: 1,
  subtasks: [],
  completedPomodoros: 0,
  ...overrides,
});

const mapOf = (...items: TodoItem[]) => new Map(items.map((t) => [t.id, t]));

test('diffTodos reports nothing when the lists match', () => {
  const a = todo({ id: 'a' });
  const b = todo({ id: 'b', order: 2 });
  assert.deepEqual(diffTodos(mapOf(a, b), [a, b]), { upserts: [], deletes: [] });
});

test('diffTodos ignores key order and an absent pomodoro count', () => {
  const synced = todo({ completedPomodoros: 0 });
  const local = { ...todo(), completedPomodoros: undefined };
  assert.deepEqual(diffTodos(mapOf(synced), [local]), { upserts: [], deletes: [] });
});

test('diffTodos upserts new and changed tasks only', () => {
  const a = todo({ id: 'a' });
  const b = todo({ id: 'b' });
  const result = diffTodos(mapOf(a, b), [
    a,
    { ...b, completed: true },
    todo({ id: 'c', title: 'New' }),
  ]);
  assert.deepEqual(result.upserts.map((t) => t.id), ['b', 'c']);
  assert.deepEqual(result.deletes, []);
});

test('diffTodos detects subtask changes', () => {
  const a = todo({ subtasks: [{ id: 's1', title: 'Step', completed: false }] });
  const changed = { ...a, subtasks: [{ id: 's1', title: 'Step', completed: true }] };
  assert.deepEqual(diffTodos(mapOf(a), [changed]).upserts.map((t) => t.id), ['a']);
});

test('diffTodos deletes tasks missing from the new list', () => {
  const a = todo({ id: 'a' });
  const b = todo({ id: 'b' });
  assert.deepEqual(diffTodos(mapOf(a, b), [a]), { upserts: [], deletes: ['b'] });
});

test('diffTodos with an empty list deletes everything (callers must guard hydration)', () => {
  const a = todo({ id: 'a' });
  assert.deepEqual(diffTodos(mapOf(a), []).deletes, ['a']);
});

test('diffTodos writes sanitized data and skips untitled tasks', () => {
  const result = diffTodos(new Map(), [
    todo({ id: 'a', title: '  Padded  ', priority: 'urgent' as never }),
    todo({ id: 'b', title: '   ' }),
  ]);
  assert.equal(result.upserts.length, 1);
  assert.equal(result.upserts[0].title, 'Padded');
  assert.equal(result.upserts[0].priority, 'medium');
});

test('diffTodos keeps the first of duplicate ids', () => {
  const result = diffTodos(new Map(), [
    todo({ id: 'a', title: 'First' }),
    todo({ id: 'a', title: 'Second' }),
  ]);
  assert.deepEqual(result.upserts.map((t) => t.title), ['First']);
});

test('serializeTodo is stable for equal content', () => {
  assert.equal(serializeTodo(todo()), serializeTodo({ ...todo() }));
  assert.notEqual(serializeTodo(todo()), serializeTodo(todo({ order: 2 })));
});

test('chunk splits into groups of at most the given size', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 3), []);
  assert.throws(() => chunk([1], 0));
});

test('sortByOrder sorts by order then createdAt without mutating', () => {
  const input = [
    todo({ id: 'c', order: 2, createdAt: 1 }),
    todo({ id: 'b', order: 1, createdAt: 5 }),
    todo({ id: 'a', order: 1, createdAt: 3 }),
  ];
  assert.deepEqual(sortByOrder(input).map((t) => t.id), ['a', 'b', 'c']);
  assert.equal(input[0].id, 'c');
});
