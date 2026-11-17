# Focuslist — UI/UX Improvement Plan

A prioritized, grounded plan for improving the **interface and experience** — separate
from the feature/bug plan in `IMPROVEMENT_PLAN.md`. Every item below comes from reading
the current code and screens, not a generic checklist. Each one says **what**, **why it
matters to the user**, **where** (files), and a rough **impact / effort**.

Work top-down: Tier 1 is cheap and high-impact; Tier 3 is bigger bets. Do one item per
sitting, on a branch, and look at it in both light and dark mode before moving on.

> Legend — Impact: ⭐ low · ⭐⭐ medium · ⭐⭐⭐ high. Effort: ⚡ small · ⚡⚡ medium · ⚡⚡⚡ large.

---

## Tier 1 — Quick wins (polish that users feel immediately)

- [x] **Toasts shouldn't shove the page down.** `⭐⭐ / ⚡`
  **Done:** floating bottom-center toast over an always-mounted `aria-live` region; verified the task list does not move when a toast appears.
  The confirmation/undo banner renders *inline* at the top of the task column
  (`src/App.tsx`), so every action nudges the whole list vertically. Move it to a fixed,
  bottom-center (or top-right) overlay that floats above content and animates in/out.
  *Why:* layout shift on every toggle/delete is disorienting and makes the Undo target
  jump.

- [x] **Bigger, consistent touch/click targets on row actions.** `⭐⭐ / ⚡`
  **Done:** shared `.icon-btn` (36px, 40px on touch) on list rows, calendar nav, board cards, modal closes and the toast; `.hit-area` invisibly extends tiny controls. On phones the row actions drop to their own line so titles keep full width.
  Edit / delete / reorder / subtask-toggle buttons are `p-1`–`p-1.5` around a
  `w-3.5 h-3.5` icon — well under the ~40px comfortable tap size, and they sit close
  together (`TaskItem.tsx`, `CalendarView.tsx`). Pad to a ≥36–40px hit area (keep the
  icon size) and add a hover/focus background so the target is visible before the click.
  *Why:* fat-finger misses on mobile; low discoverability on desktop.

- [x] **Don't encode priority by color alone.** `⭐⭐ / ⚡`
  **Done:** *Correction:* list rows already showed a text label, so the real gaps were elsewhere. High priority now uses a filled flag, and calendar chips (where color was the only signal) get an overdue/high icon plus an `aria-label` suffix.
  Priority shows as a colored flag + colored text (red/amber/slate). For color-blind
  users and in dense board columns this is ambiguous. Keep the color but add a short
  text/shape token (e.g. a filled vs. outline flag, or `P1/P2/P3`). *Why:* WCAG 1.4.1
  (use of color) + faster scanning.

- [x] **More due-date presets + a quick "clear".** `⭐⭐ / ⚡`
  **Done:** added *Weekend* and *Next week* (pure, tested functions; de-duplicated against Today/Tomorrow; the real date is the tooltip). *Correction:* a "No Date" clear button already existed.
  `TaskInput` offers only *Today* and *Tomorrow* plus a raw date field. Add *This
  weekend*, *Next week*, and a one-click *No date / Clear*. *Why:* the raw
  `mm/dd/yyyy` input is the slowest part of capture, which is where this app should feel
  fastest.

- [x] **Show the keyboard shortcuts in-app.** `⭐⭐ / ⚡`
  **Done:** `?` opens a cheatsheet dialog; also a header button and a command-palette entry. Not done: hover `kbd` hint chips.
  Shortcuts exist (`N`, `/`, `Ctrl+K`, Zen `Space/R/M/Esc`) but are only in the README.
  Add a `?` shortcut that opens a small shortcuts cheatsheet modal, and surface hints as
  `kbd` chips on hover. *Why:* the app's whole value prop is keyboard speed — make it
  discoverable.

- [x] **Focus-visible rings everywhere interactive.** `⭐⭐ / ⚡`
  **Done:** one global `:focus-visible` rule (indigo, readable on light, dark and the always-dark cards) replaced the per-element utilities; the borderless title field gets a focus-within ring.
  Some controls have `focus-visible:outline` (sidebar, board title), many don't (icon
  buttons, segmented toggles, selects). Standardize one focus-ring utility across all
  buttons/inputs. *Why:* keyboard users currently lose track of focus; also WCAG 2.4.7.

- [x] **Empty-state for the timer / "no focused task".** `⭐ / ⚡`
  **Done:** *Correction:* an empty state existed but said "All tasks completed" even with zero tasks. It now distinguishes the two cases and offers an "Add a task" button.
  When there are no active tasks, the Focus panel still shows a dropdown. Add a gentle
  "Add a task to start a focus session" state. *Why:* removes a dead-end control.

---

## Tier 2 — Interaction & hierarchy (the app starts to feel "designed")

- [ ] **Drag-and-drop reordering (list) and drag-between-columns (board).** `⭐⭐⭐ / ⚡⚡`
  Today the only reorder is up/down arrow buttons (`moveTodoOrder`), and the Priority
  Board is read-only — you can't drag a card from *Medium* to *High*. Add pointer + keyboard
  drag (e.g. dnd-kit, which is accessible) so dragging a card across columns updates its
  priority, and dragging in the list sets manual order. *Why:* this is the single biggest
  "why can't I just…" gap; a Kanban you can't drag feels broken.

