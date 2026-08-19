# Test Game

A compact three-reel slot game built with React, TypeScript, PixiJS, and SCSS.

## Features

- Config-driven symbols, payouts, reel timing, and visual theme
- Deterministic reel landing with sequential stops
- Left-aligned matching-symbol payouts
- High-value symbol anticipation and win animations
- Configurable row count for future `3 × 2` extension
- Lightweight FPS and frame-time monitor

Game rules remain independent from PixiJS rendering so domain behavior can evolve without coupling it to animation code. The current symbol distribution and paytable target an RTP of approximately **94.67%**.

## Run locally

```bash
npm install
npm run dev
```

## Architecture

| Location         | Responsibility                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `src/config`     | Game settings, symbols, paytable, reel timing, and visual theme                          |
| `src/domain`     | Framework-independent game rules, result generation, payouts, and anticipation decisions |
| `src/core`       | Reusable low-level utilities and the PixiJS runtime wrapper                              |
| `src/game`       | PixiJS reel rendering, animation, landing, and win presentation                          |
| `src/components` | React UI components and the performance panel                                            |
| `src/App.tsx`    | Application state and coordination between the React UI and PixiJS game                  |

New game rules belong in `domain`, rendering behavior in `game`, reusable UI in `components`, and tunable values in `config`.

## Quality checks

```bash
npm run lint
npm run format:check
npm run build
```

Husky runs the configured pre-commit checks automatically.

## Design decisions and trade-offs

- Domain rules and result generation live outside React and PixiJS; React owns UI state while PixiJS owns reel presentation and timing.
- No external state-management library is used; the application is implemented with React state, callbacks, and refs.
- Anticipation is limited to high-value near-wins to keep the signal meaningful, and the final reel holds briefly before landing.
- The current product scope is one row. The data model supports more rows, but multi-row stake and payline rules are intentionally not included.
- Automated tests were deferred for this time-boxed implementation. TypeScript, ESLint, Prettier, and the production build provide the current automated checks.
