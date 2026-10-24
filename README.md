# Focuslist — Task & Priority Manager

**Focuslist** is a local-first, keyboard-driven task and priority workspace built with React 19, TypeScript, and Tailwind CSS. Designed for high-signal daily execution, it combines structured deliverable capture, nested subtask checklists, switchable List and Priority Kanban Board views, a persistent **Deep Work & Fullscreen Zen Timer** with Pomodoro tracking and Web Audio chimes, a global **Command Palette (`Ctrl/Cmd + K`)**, and validated **JSON/CSV data portability**.

---

## Table of Contents

1. [Key Features](#key-features)
2. [How to Use Focuslist](#how-to-use-focuslist)
3. [Keyboard Shortcuts](#keyboard-shortcuts)
4. [Example Use Cases](#example-use-cases)
5. [Architecture & Project Structure](#architecture--project-structure)
6. [Getting Started & Testing](#getting-started--testing)

---

## Key Features

- **Structured Task Capture**: Create deliverables with titles, expandable multi-line context notes, project categories (*Work*, *Personal*, *Errands*, *Study*), priority levels (*Low*, *Medium*, *High*), and one-click due date presets (*Today*, *Tomorrow*, or custom calendar dates).
- **Nested Subtask Checklists**: Expand any task to break work into granular checklist steps (`completed/total`), toggle individual items, or check off steps directly inside Fullscreen Zen Mode.
- **Smart Views & Multi-Criteria Filtering**:
  - **Smart Views**: *All Tasks*, *Due Today* (automatically surfaces overdue items), *Scheduled*, and *High Priority*.
  - **Project Filters**: Isolate deliverables by *Work*, *Personal*, *Errands*, or *Study*.
  - **Status & Search Controls**: Filter by *All*, *Active*, or *Completed*, search across titles/notes/subtasks in real time, and sort by *Manual Order*, *Priority (High–Low)*, *Due Date (Soonest)*, or *Alphabetical (A–Z)*.
- **Dual Layout Modes (List & Priority Board)**: Switch seamlessly between a compact single-column **List View** and a 3-column **Priority Kanban Board** (*High*, *Medium*, *Low Priority*).
- **Precision Focus Timer, Pomodoro Tracking & Fullscreen Zen Mode**:
  - **Persistent Countdown**: Timestamp-backed `25m Focus` and `5m Break` intervals that survive page reloads and update the browser tab title live.
  - **Pomodoro Counter (`🍅`)**: Automatically increments the completed focus session count on the active deliverable whenever a 25-minute focus interval finishes.
  - **Fullscreen Zen Mode**: Distraction-free dark canvas featuring an animated SVG circular progress ring, active task and subtask checklist controls, and single-key shortcuts.
  - **Zero-Asset Web Audio Chimes**: Synthesized acoustic chimes on timer start, interval completion, and task completion (with one-click mute/unmute).
- **Global Command Palette (`Ctrl/Cmd + K`)**: Jump to any view, toggle layout modes, trigger exports/imports, complete tasks, or create a new task directly from the command query.
- **Validated JSON & CSV Import/Export**: Back up your workspace to `.json` or `.csv`, and import external files with a live validation preview supporting **Merge** or **Replace** modes.

---

## How to Use Focuslist

### 1. Capturing & Organizing Tasks
1. Press `N` (or click the **New Task** input at the top of the workspace) and type your deliverable title.
2. *(Optional)* Click **Add notes** to attach acceptance criteria, links, or context.
3. Select a **Project** (*Work*, *Personal*, *Errands*, *Study*), **Priority** (*Low*, *Medium*, *High*), and **Due Date** (*Today*, *Tomorrow*, or a custom date).
4. Press `Enter` or click **Add Task**.

### 2. Managing Subtasks & Reordering
- **Subtasks**: Click the **`Subtasks`** button on any task card to open its checklist drawer. Type a step and press `Enter` to append it, or toggle existing steps to update the progress badge (`1/3 subtasks`).
- **Manual Ordering**: When sorted by *Manual Order*, use the up/down reorder buttons on the left of any task row to adjust execution priority.
- **Editing & Deleting**: Click the pencil icon on a task to modify its title, notes, category, priority, or due date in a modal dialog, or click the trash icon to remove it.

### 3. Switching Views & Layouts
- Use the left **Sidebar** to filter by Smart Views (*All Tasks*, *Due Today*, *Scheduled*, *High Priority*) or specific *Projects*.
- In the main toolbar, toggle between **List** (dense vertical stack with manual reordering) and **Board** (three columns grouped by *High*, *Medium*, and *Low* priority).

### 4. Running Deep Work & Fullscreen Zen Sessions
1. In the right-hand **Focus Session** panel, pick a task from the **Focused Deliverable** dropdown.
2. Choose **25m Focus** or **5m Break** and click **Start Timer** (or click **Zen Mode** in the top-right corner of the timer display to enter the fullscreen distraction-free view).
3. Inside **Zen Mode**, use `Space` to start/pause the timer, check off subtasks as you complete them, or click **Done** to mark the entire deliverable complete.
4. When a 25-minute focus interval reaches `00:00`, a peaceful chord chime plays, a browser notification fires (if permitted), and the task receives a **`🍅 1`** Pomodoro badge.

### 5. Backing Up, Exporting & Importing Data
1. Click **Export / Import** in the Sidebar (or open the Command Palette with `Ctrl/Cmd + K` and select an export/import command).
2. **Export Tab**: Download a lossless `.json` backup or an RFC-4180 `.csv` spreadsheet file, or copy the payload directly to your clipboard.
3. **Import & Validate Tab**: Upload a `.json` or `.csv` file (or paste raw text). Review the live validation summary (valid tasks, nested subtasks, and any row-level warnings), choose **Merge with existing tasks** or **Replace entire workspace**, and click **Import**.

---

## Keyboard Shortcuts

### Global & Workspace Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Global (anywhere in the app) | Open or close the Command Palette |
| `N` | Workspace (when no input is focused) | Focus the *New Task* title input |
| `/` | Workspace (when no input is focused) | Focus the *Search tasks* input |
| `Enter` | Inside *New Task* or *Subtask* input | Submit and save the task or subtask |
| `ArrowUp` / `ArrowDown` | Inside Command Palette | Move selection highlight up or down |
| `Enter` | Inside Command Palette | Execute the highlighted command |
| `Escape` | Inside any Modal or Command Palette | Close the active modal or overlay |

### Fullscreen Zen Mode Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Space` | Inside Fullscreen Zen Mode | Start or pause the active focus/break timer |
| `R` | Inside Fullscreen Zen Mode | Reset the current timer interval |
| `M` | Inside Fullscreen Zen Mode | Mute or unmute synthesized audio chimes |
| `Escape` | Inside Fullscreen Zen Mode | Exit Fullscreen Zen Mode back to workspace |

---

## Example Use Cases

### 1. Software Engineer & Product Designer Daily Triage
- **Scenario**: An engineer starts the day with code reviews, a production bug fix, and sprint feature work scattered across notes.
- **Workflow**: Press `N` to log each item under **Work**, mark the production bug as **High Priority** due **Today**, and add subtask checklists for the PR review steps (`[ ] Run unit tests`, `[ ] Verify mobile layout`, `[ ] Merge PR`). Switch to the **Priority Board** during standup to communicate high-priority blockers at a glance.

### 2. Deep Work & Time-Boxed Maker Sessions
- **Scenario**: A writer or developer struggles with context switching and wants structured 25-minute Pomodoro sprints without opening a separate timer app.
- **Workflow**: Select the top deliverable in the **Focus Session** panel, launch **Zen Mode**, and press `Space`. Work through the task's inline checklist on the dark fullscreen canvas while the circular progress ring counts down. Each completed 25-minute block logs a `🍅` Pomodoro badge directly on the task card.

### 3. Academic, Research & Exam Milestone Tracking
- **Scenario**: A graduate student is balancing thesis chapters, lab assignments, and personal errands with strict deadlines.
- **Workflow**: Categorize academic deliverables under **Study** with specific calendar due dates and keep daily chores under **Personal** and **Errands**. Use the **Scheduled** view to inspect upcoming deadlines chronologically and check the **Active Workload by Project** bar chart to ensure study time isn't crowded out by errands.

### 4. Local-First Privacy with Spreadsheet Auditing & Cross-Device Migration
- **Scenario**: A consultant needs a fast, zero-account task tracker that keeps data strictly in the browser while supporting weekly client reporting in Excel/Google Sheets.
- **Workflow**: Track tasks locally throughout the week with instant `localStorage` persistence. On Friday, open the **Export / Import** modal and download a **CSV Spreadsheet** (including completed Pomodoro counts, priorities, due dates, and serialized subtasks) for weekly reporting, or export a **JSON Backup** to transfer the workspace to another machine.

---

## Architecture & Project Structure

Core state transformations, filtering, sorting, and serialization are decoupled from React components so they can be verified deterministically with Node's native test runner:

- `src/utils/todoLogic.ts`: Pure functions for task CRUD, subtask checklists, Pomodoro increments, multi-criteria filtering/sorting, workspace statistics, and RFC-4180 CSV / JSON serialization and validation.
- `src/utils/todoLogic.test.ts`: Unit test suite (`node:test` + `node:assert/strict`) covering task creation, Pomodoro tracking, subtask operations, reordering, filtering, stats, and JSON/CSV round-trip import/export.
- `src/hooks/useFocusTimer.ts`: Custom React hook managing persistent timestamp-based countdowns, live `document.title` updates, browser notifications, and sound triggers.
- `src/utils/soundEffects.ts`: Zero-dependency Web Audio API synthesizer generating harmonic chimes for timer start, interval completion, and task completion.
- `src/components/ZenModeModal.tsx`: Fullscreen distraction-free focus modal with SVG progress ring, live checklist interaction, and keyboard shortcuts (`Space`, `R`, `M`, `Esc`).
- `src/components/FocusPanel.tsx`: Right-hand companion panel housing the 25m/5m timer readout, Zen Mode launcher, and interactive project workload chart.
- `src/components/CommandPalette.tsx`: Keyboard-first `Ctrl/Cmd + K` modal for instant navigation, task toggling, and quick task creation.
- `src/components/PortabilityModal.tsx`: Two-tab Export & Validated Import dialog for `.json` and `.csv` data portability.
- `src/components/Sidebar.tsx`, `src/components/TaskInput.tsx`, `src/components/TaskItem.tsx`, `src/components/EditTaskModal.tsx`: Accessible workspace UI components built on custom CSS design tokens.

---

## Getting Started & Testing

### Prerequisites
- Node.js 22+ and npm

### Installation & Local Development
```bash
# Install dependencies
npm install

# Start the development server at http://localhost:3000
npm run dev
```

### Running Unit Tests
```bash
npx --yes tsx --test src/utils/todoLogic.test.ts
```

### Building for Production
```bash
npm run build
```
