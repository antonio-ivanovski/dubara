# Dubara — Tech

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first config, `@tailwindcss/vite` plugin) |
| State | Zustand v5 with `persist` middleware |
| Persistence | `localStorage` (key `dubara-game-v2`) |
| Routing | None — single screen, phase-switched via state |
| Backend / network | None |
| Testing | Not yet introduced; phase 7+ candidate |

## Dependencies

Runtime:
- `react` ^19.2
- `react-dom` ^19.2
- `zustand` ^5
- `tailwindcss` ^4
- `@tailwindcss/vite` ^4

Dev:
- `typescript` ~6.0
- `vite` ^8
- `@vitejs/plugin-react` ^6
- `oxlint` ^1.71

## Tailwind v4 setup

`vite.config.ts` registers `@tailwindcss/vite` alongside `@vitejs/plugin-react`.

`src/index.css` is the single CSS entry:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0f;
  --color-surface: #14141c;
  /* ... full token set in the file itself */
}

html, body, #root { height: 100%; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

There is no `tailwind.config.js`. v4's CSS-first `@theme` block is the single source of truth for design tokens.

## State persistence

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({ /* state + actions */ }),
    {
      name: 'dubara-game-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        players: s.players,
        subRoundCapOverride: s.subRoundCapOverride,
        scores: s.scores,
        history: s.history,
        current: s.current,
      }),
      version: 1,
    },
  ),
);
```

- `timerNow` and any UI-only flags are excluded via `partialize`.
- `version: 1` is set from the start so we can ship a `migrate` function if the shape ever changes.
- On hydrate, if `current` is mid-round, the `<ResumeBanner />` shows.

## Persistence shape

```ts
{
  players: Player[];                    // last configured roster
  subRoundCapOverride: number | null;   // null = auto from player count
  scores: Record<string, number>;       // tournament scores
  history: RoundRecord[];               // for finale / review
  current: CurrentRound | null;         // null on lobby, non-null mid-game
}
```

## Mobile-first constraints

- Layout uses a centered container capped at `max-w-md` (~28rem). No desktop breakpoints.
- No hover states. All interactions are tap.
- Tap targets ≥ 48px (`min-h-12`).
- Word display uses fluid type (`text-[12vw]`) so it scales with phone width.
- The app does not adapt to landscape orientation in any special way; portrait is the canonical orientation.

## Project layout

```
src/
  main.tsx
  App.tsx
  index.css
  store/
    gameStore.ts        # zustand store + persist
    selectors.ts        # phase / currentRound / scores derivations
    types.ts            # Player, Word, Difficulty, Phase, GameStore, ...
  game/
    words.ts            # curated Macedonian dictionary
    shuffle.ts          # Fisher–Yates
    scoring.ts          # resolveOutcome(state) → deltas
    subRoundCap.ts      # computeSubRoundCap(players)
  components/
    Screen.tsx
    Header.tsx
    ResumeBanner.tsx
    Button.tsx
    ConfirmDialog.tsx
    Lobby.tsx
    DifficultyPick.tsx
    RevealQueue.tsx
    WordCard.tsx
    RoundOrder.tsx
    Vote.tsx
    Outcome.tsx
    Scoreboard.tsx
    Finale.tsx
```

## Scripts

```bash
bun install
bun run dev         # vite dev server
bun run build       # tsc -b && vite build
bun run preview     # serve built bundle
bun run lint        # oxlint
```

(Bun is used because the existing `bun.lock` is the lockfile; npm/yarn/pnpm work the same.)