# donna

> Self-hostable GitHub PR dashboard — filter, prioritise, and track review status across all your repositories.

[![CI](https://github.com/adelbeke/donna/actions/workflows/ci.yml/badge.svg)](https://github.com/adelbeke/donna/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**[→ Live demo](https://adelbeke.github.io/donna/)**

## Features

- Filter by repository, review state (approved / commented / pending / changes requested)
- Mark PRs as top priority (persisted in localStorage)
- Sections: Review requested · My PRs · Mentioned
- Team CODEOWNERS support via `reviewRequests`
- Sort by newest or oldest
- PAT stored locally, never sent to a server

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Zustand (state + persistence)
- TanStack Query (data fetching)
- GitHub GraphQL API

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173, paste a GitHub PAT with `repo` and `read:org` scopes.

[Generate a token →](https://github.com/settings/tokens/new?scopes=repo,read:org)

## Deploying

The app deploys automatically to [GitHub Pages](https://adelbeke.github.io/donna/) on every push to `main` via `.github/workflows/deploy.yml`. The Vite `base` is set to `/donna/` in `vite.config.ts`.

For any other static host: `npm run build` and drop the `dist/` folder.

## Roadmap

- [ ] OAuth GitHub login
- [ ] Notifications for new review requests
- [ ] Per-PR notes
- [ ] Electron wrapper

## Contributing

Issues and PRs are welcome. Before opening a PR, run:

```bash
npm run lint
npm run test:run
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## License

MIT © [Arthur Delbeke](https://github.com/adelbeke)
