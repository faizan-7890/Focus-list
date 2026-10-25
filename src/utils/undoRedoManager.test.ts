import test from 'node:test';
import assert from 'node:assert/strict';
import { UndoRedoManager } from './undoRedoManager.ts';
import type { TodoItem } from './todoLogic.ts';
import { cloneTodoList } from '../hooks/useUndoRedo.ts';

const createSampleTodo = (id: string, title: string): TodoItem => ({
  id,
  title,
  notes: '',
  completed: false,
  priority: 'medium',
  category: 'Work',
  dueDate: '2026-10-26',
  createdAt: 1761400000000,
  order: 1,
  subtasks: [{ id: 'sub-1', title: 'Step 1', completed: false }],
});

test('UndoRedoManager manages undo and redo lifecycle correctly', () => {
  const manager = new UndoRedoManager<TodoItem[]>(cloneTodoList, 20);

  assert.equal(manager.canUndo(), false);
  assert.equal(manager.canRedo(), false);
  assert.equal(manager.getLastUndoLabel(), null);

  const state0: TodoItem[] = [createSampleTodo('1', 'Task 1')];
  const state1: TodoItem[] = [
    createSampleTodo('1', 'Task 1'),
    createSampleTodo('2', 'Task 2'),
  ];

  // Action: Add Task 2
  manager.push("Added 'Task 2'", state0);
  assert.equal(manager.canUndo(), true);
  assert.equal(manager.canRedo(), false);
  assert.equal(manager.getLastUndoLabel(), "Added 'Task 2'");

  // Undo: should return state0
  const undoResult = manager.undo(state1);
  assert.ok(undoResult);
  assert.equal(undoResult.label, "Added 'Task 2'");
  assert.equal(undoResult.state.length, 1);
  assert.equal(undoResult.state[0].title, 'Task 1');
  assert.equal(manager.canUndo(), false);
  assert.equal(manager.canRedo(), true);

  // Redo: should return state1
  const redoResult = manager.redo(undoResult.state);
  assert.ok(redoResult);
  assert.equal(redoResult.label, "Added 'Task 2'");
  assert.equal(redoResult.state.length, 2);
  assert.equal(manager.canUndo(), true);
  assert.equal(manager.canRedo(), false);
});

test('UndoRedoManager clears redo branch when a new action is pushed', () => {
  const manager = new UndoRedoManager<TodoItem[]>(cloneTodoList, 20);

  const state0: TodoItem[] = [createSampleTodo('1', 'Task 1')];
  const state1: TodoItem[] = [
    createSampleTodo('1', 'Task 1'),
    createSampleTodo('2', 'Task 2'),
  ];

  manager.push("Added 'Task 2'", state0);
  manager.undo(state1);
  assert.equal(manager.canRedo(), true);

  // New action after undo invalidates redo stack
  const state2: TodoItem[] = [
    createSampleTodo('1', 'Task 1'),
    createSampleTodo('3', 'Task 3'),
  ];
  manager.push("Added 'Task 3'", state0);
  assert.equal(manager.canRedo(), false);
  assert.equal(manager.canUndo(), true);
  assert.equal(manager.getLastUndoLabel(), "Added 'Task 3'");
});

test('UndoRedoManager caps history size at maxHistory', () => {
  const max = 5;
  const manager = new UndoRedoManager<number[]>(
    (arr) => [...arr],
    max
  );

  for (let i = 0; i < 10; i++) {
    manager.push(`Action ${i}`, [i]);
  }

  // Can only undo 5 times
  let current = [99];
  let undoCount = 0;
  while (manager.canUndo()) {
    const res = manager.undo(current);
    assert.ok(res);
    current = res.state;
    undoCount++;
  }

  assert.equal(undoCount, max);
  assert.equal(manager.undo(current), null);
});

test('UndoRedoManager deep clones snapshots to isolate mutations', () => {
  const manager = new UndoRedoManager<TodoItem[]>(cloneTodoList, 20);
  const state: TodoItem[] = [createSampleTodo('1', 'Original Task')];

  manager.push('Initial Task', state);

  // Mutate original state array and subtask
  state[0].title = 'Mutated Task';
  state[0].subtasks[0].completed = true;

  const undoResult = manager.undo([]);
  assert.ok(undoResult);
  assert.equal(undoResult.state[0].title, 'Original Task');
  assert.equal(undoResult.state[0].subtasks[0].completed, false);
});

test('UndoRedoManager clear resets history stacks', () => {
  const manager = new UndoRedoManager<string[]>((s) => [...s], 10);
  manager.push('Step 1', ['a']);
  manager.push('Step 2', ['b']);

  assert.equal(manager.canUndo(), true);
  manager.clear();
  assert.equal(manager.canUndo(), false);
  assert.equal(manager.canRedo(), false);
  assert.equal(manager.getLastUndoLabel(), null);
});
