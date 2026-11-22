/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure helpers for syncing the in-memory task list with Firestore.
 *
 * The app keeps one Firestore document per task. Rather than rewriting every
 * mutation handler, the sync hook compares each new local list with the last
 * list it knows Firestore has, and writes only what changed.
 */

import { sanitizeTodo } from './persistence';
import type { TodoItem } from './todoLogic';

export interface TodoDiff {
  /** Tasks that are new or whose content changed: written with `set`. */
  upserts: TodoItem[];
  /** Ids of tasks that no longer exist locally: deleted. */
  deletes: string[];
}

/**
 * Normalize a task into the exact shape stored in Firestore. Sanitizing also
 * guarantees there are no `undefined` fields, which Firestore rejects.
 */
export function toStoredTodo(todo: TodoItem, index = 0): TodoItem | null {
  return sanitizeTodo(todo, index);
}

/**
 * Stable serialization for change detection: keys in a fixed order, so two
 * tasks with the same content always compare equal regardless of key order.
 */
export function serializeTodo(todo: TodoItem): string {
  return JSON.stringify([
    todo.id,
    todo.title,
    todo.notes,
    todo.completed,
    todo.priority,
    todo.category,
    todo.dueDate,
    todo.createdAt,
    todo.order,
    todo.completedPomodoros ?? 0,
    todo.subtasks.map((st) => [st.id, st.title, st.completed]),
  ]);
}

/**
 * Compare the last-synced tasks with the new local list.
 *
 * `synced` maps id -> the task as Firestore last reported it. Tasks without a
 * usable title (which sanitizing would reject) are skipped rather than
 * written, and duplicate ids keep the first occurrence.
 */
export function diffTodos(
  synced: ReadonlyMap<string, TodoItem>,
  next: readonly TodoItem[]
): TodoDiff {
  const upserts: TodoItem[] = [];
  const seen = new Set<string>();

  next.forEach((todo, index) => {
    if (seen.has(todo.id)) return;
    seen.add(todo.id);
    const stored = toStoredTodo(todo, index);
    if (!stored || stored.id !== todo.id) return;
    const previous = synced.get(todo.id);
    if (!previous || serializeTodo(previous) !== serializeTodo(stored)) {
      upserts.push(stored);
    }
  });

  const deletes: string[] = [];
  synced.forEach((_value, id) => {
    if (!seen.has(id)) deletes.push(id);
  });

  return { upserts, deletes };
}

/** Split `items` into consecutive groups of at most `size`. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) throw new Error('chunk size must be positive');
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

/** Firestore allows 500 writes per batch; stay safely under it. */
export const MAX_BATCH_WRITES = 450;

/** Order tasks the way the app expects (ascending `order`, then createdAt). */
export function sortByOrder(todos: TodoItem[]): TodoItem[] {
  return [...todos].sort(
    (a, b) => a.order - b.order || a.createdAt - b.createdAt
  );
}
