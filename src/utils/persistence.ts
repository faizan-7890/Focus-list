/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Versioned localStorage persistence for the task workspace.
 *
 * Why this exists: the app used to store a bare `TodoItem[]` under a single
 * key and `JSON.parse` it on boot with no shape checking. Any future change to
 * the task shape — or a single corrupt field written by a half-finished tab —
 * could throw on load and silently drop the user's entire workspace back to the
 * demo seed. This module wraps saved data in a `{ version, todos }` envelope,
 * runs ordered migrations when the on-disk version is older than the code, and
 * sanitizes every field so one bad value never discards good tasks.
 */

import {
  applyImportedTodos,
  normalizeCategory,
  normalizeDueDate,
  normalizePomodoros,
  normalizePriority,
  type Subtask,
  type TodoItem,
} from './todoLogic';

/** Current on-disk schema version. Bump this whenever the stored shape changes. */
export const SCHEMA_VERSION = 2;

/** Primary key holding the versioned envelope. */
export const STORAGE_KEY = 'focuslist_state_v2';

/** Legacy key: an unversioned bare `TodoItem[]`. Read once, then migrated. */
export const LEGACY_STORAGE_KEY = 'focuslist_todos_v1';

/** Where an unreadable payload is copied before it can be overwritten. */
export const CORRUPT_BACKUP_KEY = 'focuslist_state_v2_corrupt';

export interface PersistedState {
  version: number;
  todos: TodoItem[];
}

export interface LoadResult {
  todos: TodoItem[];
  /** How the data was recovered — useful for a one-time "migrated" notice/log. */
  source: 'current' | 'migrated-legacy' | 'migrated-version' | 'fallback';
  /** True when stored data existed but could not be read at all. */
  recoveredFromError: boolean;
}

/**
 * Coerce an unknown value into a safe TodoItem, or null if it has no usable
 * title. Every field is defended so a malformed entry can be dropped on its own
 * without taking the rest of the list down with it.
 */
