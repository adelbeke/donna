# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Donna is a GitHub PR dashboard that ships as **two products from one React codebase**:

- **Electron app** (macOS, the primary target): full features including the Branches tab. Auth and all GitHub calls are delegated to the local `gh` CLI — no token is ever stored.
- **Web app** (GitHub Pages at `adelbeke.github.io/donna`): browser-only, authenticates with a classic PAT kept in `localStorage`, and **omits the Branches tab**.

Understanding the split between these two modes is the key to working in this repo.

## Commands

```bash
npm run dev            # web renderer on http://localhost:5173/donna/
npm run dev:electron   # Electron window (expects the vite dev server above to be running)
npm run lint           # ESLint (flat config)
npm test               # vitest watch
npm run test:run       # vitest once  — run a single file: npm run test:run src/lib/prUtils.test.ts
npm run build          # web build: tsc -b && vite build
npm run build:electron # electron-vite build && electron-builder (produces signed .dmg)
```

CI (`.github/workflows/ci.yml`) runs `lint`, `test:run`, then `build` on every PR — all three must pass.

## Main Features

**Pull Requests view** (`prs`) — three sections selected in the left `Filters` sidebar, each a different GitHub search (`buildSearchQuery`):
- **Review requested** / **My PRs** (authored) / **Mentioned**.
- Per-PR actions on each `PRCard`: **star** (top-priority, pinned above the list and persisted), **hide** (dims + filtered out unless "Hidden" toggle is on), **copy PR link**, open externally.
- **Mute authors**: free-form patterns (e.g. `dependabot`) that filter out their PRs.
- Filters: by repository (checkboxes, shown only when >1 repo loaded), title search (navbar), show/hide **drafts**, show/hide **hidden**.
- Each card shows repo, author, `#number`, opened/updated ages, diff size (`+/-`), draft/hidden badges, **my review-state** badge, a **CI checks** badge that opens a `ChecksPanel` popover (lazy-loads per-check contexts), and a **conflict** badge when `mergeable === 'CONFLICTING'`. In the authored section, cards also show grouped **reviewer avatars** (approved / changes-requested / commented / pending).
- Paging: "Load more" / "Load all" (capped — see pipeline below), with a truncation notice past the cap.

**Branches view** (`branches`, **Electron-only**) — `BranchList` reads *local* git repos the user adds via a native directory picker:
- Lists branches per repo with **worktree detection**, a **dirty-state** dot for uncommitted changes, and the **linked open PR** (matched by `repo/headRefName`).
- One-click copy of `git switch <branch>` and `cd <worktree-path>`.

**App-wide**: light/dark theme toggle, OTA self-update banner (Electron), version in the footer.

## Repository layout

```
electron/            Electron main + preload (Node side; the only place that shells out)
  main.ts            ipcMain handlers: gh:graphql/rest/installed, branches/worktrees list, dialog, updater
  preload.ts         contextBridge → window.electronAPI (typed in src/types/electron.d.ts)
src/
  App.tsx            QueryClient setup + container switch (IS_NATIVE → AppContainer or WebContainer)
  AppContainer.tsx   Electron entry: gh CLI auth probe, error screen, mounts DashboardPage
  WebContainer.tsx   Web entry: PAT gate, mounts AuthPage or DashboardPage
  main.tsx           React entry
  index.css          Tailwind v4 @theme tokens + [data-theme="light"] overrides
  pages/             AuthPage (web PAT entry), DashboardPage (navbar + view switch)
  components/        One folder per component: ComponentName/ComponentName.tsx (+ .test.tsx)
                     PRCard/ (PRCard, ReviewerAvatars, ChecksPanel), PRList/, Filters/,
                     BranchList/, Footer/, shared/ (CopyWithFeedback)
  hooks/             react-query wrappers: useGitHubPRs (core), useCheckContexts, useViewer,
                     useTheme, useUpdateCheck
  store/             Zustand stores: authStore, prStore, branchStore
  lib/               github.ts (clients + GraphQL queries), prUtils.ts & prFilters.ts (pure,
                     well-tested), timeAgo.ts, electron.ts (IS_NATIVE), features.ts (FeaturesContext)
  types/             github.ts (API shapes), worktree.ts, electron.d.ts (window global)
```

`src/config.ts` is empty. `src/hooks/useBranches.ts`, `useRepos.ts`, `useRecentRepos.ts` exist but are **not wired into any view** (the live Branches tab uses local git via IPC, not these GraphQL/REST hooks) — treat them as dormant, not load-bearing.

## The native-vs-web abstraction

The renderer never branches on platform ad hoc. It goes through three seams:

1. **`AppContainer` / `WebContainer`** — the top-level split. `App.tsx` uses `IS_NATIVE` exactly once to choose which container to render. All platform-specific bootstrap logic (auth flow, error screens) lives in these two files and nowhere else.

2. **`FeaturesContext`** (`src/lib/features.ts`) — a static React context (never updated after mount) that carries the set of gated `Feature` values. `AppContainer` provides `new Set(['branches'])`; `WebContainer` leaves the default empty Set. Components read it via `useFeatures()` — **never import `IS_NATIVE` inside a component**, use `features.has('branches')` instead. To add a new gated feature: add it to the `Feature` union type and set it in `AppContainer`.

3. **`createClient(token)` / `restFetch(url, token)`** (`src/lib/github.ts`) — the transport seam. In Electron they call `window.electronAPI.gh.graphql/.rest`, which IPCs to `electron/main.ts` and shells out to `gh api`. In the browser they hit `api.github.com` directly with the PAT. **Data hooks stay platform-agnostic by always going through these functions** — never call `fetch` to GitHub or read `window.electronAPI` directly from a hook/component.

