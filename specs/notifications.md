# Notifications — plan

Status: design settled, shipping plan below, not implemented.

## Goal

Native OS notification, without keeping the PR tab open or the window focused, for:
1. A new PR enters a category the user cares about (review requested, assigned).
2. Something changes on a PR the user *authored*: CI turns red, someone leaves a
   review.

These are two different mechanisms (list-membership diff vs. per-PR state diff) —
see §1.

## What already exists (reuse, don't rebuild)

- Sections `review-requested` / `assigned` / `authored` / `reviewed` already exist as
  separate GraphQL searches (`buildSearchQuery`, `prUtils.ts`) — these *are* the
  notification categories, no new query needed.
- `useFocusRefresh` already does new-PR diffing, but only on window focus and only
  for the currently-open section/tab. Separate concern from background notifications
  (that one drives the in-app "N new" badge, stays as-is).
- `electron/main.ts` already shells out to `gh api graphql` for every GitHub call
  (`gh:graphql` IPC handler) and already imports `fs` — the transport and file
  persistence primitives needed for a main-process poll already exist, nothing new
  to add there.

## Why this must run in the main process, not the renderer

Requirement: fire even when Donna isn't focused. A naive `setInterval`/react-query
`refetchInterval` in the renderer (the `useUpdateCheck.ts` pattern) is **not
sufficient** for that: Electron's `BrowserWindow` defaults to
`backgroundThrottling: true`, so Chromium throttles renderer timers once the window
is occluded/hidden — not just OS-unfocused but backgrounded behind another window,
minimized, or (on macOS, since `window-all-closed` intentionally doesn't quit the
app here) window *closed* while Donna sits in the dock. All three are plausible
"not focused" states for a PR-inbox app running in the background.

Setting `backgroundThrottling: false` on the `BrowserWindow` would fix the
occluded/minimized case but not the window-closed case (no renderer running at
all). So: move the poll loop and the `Notification` call into the **main process**.
Electron's main-process `Notification` module doesn't depend on any window existing.
The renderer already isn't the one making the GitHub call today (it goes through
IPC to `gh api graphql` in main anyway) — this just moves the *scheduling* to where
the call already actually executes.

## Design

### 1. Which triggers

Two independent groups, each its own on/off toggle(s):

**a) New PR appeared** (list-membership diff) — reuse existing sections:
default **on** for `review-requested` and `assigned`. `reviewed` stays off by
default (weak signal, YAGNI unless asked).

**b) State changed on a PR I authored** (per-PR state diff, scoped to the
`authored` section only — "my PR" has one meaning):
- **CI failed**: `checkState` (via `deriveCheckState`, `prUtils.ts`) transitions
  into `'FAILURE'`.
- **Someone leaves a review**: a new review node appears from someone other than
  the user, in any submitted state (`APPROVED` / `CHANGES_REQUESTED` /
  `COMMENTED` — excludes `PENDING`, which is a private draft and isn't visible via
  the API from another user's perspective anyway, and `DISMISSED`, which is a
  state change on an existing review, not a new one).

Both default **on** since explicitly requested — these are exactly the kind of
signal a PR-inbox app should surface unprompted.

### 2. Detection ("should this fire")

Main-process poll (`setInterval` in `electron/main.ts` or a new
`electron/notifications.ts` it imports), independent of window/renderer state.
Two query shapes depending on which triggers are enabled, to avoid paying for data
nobody asked for:

**Whose login ("me")**: `electron/main.ts` never resolves the logged-in user's
login today (the renderer does it via `useViewer`/`VIEWER_QUERY`, main only shells
out to `gh api`). `buildSearchQuery(section, login)` (group a) and the
`author.login !== me` check (group b) both need it. Fix: `runGh` the existing
`VIEWER_QUERY` once when the poll loop starts, cache the login in memory for the
process lifetime (a user re-authenticating as someone else means relaunching the
app anyway, so no invalidation needed).

**Group (a) — list-membership diff**, one lightweight search per enabled category:
- `runGh(['api', 'graphql', ...])` with the same `buildSearchQuery`-shaped search —
  needs `id`, `number`, `title`, `url`, `repository.nameWithOwner`, `author.login`
  per node (not just ids): required for both the notification body (§4) and the
  click-through deep link (§5).
- Persist `seenIds: Record<PRSection, string[]>` (see storage note below).
- **First run per category**: seed `seenIds` from the fetch, notify nothing (avoids
  a notification storm on first launch/reinstall).
- Each poll: `newIds = fetched - seenIds`. Notify if `newIds.length > 0`, then
  `seenIds = fetched` (replace, not append — self-pruning, no unbounded growth).

