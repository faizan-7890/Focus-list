import React, { useState } from 'react';
import { Calendar, FileText, Plus } from 'lucide-react';
import {
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

  const tomorrowDate = getTomorrowIsoDate(todayDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title before adding.');
      return;
    }
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
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Add new task"
      className="bg-white border border-stone-200/90 rounded-xl p-4 sm:p-5 space-y-3.5"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="w-6 h-6 rounded-md bg-stone-100 text-slate-500 flex items-center justify-center font-mono text-xs shrink-0"
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
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Add a new task or deliverable... (Press N)"
            className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowNotes((prev) => !prev)}
            aria-expanded={showNotes}
            className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{showNotes ? 'Hide Notes' : 'Add Notes'}</span>
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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
            className="w-full text-sm text-slate-700 placeholder:text-slate-400 bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-400"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="new-task-category"
              className="text-slate-500 font-medium"
            >
              Project:
            </label>
            <select
              id="new-task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="bg-stone-50 border border-stone-200 text-slate-800 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-slate-400"
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
              className="text-slate-500 font-medium"
            >
              Priority:
            </label>
            <select
              id="new-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="bg-stone-50 border border-stone-200 text-slate-800 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-slate-400"
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
              className="text-slate-500 font-medium inline-flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Due:</span>
            </label>
            <input
              id="new-task-duedate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-slate-800 rounded-lg px-2.5 py-1 font-mono text-xs focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Quick Schedule Preset Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDueDate(todayDate)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              dueDate === todayDate
                ? 'bg-slate-900 text-white'
                : 'bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDueDate(tomorrowDate)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              dueDate === tomorrowDate
                ? 'bg-slate-900 text-white'
                : 'bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-900'
            }`}
          >
            Tomorrow
          </button>
          {dueDate && (
            <button
              type="button"
              onClick={() => setDueDate('')}
              className="px-2 py-1 rounded-md text-xs text-slate-500 hover:text-slate-800 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
            >
              No Date
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