export function sanitizeTodo(raw: unknown, index = 0): TodoItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const title = String(obj.title ?? '').trim();
  if (!title) return null;

  const subtasksRaw = Array.isArray(obj.subtasks) ? obj.subtasks : [];
  const subtasks: Subtask[] = subtasksRaw
    .map((st, sIdx): Subtask | null => {
      if (!st || typeof st !== 'object') return null;
      const stObj = st as Record<string, unknown>;
      const stTitle = String(stObj.title ?? '').trim();
      if (!stTitle) return null;
      return {
        id:
          typeof stObj.id === 'string' && stObj.id.trim()
            ? stObj.id.trim()
            : `sub_${index}_${sIdx}_${Math.random().toString(36).slice(2, 6)}`,
        title: stTitle,
        completed: Boolean(stObj.completed),
      };
    })
    .filter((st): st is Subtask => st !== null);

  return {
    id:
      typeof obj.id === 'string' && obj.id.trim()
        ? obj.id.trim()
        : `task_${index}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    notes: String(obj.notes ?? '').trim(),
    completed: Boolean(obj.completed),
    priority: normalizePriority(obj.priority),
    category: normalizeCategory(obj.category),
    dueDate: normalizeDueDate(obj.dueDate),
    createdAt:
      typeof obj.createdAt === 'number' && Number.isFinite(obj.createdAt)
        ? obj.createdAt
        : Date.now() + index,
    order: typeof obj.order === 'number' && Number.isFinite(obj.order) ? obj.order : index + 1,
    subtasks,
    completedPomodoros: normalizePomodoros(obj.completedPomodoros),
  };
}

/** Sanitize an unknown array into a clean TodoItem[], dropping bad entries. */
export function sanitizeTodos(raw: unknown): TodoItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, idx) => sanitizeTodo(entry, idx))
    .filter((t): t is TodoItem => t !== null);
}

/**
 * Ordered migrations. The key N transforms data from version N to version N+1.
 * Add a new entry whenever SCHEMA_VERSION is bumped; never edit an old one.
 */
const MIGRATIONS: Record<number, (todos: TodoItem[]) => TodoItem[]> = {
  // v1 -> v2: ensure every task carries a numeric completedPomodoros counter.
  1: (todos) =>
    todos.map((t) => ({
      ...t,
      completedPomodoros: normalizePomodoros(t.completedPomodoros),
    })),
};

/** Run migrations from `fromVersion` up to SCHEMA_VERSION. */
export function migrateTodos(todos: TodoItem[], fromVersion: number): TodoItem[] {
  let result = todos;
  for (let v = fromVersion; v < SCHEMA_VERSION; v += 1) {
    const migrate = MIGRATIONS[v];
    if (migrate) {
      result = migrate(result);
    }
  }
  return result;
}

/**
 * Parse a raw stored string (from the current key) into todos, handling both
 * the versioned envelope and a few tolerated legacy shapes. Returns null when
 * nothing usable could be recovered.
 */
export function parsePersistedState(
  rawJson: string
): { todos: TodoItem[]; version: number; rawCount: number } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }

  // Versioned envelope: { version, todos }
  if (
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    Array.isArray((parsed as PersistedState).todos)
  ) {
    const envelope = parsed as Partial<PersistedState>;
    const version =
      typeof envelope.version === 'number' && Number.isFinite(envelope.version)
        ? envelope.version
        : 1;
    return {
      todos: sanitizeTodos(envelope.todos),
      version,
      rawCount: (envelope.todos as unknown[]).length,
    };
  }

  // Tolerated legacy shape: a bare array written under the current key.
  if (Array.isArray(parsed)) {
    return { todos: sanitizeTodos(parsed), version: 1, rawCount: parsed.length };
  }

  return null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Access to localStorage can throw in sandboxed/third-party frames.
  }
  return null;
}

/**
 * Load the workspace. Tries, in order: the versioned key (migrating if older),
 * then the legacy bare-array key (migrating it forward and clearing it), then
 * the provided fallback (the demo seed). Never throws.
 */
export function loadTodos(
  fallback: () => TodoItem[],
  storage: StorageLike | null = getStorage()
): LoadResult {
  if (!storage) {
    return { todos: fallback(), source: 'fallback', recoveredFromError: false };
  }

  // 1. Current versioned key.
  let rawCurrent: string | null = null;
  try {
    rawCurrent = storage.getItem(STORAGE_KEY);
  } catch {
    rawCurrent = null;
  }

  if (rawCurrent) {
    const parsed = parsePersistedState(rawCurrent);
    // A stored list that was genuinely empty (the user cleared everything) is
    // valid state and must stay empty. A list that had entries but none
    // survived sanitizing is corruption, not an empty workspace.
    if (parsed && (parsed.todos.length > 0 || parsed.rawCount === 0)) {
      const current =
        parsed.version < SCHEMA_VERSION
          ? migrateTodos(parsed.todos, parsed.version)
          : parsed.todos;
      // The legacy key is only removed after a successful migration, so if it
      // is present now, a tab still running the old build wrote it after that.
      // Merge it in rather than ignoring (and later deleting) those edits.
      const legacy = tryLoadLegacy(storage);
      if (legacy) {
        return {
          todos: mergeTodos(current, legacy.todos),
          source: 'migrated-legacy',
          recoveredFromError: false,
        };
      }
      return {
        todos: current,
        source: parsed.version < SCHEMA_VERSION ? 'migrated-version' : 'current',
        recoveredFromError: false,
      };
    }
    // Stored data existed but was unreadable. Keep a copy of the raw bytes
    // before the next save overwrites them, then try the legacy key.
    try {
      storage.setItem(CORRUPT_BACKUP_KEY, rawCurrent);
    } catch {
      // Best effort; nothing else can be done here.
    }
    const legacy = tryLoadLegacy(storage);
    if (legacy) return { ...legacy, recoveredFromError: true };
    return { todos: fallback(), source: 'fallback', recoveredFromError: true };
  }

  // 2. Legacy unversioned key.
  const legacy = tryLoadLegacy(storage);
  if (legacy) return legacy;

  // 3. Nothing stored — seed.
  return { todos: fallback(), source: 'fallback', recoveredFromError: false };
}

function tryLoadLegacy(storage: StorageLike): LoadResult | null {
  let rawLegacy: string | null = null;
  try {
    rawLegacy = storage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!rawLegacy) return null;

  const parsed = parsePersistedState(rawLegacy);
  if (!parsed) return null;
  // A legacy list that was genuinely empty means the user cleared everything;
  // keep it empty instead of re-seeding the demo tasks.
  if (parsed.todos.length === 0) {
    if (parsed.rawCount !== 0) return null;
    return { todos: [], source: 'migrated-legacy', recoveredFromError: false };
  }

  const migrated = migrateTodos(parsed.todos, parsed.version);
  return { todos: migrated, source: 'migrated-legacy', recoveredFromError: false };
}

/**
 * Merge `incoming` tasks into `base`: tasks with a matching id take the
 * incoming version, new ones are added. Nothing in `base` is dropped.
 */
export function mergeTodos(base: TodoItem[], incoming: TodoItem[]): TodoItem[] {
  return applyImportedTodos(base, incoming, 'merge');
}

/**
 * Persist the workspace under the versioned key. Never throws; returns false
 * when the write failed (for example over quota), so callers must not discard
 * any other copy of the data on the strength of this save.
 */
export function saveTodos(
  todos: TodoItem[],
  storage: StorageLike | null = getStorage()
): boolean {
  if (!storage) return false;
  try {
    const envelope: PersistedState = { version: SCHEMA_VERSION, todos };
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/** Remove the legacy key once its data has been carried forward. */
export function clearLegacyStorage(
  storage: StorageLike | null = getStorage()
): void {
  if (!storage) return;
  try {
    storage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}