**Group (b) — per-PR state diff**, only runs if CI-failed or "someone reviewed" is
enabled;
piggybacks on the `authored` search from group (a) if that's also enabled (same
underlying PR list — author's own open PRs — so no separate query, just heavier
fields: `commits.nodes.commit.statusCheckRollup.state`, `reviews.nodes { id state
author { login } }`), otherwise runs its own `authored` search:
- Persist `lastCheckState: Record<prId, CheckRollupState>` and
  `seenReviewIds: Record<prId, string[]>`.
- **First run**: seed both maps from the fetch, notify nothing.
- Each poll, per PR: if `checkState !== lastCheckState[id] && checkState ===
  'FAILURE'` → notify (transition-into-failure only, not "still failing" on every
  tick — avoids repeat spam while the PR sits red). New review nodes (`id` not in
  `seenReviewIds[prId]`) with `state` in `{APPROVED, CHANGES_REQUESTED, COMMENTED}`
  and `author.login !== me` → notify, one notification per new review node (someone
  who both comments and later approves fires twice — two distinct events). Then
  overwrite both maps with the latest fetch.

**Storage**: all of the above (`seenIds`, `lastCheckState`, `seenReviewIds` +
settings) go in one small JSON file in `app.getPath('userData')` — main process has
no access to the renderer's `localStorage`, and must keep working with the window
closed, so it needs its own durable store. Renderer's zustand store stays the
source of truth for *displaying* settings in the UI; on change it pushes the new
value to main via a `notifications:updateSettings` IPC call, main also reads its
last-persisted copy at startup so it works before the renderer ever mounts.

### 3. Polling interval setting

Single global interval (not per-category — no real use case for different cadences
per category). Dropdown in settings: 1 / 5 / 15 / 30 min, default 5 min. Stored
alongside the category toggles in `notificationStore`.

### 4. Title/body copy

- 1 new PR (group a): title `"New review request"` / `"You were assigned"`, body
  `"<repo>#<number> · <title> — by <author>"`.
- N new PRs, same category/tick (group a): title `"N new review requests"`, body
  the repo names, e.g. `"donna, other-repo"` (truncate at 3 + "and N more").
- CI failed (group b): title `"CI failed"`, body `"<repo>#<number> · <title>"`.
- Review left (group b): title `"<reviewer> <verb> your PR"`, body
  `"<repo>#<number> · <title>"`, `verb` from a `Record<ReviewState, string>` lookup
  (matches the existing `reviewBadge`/`ownershipBadge` lookup-table idiom in
  `PRCard.tsx`) — `APPROVED → "approved"`, `CHANGES_REQUESTED → "requested changes
  on"`, `COMMENTED → "commented on"`.
- Group (b) events are always one-notification-per-PR-per-event (never batched) —
  specific enough that bundling would lose information the click-through can't
  recover (single-PR deep link only, §5).

### 5. Click behavior

Correction from the first draft: a per-PR route already exists —
`PRCard.tsx`'s `openInDonna` navigates to `/prs/:owner/:repo/:number` when
`prStore.openPRsInDonna` is on. Reuse it instead of falling back to "just switch
section":

- **Single new PR**: `notification.on('click', ...)` → `win.show(); win.focus()`
  (recreate via `createWindow()` if closed), then:
  - `openPRsInDonna === true` → IPC-send `{ route: '/prs/:owner/:repo/:number' }`,
    renderer calls `navigate(...)` (in-app review, matches the existing per-card
    click behavior).
  - `openPRsInDonna === false` → `shell.openExternal(pr.url)` directly from main,
    no renderer round-trip needed — same "opt-out = browser" behavior the PR cards
    already have.
- **N new PRs in one category/tick**: no single PR to deep-link to → focus the
  window and IPC-send `{ section }` so the renderer calls `setSection` (list view,
  same as before).
- **Group (b) events** (CI failed / approved) are always single-PR (§4) → always
  take the deep-link branch above.

Main needs `openPRsInDonna` to decide this, but that's a `prStore` (renderer)
value, not part of the new `notificationStore`. Simplest: the same
`notifications:updateSettings` IPC push also carries `openPRsInDonna`, and the
renderer subscribes to *both* `notificationStore` and `prStore.openPRsInDonna`
changes to re-push — one IPC channel, one settings blob in main, no second sync
path to keep in step.

### 6. Permission

macOS handles this at the OS level (System Settings → Notifications) the first time
`new Notification()` fires from a main-process app — no `requestPermission()` call
needed like the web API; that's a browser-only concept. Nothing to build.

## New code surface

