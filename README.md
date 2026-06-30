<div align="center">

# donna

Your GitHub companion — track PRs, manage branches and worktrees, all from a native macOS app.

[![CI](https://github.com/adelbeke/donna/actions/workflows/ci.yml/badge.svg)](https://github.com/adelbeke/donna/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

| Pull requests | Branches / Worktrees |
|---|---|
| <img width="1277" height="761" alt="Screenshot 2026-06-27 at 09 56 18" src="https://github.com/user-attachments/assets/9c6d779b-1a48-4409-8314-7be99eaa5506" /> | <img width="1277" height="761" alt="Screenshot 2026-06-26 at 10 26 17" src="https://github.com/user-attachments/assets/2e9bc7b3-4b38-4b1c-a4b2-73fd04662632" />|

## Requirements

- macOS (arm64 or x64)
- [GitHub CLI (`gh`)](https://cli.github.com/) installed and authenticated (`gh auth login`)

## Install

Download the latest `.dmg` from [Releases](https://github.com/adelbeke/donna/releases), mount it, drag Donna to Applications.

## Features

**Pull Requests**
- Three sections: **Review requested** · **My PRs** · **Mentioned**
- Filter by repository, search by title, sort newest/oldest
- Filter by your own review state: changes requested / commented / not reviewed
- Star PRs as top priority — pinned at the top
- Hide PRs you don't care about; toggle drafts / hidden
- Cards show repo, author, diff size, review-state badges, CI status, conflict indicator, relative timestamps

**Branches**
- Add local repositories via directory picker
- Lists all branches across your repos, with worktree detection
- Shows dirty state and linked PR per branch
- One-click copy for `git switch <branch>` or `cd <worktree>`

## How Donna works (vs GitHub Notifications)

Donna queries GitHub's **search API** for open PRs directly — it is a PR tracker, not a mirror of your GitHub Notifications inbox.

| | GitHub Notifications | Donna |
|---|---|---|
| Source | Notification events | Live PR search |
| "Mark as done" | Dismisses the notification | No effect in Donna |
| Scope | Only PRs that generated a notification | All open PRs matching the search criteria |

This means:
- **Hiding a PR in Donna** marks it locally — it won't affect your GitHub Notifications.
- **PRs you've marked as done in GitHub** will still appear in Donna's *Review requested* section as long as GitHub still has you as a requested reviewer on that PR.
- If you're seeing a large number of stale review requests, the fastest fix is to ask the PR author to re-request review or dismiss the request on GitHub.

Donna's value is a focused, persistent view of what's actually open and needs your attention — independent of whether you've cleared the notification.

## Auth

Donna delegates all GitHub API calls to the `gh` CLI — no token to manage, no PAT stored anywhere. Run `gh auth login` once and you're done.

## Web version

A browser-only build is live at [adelbeke.github.io/donna](https://adelbeke.github.io/donna/). It uses a classic PAT (`repo` + `read:org` scopes, stored in `localStorage`) and does not include the Branches tab.

## Dev

```bash
npm install

npm run dev            # web only (localhost:5173)
npm run dev:electron   # Electron window (requires vite dev server running)

npm run lint
npm run test:run
npm run build:electron
```

## Tech stack

Electron, React 19, electron-vite, TypeScript, Tailwind v4, Zustand, TanStack Query, graphql-request.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © [Arthur Delbeke](https://github.com/adelbeke)
