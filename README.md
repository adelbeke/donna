<div align="center">

# donna

Your GitHub companion — track PRs, manage branches and worktrees, all from a native macOS app.

[![CI](https://github.com/adelbeke/donna/actions/workflows/ci.yml/badge.svg)](https://github.com/adelbeke/donna/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

![donna screenshot](docs/screenshot.png)

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
