# donna

> Self-hostable GitHub PR dashboard — filter, prioritise, and track review status across all your repositories.

[![CI](https://github.com/adelbeke/donna/actions/workflows/ci.yml/badge.svg)](https://github.com/adelbeke/donna/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

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

```bash
npm run build
# deploy the dist/ folder to Vercel, Netlify, GitHub Pages, etc.
```

## Roadmap

- [ ] OAuth GitHub login
- [ ] Notifications for new review requests
- [ ] Per-PR notes
- [ ] Electron wrapper

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © [Arthur Delbeke](https://github.com/adelbeke)
