# Architecture Reference

This document explains where each responsibility lives, how a spin moves through the application, and which invariants must be preserved when the game is extended.

## Layer boundaries

Dependencies flow inward from presentation code toward framework-independent rules:

```text
React components ─┬─> App coordination ─> domain rules
                  └─> Pixi presentation ─> core utilities

config ─> domain types, React coordination, and Pixi presentation
```

- `src/config` contains values that designers or developers can tune without changing behavior code.
- `src/domain` contains game data structures and deterministic rule calculations. It does not import React or PixiJS.
- `src/core` contains generic math, randomness, and Pixi application lifecycle utilities.
- `src/game` owns PixiJS display objects, animation state, reel timing, and presentation sequencing.
- `src/components` owns accessible React markup. Components do not calculate payouts or control reel animation directly.
- `src/App.tsx` coordinates money, spin requests, domain calculations, and presentation callbacks.

## Runtime flow

### Application startup

1. `main.tsx` verifies that the root element exists and mounts `App` in React strict mode.
2. `App` generates an initial result so the reels have symbols before the first paid spin.
3. `GameCanvas` creates one `PixiGame`, supplies the initial result, and mounts it into its host element.
4. `PixiGame.init` creates one `Reel` per configured reel and starts the Pixi ticker.
5. `GameCanvas` reports readiness to `App`, enabling the controls.

### Spin lifecycle

1. `App.spin` rejects requests while loading, spinning, or short of balance.
2. A complete `SpinRequest` is created before animation starts. It stores the generated result, the charged bet, and whether anticipation should play.
3. The bet is deducted immediately and the request is passed to `GameCanvas`.
4. `PixiGame.spin` starts every reel, then stops them in index order using the already-generated result.
5. For an eligible high-value near-win, the final reel displays the anticipation frame and waits before landing.
6. After every reel lands, `PixiGame` identifies winning rows and plays their visual pulse.
7. `GameCanvas` reports presentation completion to `App`.
8. `App.completeSpin` calculates the payout from the stored request, credits the balance, publishes the result, and unlocks the controls.

The result is generated before animation. Rendering never decides game outcomes.

## State ownership

### React application state

| State         | Owner | Purpose                                                      |
| ------------- | ----- | ------------------------------------------------------------ |
| `result`      | `App` | Result currently displayed by the Pixi reels                 |
| `lastResult`  | `App` | Most recently completed paid result shown in the stats panel |
| `lastWin`     | `App` | Credits won by the most recently completed spin              |
| `balance`     | `App` | Player credits after deductions and awarded wins             |
| `bet`         | `App` | Selected stake for the next spin                             |
| `ready`       | `App` | Whether Pixi initialization completed successfully           |
| `spinning`    | `App` | Render state used to disable controls and update labels      |
| `message`     | `App` | Primary status message for the player                        |
| `spinRequest` | `App` | Immutable request dispatched to the Pixi presentation layer  |

`spinningRef` synchronously blocks duplicate clicks before React commits a render. `spinRequestRef` preserves the exact bet/result pair until the asynchronous animation finishes. `performanceRef` exposes the performance panel's imperative update API without putting frame samples in React state.

### Pixi game state

| State                | Owner      | Purpose                                                                   |
| -------------------- | ---------- | ------------------------------------------------------------------------- |
| `runtime`            | `PixiGame` | Pixi application, canvas, ticker, and teardown lifecycle                  |
| `reels`              | `PixiGame` | Ordered visual reel instances                                             |
| `result`             | `PixiGame` | Latest requested result, including results received before initialization |
| `spinning`           | `PixiGame` | Prevents overlapping presentation sequences                               |
| `destroyed`          | `PixiGame` | Stops asynchronous work from touching a disposed renderer                 |
| `finishWait`         | `PixiGame` | Cancellation hook for the currently active sequencing delay               |
| performance counters | `PixiGame` | Frame count, elapsed time, and worst frame in the current sample window   |

### Reel animation state

| State                                  | Purpose                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `symbolViews`                          | Reusable Pixi containers and text nodes that form the circular strip             |
| `landingTargets`                       | Maps strip views to deterministic symbols required at the final landing position |
| `spinElapsed` / `currentSpeed`         | Acceleration progress and current scrolling speed                                |
| `landing`                              | Distance, duration, progress, and completion callback for deterministic stopping |
| `anticipating` / `anticipationElapsed` | Visibility and pulse phase of the anticipation frame                             |
| `winViews` / `winAnimation`            | Winning symbols and progress of their pulse animation                            |

## Configuration reference

### Game configuration

- `reels`: number of horizontal reel columns.
- `rows`: number of visible symbol rows per reel.
- `symbols`: weighted symbol definitions used by result generation and reel filler symbols.
- `betOptions`: stake values exposed by the controls.
- `initialBalance`: credits assigned on application startup.

### Reel configuration

- `width` and `gap`: logical canvas layout dimensions.
- `symbolHeight`: height of one visible symbol cell.
- `speed`: steady-state strip speed in pixels per second.
- `accelerationDuration`: time required to reach steady-state speed.
- `spinDuration`: delay before the first reel starts landing.
- `stopDelay`: delay between consecutive reel stop requests.
- `minStopDuration` and `maxStopDuration`: bounds for landing animation duration.
- `anticipationDelay`: extra hold before an eligible final reel lands.
- `anticipationPulseDuration`: duration of one anticipation-frame opacity cycle.
- `winAnimationDuration`: total duration of the winning-symbol pulse.

