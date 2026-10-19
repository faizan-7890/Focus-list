# Focuslist Enhancement Plan — Command Palette & Data Portability

This enhancement equips Focuslist with a keyboard-first Command Palette (`Cmd/Ctrl + K`) for instant navigation and task actions alongside full-fidelity JSON and CSV task import/export for portable local backups and spreadsheet reporting.

## User Review & Critical Decisions

> [!IMPORTANT]
> All enhancement priorities have been aligned with your selections. Review the import conflict strategy below before proceeding to implementation.

- **Confirmed Decision 1 — Data Portability (JSON & CSV Import/Export)**: Users can export their entire task workspace to structured JSON (preserving subtasks and ordering) or RFC-4180 CSV (for spreadsheet analysis), and import JSON or CSV files with live validation previews.
- **Confirmed Decision 2 — Workflow Interaction (Command Palette)**: A global Command Palette (`Cmd/Ctrl + K`) provides fuzzy search and single-keystroke execution across smart views, layout modes, focus timer controls, bulk task actions, and data export/import.
- **Confirmed Decision 3 — Storage Posture (Local Storage + Backup Export)**: All task state remains fast, private, and instantaneous in `localStorage`, augmented by one-click backup downloads and a user-selectable **Merge vs. Replace** import mode.

---

## 1. Overview & Core Concept

- **What It Does**: Adds two power-user pillars to Focuslist:
  1. **Command Palette (`Cmd/Ctrl + K`)**: A modal command runner that lets users jump to any view (*Due Today*, *High Priority*, *Work*, *Board View*), trigger actions (*Start/Pause Focus Timer*, *Complete All*, *Clear Completed*, *New Task*), search and toggle specific tasks, or launch *Export / Import* without touching the mouse.
  2. **JSON & CSV Import / Export Hub**: A dedicated portability workflow accessible from the sidebar and Command Palette that exports tasks to `.json` or `.csv` files and imports external `.json` or `.csv` task lists with schema validation, row-level error reporting, and a choice to either **Merge with existing tasks** or **Replace current workspace**.
- **Target Audience / Persona**: Keyboard-driven individual contributors, engineers, and solo planners who value zero-latency local state, rapid keyboard navigation, and full ownership of their data across devices and spreadsheets.
- **Key Value**: Eliminates pointer-heavy navigation via `Cmd/Ctrl + K` while guaranteeing that browser-stored tasks can be backed up, migrated, or analyzed in Excel/Google Sheets at any time.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Executing Actions via Command Palette (`Cmd/Ctrl + K`)**:
   - Pressing `Cmd + K` (macOS) or `Ctrl + K` (Windows/Linux) — or clicking the `Command Palette (⌘K)` trigger in the workspace header/sidebar — opens a centered command overlay.
   - Typing filters grouped commands in real time across four categories: **Quick Actions** (*Create New Task*, *Start Focus Timer*, *Clear Completed Tasks*), **Navigation & Views** (*Switch to Board View*, *Filter: High Priority*, *Project: Work*), **Data Portability** (*Export Tasks as JSON*, *Export Tasks as CSV*, *Import Tasks from File*), and **Active Tasks** (*Toggle completion or edit matching tasks*).
   - Using `ArrowUp` / `ArrowDown` moves the active highlight; pressing `Enter` executes the command and closes the palette; pressing `Escape` or clicking the backdrop dismisses it cleanly.

2. **Exporting Tasks (JSON Backup & CSV Spreadsheet)**:
   - Selecting **Export JSON** immediately downloads `focuslist-backup-YYYY-MM-DD.json` containing the complete task array, subtasks, priorities, and timestamps.
   - Selecting **Export CSV** downloads `focuslist-tasks-YYYY-MM-DD.csv` with properly escaped columns (`Title`, `Status`, `Priority`, `Project`, `Due Date`, `Notes`, `Subtasks Summary`) ready for spreadsheet software.

3. **Importing Tasks with Validation & Merge/Replace Control**:
   - Opening **Import Tasks** presents a clean dialog where users can upload a `.json` or `.csv` file (or paste raw JSON/CSV text).
   - Before modifying state, Focuslist parses and validates the payload, displaying a tabular preview summary (`Valid tasks found`, `Subtasks included`, or specific line-level validation errors paired with an alert icon).
   - The user chooses **Merge (Keep existing tasks and append imported)** or **Replace (Overwrite workspace with imported tasks)** and clicks **Confirm Import**.

### Visual Identity & Theme

- **Aesthetic Direction**: Continues Focuslist's quiet, editorial-utilitarian SaaS workspace aesthetic — crisp structural surfaces, hairline stone borders, zero static pills, and tabular monospace metrics.
- **Color Palette & Mood**:
  - **Canvas**: Warm stone `#F4F4F0` (`--color-canvas`)
  - **Structural Surfaces**: Pure white `#FFFFFF` (`--color-surface`) with `#E7E5E4` (`border-stone-200`) hairline dividers
  - **Primary Accent & Command Header**: Deep obsidian `#0F172A` (`--color-ink` / `--color-accent`)
  - **Semantic Status**: Emerald `#059669` (`--color-success`) for valid import summaries and completed states; Amber `#B45309` for warnings; Crimson `#DC2626` (`--color-danger`) for validation errors