- [ ] **Fix board card legibility at narrow widths.** `⭐⭐ / ⚡⚡`
  In the 3-column board, titles wrap to 4–6 lines ("Pick up fresh espresso beans and oat
  milk") and metadata crowds. Clamp the title to 2 lines with a tooltip, tighten the meta
  row, and let columns scroll independently with a sticky column header + count. *Why:*
  the board is currently harder to scan than the list it's meant to improve on.

- [ ] **Inline quick-add inside each board column / calendar day.** `⭐⭐ / ⚡⚡`
  Calendar already has a per-day `+`; mirror it: an "+ Add" affordance at the bottom of
  each board column that creates a task pre-set to that priority. *Why:* keeps capture in
  context instead of bouncing to the top form.

- [ ] **Richer task rows: progress + overdue emphasis.** `⭐⭐ / ⚡`
  Subtasks show `1/3` as text; add a thin progress bar. Overdue items only differ by text
  color — add a left accent border or subtle tint so they pop in a long list
  (`TaskItem.tsx`). *Why:* at-a-glance triage.

- [ ] **Animated, reduced-motion-aware transitions.** `⭐⭐ / ⚡⚡`
  Add tasteful enter/exit and reorder animations (complete, delete, move). The CSS already
  honors `prefers-reduced-motion`, so gate motion on it. *Why:* state changes currently
  "pop"; smooth motion communicates what moved where. (Keep it subtle — this is a
  productivity tool, not a toy.)

- [ ] **Consistent modal system.** `⭐⭐ / ⚡⚡`
  Edit, New-from-calendar, Command Palette, and Portability each hand-roll backdrop +
  focus trap. Extract one `<Modal>` (backdrop, `Esc`, focus trap via the existing
  `useFocusTrap`, scroll-lock, enter/exit transition) and reuse it. *Why:* consistency +
  fewer a11y gaps, and scroll-lock is currently missing (background scrolls behind modals).

- [ ] **Sticky workspace toolbar.** `⭐ / ⚡`
  The status/layout/search/sort controls scroll away. Make the filter+search bar sticky
  under the header so filtering a long list doesn't require scrolling back up.

---

## Tier 3 — Larger bets (structure, mobile, accessibility depth)

- [ ] **Mobile-first pass.** `⭐⭐⭐ / ⚡⚡⚡`
  On small screens the sidebar collapses to a horizontal chip scroller and the Focus panel
  stacks to the bottom (`App.tsx` `flex-col xl:flex-row`). Audit end-to-end on a phone:
  one-handed reach for primary actions, a bottom action bar or FAB for "New Task", larger
  controls, and making the board horizontally swipeable. *Why:* a daily planner is used on
  phones; the current layout is desktop-first.

- [ ] **Accessibility deep pass.** `⭐⭐⭐ / ⚡⚡`
  Beyond focus rings and color: audit the `role="button"` spans and `role="checkbox"`
  buttons in `App.tsx`/`TaskItem.tsx` for correct roles/labels/keyboard semantics, add
  `aria-live` announcements for add/complete/delete/undo, label the sort/filter groups,
  verify the command palette's `listbox`/`option` semantics and `aria-activedescendant`,
  and run axe + full keyboard-only and screen-reader passes. *Why:* real inclusivity, and
  it hardens the keyboard-first promise.

- [ ] **A real design-token layer (spacing/radius/elevation/semantic color).** `⭐⭐ / ⚡⚡`
  Colors are mostly hardcoded Tailwind classes (`bg-white`, `text-slate-900`, …) with the
  dark variants added per-class. Promote the recurring pairs to semantic tokens —
  `surface`, `surface-muted`, `border`, `text`, `text-muted`, `accent` — as CSS variables
  consumed by a few utility classes, so future theme/brand changes are one place, not 300.
  *Why:* maintainability and visual consistency; shrinks the dark-mode surface area.

- [ ] **Onboarding / first-run.** `⭐⭐ / ⚡⚡`
  First-time users land on seeded demo tasks with no guidance. Add a dismissible one-time
  tour or a "sample vs. start empty" choice, and make the "Restore Sample Tasks" action
  clearly reversible. *Why:* demo data is helpful but can feel like clutter you must clean
  up.

- [ ] **Density toggle (comfortable / compact).** `⭐ / ⚡⚡`
  Power users want more rows per screen; new users want breathing room. A compact-mode
  toggle (persisted, like the theme) that tightens padding/line-height. *Why:* serves both
  audiences without compromising the default.

- [ ] **Views & personalization memory.** `⭐⭐ / ⚡`
  Persist the last layout (list/board/calendar), sort, and active view to `localStorage`
  (now that there's a clean persistence layer to extend). *Why:* returning to your chosen
  view each morning is a small, constant delight.

---

## Tier 1 follow-up notes

Two bugs of my own were found and fixed while verifying this batch:

- The automated dark-mode pass had dimmed text inside the always-dark timer card and
  briefing banner (it applied `dark:text-slate-500` to already-dark surfaces). Removed.
- `loadTodos` re-seeded the demo tasks if you deleted every task and reloaded, because it
  treated an empty stored list as "nothing saved". An intentionally empty workspace now
  stays empty, while a list whose entries were *all* invalid is still treated as corrupt.
  Covered by new `persistence.test.ts` cases.

## Suggested order

1. **Tier 1 top-to-bottom** — a weekend of small, visible polish (toasts, hit areas,
   focus rings, presets, shortcut cheatsheet).
2. **Drag-and-drop + board legibility** — the highest-impact interaction fixes.
3. **One `<Modal>` + sticky toolbar + richer rows** — consistency and triage.
4. **Mobile + accessibility passes**, then the **token layer** to lock in consistency.

## How to validate each change

- Check it in **light and dark**, and at **phone width** (DevTools ~375px), before moving on.
- Keyboard-only: can you reach and operate the new control, and is focus always visible?
- Does any action cause **layout shift** or scroll jumps? (It shouldn't.)
- Re-run `npm run lint` and `npm test`; add/extend a test when you change logic.
