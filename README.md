# Focuslist — Task & Priority Manager

**Focuslist** is a keyboard-driven task and priority workspace built with React 19, TypeScript, Tailwind CSS, and Firebase. Sign in with Google and your tasks sync across devices through Cloud Firestore, and keep working offline. Designed for high-signal daily execution, it combines structured deliverable capture, nested subtask checklists, switchable List and Priority Kanban Board views, a persistent **Deep Work & Fullscreen Zen Timer** with Pomodoro tracking and Web Audio chimes, a global **Command Palette (`Ctrl/Cmd + K`)**, and validated **JSON/CSV data portability**.

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
- **Calendar View**: A third layout that shows one month as a Monday-to-Sunday grid with each task on its due date. Step between months, jump back to today, click the `+` on any day to add a task due that day, and click any task to edit it. The calendar respects the active view, status, and search filters.
- **Precision Focus Timer, Pomodoro Tracking & Fullscreen Zen Mode**:
  - **Persistent Countdown**: Timestamp-backed `25m Focus` and `5m Break` intervals that survive page reloads and update the browser tab title live.
  - **Pomodoro Counter (`🍅`)**: Automatically increments the completed focus session count on the active deliverable whenever a 25-minute focus interval finishes.
  - **Fullscreen Zen Mode**: Distraction-free dark canvas featuring an animated SVG circular progress ring, active task and subtask checklist controls, and single-key shortcuts.
  - **Zero-Asset Web Audio Chimes**: Synthesized acoustic chimes on timer start, interval completion, and task completion (with one-click mute/unmute).
- **Global Command Palette (`Ctrl/Cmd + K`)**: Jump to any view, toggle layout modes, switch the theme, trigger exports/imports, complete tasks, or create a new task directly from the command query.
- **Light / Dark / System Theme**: A header toggle (and a *Switch Theme* command) cycles **Light → Dark → System**. The choice persists to `localStorage`, follows your OS when set to *System*, and is applied before first paint so there is no flash of the wrong theme on load.
- **Validated JSON & CSV Import/Export**: Back up your workspace to `.json` or `.csv`, and import external files with a live validation preview supporting **Merge** or **Replace** modes.
- **Google Sign-In & Cloud Sync**: Sign-in is required. Each user's tasks are stored in Cloud Firestore (one document per task) and sync live across devices and tabs. An offline cache keeps the app usable without a connection and sends queued changes when you reconnect. Signing out clears this device's cached copy.
- **Carries Over Browser Data**: On first sign-in, tasks saved in the browser by earlier versions are uploaded to a new account, or offered for merging into an existing one. The browser copy is kept as a backup.

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
| `?` | Workspace (when no input is focused) | Open the keyboard shortcuts cheatsheet |
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
- **Workflow**: Track tasks throughout the week; every change is saved to your account instantly. On Friday, open the **Export / Import** modal and download a **CSV Spreadsheet** (including completed Pomodoro counts, priorities, due dates, and serialized subtasks) for weekly reporting, or export a **JSON Backup** to transfer the workspace to another machine.

---

## Architecture & Project Structure

Core state transformations, filtering, sorting, and serialization are decoupled from React components so they can be verified deterministically with Node's native test runner:

- `src/utils/todoLogic.ts`: Pure functions for task CRUD, subtask checklists, Pomodoro increments, multi-criteria filtering/sorting, workspace statistics, and RFC-4180 CSV / JSON serialization and validation.
- `src/utils/todoLogic.test.ts`: Unit test suite (`node:test` + `node:assert/strict`) covering task creation, Pomodoro tracking, subtask operations, reordering, filtering, stats, and JSON/CSV round-trip import/export.
- `src/hooks/useFocusTimer.ts`: Custom React hook managing persistent timestamp-based countdowns, live `document.title` updates, browser notifications, and sound triggers.
- `src/hooks/useTheme.ts`: Theme hook managing the Light/Dark/System preference — persistence, live OS-change tracking, and applying the `dark` class + `color-scheme` to `<html>`.
- `src/components/ShortcutsModal.tsx`: The `?` keyboard shortcuts cheatsheet dialog.
- `src/lib/firebase.ts`: Firebase app, Auth and Firestore setup (offline cache, emulator switch). The web config here identifies the project and is not secret.
- `src/AuthGate.tsx`, `src/components/SignInScreen.tsx`, `src/hooks/useAuth.ts`: Required Google sign-in, and sign-out that clears the local cache.
- `src/hooks/useFirestoreTodos.ts`: Live Firestore listener plus a `setTodos` that writes only changed tasks. It never writes before the first snapshot, so an empty initial list can't wipe an account.
- `src/utils/syncLogic.ts` (+ `.test.ts`): Pure diffing and batching used by the sync hook.
- `src/hooks/useLocalImport.ts`: One-time carry-over of tasks saved in the browser before sign-in.
- `src/utils/persistence.ts`: Task sanitization (shared by sync) and reading of pre-sync `localStorage` data.
- `firestore.rules` (+ `tests/firestore.rules.test.ts`): Each user can only read and write their own tasks, and writes must have the exact task shape.
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

# Start the development server at http://localhost:3000 (uses the real Firebase project)
npm run dev
```

### Developing against local emulators (no real data touched)
Requires Java 21+ for the Firebase emulators.
```bash
# Terminal 1: Auth + Firestore emulators (emulator UI at http://localhost:4000)
npm run emulators

# Terminal 2: the app, pointed at the emulators
npm run dev:emulators
```
In emulator mode, "Continue with Google" opens the Auth emulator's test account page instead of real Google sign-in.

### Running Tests
```bash
npm test            # unit tests
npm run test:rules  # Firestore security rules, against the emulator (needs Java)
```

### Building & Deploying
```bash
npm run build
npm run deploy      # build + deploy Hosting and Firestore rules (needs `npx firebase login`)
```

### Firebase project setup (one-time)
The app uses the Firebase project `focuslist-ee442`. In the [Firebase console](https://console.firebase.google.com/):
1. **Authentication → Sign-in method**: enable **Google** and set a support email.
2. **Firestore Database**: create the database in **production mode**. Pick the region closest to your users; it can't be changed later.
3. **GitHub deploys**: run `npx firebase login`, then `npx firebase init hosting:github`. It creates a service account and the `FIREBASE_SERVICE_ACCOUNT_FOCUSLIST_EE442` repository secret. When it offers to write workflow files, keep the ones in `.github/workflows/` (or restore them with `git checkout .github`).
4. **Google Cloud IAM**: give that service account the **Firebase Rules Admin** and **Cloud Datastore Index Admin** roles so CI can deploy the security rules.
5. *(Recommended)* **Google Cloud → APIs & Services → Credentials**: restrict the browser API key to the `focuslist-ee442.web.app`, `focuslist-ee442.firebaseapp.com` and `localhost` referrers.
6. **Pull request previews**: if Google sign-in fails on a preview URL with "unauthorized domain", add that domain under **Authentication → Settings → Authorized domains**.

### Continuous deployment
- **Pull requests**: lint, unit tests, build and rules tests run, then a Firebase Hosting preview channel is deployed and its URL is posted on the PR.
- **Merges to `main`**: the same checks run, then the site deploys to `https://focuslist-ee442.web.app` and the Firestore rules are deployed.
- Until the deploy secret exists, the deploy steps are skipped with a notice; the checks still run.
