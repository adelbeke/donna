# Contributing

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint |
| `npm run test:run` | Run tests once |
| `npm test` | Tests in watch mode |

## Before opening a PR

```bash
npm run lint
npm run test:run
npm run build
```

All three must pass.

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, etc.
- **Branches**: `feat/short-description`, `fix/short-description`.
- **PRs**: one logical change per PR; keep diffs small and reviewable.

## PR flow

1. Fork the repo and create a branch from `main`.
2. Make your change with tests where applicable.
3. Open a pull request — the CI must be green.
