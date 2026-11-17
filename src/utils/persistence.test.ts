/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA_VERSION,
  migrateTodos,
  parsePersistedState,
  sanitizeTodo,
  sanitizeTodos,
} from './persistence.ts';
import type { TodoItem } from './todoLogic.ts';

const baseTodo = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  id: 'task_1',
  title: 'Ship release',
  notes: '',
  completed: false,
  priority: 'medium',
  category: 'Work',
  dueDate: '',
  createdAt: 1700000000000,
  order: 1,
  subtasks: [],
  completedPomodoros: 0,
  ...overrides,
});

test('sanitizeTodo coerces a well-formed object', () => {
  const result = sanitizeTodo(baseTodo({ title: '  Trim me  ' }));
  assert.ok(result);
  assert.equal(result?.title, 'Trim me');
  assert.equal(result?.priority, 'medium');
  assert.equal(result?.category, 'Work');
});

test('sanitizeTodo drops entries with no title', () => {
  assert.equal(sanitizeTodo({ title: '   ' }), null);
  assert.equal(sanitizeTodo({}), null);
  assert.equal(sanitizeTodo(null), null);
  assert.equal(sanitizeTodo('not an object'), null);
});

test('sanitizeTodo repairs invalid field values instead of discarding the task', () => {
  const result = sanitizeTodo({
    title: 'Partial',
    priority: 'URGENT', // invalid -> medium
    category: 'Nonsense', // invalid -> Work
    dueDate: 'not-a-date', // invalid -> ''
    completedPomodoros: -4, // invalid -> 0
    createdAt: 'yesterday', // invalid -> replaced with a number
    order: Number.NaN, // invalid -> index-based
    subtasks: [{ title: 'ok' }, { title: '' }, 42, null],
  });
  assert.ok(result);
  assert.equal(result?.priority, 'medium');
  assert.equal(result?.category, 'Work');
  assert.equal(result?.dueDate, '');
  assert.equal(result?.completedPomodoros, 0);
  assert.equal(typeof result?.createdAt, 'number');
  assert.ok(Number.isFinite(result?.order));
  // Only the one valid subtask survives.
  assert.equal(result?.subtasks.length, 1);
  assert.equal(result?.subtasks[0].title, 'ok');
});

test('sanitizeTodos keeps good entries and drops bad ones', () => {
  const cleaned = sanitizeTodos([
    baseTodo({ id: 'a', title: 'Keep A' }),
    { title: '' }, // dropped
    baseTodo({ id: 'b', title: 'Keep B' }),
    null, // dropped
  ]);
  assert.equal(cleaned.length, 2);
  assert.deepEqual(
    cleaned.map((t) => t.title),
    ['Keep A', 'Keep B']
  );
});

test('sanitizeTodos returns [] for non-arrays', () => {
  assert.deepEqual(sanitizeTodos(null), []);
  assert.deepEqual(sanitizeTodos({ todos: [] }), []);
  assert.deepEqual(sanitizeTodos('oops'), []);
});

test('parsePersistedState reads a versioned envelope', () => {
  const json = JSON.stringify({
    version: SCHEMA_VERSION,
    todos: [baseTodo({ title: 'Enveloped' })],
  });
  const result = parsePersistedState(json);
  assert.ok(result);
  assert.equal(result?.version, SCHEMA_VERSION);
  assert.equal(result?.todos[0].title, 'Enveloped');
});

test('parsePersistedState tolerates a bare legacy array as version 1', () => {
  const json = JSON.stringify([baseTodo({ title: 'Legacy array' })]);
  const result = parsePersistedState(json);
  assert.ok(result);
  assert.equal(result?.version, 1);
  assert.equal(result?.todos[0].title, 'Legacy array');
});

test('parsePersistedState defaults a missing version to 1', () => {
  const json = JSON.stringify({ todos: [baseTodo()] });
  const result = parsePersistedState(json);
  assert.equal(result?.version, 1);
});

test('parsePersistedState returns null for corrupt JSON', () => {
  assert.equal(parsePersistedState('{not json'), null);
  assert.equal(parsePersistedState(''), null);
});

test('parsePersistedState returns null for a non-task payload', () => {
  assert.equal(parsePersistedState(JSON.stringify({ hello: 'world' })), null);
  assert.equal(parsePersistedState(JSON.stringify(42)), null);
});

test('migrateTodos v1 -> current backfills completedPomodoros', () => {
  const legacy = [baseTodo()];
  // Simulate a v1 record missing the field entirely.
  delete (legacy[0] as Partial<TodoItem>).completedPomodoros;
  const migrated = migrateTodos(legacy, 1);
  assert.equal(migrated[0].completedPomodoros, 0);
});

test('migrateTodos is a no-op when already current', () => {
  const todos = [baseTodo({ completedPomodoros: 5 })];
  const migrated = migrateTodos(todos, SCHEMA_VERSION);
  assert.equal(migrated[0].completedPomodoros, 5);
});
