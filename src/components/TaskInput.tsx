import React, { useState } from 'react';
import { AlertCircle, Calendar, FileText, Plus } from 'lucide-react';
import {
  getNextMondayIsoDate,
  getNextWeekendIsoDate,
  getTomorrowIsoDate,
  type Category,
  type CreateTodoInput,
  type Priority,
} from '../utils/todoLogic';

interface TaskInputProps {
  onAddTodo: (input: CreateTodoInput) => void;
  todayDate: string;
  defaultCategory?: Category;
  defaultDueDate?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const CATEGORIES: Category[] = ['Work', 'Personal', 'Errands', 'Study'];
const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
];

function describeDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export const TaskInput: React.FC<TaskInputProps> = ({
  onAddTodo,
  todayDate,
  defaultCategory = 'Work',
  defaultDueDate = '',
  inputRef,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick-pick presets. Dropping any whose date repeats an earlier preset keeps
  // the row free of duplicates (e.g. "Weekend" on a Friday is just Tomorrow).
  const presets = [
    { label: 'Today', date: todayDate },
    { label: 'Tomorrow', date: getTomorrowIsoDate(todayDate) },
    { label: 'Weekend', date: getNextWeekendIsoDate(todayDate) },
    { label: 'Next week', date: getNextMondayIsoDate(todayDate) },
  ].filter((p, i, all) => all.findIndex((q) => q.date === p.date) === i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!title.trim()) {
      setError('Enter a task title before adding.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    onAddTodo({
      title: title.trim(),
      notes: notes.trim(),
      category,
      priority,
      dueDate,
    });
    setTitle('');
    setNotes('');
    setShowNotes(false);
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Add new task"
      className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3.5"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5 rounded-lg p-1 -m-1 focus-within:ring-2 focus-within:ring-indigo-500/40">
          <span
            aria-hidden="true"
            className="w-6 h-6 rounded-md bg-stone-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-mono text-xs shrink-0"
          >
            +
          </span>
          <label htmlFor="new-task-title" className="sr-only">
            New task title
          </label>
          <input
            ref={inputRef}
            id="new-task-title"
            type="text"
            value={title}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'new-task-error' : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Add a new task or deliverable... (Press N)"
            className="w-full text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-0 focus:outline-none focus:ring-0 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowNotes((prev) => !prev)}
            aria-expanded={showNotes}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{showNotes ? 'Hide Notes' : 'Add Notes'}</span>
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {showNotes && (
        <div className="pt-1">
          <label htmlFor="new-task-notes" className="sr-only">
            Task notes
          </label>
          <textarea
            id="new-task-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context, links, or acceptance criteria..."
            className="w-full text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-stone-50 dark:bg-slate-900/50 border border-stone-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
          />
        </div>
      )}

      {error && (
        <p
          id="new-task-error"
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="new-task-category"
              className="text-slate-500 dark:text-slate-400 font-medium"
            >
              Project:
            </label>
            <select
              id="new-task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="bg-stone-50 dark:bg-slate-900/50 border border-stone-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label
              htmlFor="new-task-priority"
              className="text-slate-500 dark:text-slate-400 font-medium"
            >
              Priority:
            </label>
            <select
              id="new-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="bg-stone-50 dark:bg-slate-900/50 border border-stone-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label
              htmlFor="new-task-duedate"
              className="text-slate-500 dark:text-slate-400 font-medium inline-flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <span>Due:</span>
            </label>
            <input
              id="new-task-duedate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-stone-50 dark:bg-slate-900/50 border border-stone-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 font-mono text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
            />
          </div>
        </div>

        {/* Quick Schedule Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setDueDate(preset.date)}
              title={describeDate(preset.date)}
              aria-pressed={dueDate === preset.date}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                dueDate === preset.date
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
          {dueDate && (
            <button
              type="button"
              onClick={() => setDueDate('')}
              className="px-2 py-1 rounded-md text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              No Date
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
