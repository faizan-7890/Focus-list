export type Priority = 'low' | 'medium' | 'high';
export type Category = 'Personal' | 'Work' | 'Errands' | 'Study';
export type StatusFilter = 'all' | 'active' | 'completed';
export type ViewFilter = 'all' | 'today' | 'upcoming' | 'high-priority' | Category;
export type SortBy = 'manual' | 'dueDate' | 'priority' | 'alphabetical';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string; // YYYY-MM-DD or ''
  createdAt: number;
  order: number;
  subtasks: Subtask[];
}

export interface CreateTodoInput {
  title: string;
  notes?: string;
  priority?: Priority;
  category?: Category;
  dueDate?: string;
  subtasks?: Array<{ title: string; completed?: boolean }>;
}

export interface FilterCriteria {
  status: StatusFilter;
  view: ViewFilter;
  searchQuery: string;
  sortBy: SortBy;
  todayDate: string; // YYYY-MM-DD
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function generateId(prefix = 'todo'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getTodayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowIsoDate(todayDate: string): string {
  const parts = todayDate.split('-').map(Number);
  const base =
    parts.length === 3 && !parts.some(isNaN)
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date();
  base.setDate(base.getDate() + 1);
  return getTodayIsoDate(base);
}

export function formatTimerDisplay(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function createTodo(
  existingTodos: TodoItem[],
  input: CreateTodoInput,
  now = Date.now()
): TodoItem[] {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    return existingTodos;
  }

  const minOrder = existingTodos.reduce(
    (min, item) => (item.order < min ? item.order : min),
    0
  );

  const newTodo: TodoItem = {
    id: generateId('task'),
    title: trimmedTitle,
    notes: (input.notes ?? '').trim(),
    completed: false,
    priority: input.priority ?? 'medium',
    category: input.category ?? 'Personal',
    dueDate: input.dueDate ?? '',
    createdAt: now,
    order: minOrder - 1,
    subtasks: (input.subtasks ?? [])
      .map((st, idx) => ({
        id: `sub_${now}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        title: st.title.trim(),
        completed: Boolean(st.completed),
      }))
      .filter((st) => st.title.length > 0),
  };

  return [newTodo, ...existingTodos];
}

export function toggleTodo(todos: TodoItem[], id: string): TodoItem[] {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
}

export function updateTodo(
  todos: TodoItem[],
  id: string,
  updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>
): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== id) return todo;
    const nextTitle =
      updates.title !== undefined ? updates.title.trim() : todo.title;
    if (!nextTitle) return todo;
    return {
      ...todo,
      ...updates,
      title: nextTitle,
      notes: updates.notes !== undefined ? updates.notes.trim() : todo.notes,
    };
  });
}

export function deleteTodo(todos: TodoItem[], id: string): TodoItem[] {
  return todos.filter((todo) => todo.id !== id);
}

export function clearCompletedTodos(todos: TodoItem[]): TodoItem[] {
  return todos.filter((todo) => !todo.completed);
}

export function toggleAllTodos(todos: TodoItem[], completed: boolean): TodoItem[] {
  return todos.map((todo) => ({ ...todo, completed }));
}

export function addSubtask(
  todos: TodoItem[],
  todoId: string,
  subtaskTitle: string
): TodoItem[] {
  const clean = subtaskTitle.trim();
  if (!clean) return todos;

  return todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    const nextSubtask: Subtask = {
      id: generateId('sub'),
      title: clean,
      completed: false,
    };
    return {
      ...todo,
      subtasks: [...todo.subtasks, nextSubtask],
    };
  });
}

export function toggleSubtask(
  todos: TodoItem[],
  todoId: string,
  subtaskId: string
): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    return {
      ...todo,
      subtasks: todo.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    };
  });
}

export function deleteSubtask(
  todos: TodoItem[],
  todoId: string,
  subtaskId: string
): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    return {
      ...todo,
      subtasks: todo.subtasks.filter((st) => st.id !== subtaskId),
    };
  });
}

export function moveTodoOrder(
  todos: TodoItem[],
  id: string,
  direction: 'up' | 'down'
): TodoItem[] {
  const sorted = [...todos].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((t) => t.id === id);
  if (index === -1) return todos;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) return todos;

  const tempOrder = sorted[index].order;
  sorted[index] = { ...sorted[index], order: sorted[targetIndex].order };
  sorted[targetIndex] = { ...sorted[targetIndex], order: tempOrder };

  return sorted.sort((a, b) => a.order - b.order);
}

export function filterAndSortTodos(
  todos: TodoItem[],
  criteria: FilterCriteria
): TodoItem[] {
  const query = criteria.searchQuery.trim().toLowerCase();

  const filtered = todos.filter((todo) => {
    // Status check
    if (criteria.status === 'active' && todo.completed) return false;
    if (criteria.status === 'completed' && !todo.completed) return false;

    // View check
    if (criteria.view === 'today') {
      if (!todo.dueDate || todo.dueDate > criteria.todayDate) return false;
    } else if (criteria.view === 'upcoming') {
      if (!todo.dueDate || todo.dueDate < criteria.todayDate) return false;
    } else if (criteria.view === 'high-priority') {
      if (todo.priority !== 'high') return false;
    } else if (
      criteria.view === 'Personal' ||
      criteria.view === 'Work' ||
      criteria.view === 'Errands' ||
      criteria.view === 'Study'
    ) {
      if (todo.category !== criteria.view) return false;
    }

    // Search query check
    if (query.length > 0) {
      const inTitle = todo.title.toLowerCase().includes(query);
      const inNotes = todo.notes.toLowerCase().includes(query);
      const inCategory = todo.category.toLowerCase().includes(query);
      const inSubtasks = todo.subtasks.some((st) =>
        st.title.toLowerCase().includes(query)
      );
      if (!inTitle && !inNotes && !inCategory && !inSubtasks) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (criteria.sortBy === 'priority') {
      const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (diff !== 0) return diff;
    } else if (criteria.sortBy === 'dueDate') {
      if (a.dueDate && b.dueDate) {
        const cmp = a.dueDate.localeCompare(b.dueDate);
        if (cmp !== 0) return cmp;
      } else if (a.dueDate && !b.dueDate) {
        return -1;
      } else if (!a.dueDate && b.dueDate) {
        return 1;
      }
    } else if (criteria.sortBy === 'alphabetical') {
      const cmp = a.title.localeCompare(b.title);
      if (cmp !== 0) return cmp;
    }
    return a.order - b.order;
  });
}

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
  dueTodayOrOverdue: number;
  scheduledActive: number;
  overdue: number;
  highPriorityActive: number;
  byCategory: Record<Category, number>;
}

export function computeTodoStats(
  todos: TodoItem[],
  todayDate: string
): TodoStats {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const dueTodayOrOverdue = todos.filter(
    (t) => !t.completed && t.dueDate !== '' && t.dueDate <= todayDate
  ).length;

  const scheduledActive = todos.filter(
    (t) => !t.completed && t.dueDate !== '' && t.dueDate >= todayDate
  ).length;

  const overdue = todos.filter(
    (t) => !t.completed && t.dueDate !== '' && t.dueDate < todayDate
  ).length;

  const highPriorityActive = todos.filter(
    (t) => !t.completed && t.priority === 'high'
  ).length;

  const byCategory: Record<Category, number> = {
    Personal: 0,
    Work: 0,
    Errands: 0,
    Study: 0,
  };

  for (const todo of todos) {
    if (!todo.completed) {
      byCategory[todo.category] = (byCategory[todo.category] ?? 0) + 1;
    }
  }

  return {
    total,
    active,
    completed,
    completionRate,
    dueTodayOrOverdue,
    scheduledActive,
    overdue,
    highPriorityActive,
    byCategory,
  };
}

export function formatDueDateLabel(
  dueDate: string,
  todayDate: string
): { label: string; isOverdue: boolean; isToday: boolean } {
  if (!dueDate) {
    return { label: '', isOverdue: false, isToday: false };
  }
  if (dueDate === todayDate) {
    return { label: 'Due Today', isOverdue: false, isToday: true };
  }
  if (dueDate < todayDate) {
    return { label: `Overdue (${dueDate})`, isOverdue: true, isToday: false };
  }
  const parts = dueDate.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatted = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return { label: `Due ${formatted}`, isOverdue: false, isToday: false };
  }
  return { label: `Due ${dueDate}`, isOverdue: false, isToday: false };
}

export function getInitialDemoTodos(todayDate: string): TodoItem[] {
  const parts = todayDate.split('-').map(Number);
  const baseDate =
    parts.length === 3
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date();
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(baseDate.getDate() + 1);
  const nextWeek = new Date(baseDate);
  nextWeek.setDate(baseDate.getDate() + 4);

  const tomorrowStr = getTodayIsoDate(tomorrow);
  const nextWeekStr = getTodayIsoDate(nextWeek);

  return [
    {
      id: 'task_demo_1',
      title: 'Finalize Q4 product roadmap presentation',
      notes: 'Review key milestone dates with engineering and design leads before 3:00 PM sync.',
      completed: false,
      priority: 'high',
      category: 'Work',
      dueDate: todayDate,
      createdAt: Date.now() - 3600_000 * 5,
      order: 1,
      subtasks: [
        { id: 'sub_demo_1', title: 'Update velocity metrics slide', completed: true },
        { id: 'sub_demo_2', title: 'Confirm release target dates', completed: false },
        { id: 'sub_demo_3', title: 'Share deck link in team channel', completed: false },
      ],
    },
    {
      id: 'task_demo_2',
      title: 'Pick up fresh espresso beans and oat milk',
      notes: 'Single-origin Ethiopian roast from the local roastery on 4th St.',
      completed: false,
      priority: 'medium',
      category: 'Errands',
      dueDate: todayDate,
      createdAt: Date.now() - 3600_000 * 4,
      order: 2,
      subtasks: [],
    },
    {
      id: 'task_demo_3',
      title: 'Complete TypeScript async patterns chapter',
      notes: 'Practice writing unit tests with node:test and strict assertions.',
      completed: false,
      priority: 'medium',
      category: 'Study',
      dueDate: tomorrowStr,
      createdAt: Date.now() - 3600_000 * 3,
      order: 3,
      subtasks: [
        { id: 'sub_demo_4', title: 'Read concurrency control notes', completed: true },
        { id: 'sub_demo_5', title: 'Complete 3 practice exercises', completed: false },
      ],
    },
    {
      id: 'task_demo_4',
      title: 'Schedule annual dental checkup and cleaning',
      notes: 'Prefer morning slot on Tuesday or Thursday.',
      completed: false,
      priority: 'low',
      category: 'Personal',
      dueDate: nextWeekStr,
      createdAt: Date.now() - 3600_000 * 2,
      order: 4,
      subtasks: [],
    },
    {
      id: 'task_demo_5',
      title: 'Submit monthly expense reimbursement report',
      notes: 'Attached receipts for conference travel and software subscriptions.',
      completed: true,
      priority: 'high',
      category: 'Work',
      dueDate: todayDate,
      createdAt: Date.now() - 3600_000 * 12,
      order: 5,
      subtasks: [
        { id: 'sub_demo_6', title: 'Export PDF receipts', completed: true },
        { id: 'sub_demo_7', title: 'Submit in finance portal', completed: true },
      ],
    },
  ];
}

export type ImportMode = 'merge' | 'replace';

export interface ImportValidationResult {
  validTodos: TodoItem[];
  errors: string[];
  sourceFormat: 'json' | 'csv';
  totalSubtasks: number;
}

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const VALID_CATEGORIES: Category[] = ['Work', 'Personal', 'Errands', 'Study'];

export function exportTodosToJson(todos: TodoItem[]): string {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    count: todos.length,
    todos,
  };
  return JSON.stringify(payload, null, 2);
}

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (
    normalized.includes(',') ||
    normalized.includes('"') ||
    normalized.includes('\n')
  ) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function serializeSubtasksForCsv(subtasks: Subtask[]): string {
  return subtasks
    .map((st) => `${st.completed ? '[x]' : '[ ]'} ${st.title}`)
    .join(' | ');
}

export function parseSubtasksFromCsvCell(
  cell: string,
  now = Date.now()
): Subtask[] {
  if (!cell.trim()) return [];
  return cell
    .split('|')
    .map((part, idx) => {
      const trimmed = part.trim();
      if (!trimmed) return null;
      let completed = false;
      let title = trimmed;
      if (/^\[x\]/i.test(trimmed)) {
        completed = true;
        title = trimmed.replace(/^\[x\]\s*/i, '').trim();
      } else if (/^\[\s*\]/.test(trimmed)) {
        completed = false;
        title = trimmed.replace(/^\[\s*\]\s*/, '').trim();
      }
      if (!title) return null;
      return {
        id: `sub_${now}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        completed,
      };
    })
    .filter((st): st is Subtask => st !== null);
}

export function exportTodosToCsv(todos: TodoItem[]): string {
  const headers = [
    'Title',
    'Status',
    'Priority',
    'Project',
    'Due Date',
    'Notes',
    'Subtasks',
  ];
  const rows = todos.map((todo) => [
    escapeCsvCell(todo.title),
    escapeCsvCell(todo.completed ? 'completed' : 'active'),
    escapeCsvCell(todo.priority),
    escapeCsvCell(todo.category),
    escapeCsvCell(todo.dueDate),
    escapeCsvCell(todo.notes),
    escapeCsvCell(serializeSubtasksForCsv(todo.subtasks)),
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        if (ch === '\r') i++;
        currentRow.push(currentCell);
        if (currentRow.some((c) => c.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
  }

  currentRow.push(currentCell);
  if (currentRow.some((c) => c.trim().length > 0)) {
    rows.push(currentRow);
  }
  return rows;
}

function normalizePriority(raw: unknown): Priority {
  const str = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (VALID_PRIORITIES.includes(str as Priority)) {
    return str as Priority;
  }
  return 'medium';
}

function normalizeCategory(raw: unknown): Category {
  const str = String(raw ?? '').trim();
  const match = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === str.toLowerCase()
  );
  return match ?? 'Work';
}

function normalizeDueDate(raw: unknown): string {
  const str = String(raw ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  return '';
}

export function parseImportedTasks(
  rawContent: string,
  formatHint?: 'json' | 'csv',
  now = Date.now()
): ImportValidationResult {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    return {
      validTodos: [],
      errors: ['Paste or upload non-empty JSON or CSV content to import.'],
      sourceFormat: formatHint ?? 'json',
      totalSubtasks: 0,
    };
  }

  const detectedFormat: 'json' | 'csv' =
    formatHint ??
    (trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'csv');

  if (detectedFormat === 'json') {
    try {
      const parsed = JSON.parse(trimmed);
      const rawArray: unknown[] = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { todos?: unknown[] }).todos)
        ? (parsed as { todos: unknown[] }).todos
        : [];

      if (!Array.isArray(rawArray) || rawArray.length === 0) {
        return {
          validTodos: [],
          errors: ['JSON payload does not contain a non-empty task array.'],
          sourceFormat: 'json',
          totalSubtasks: 0,
        };
      }

      const validTodos: TodoItem[] = [];
      const errors: string[] = [];

      rawArray.forEach((entry, idx) => {
        if (!entry || typeof entry !== 'object') {
          errors.push(`Item #${idx + 1}: Invalid task object.`);
          return;
        }
        const obj = entry as Record<string, unknown>;
        const title = String(obj.title ?? '').trim();
        if (!title) {
          errors.push(`Item #${idx + 1}: Missing required task title.`);
          return;
        }
        const subtasksRaw = Array.isArray(obj.subtasks) ? obj.subtasks : [];
        const subtasks: Subtask[] = subtasksRaw
          .map((st, sIdx) => {
            if (!st || typeof st !== 'object') return null;
            const stObj = st as Record<string, unknown>;
            const stTitle = String(stObj.title ?? '').trim();
            if (!stTitle) return null;
            return {
              id:
                typeof stObj.id === 'string' && stObj.id.trim()
                  ? stObj.id.trim()
                  : `sub_${now}_${idx}_${sIdx}`,
              title: stTitle,
              completed: Boolean(stObj.completed),
            };
          })
          .filter((st): st is Subtask => st !== null);

        validTodos.push({
          id:
            typeof obj.id === 'string' && obj.id.trim()
              ? obj.id.trim()
              : `task_${now}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          title,
          notes: String(obj.notes ?? '').trim(),
          completed: Boolean(obj.completed),
          priority: normalizePriority(obj.priority),
          category: normalizeCategory(obj.category),
          dueDate: normalizeDueDate(obj.dueDate),
          createdAt:
            typeof obj.createdAt === 'number' ? obj.createdAt : now + idx,
          order: typeof obj.order === 'number' ? obj.order : idx + 1,
          subtasks,
        });
      });

      const totalSubtasks = validTodos.reduce(
        (sum, t) => sum + t.subtasks.length,
        0
      );

      return {
        validTodos,
        errors,
        sourceFormat: 'json',
        totalSubtasks,
      };
    } catch (err) {
      return {
        validTodos: [],
        errors: [
          `Invalid JSON syntax: ${
            err instanceof Error ? err.message : 'Unable to parse JSON'
          }`,
        ],
        sourceFormat: 'json',
        totalSubtasks: 0,
      };
    }
  }

  // CSV parsing
  const rows = parseCsvRows(trimmed);
  if (rows.length === 0) {
    return {
      validTodos: [],
      errors: ['CSV content contains no rows.'],
      sourceFormat: 'csv',
      totalSubtasks: 0,
    };
  }

  const firstRowLower = rows[0].map((c) => c.trim().toLowerCase());
  const hasHeader =
    firstRowLower.includes('title') ||
    firstRowLower.includes('task') ||
    firstRowLower.includes('priority') ||
    firstRowLower.includes('project');

  const colIndex = {
    title: hasHeader
      ? Math.max(
          0,
          firstRowLower.findIndex((h) => h === 'title' || h === 'task')
        )
      : 0,
    status: hasHeader
      ? firstRowLower.findIndex((h) => h === 'status' || h === 'completed')
      : 1,
    priority: hasHeader
      ? firstRowLower.findIndex((h) => h === 'priority')
      : 2,
    category: hasHeader
      ? firstRowLower.findIndex((h) => h === 'project' || h === 'category')
      : 3,
    dueDate: hasHeader
      ? firstRowLower.findIndex(
          (h) => h === 'due date' || h === 'duedate' || h === 'due'
        )
      : 4,
    notes: hasHeader ? firstRowLower.findIndex((h) => h === 'notes') : 5,
    subtasks: hasHeader
      ? firstRowLower.findIndex((h) => h === 'subtasks' || h === 'steps')
      : 6,
  };

  const dataRows = hasHeader ? rows.slice(1) : rows;
  if (dataRows.length === 0) {
    return {
      validTodos: [],
      errors: ['CSV file contains a header row but no task rows.'],
      sourceFormat: 'csv',
      totalSubtasks: 0,
    };
  }

  const validTodos: TodoItem[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, idx) => {
    const lineNum = hasHeader ? idx + 2 : idx + 1;
    const rawTitle = (row[colIndex.title] ?? '').trim();
    if (!rawTitle) {
      errors.push(`Row ${lineNum}: Missing task title.`);
      return;
    }

    const rawStatus =
      colIndex.status >= 0 ? (row[colIndex.status] ?? '').trim().toLowerCase() : '';
    const completed =
      rawStatus === 'completed' ||
      rawStatus === 'true' ||
      rawStatus === 'done' ||
      rawStatus === 'yes';

    const priority =
      colIndex.priority >= 0
        ? normalizePriority(row[colIndex.priority])
        : 'medium';
    const category =
      colIndex.category >= 0
        ? normalizeCategory(row[colIndex.category])
        : 'Work';
    const dueDate =
      colIndex.dueDate >= 0 ? normalizeDueDate(row[colIndex.dueDate]) : '';
    const notes =
      colIndex.notes >= 0 ? (row[colIndex.notes] ?? '').trim() : '';
    const subtasksCell =
      colIndex.subtasks >= 0 ? (row[colIndex.subtasks] ?? '').trim() : '';
    const subtasks = parseSubtasksFromCsvCell(subtasksCell, now + idx);

    validTodos.push({
      id: `task_${now}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      title: rawTitle,
      notes,
      completed,
      priority,
      category,
      dueDate,
      createdAt: now + idx,
      order: idx + 1,
      subtasks,
    });
  });

  const totalSubtasks = validTodos.reduce(
    (sum, t) => sum + t.subtasks.length,
    0
  );

  return {
    validTodos,
    errors,
    sourceFormat: 'csv',
    totalSubtasks,
  };
}

export function applyImportedTodos(
  existingTodos: TodoItem[],
  importedTodos: TodoItem[],
  mode: ImportMode
): TodoItem[] {
  if (importedTodos.length === 0) return existingTodos;

  if (mode === 'replace') {
    return importedTodos.map((t, idx) => ({
      ...t,
      order: idx + 1,
    }));
  }

  // Merge mode: update existing matching IDs or prepend new tasks at top
  const minOrder = existingTodos.reduce(
    (min, item) => (item.order < min ? item.order : min),
    0
  );

  const existingIds = new Set(existingTodos.map((t) => t.id));
  const newTasks: TodoItem[] = [];
  const updatedById = new Map<string, TodoItem>();

  importedTodos.forEach((item, idx) => {
    if (existingIds.has(item.id)) {
      updatedById.set(item.id, item);
    } else {
      newTasks.push({
        ...item,
        order: minOrder - (importedTodos.length - idx),
      });
    }
  });

  const mergedExisting = existingTodos.map(
    (item) => updatedById.get(item.id) ?? item
  );

  return [...newTasks, ...mergedExisting].sort((a, b) => a.order - b.order);
}
