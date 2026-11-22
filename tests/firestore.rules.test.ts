/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Security-rules tests. Run with `npm run test:rules`, which starts the
// Firestore emulator and runs this file against it.

import test, { after, before, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-focuslist';
let env: RulesTestEnvironment;

const validTodo = (id = 'task_1') => ({
  id,
  title: 'Ship release',
  notes: '',
  completed: false,
  priority: 'medium',
  category: 'Work',
  dueDate: '2026-11-22',
  createdAt: 1700000000000,
  order: 1,
  subtasks: [{ id: 'sub_1', title: 'Write notes', completed: false }],
  completedPomodoros: 0,
});

const aliceDb = () => env.authenticatedContext('alice').firestore();
const aliceTodo = (id = 'task_1') => doc(aliceDb(), 'users', 'alice', 'todos', id);

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

after(async () => {
  await env.cleanup();
});

test('owner can create, read, update and delete their own task', async () => {
  await assertSucceeds(setDoc(aliceTodo(), validTodo()));
  await assertSucceeds(getDoc(aliceTodo()));
  await assertSucceeds(updateDoc(aliceTodo(), { completed: true }));
  await assertSucceeds(deleteDoc(aliceTodo()));
});

test('another signed-in user cannot read or write the task', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice', 'todos', 'task_1'), validTodo());
  });
  const bob = env.authenticatedContext('bob').firestore();
  const target = doc(bob, 'users', 'alice', 'todos', 'task_1');
  await assertFails(getDoc(target));
  await assertFails(setDoc(target, validTodo()));
  await assertFails(deleteDoc(target));
});

test('signed-out clients are denied', async () => {
  const anon = env.unauthenticatedContext().firestore();
  const target = doc(anon, 'users', 'alice', 'todos', 'task_1');
  await assertFails(getDoc(target));
  await assertFails(setDoc(target, validTodo()));
});

test('everything outside users/{uid}/todos is denied', async () => {
  await assertFails(setDoc(doc(aliceDb(), 'users', 'alice'), { name: 'Alice' }));
  await assertFails(setDoc(doc(aliceDb(), 'other', 'x'), { a: 1 }));
});

test('document id must match the task id', async () => {
  await assertFails(setDoc(aliceTodo('task_1'), validTodo('task_2')));
});

test('rejects unknown fields and missing fields', async () => {
  await assertFails(setDoc(aliceTodo(), { ...validTodo(), isAdmin: true }));
  const { notes: _omit, ...missingNotes } = validTodo();
  await assertFails(setDoc(aliceTodo(), missingNotes));
});

test('rejects invalid field values', async () => {
  const bad: Array<Record<string, unknown>> = [
    { title: '' },
    { title: 'x'.repeat(501) },
    { notes: 'x'.repeat(10001) },
    { priority: 'urgent' },
    { category: 'Hobbies' },
    { completed: 'yes' },
    { dueDate: '22/11/2026' },
    { completedPomodoros: -1 },
    { completedPomodoros: 1.5 },
    { order: 'first' },
    { subtasks: 'none' },
    { subtasks: Array.from({ length: 201 }, (_, i) => ({ id: `s${i}`, title: 't', completed: false })) },
  ];
  for (const overrides of bad) {
    await assertFails(setDoc(aliceTodo(), { ...validTodo(), ...overrides }));
  }
});

test('accepts an empty due date and negative order (new tasks sort first)', async () => {
  await assertSucceeds(setDoc(aliceTodo(), { ...validTodo(), dueDate: '', order: -3 }));
});

test('an update that breaks the shape is rejected', async () => {
  await assertSucceeds(setDoc(aliceTodo(), validTodo()));
  await assertFails(updateDoc(aliceTodo(), { priority: 'critical' }));
});
