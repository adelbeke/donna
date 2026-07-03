# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Donna is an open source GitHub companion — filter, prioritise, and track review status across all your repositories. The **Electron app** (macOS) is the sole functional product: full features including the Branches tab, with auth and all GitHub calls delegated to the local `gh` CLI — no token is ever stored.

The React renderer previously also shipped as a browser-only web app (GitHub Pages at `adelbeke.github.io/donna`), authenticating with a classic PAT kept in `localStorage`. That web app has been retired — GitHub Pages now serves a static `web-deprecated/index.html` pointing visitors to the latest release, built and deployed independently of the React app (see `.github/workflows/deploy.yml`). The renderer source no longer contains a web entry point (`WebContainer`/`AuthPage` were removed); `authStore` remains shared infrastructure used by the Electron app's `gh-cli` sentinel token flow.

## Commands

```bash
npm run dev            # web renderer on http://localhost:5173/donna/
npm run dev:electron   # Electron window (expects the vite dev server above to be running)
npm run lint           # ESLint (flat config)
npm test               # vitest watch
npm run test:run       # vitest once  — run a single file: npm run test:run src/features/pull-requests/lib/prUtils.test.ts
npm run build          # web build: tsc -b && vite build
npm run build:electron # electron-vite build && electron-builder (produces signed .dmg)
```

CI (`.github/workflows/ci.yml`) runs `lint`, `test:run`, then `build` on every PR — all three must pass.

## Main Features

**Pull Requests view** (`prs`) — three sections selected via the `PRSectionsTabs` sidebar tabs, each a different GitHub search (`buildSearchQuery`):
- **Review requested** / **My PRs** (authored) / **Mentioned**.
- Per-PR actions on each `PRCard`: **star** (top-priority, pinned above the list and persisted), **hide** (dims + filtered out unless "Hidden" toggle is on), **copy PR link**, open externally.
- **Mute authors**: free-form patterns (e.g. `dependabot`) that filter out their PRs.
- Filters: by repository/org (checkboxes in the `SettingsModal` gear-icon popover, shown only when >1 repo loaded), title search (above the list), show/hide **drafts**, show/hide **hidden** (`VisibilityToggles` in the list header).
- Each card shows repo, author, `#number`, opened/updated ages, diff size (`+/-`), draft/hidden badges, **my review-state** badge, a **CI checks** badge that opens a `PRChecksModal` popover (lazy-loads per-check contexts), and a **conflict** badge when `mergeable === 'CONFLICTING'`. In the authored section, cards also show grouped **reviewer avatars** (approved / changes-requested / commented / pending).
- Paging: pages auto-load in the background (capped at `MAX_PAGES = 10`); a spinner in the header badge shows while more pages are fetching.
- **Focus refresh**: when the window regains focus, `useFocusRefresh` (`hooks/useFocusRefresh.ts`) snapshots the current PR IDs and triggers a refetch. If new PRs appear, a `NewPRsBadge` is shown above the list; the list stays frozen at the pre-focus snapshot until the badge is dismissed or clicked. The `authored` section is excluded from this detection. Local mutations (star/hide) pass through the snapshot filter so they are always reflected immediately.

**Branches view** (`branches`, **Electron-only**) — `BranchDashboard` renders a branch-name search box plus `BranchList`, which reads *local* git repos the user adds via a native directory picker:
- Lists branches per repo with **worktree detection**, a **dirty-state** dot for uncommitted changes, and the **linked open PR** (matched by `repo/headRefName`).
- One-click copy of `git switch <branch>` and `cd <worktree-path>`.

**App-wide**: light/dark theme toggle, OTA self-update banner (Electron), version in the footer.

## Repository layout

