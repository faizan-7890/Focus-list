/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { loadTodos, mergeTodos } from '../utils/persistence';
import { getInitialDemoTodos, type TodoItem } from '../utils/todoLogic';

export const localImportFlagKey = (uid: string) => `focuslist_local_imported_${uid}`;

function readFlag(uid: string): boolean {
  try {
    return window.localStorage.getItem(localImportFlagKey(uid)) === '1';
  } catch {
    return false;
  }
}

function writeFlag(uid: string): void {
  try {
    window.localStorage.setItem(localImportFlagKey(uid), '1');
  } catch {
    // Non-fatal: worst case the offer is shown again next time.
  }
}

export interface PendingLocalImport {
  /** How many browser tasks are not yet in the account. */
  count: number;
  merge: () => void;
  dismiss: () => void;
}

interface UseLocalImportOptions {
  uid: string;
  todos: TodoItem[];
  setTodos: Dispatch<SetStateAction<TodoItem[]>>;
  /** Only decide once the server has answered, never from an empty cache. */
  serverSynced: boolean;
  todayDate: string;
  notify: (message: string) => void;
}

/**
 * Runs once per account on this device, after the first server snapshot:
 *
 * - Empty account + tasks saved in this browser (the pre-sync localStorage
 *   data) -> upload them and say so.
 * - Empty account + nothing in this browser -> seed the demo tasks. Their ids
 *   are fixed, so two devices seeding at once write the same documents.
 * - Account already has tasks + this browser has others -> offer to add the
 *   missing ones (returned as `pending` for the app to show).
 *
 * The browser's localStorage copy is left untouched as a backup.
 */
export function useLocalImport({
  uid,
  todos,
  setTodos,
  serverSynced,
  todayDate,
  notify,
}: UseLocalImportOptions): PendingLocalImport | null {
  const [pending, setPending] = useState<PendingLocalImport | null>(null);
  const ranRef = useRef(false);

  const finish = useCallback(() => {
    writeFlag(uid);
    setPending(null);
  }, [uid]);

  useEffect(() => {
    if (!serverSynced || ranRef.current) return;
    ranRef.current = true;
    if (readFlag(uid)) return;

    const local = loadTodos(() => []).todos;

    if (todos.length === 0) {
      if (local.length > 0) {
        setTodos(local);
        notify(
          `Imported ${local.length} ${local.length === 1 ? 'task' : 'tasks'} from this browser.`
        );
      } else {
        setTodos(getInitialDemoTodos(todayDate));
      }
      writeFlag(uid);
      return;
    }

    const accountIds = new Set(todos.map((t) => t.id));
    const missing = local.filter((t) => !accountIds.has(t.id));
    if (missing.length === 0) {
      writeFlag(uid);
      return;
    }

    setPending({
      count: missing.length,
      merge: () => {
        // Only add tasks the account doesn't have; never overwrite its
        // (possibly newer) versions with this browser's copies.
        setTodos((prev) => {
          const ids = new Set(prev.map((t) => t.id));
          return mergeTodos(prev, missing.filter((t) => !ids.has(t.id)));
        });
        notify(
          `Added ${missing.length} ${missing.length === 1 ? 'task' : 'tasks'} from this browser.`
        );
        finish();
      },
      dismiss: finish,
    });
    // Decide exactly once, from the state at the first server snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSynced]);

  return pending;
}
