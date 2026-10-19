import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Category, Priority, TodoItem } from '../utils/todoLogic';

interface EditTaskModalProps {
  todo: TodoItem;
  onClose: () => void;
  onSave: (
    id: string,
    updates: {
      title: string;
      notes: string;
      category: Category;
      priority: Priority;
      dueDate: string;
    }
  ) => void;
}

const CATEGORIES: Category[] = ['Work', 'Personal', 'Errands', 'Study'];
const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
];

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  todo,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes);
  const [category, setCategory] = useState<Category>(todo.category);
  const [priority, setPriority] = useState<Priority>(todo.priority);
  const [dueDate, setDueDate] = useState(todo.dueDate);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!title.trim()) {
      setError('Task title cannot be empty.');
      return;
    }
    setIsSaving(true);
    onSave(todo.id, {
      title: title.trim(),
      notes: notes.trim(),
      category,
      priority,
      dueDate,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-heading"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-stone-200 rounded-xl w-full max-w-lg p-6 space-y-5 shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2
            id="edit-task-heading"
            className="text-base font-semibold text-slate-900 font-display"
          >
            Edit Task Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit task modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-stone-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-task-title"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Task Title
            </label>
            <input
              ref={titleInputRef}
              id="edit-task-title"
              type="text"
              value={title}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'edit-task-error' : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              className="w-full text-sm text-slate-900 bg-white border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
            />
            {error && (
              <p
                id="edit-task-error"
                role="alert"
                className="text-xs font-medium text-red-600 mt-1.5 flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-task-notes"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="edit-task-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional task details or notes..."
              className="w-full text-sm text-slate-900 bg-white border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="edit-task-category"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Project
              </label>
              <select
                id="edit-task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full text-xs text-slate-900 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-task-priority"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Priority
              </label>
              <select
                id="edit-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full text-xs text-slate-900 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-900"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-task-duedate"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Due Date
              </label>
              <input
                id="edit-task-duedate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs font-mono text-slate-900 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