```
electron/            Electron main + preload (Node side; the only place that shells out)
  main.ts            ipcMain handlers: gh:graphql/rest/installed, branches/worktrees list, dialog, updater
  preload.ts         contextBridge → window.electronAPI (typed in src/types/electron.d.ts)
src/
  App.tsx            QueryClient setup, always mounts AppContainer
  main.tsx           React entry
  index.css          Tailwind v4 @theme tokens + [data-theme="light"] overrides
  containers/        AppContainer.tsx (Electron: gh CLI auth probe, error screen, mounts DashboardPage)
                     DashboardPage.tsx (navbar + view switch)
  features/          Feature slices — each has components/, queries/, stores/ + exports.ts barrel
    auth/            authStore (token + user), backing AppContainer's gh-cli sentinel token flow
      stores/                authStore.ts (Zustand, persisted: token + user) + authStore.test.ts
      exports.ts             public surface: { useAuthStore }
    branches/        Electron-only Branches tab
      components/BranchDashboard/   BranchDashboard.tsx (search input + BranchList)
      components/BranchList/        BranchList.tsx + BranchList.test.tsx, BranchCard/ (BranchCard.tsx)
      stores/                       branchStore.ts (Zustand, persisted)
      types.ts                      branch-specific TypeScript types
      exports.ts                    public surface: { BranchDashboard }
    pull-requests/   PR inbox feature
      components/    PRDashboard/ (search input + SettingsModal + PRSectionsTabs + PRList),
                     PRSectionsTabs/ (+ .test.tsx — section tabs sidebar), SettingsModal/ (+ .test.tsx —
                     repo/org checkboxes, muted authors, hidden repos), PRList/ (PRList, PRList.test.tsx),
                     PRListHeader/, VisibilityToggles/ (drafts/hidden toggles), NewPRsBadge/ (+ .test.tsx),
                     NotificationHint/ (+ .test.tsx), PRCard/ (PRCard, PRCard.test.tsx, ReviewerAvatars),
                     PRCardActions/ (PRCardAction, PRCardActions), PRChecksModal/ (PRChecksModal,
                     PRCheckIcon), PRCheckRow/ (+ .test.tsx)
      hooks/         useFocusRefresh.ts + useFocusRefresh.test.tsx
      lib/           prUtils.ts & prUtils.test.ts, prFilters.ts & prFilters.test.ts, timeAgo.ts & timeAgo.test.ts
      queries/       useGitHubPRs.ts + useGitHubPRs.test.ts, useCheckContexts.ts, usePRDetails.ts, useViewer.ts
      stores/        prStore.ts + prStore.test.ts (Zustand, persisted)
      exports.ts     public surface: { usePRStore, usePullRequests, useCheckContexts, PRDashboard }
    updates/         OTA self-update (Electron-only)
      components/UpdateBanner/   UpdateBanner.tsx
      queries/                   useUpdateCheck.ts + useUpdateCheck.test.tsx
      exports.ts                 public surface: { useUpdateCheck, isNewer, UpdateBanner }
  providers/         Transport layer: github.ts (createClient/restFetch + GraphQL queries),
                     github.test.ts, electron.ts (gh CLI IPC wrappers)
  shared/            Cross-feature shared code
    components/      CopyWithFeedback/, Footer/, SearchInput/, ContributeLinks/, ui/ButtonWithTooltip, ui/Modal
    features.ts      FeaturesContext (useFeatures, Feature union type)
    hooks/           useTheme.ts
  types/             github.ts (API shapes), worktree.ts, electron.d.ts (window global)
```

### Path alias

`@/` resolves to `src/` in both Vite configs and `tsconfig.app.json`. Use it for any cross-feature import instead of deep relative paths (`../../..`).

## App bootstrap and transport

`App.tsx` always mounts `AppContainer`, which auto-probes `gh` on launch via `tryNativeAuth`, sets a sentinel token `'gh-cli'` in `authStore` on success, and shows an `AppAuthError` screen with a Retry button if `gh` is missing or not logged in.

`FeaturesContext` (`src/shared/features.ts`) is a static React context carrying the set of gated `Feature` values; `AppContainer` provides `new Set(['branches'])`. Components read it via `useFeatures()` rather than assuming a feature is always available — this is what lets `branches` stay conceptually optional even though only one container exists.

`createClient()` / `restFetch(url)` (`src/providers/github.ts`) are the transport seam: they call `window.electronAPI.gh.graphql/.rest`, which IPCs to `electron/main.ts` and shells out to `gh api`. **Data hooks stay decoupled from IPC details by always going through these functions** — never call `fetch` to GitHub or read `window.electronAPI` directly from a hook/component.

Anything that touches the local filesystem (list branches, list worktrees, directory picker) is Electron-only and lives as an `ipcMain.handle` in `electron/main.ts`, exposed through `preload.ts`, typed in `src/types/electron.d.ts`. These shell out to local `git`. `main.ts` augments `PATH` with Homebrew dirs so the bundled `.app` can find `gh`/`git`.

## State management

Two layers, deliberately separated:

- **TanStack Query** owns all server data (PRs, branches, check contexts, viewer, update check). A global `QueryCache.onError` handler (`App.tsx`) calls `expireSession()` on auth errors so a 401/403 logs the user out everywhere.
- **Zustand** owns UI/client state, persisted to `localStorage`:
  - `authStore` (`pr-dashboard-auth`) — token + user.
  - `prStore` (`pr-dashboard-state`) — current view (`prs`/`branches`), filters, and the `priorityIds` / `hiddenIds` arrays (starred and hidden PRs).
  - `branchStore` (`branch-dashboard-state`) — the list of local repo paths the user added.
  - Theme is a separate raw `localStorage['theme']` key managed by `useTheme`.

