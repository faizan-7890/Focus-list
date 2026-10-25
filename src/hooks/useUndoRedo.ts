import { useCallback, useMemo, useRef, useState } from 'react';
import type { TodoItem } from '../utils/todoLogic';
import { UndoRedoManager } from '../utils/undoRedoManager';

export const cloneTodoList = (todos: TodoItem[]): TodoItem[] =>
  todos.map((todo) => ({
    ...todo,
    subtasks: todo.subtasks.map((st) => ({ ...st })),
  }));

export interface UseUndoRedoReturn {
  pushUndo: (label: string, previousState: TodoItem[]) => void;
  undo: () => { state: TodoItem[]; label: string } | null;
  redo: () => { state: TodoItem[]; label: string } | null;
  canUndo: boolean;
  canRedo: boolean;
  lastUndoLabel: string | null;
  clearHistory: () => void;
}

export function useUndoRedo(
  currentStateRef: React.RefObject<TodoItem[]>
): UseUndoRedoReturn {
  const [, setRevision] = useState(0);
  const managerRef = useRef<UndoRedoManager<TodoItem[]> | null>(null);

  if (!managerRef.current) {
    managerRef.current = new UndoRedoManager<TodoItem[]>(cloneTodoList, 20);
  }

  const manager = managerRef.current;

  const pushUndo = useCallback(
    (label: string, previousState: TodoItem[]) => {
      manager.push(label, previousState);
      setRevision((r) => r + 1);
    },
    [manager]
  );

  const undo = useCallback((): { state: TodoItem[]; label: string } | null => {
    const current = currentStateRef.current ?? [];
    const result = manager.undo(current);
    if (result) {
      setRevision((r) => r + 1);
    }
    return result;
  }, [manager, currentStateRef]);

  const redo = useCallback((): { state: TodoItem[]; label: string } | null => {
    const current = currentStateRef.current ?? [];
    const result = manager.redo(current);
    if (result) {
      setRevision((r) => r + 1);
    }
    return result;
  }, [manager, currentStateRef]);

  const clearHistory = useCallback(() => {
    manager.clear();
    setRevision((r) => r + 1);
  }, [manager]);

  return useMemo(
    () => ({
      pushUndo,
      undo,
      redo,
      canUndo: manager.canUndo(),
      canRedo: manager.canRedo(),
      lastUndoLabel: manager.getLastUndoLabel(),
      clearHistory,
    }),
    [pushUndo, undo, redo, clearHistory, manager]
  );
}