### Performance configuration

- `enabled`: mounts the panel and enables frame sampling.
- `sampleInterval`: minimum number of raw elapsed milliseconds collected before publishing a sample.

### Symbol configuration

- `id`: stable numeric identity used for comparisons and map lookup.
- `label`: accessible human-readable name.
- `glyph`: visual character rendered by Pixi and result summaries.
- `weight`: relative probability used by `pickWeighted`.
- `payouts`: multiplier indexed by the number of matching leading reels.
- `highValue`: limits anticipation to intentionally rare or valuable symbols.

## Module reference

### Entry and coordination

- `src/main.tsx`: browser entry point and root validation.
- `src/App.tsx`: owns React state, dispatches spins, settles payouts, and connects React to Pixi.

### Configuration

- `src/config/gameConfig.ts`: complete runtime configuration object validated with `satisfies GameConfig`.
- `src/config/symbols.ts`: symbol table and constant-time `symbolsById` lookup map.
- `src/config/types.ts`: configuration contracts shared by orchestration and rendering.

### Domain

- `src/domain/types.ts`: symbol, reel, result, and spin-request data contracts.
- `src/domain/resultGenerator.ts`: creates weighted results; accepts an injectable random source for deterministic callers.
- `src/domain/winCalculator.ts`: measures left-aligned runs and calculates row wins and total credits.
- `src/domain/anticipation.ts`: identifies high-value results that match through every reel except the final reel.

### Core

- `src/core/random.ts`: generic validated weighted selection.
- `src/core/math.ts`: positive modulo, easing curves, and normalized oscillation.
- `src/core/PixiRuntime.ts`: initializes, mounts, ticks, and destroys the Pixi application.

### Pixi presentation

- `src/game/PixiGame.ts`: sequences reels, anticipation, win presentation, teardown, and performance sampling.
- `src/game/Reel.ts`: owns the circular strip, acceleration, deterministic landing, anticipation frame, and win pulse.

### React presentation

- `src/components/GameCanvas.tsx`: owns the Pixi host and bridges React requests to `PixiGame`.
- `src/components/PerformancePanel.tsx`: updates frame statistics imperatively to avoid observer-induced React renders.
- `src/components/GameControls.tsx`: bet selection, spin action, disabled state, and live status message.
- `src/components/GameStats.tsx`: balance, bet, last win, and last-result layout.
- `src/components/ResultDisplay.tsx`: accessible label plus compact glyph rendering for a completed result.
- `src/components/StatItem.tsx`: reusable label/value wrapper.
- `src/components/GameHeader.tsx`: heading content and optional composed children.
- `src/components/GameLoader.tsx`: accessible Pixi initialization state.

### Styling and tooling

- `src/styles.scss`: shared palette, responsive application layout, component styles, and the two layout breakpoints.
- `vite.config.ts`: React-enabled Vite development and production build configuration.
- `eslint.config.js`: TypeScript, React Hooks, and Vite refresh lint rules.
- `tsconfig.app.json`: strict browser TypeScript settings with type checking only and no direct emit.
- `.husky/pre-commit`: runs the formatting gate before Git creates a commit.

## Important invariants

- Outcomes and payouts are calculated from symbol IDs, never labels or glyph strings.
- A win is a matching run that starts on the leftmost reel; matching symbols after a gap do not count.
- A payout exists only when the paytable defines the exact run length.
- `SpinRequest.bet` is used for settlement so changing the selected bet cannot change an in-flight payout.
- Reel landing targets are planned before deceleration and assigned to off-screen views before they become visible.
- Teardown resolves active waits and animation promises so React unmounts cannot leave pending work behind.
- Frame statistics update DOM nodes through an imperative handle; they must not be moved into root React state.

## Extension guide

### Add a symbol

Add one `SymbolDefinition` to `src/config/symbols.ts`. Keep the ID unique, define payouts for every supported winning run length, and decide explicitly whether it should trigger anticipation.

### Add visible rows

Increase `gameConfig.rows`. Result generation, reel construction, and row evaluation already use the configured row count. Define stake and payline rules before treating multiple rows as a production betting model.

### Add reels

Increase `gameConfig.reels` only after adding matching payout entries for the new run lengths. Missing exact-run payouts intentionally return zero.

### Change animation timing

Adjust `gameConfig.reel`. Keep deterministic outcome generation in `domain`; do not move random selection into `Reel` landing logic.

### Add a rule

Place framework-independent evaluation in `src/domain`, call it from `App` or `PixiGame` as appropriate, and keep Pixi methods limited to presentation.

## Current trade-offs

- The product scope is one visible row; multi-row stake and payline rules are not implemented.
- Anticipation holds the final reel at normal speed rather than introducing a separate slowdown model.
- Symbol glyph changes use Pixi `Text`; a production asset pipeline would normally use cached textures or sprites.
- Automated tests are deferred. The current automated gates are TypeScript, ESLint, Prettier, and the production build.