## PR data pipeline

`usePullRequests` (`src/features/pull-requests/queries/useGitHubPRs.ts`) is the core read path:

1. `buildSearchQuery(section, login)` turns the active section (`review-requested` / `authored` / `mentioned`) into a GitHub search string.
2. `useInfiniteQuery` pages the GraphQL `search` via `PR_LIST_QUERY` (20/page, capped at `MAX_PAGES = 10`), sorted `sort:updated-desc`. Pages auto-fetch sequentially via a `useEffect`; `PRListHeader` shows a spinner while `isFetchingNextPage`. The list query returns only lightweight fields — `reviews`, `reviewRequests`, `commits`, and `mergeable` are **not** fetched here.
3. Each node is enriched in-memory with `isTopPriority`, `isHidden`.
4. `applyFilters` (`src/features/pull-requests/lib/prFilters.ts`) drops drafts/hidden/repo/author/search misses.
5. `sortAndPartition` (`src/features/pull-requests/lib/prUtils.ts`) sorts by `updatedAt` and splits priority PRs (pinned on top) from the rest.
6. **Per-card detail loading**: `PRCard` calls `usePRDetails(pr.id)` (`src/features/pull-requests/queries/usePRDetails.ts`) which lazily fetches the heavy per-PR fields (`reviews`, `reviewRequests`, `mergeable`, `commits`/`statusCheckRollup`). `myReviewState`, `checkState`, and conflict badge are derived from the merged result — so they appear progressively as details load. `reviews`, `reviewRequests`, `commits`, and `mergeable` are optional on the `PullRequest` type for this reason.

All GraphQL queries live as exported template strings in `src/providers/github.ts`. The pure derivation helpers in `prUtils.ts` (review summaries, check rollup state) are the most heavily unit-tested part of the app — keep them pure and add cases there rather than testing through components.

## Code standards

These are conventions the existing code follows consistently — match them:

- **TypeScript is strict.** `tsconfig.app.json` sets `verbatimModuleSyntax` (so type-only imports **must** use `import type { … }`), `noUnusedLocals`/`noUnusedParameters`, `erasableSyntaxOnly` (no runtime-emitting TS like enums/namespaces — use union string types as in `types/github.ts`), and `noFallthroughCasesInSwitch`. Avoid `any`; the one place it's needed is `eslint-disable`d inline.
- **Function style**: always `const` arrow functions — `export const foo = () => ...` and `const bar = () => ...`. Only `App.tsx` keeps `export default`; all other components use named exports. Enforced by `func-style: ["error", "expression"]`.
- **Named exports only**: no `export default` except `App.tsx` (required by `main.tsx`). Components are named-exported directly (`export const Foo = () => ...`); barrels re-export by name.
- **Type definitions**: always `type` over `interface`. Extend with `&`: `type Props = PropsWithChildren & { label: string }`. Exception: `interface Window` in `src/types/electron.d.ts` (TS global augmentation, ESLint rule disabled for `.d.ts`). Enforced by `@typescript-eslint/consistent-type-definitions: ["error", "type"]`.
- **Components**: one component per folder as `Name/Name.tsx` with a colocated `Name.test.tsx`; named-exported. Small sub-components (e.g. `CheckIcon`) can be local to the file. Lookup tables keyed by a union type (`Record<ReviewState, …>`) are the idiom for badge/icon config rather than `if/else` chains.
- **Styling**: Tailwind v4 utility classes only — no CSS modules, no inline styles. **All colors go through `var(--color-*)`** in arbitrary-value classes (`bg-[var(--color-surface)]`), never raw palette classes like `bg-gray-900`, so both themes work. Recurring patterns: `cursor-pointer` on every interactive element, `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` for keyboard a11y, and the `group` + `opacity-0 group-hover:opacity-100` reveal for card hover actions. Icons come from `lucide-react`.
- **External links** always use `target="_blank" rel="noopener noreferrer"`; in Electron these are forced to the system browser by `setWindowOpenHandler` in `main.ts`.
- **Data layer**: GraphQL query strings are constants in `providers/github.ts`; hooks are thin react-query wrappers keyed on `[resource, …deps, login]` with explicit `staleTime` and `enabled: !!token`. Server pagination is always bounded (10-page caps) with an explicit truncation signal rather than unbounded fetching. Keep business logic in pure `features/*/lib/` functions (testable) and out of components.
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