Anything that touches the local filesystem (list branches, list worktrees, directory picker) is Electron-only and lives as an `ipcMain.handle` in `electron/main.ts`, exposed through `preload.ts`, typed in `src/types/electron.d.ts`. These shell out to local `git`. `main.ts` augments `PATH` with Homebrew dirs so the bundled `.app` can find `gh`/`git`.

Auth flow differs by container: `WebContainer` shows `AuthPage` until a PAT is set; `AppContainer` auto-probes `gh` on launch, sets a sentinel token `'gh-cli'`, and shows an error screen with a Retry button if `gh` is missing or not logged in.

## State management

Two layers, deliberately separated:

- **TanStack Query** owns all server data (PRs, branches, check contexts, viewer, update check). A global `QueryCache.onError` handler (`App.tsx`) calls `expireSession()` on auth errors so a 401/403 logs the user out everywhere.
- **Zustand** owns UI/client state, persisted to `localStorage`:
  - `authStore` (`pr-dashboard-auth`) — token + user.
  - `prStore` (`pr-dashboard-state`) — current view (`prs`/`branches`), filters, and the `priorityIds` / `hiddenIds` arrays (starred and hidden PRs).
  - `branchStore` (`branch-dashboard-state`) — the list of local repo paths the user added.
  - Theme is a separate raw `localStorage['theme']` key managed by `useTheme`.

## PR data pipeline

`usePullRequests` (`src/hooks/useGitHubPRs.ts`) is the core read path:

1. `buildSearchQuery(section, login)` turns the active section (`review-requested` / `authored` / `mentioned`) into a GitHub search string.
2. `useInfiniteQuery` pages the GraphQL `search` (20/page, capped at `MAX_PAGES = 10`; `truncated` flags when the cap hides more).
3. Each node is enriched in-memory with `myReviewState` (`deriveMyReviewState`), `isTopPriority`, `isHidden`.
4. `applyFilters` (`src/lib/prFilters.ts`) drops drafts/hidden/repo/author/search misses.
5. `sortAndPartition` (`src/lib/prUtils.ts`) sorts by `updatedAt` and splits priority PRs (pinned on top) from the rest.

All GraphQL queries live as exported template strings in `src/lib/github.ts`. The pure derivation helpers in `prUtils.ts` (review summaries, check rollup state) are the most heavily unit-tested part of the app — keep them pure and add cases there rather than testing through components.

## Code standards

These are conventions the existing code follows consistently — match them:

- **TypeScript is strict.** `tsconfig.app.json` sets `verbatimModuleSyntax` (so type-only imports **must** use `import type { … }`), `noUnusedLocals`/`noUnusedParameters`, `erasableSyntaxOnly` (no runtime-emitting TS like enums/namespaces — use union string types as in `types/github.ts`), and `noFallthroughCasesInSwitch`. Avoid `any`; the one place it's needed is `eslint-disable`d inline.
- **Components**: one component per folder as `Name/Name.tsx` with a colocated `Name.test.tsx`; default-exported. Small sub-components (e.g. `CheckIcon`) can be local to the file. Lookup tables keyed by a union type (`Record<ReviewState, …>`) are the idiom for badge/icon config rather than `if/else` chains.
- **Styling**: Tailwind v4 utility classes only — no CSS modules, no inline styles. **All colors go through `var(--color-*)`** in arbitrary-value classes (`bg-[var(--color-surface)]`), never raw palette classes like `bg-gray-900`, so both themes work. Recurring patterns: `cursor-pointer` on every interactive element, `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` for keyboard a11y, and the `group` + `opacity-0 group-hover:opacity-100` reveal for card hover actions. Icons come from `lucide-react`.
- **External links** always use `target="_blank" rel="noopener noreferrer"`; in Electron these are forced to the system browser by `setWindowOpenHandler` in `main.ts`.
- **Data layer**: GraphQL query strings are constants in `lib/github.ts`; hooks are thin react-query wrappers keyed on `[resource, …deps, login]` with explicit `staleTime` and `enabled: !!token`. Server pagination is always bounded (10-page caps) with an explicit truncation signal rather than unbounded fetching. Keep business logic in pure `lib/*` functions (testable) and out of components.
- **Zustand**: subscribe with narrow selectors (`usePRStore((s) => s.priorityIds)`) to avoid needless re-renders; persisted stores declare explicit `partialize`/`merge` to keep `localStorage` migration-safe.
- **Magic numbers** are pulled into named `const`s (see `CopyWithFeedback`, `MAX_PAGES`).
- Comments prefixed `// ponytail:` mark intentional non-obvious decisions; preserve them and add your own when a choice would otherwise look like a mistake.

## Build configs

Two separate Vite configs, both injecting `__APP_VERSION__` from `package.json` (declared in `electron.d.ts`):

- `vite.config.ts` — the web build (`base: '/donna/'`) **and** the Vitest config (jsdom, globals, `src/test/setup.ts`).
- `electron.vite.config.ts` — the three Electron bundles (main / preload / renderer) for `electron-vite`.

## Tests

Vitest + Testing Library + jsdom. Tests are colocated (`Foo.tsx` ↔ `Foo.test.tsx`). `npm test` watches; `npm run test:run` is the one-shot used by CI.

## Conventions

- **Conventional Commits** are required — the release changelog is generated by grepping `feat:` / `fix:` / `docs:` prefixes, and PR titles feed it. Branches: `feat/...`, `fix/...`. Keep one logical change per PR.