- `electron/notifications.ts` — the poll loop, `seenIds` + settings persistence
  (JSON file in `userData`), the `runGh` search calls, `new Notification(...)`.
  Started once from `app.whenReady()` in `main.ts`, alongside the existing
  `autoUpdater` setup.
- `ipcMain.handle('notifications:updateSettings', ...)` in `main.ts` +
  matching `preload.ts` bridge + `electron.d.ts` type, so the renderer can push
  `{ enabledCategories, pollIntervalMs, openPRsInDonna }` changes.
- `ipcMain`/`webContents.send('notifications:navigate', { route } | { section })`
  the other direction — fired from the click handler, a small listener near the
  router root (e.g. in `DashboardPage.tsx`) calls `navigate(route)` or
  `setSection(section)`. Window recreation on click reuses the existing
  `createWindow()` used by `app.on('activate', ...)`.
- `src/features/notifications/stores/notificationStore.ts` — Zustand, persisted,
  UI-facing only: `enabledCategories`, `pollIntervalMs`. Subscribes to itself *and*
  to `prStore.openPRsInDonna`; either changing re-pushes the combined settings blob
  via `window.electronAPI.notifications.updateSettings(...)`. No `seenIds` here —
  that's main-process-only state.
- Settings UI: see §7 — new `/settings` page, not the existing `SettingsModal`.
- `exports.ts` barrel per convention.

### 7. Settings surface: dedicated `/settings` route

The existing gear-icon `SettingsModal` is scoped to the current PR *view*: repo/org
filters, muted authors, hidden repos — things that only make sense while looking at
a specific section's list. Notification prefs are different in kind: app-wide,
independent of which view/section is open, persist regardless of what you're
looking at. Cramming ~6 settings (2 category toggles, CI-failed, review-left,
interval, plus `openPRsInDonna` already exists elsewhere) into a view-scoped popover
mixes two concerns and the popover would start feeling crowded.

**Confirmed**: a real `/settings` route (`SettingsPage`, react-router — already used
for `/prs/:owner/:repo/:number`), reachable from the navbar next to the theme
toggle. One page, one "Notifications" section for now (toggles + interval
dropdown) — not splitting into multiple settings pages/tabs, there's only one topic
worth a page today. Leave `SettingsModal` exactly as-is; don't migrate
`openPRsInDonna` or the filter settings into the new page — no functional reason to
move working code, that would be scope creep on this task.

## Shipping plan

Two releases, split along the two trigger groups (§1) — each is a complete,
independently useful, independently testable feature. `release.yml`'s version bump
is a manual `workflow_dispatch` input (`npm version <type>`), not
semantic-release-derived from commit messages, so choosing `major` here is a free
call, not something the tooling forces either way.

### v3.0.0 — background notifications (group a) + settings page

The headline: Donna notifies you of new review requests / assignments while
unfocused, and you can configure it. Nothing ships half-working; group (b) isn't
part of this milestone at all.

PRs (order doesn't matter, but the tag only happens once all three are on `main`
and manually verified against a real `gh`-authenticated account):

1. `feat: main-process notification poll infrastructure` — `electron/notifications.ts`
   skeleton, JSON persistence file, both IPC channels (`notifications:updateSettings`
   in, `notifications:navigate` out), wired into `main.ts` `app.whenReady()`. No
   trigger enabled by default at this point — dead weight until PR 2, safe to merge
   alone.
2. `feat: review-requested/assigned notification triggers` — group (a) detection,
   `Notification` firing, title/body copy (§4), click-through incl. the
   `openPRsInDonna` deep-link/external-browser branch (§5).
3. `feat: notification settings page` — `/settings` route, `SettingsPage`,
   `notificationStore`, navbar entry, wired end-to-end to PR 1's IPC channel.

Manual verification before tagging: toggle each category off and confirm it stops
firing; toggle back on; click a notification with `openPRsInDonna` both on and off;
quit-and-relaunch to confirm `seenIds` persisted (no re-notify storm on restart).

### v3.1.0 — CI-failed / review-left (group b)

Additive, no user-facing regression risk to the v3.0.0 surface — minor bump.

PRs:

1. `feat: CI-failed and review-left notification triggers` — group (b) detection
   (`lastCheckState`, `seenReviewIds`), piggybacked `authored` query, firing +
   click-through (always single-PR deep-link, §5).
2. `feat: add CI-failed/review-left toggles to settings page` — two more checkboxes
   on the same `/settings` page from v3.0.0; small enough to fold into PR 1 if it
   turns out trivial, kept separate here only because it touches renderer instead
   of main.

Manual verification: push a failing check to a real authored PR, confirm one
notification (not repeated on subsequent polls while still red); get a teammate (or
a second GitHub account) to leave a review, confirm it fires once per review.

