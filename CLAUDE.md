# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Focuslist is a keyboard-driven task and priority manager. Stack: React 19, TypeScript, Vite 8,
Tailwind CSS 4 and the Firebase JS SDK 12.

- **Sign-in is required:** Google, through Firebase Auth.
- **Storage:** each user's tasks live in Cloud Firestore at `users/{uid}/todos/{todoId}`, one
  document per task.
- **Hosting:** the site is served by Firebase Hosting from project **`focuslist-ee442`**
  (https://focuslist-ee442.web.app).
- **Every merge to `main` deploys production automatically.**

## Commands

```bash
npm run dev            # app on http://localhost:3000, against the REAL Firebase project
npm run emulators      # Auth :9099 + Firestore :8080 emulators (UI :4000); needs Java 21
npm run dev:emulators  # app pointed at the emulators (no real data touched)
npm run lint           # tsc --noEmit (the only linter)
npm test               # unit tests (node:test via tsx)
npm run test:rules     # Firestore security-rule tests on the emulator; needs Java 21
npm run build          # vite build -> dist/
npm run deploy         # build + deploy Hosting and Firestore rules (needs `npx firebase login`)
```

- `npm test` lists its test files **explicitly**; there is no glob. When you add a
  `*.test.ts`, add it to the `test` script in `package.json`, or it will never run.
- Before committing, run `npm run lint` and `npm test`. Also run `npm run test:rules` whenever
  `firestore.rules` or the task shape changes.

## Architecture

- `src/main.tsx` → `src/AuthGate.tsx` → `<App key={user.uid} user={user} />`. The `key`
  remounts the app when the account changes.
- Every task mutation in `src/App.tsx` is `setTodos(prev => pureFn(prev))`. The pure functions
  live in `src/utils/todoLogic.ts`. Add new behaviour there, with tests, not inline in
  components.
- `src/hooks/useFirestoreTodos.ts` returns a `setTodos` with React's setState contract. It
  diffs the new list against the last snapshot (`src/utils/syncLogic.ts`) and batch-writes
  only changed and deleted documents.
- Other key modules:
  - `src/hooks/useAuth.ts`: Google popup, then a redirect fallback. Sign-out clears the
    offline cache.
  - `src/hooks/useLocalImport.ts`: one-time import of pre-sync browser data.
  - `src/utils/persistence.ts`: `sanitizeTodo`, used by sync on both read and write.
  - `src/hooks/useTheme.ts`
  - `src/lib/firebase.ts`: app, auth, db (persistent multi-tab cache), and the emulator
    switch.

## Invariants: do not break

- **No Firestore writes before the first snapshot** (`hydratedRef` in `useFirestoreTodos`).
- **Deletes only target IDs a snapshot reported.** An empty initial list must never wipe an
  account.
- **Writes happen inside `setTodos`, not in an effect**, so a remote snapshot can't land
  between a local change and its write.
- Components never call Firestore directly; all task data goes through `useFirestoreTodos`.
- `firestore.rules` is the trust boundary. Never loosen it to work around a client bug.

## Changing the task shape (all four, in one PR)

1. `TodoItem` in `src/utils/todoLogic.ts`
2. `sanitizeTodo` in `src/utils/persistence.ts`
3. `serializeTodo` in `src/utils/syncLogic.ts`
4. The `hasAll` / `hasOnly` key lists and validation in `firestore.rules`, with new cases in
   `tests/firestore.rules.test.ts`

The rules must be deployed before or together with any client that writes the new field. CI
deploys them on merge.

## Firebase specifics

- **Stay on `firebase@12`.** `@firebase/rules-unit-testing` doesn't support v13 yet.
- **The web config in `src/lib/firebase.ts` is committed on purpose.** It identifies the
  project and is not a secret. Don't move it to env vars.
- **`authDomain`** is `focuslist-ee442.firebaseapp.com`. Switching it to `*.web.app` is an
  optional follow-up.
- **Emulators** use the project id `demo-focuslist`. Emulator mode is enabled by
  `--mode emulators` (or `VITE_USE_EMULATORS=true`); production builds strip that code.
- **Rules are deployed from `firestore.rules` by CI.** Editing them only in the Firebase
  console gets overwritten on the next deploy.
- **`localStorage` is only for** the theme (`focuslist_theme`), the timer state, and the
  one-time legacy import. Don't store tasks there.

## UI conventions

- **Dark mode is class-based** (`@custom-variant dark` in `src/index.css`). Every light
  colour class gets a `dark:` pair.
  - **Exception:** the always-dark surfaces get no `dark:` classes. They are
    `ZenModeModal.tsx`, the briefing banner in `App.tsx`, and the timer card in
    `FocusPanel.tsx`.
- **Patterns:**
  - Primary button: `bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900`.
  - Active or selected state: `bg-slate-900 text-white dark:bg-slate-700`.
- **Icon-only buttons** use `.icon-btn` (36 px, 40 px on touch) or `.icon-btn-sm`, and
  always get an `aria-label`. For tiny controls, `.hit-area` enlarges the click target
  invisibly.
- **Focus ring:** a single global `:focus-visible` ring is defined in `src/index.css`. Don't
  add per-element `focus-visible:outline-*` classes.
- **Toasts** float at the bottom (`showTransientNotice` / `showUndoableNotice` in
  `App.tsx`). Don't add inline banners that shift the layout.
- **Check UI changes** in light and dark mode, and at phone width (~375 px).

## Platform and workflow

- **The owner develops on Windows PowerShell.** npm scripts must be cross-platform: no
  `VAR=value cmd` syntax.
  - Known exception: `clean` uses `rm -rf`, which won't work in PowerShell.
- **Workflow:** branch per change, then a PR into `main`.
  - The PR workflow runs lint, unit tests, build and the rules tests, and posts a Hosting
    preview URL.
  - Merging runs `.github/workflows/firebase-hosting-merge.yml`, which deploys Hosting and the
    rules to production.
- **Commits:** conventional style with a scope, such as `feat(sync): …`, `fix(ux): …`,
  `docs: …` or `chore: …`. The body explains *why*.

## Docs to keep in sync

- `README.md`: features, setup, the Firebase setup steps, and CI/CD.
- `UI_UX_IMPROVEMENT_PLAN.md`: tick items as they're done. Tier 1 is complete.
- `docs/Focuslist-Technical-Documentation.pdf` is a generated snapshot as of 22 Nov 2026,
  with no source in the repo. Mention when a change makes it stale rather than editing it.
