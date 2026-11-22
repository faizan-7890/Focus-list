/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeTodos } from '../utils/persistence';
import { MAX_BATCH_WRITES, chunk, diffTodos, sortByOrder } from '../utils/syncLogic';
import type { TodoItem } from '../utils/todoLogic';

export type SyncStatus = 'loading' | 'ready' | 'error';

export interface UseFirestoreTodosResult {
  todos: TodoItem[];
  /** Same contract as React's setState; changes are written to Firestore. */
  setTodos: Dispatch<SetStateAction<TodoItem[]>>;
  status: SyncStatus;
  /** True once a snapshot has come from the server, not only the local cache. */
  serverSynced: boolean;
  /** The most recent listener or write failure; `id` changes on every new one. */
  error: SyncError | null;
}

export interface SyncError {
  id: number;
  message: string;
}

function describeFirestoreError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'permission-denied') {
    return "Couldn't save: your account doesn't have access to these tasks.";
  }
  if (code === 'resource-exhausted') {
    return "Couldn't save: the database quota has been reached.";
  }
  return "Couldn't sync tasks. Changes will retry when possible.";
}

/**
 * Keeps the task list in Firestore at `users/{uid}/todos/{todoId}`.
 *
 * - Reads: a live `onSnapshot` listener replaces local state with the
 *   server's list (sanitized and ordered). Snapshots include this device's
 *   pending writes, so local edits never flicker away.
 * - Writes: `setTodos` computes the next list immediately, diffs it against
 *   the last snapshot, and batches only the changed and deleted documents.
 *   Doing this inside the setter (not in an effect) means a remote snapshot
 *   can never land between a local change and its write.
 * - Safety: nothing is written until the first snapshot arrives, and deletes
 *   are only ever issued for ids that a snapshot reported, so an empty
 *   initial list can never wipe the account.
 */
export function useFirestoreTodos(uid: string): UseFirestoreTodosResult {
  const [todos, setTodosState] = useState<TodoItem[]>([]);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [serverSynced, setServerSynced] = useState(false);
  const [error, setErrorState] = useState<SyncError | null>(null);
  const errorCountRef = useRef(0);
  const setError = useCallback((message: string) => {
    errorCountRef.current += 1;
    setErrorState({ id: errorCountRef.current, message });
  }, []);

  /** Latest list, so consecutive setTodos calls in one handler compose. */
  const latestRef = useRef<TodoItem[]>([]);
  /** id -> task as Firestore last reported it (plus our in-flight writes). */
  const syncedRef = useRef<Map<string, TodoItem>>(new Map());
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
    syncedRef.current = new Map();
    latestRef.current = [];

    const todosCollection = collection(db, 'users', uid, 'todos');
    const unsubscribe = onSnapshot(
      todosCollection,
      { includeMetadataChanges: true },
      (snapshot) => {
        // The document id is authoritative; sanitizing drops malformed docs
        // so one bad record can never break the UI.
        const list = sortByOrder(
          sanitizeTodos(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })))
        );
        syncedRef.current = new Map(list.map((t) => [t.id, t]));
        latestRef.current = list;
        hydratedRef.current = true;
        setTodosState(list);

        const fromServer = !snapshot.metadata.fromCache;
        if (fromServer) setServerSynced(true);
        // An empty *cache* on a device that has never synced says nothing
        // about the account, so wait for the server unless we're offline or
        // the cache already has tasks.
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        if (fromServer || list.length > 0 || offline) {
          setStatus('ready');
        }
      },
      (err) => {
        setError(describeFirestoreError(err));
        setStatus('error');
      }
    );
    return unsubscribe;
  }, [uid, setError]);

  const setTodos = useCallback<Dispatch<SetStateAction<TodoItem[]>>>(
    (action) => {
      if (!hydratedRef.current) return;
      const next =
        typeof action === 'function'
          ? (action as (prev: TodoItem[]) => TodoItem[])(latestRef.current)
          : action;
      latestRef.current = next;
      setTodosState(next);

      const { upserts, deletes } = diffTodos(syncedRef.current, next);
      if (upserts.length === 0 && deletes.length === 0) return;

      // Record the writes as synced right away so a second change before the
      // server acknowledges doesn't re-send them. If a write is rejected,
      // Firestore rolls it back and the next snapshot corrects this map.
      upserts.forEach((t) => syncedRef.current.set(t.id, t));
      deletes.forEach((id) => syncedRef.current.delete(id));

      const ops = [
        ...upserts.map((t) => ({ kind: 'set' as const, todo: t })),
        ...deletes.map((id) => ({ kind: 'delete' as const, id })),
      ];
      chunk(ops, MAX_BATCH_WRITES).forEach((group) => {
        const batch = writeBatch(db);
        group.forEach((op) => {
          if (op.kind === 'set') {
            batch.set(doc(db, 'users', uid, 'todos', op.todo.id), op.todo);
          } else {
            batch.delete(doc(db, 'users', uid, 'todos', op.id));
          }
        });
        // Offline, this promise simply stays pending until reconnection;
        // it only rejects for real failures such as a rules rejection.
        batch.commit().catch((err) => setError(describeFirestoreError(err)));
      });
    },
    [uid, setError]
  );

  return { todos, setTodos, status, serverSynced, error };
}