- **Typography & Hierarchy**:
  - **Headings**: `Plus Jakarta Sans` (`600`/`700`) for modal titles and section headers
  - **Body & Command Labels**: `DM Sans` (`400`/`500`) for scannable command rows
  - **Keyboard Shortcuts & Counts**: `JetBrains Mono` (`tabular-nums`) for shortcut hints (`⌘K`, `↑↓`, `ESC`) and import/export record counters
- **Interactive Feedback & Motion**:
  - Transitions use `opacity` and `transform` only, settling within `150ms` and respecting `@media (prefers-reduced-motion: reduce)`.
  - Inline status banners confirm completed imports and exports with an explicit icon and message.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Two-Stage Validated Import (Preview Before Commit)**
  - *Chosen Approach*: Parse uploaded JSON/CSV files into a staging preview with validation counts and a **Merge vs. Replace** selector before mutating the task list.
  - *Why*: Prevents accidental data loss or corrupted task rows if a user uploads a malformed CSV or an older backup file.
  - *Alternatives Considered*: Immediate blind overwrite on file selection (rejected because a single misclicked file would wipe active local tasks).
- **Decision 2: Lossless Subtask Serialization in CSV**
  - *Chosen Approach*: JSON exports preserve full nested subtask objects; CSV exports serialize subtasks in a human-readable pipe-delimited column (`[x] Step 1 | [ ] Step 2`) that the CSV importer can also reconstruct back into subtasks.
  - *Why*: Allows round-trip editing in spreadsheets without losing checklist steps.
  - *Alternatives Considered*: Dropping subtasks from CSV exports (rejected because checklist steps are core to task progress).

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        Focuslist Workspace State                          │
│         (Todos Array, Active View, Layout Mode, localStorage Sync)        │
└───────────────┬───────────────────────────────────────────┬───────────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────┐
│      Command Palette (Cmd/Ctrl+K)     │   │   Portability Hub & Engine    │
│ ┌───────────────────────────────────┐ │   │ ┌───────────────────────────┐ │
│ │ Fuzzy Search & Keyboard Navigator │ │   │ │ JSON Serializer / Parser  │ │
│ │ (ArrowUp/Down, Enter, Escape)     │ │   │ └─────────────┬─────────────┘ │
│ └─────────────────┬─────────────────┘ │   │ ┌─────────────┴─────────────┐ │
│                   ▼                   │   │ │ RFC-4180 CSV Codec        │ │
│ ┌───────────────────────────────────┐ │   │ │ (Subtask Pipe Encoding)   │ │
│ │ Action Dispatcher                 │ │   │ └─────────────┬─────────────┘ │
│ │ • View / Filter / Layout Switches │ │   │               ▼               │
│ │ • Focus Timer & Task Toggles      │ │   │ ┌───────────────────────────┐ │
│ │ • Trigger Export / Open Import    │ │   │ │ Staged Preview & Validator│ │
│ └───────────────────────────────────┘ │   │ │ (Merge vs. Replace Commit)│ │
└───────────────────────────────────────┘   └───────────────────────────────┘
```

### Data Model & State

- **Command Item Model**: Represents each executable entry in the Command Palette with `id`, `label`, `category` (`Action`, `Navigation`, `Data`, `Task`), `keywords`, `shortcutHint`, and `onExecute` callback.
- **Import Validation Result**: Pure data structure returned by the parser containing `validTodos`, `errors` (line number + reason), `sourceFormat` (`json` | `csv`), and `totalSubtasks`.
- **Import Mode**: `'merge'` (deduplicates by `id` or prepends new tasks while preserving existing items) or `'replace'` (replaces the task array with the validated import set).

### Interactive Component & State Mapping

- **Global Keyboard Listener (`Cmd/Ctrl + K`)**: Toggles `isCommandPaletteOpen` from anywhere in the app (even when an input is focused), resets the palette search query, and focuses the command search input.
- **Command Palette Navigation**:
  - Typing into the command search bar filters commands by label, category, and keywords; if zero commands match, an explicit empty state offers a one-click *"Create task with this title"* action.
  - `ArrowDown` and `ArrowUp` cycle `selectedIndex` with wrap-around bounds; `Enter` invokes the highlighted command's handler and closes the modal.
- **Data Portability Modal & Sidebar Controls**:
  - Clicking **Export JSON** or **Export CSV** invokes pure serializer functions, generates a `Blob` download, and displays a confirmation notice.
  - Selecting a `.json` or `.csv` file (or pasting content) runs the pure parser and populates the staging preview; invalid rows display inline with `AlertCircle` icons and line numbers; clicking **Confirm Import** applies the chosen `merge` or `replace` operation to `todos` and persists to `localStorage`.
