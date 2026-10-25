export interface HistoryEntry<T> {
  label: string;
  state: T;
}

export class UndoRedoManager<T> {
  private undoStack: HistoryEntry<T>[] = [];
  private redoStack: HistoryEntry<T>[] = [];
  private maxHistory: number;
  private cloneFn: (state: T) => T;

  constructor(cloneFn: (state: T) => T, maxHistory = 20) {
    this.cloneFn = cloneFn;
    this.maxHistory = maxHistory;
  }

  push(label: string, previousState: T): void {
    const snapshot = this.cloneFn(previousState);
    this.undoStack.push({ label, state: snapshot });
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(currentState: T): { state: T; label: string } | null {
    if (this.undoStack.length === 0) return null;
    const entry = this.undoStack.pop()!;
    const currentSnapshot = this.cloneFn(currentState);
    this.redoStack.push({ label: entry.label, state: currentSnapshot });
    if (this.redoStack.length > this.maxHistory) {
      this.redoStack.shift();
    }
    return { state: entry.state, label: entry.label };
  }

  redo(currentState: T): { state: T; label: string } | null {
    if (this.redoStack.length === 0) return null;
    const entry = this.redoStack.pop()!;
    const currentSnapshot = this.cloneFn(currentState);
    this.undoStack.push({ label: entry.label, state: currentSnapshot });
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    return { state: entry.state, label: entry.label };
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getLastUndoLabel(): string | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].label : null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
