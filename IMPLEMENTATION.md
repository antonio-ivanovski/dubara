# Dubara — Implementation Design

This document describes how the game mechanics map onto the codebase. It is the bridge between `README.md` (what the game is) and the actual implementation.

## Domain types

```ts
type PlayerId = string;

interface Player {
  id: PlayerId;
  name: string;
}

type Difficulty = 'low' | 'mid' | 'high';
type DifficultyLabel = 'Лесно' | 'Средно' | 'Тешко';

interface Word {
  word: string;
  hints: Record<Difficulty, string[]>;
}

type Phase =
  | 'lobby'
  | 'difficultyPick'
  | 'reveal'
  | 'round'
  | 'vote'
  | 'outcome'
  | 'finale';

interface RoundRecord {
  word: Word;
  hintUsed: string;
  difficulty: Difficulty;
  imposterId: PlayerId;
  outcome: 'guessed' | 'survived' | 'caught';
  caughtAtSubRound: number | null;   // 1-indexed; null for guessed/survived
  kickedOutIds: PlayerId[];           // players wrongly kicked this round
  deltas: Record<PlayerId, number>;  // signed point changes
}

interface CurrentRound {
  word: Word;
  hintUsed: string;                  // resolved when reveal begins
  difficulty: Difficulty;
  imposterId: PlayerId;
  revealOrder: PlayerId[];           // shuffled once at reveal start
  revealIndex: number;               // whose card is showing
  subRound: number;                  // 1-indexed (internal name; UI displays "круг")
  speakingIndex: number;             // pointer into revealOrder
  vote: {
    kickedId: PlayerId | null;       // group decision (verbal) recorded on app
  } | null;
  resolvedOutcome: RoundRecord['outcome'] | null;
  kickedOutIds: PlayerId[];          // players wrongly kicked this round
  startedAt: number;                 // timestamp for round timing
}
```

## Store shape

```ts
interface GameStore {
  // Config
  players: Player[];
  subRoundCapOverride: number | null;

  // Tournament
  scores: Record<PlayerId, number>;
  history: RoundRecord[];

  // Current round
  current: CurrentRound | null;

  // ---- Actions ----
  addPlayer(name: string): void;
  removePlayer(id: PlayerId): void;
  setSubRoundCapOverride(value: number | null): void;

  startTournament(): void;                       // players → difficultyPick
  setDifficulty(d: Difficulty): void;            // pick word + imposter + hint, → reveal
  startReveal(): void;                           // build revealOrder, phase=reveal
  advanceReveal(): void;                         // next player / → round
  beginRound(): void;                            // phase=round, speakingIndex=0

  openVote(): void;                              // phase=vote, init vote{}
  castKick(id: PlayerId): void;                  // record group's verbal kick; always resolves as `caught` when imposter is correctly identified (cap-survived logic only in advanceSubRound)
  imposterGuessed(): void;                       // → outcome (guessed)

  advanceSubRound(): void;                       // wrong kick → next круг
  resolveOutcome(o: RoundRecord['outcome']): void; // writes history + scores
  nextRound(): void;                             // → reveal (same difficulty, new word)

  endTournament(): void;                         // → finale
  restartTournament(): void;                     // keep players, reset scores/history/current, → lobby
  resetAll(): void;                              // wipe to fresh state
}
```

## Phase transitions

```
lobby
  └─ startTournament           → difficultyPick (with players, current=null)

difficultyPick
  └─ setDifficulty             → reveal   (pick word+imposter+hint, set phase=reveal)

reveal
  └─ advanceReveal             → reveal   (next player)
  └─ advanceReveal (last)      → round    (speakingIndex=random index into revealOrder)

round
  └─ openVote                  → vote     (current.vote = { kickedId: null })
  └─ imposterGuessed           → outcome  (outcome='guessed')

vote
  └─ castKick(id)              → outcome  (if id === imposterId → caught)
  └─ castKick(id)              → round    (wrong kick: append to kickedOutIds, advanceSubRound)
  └─ imposterGuessed           → outcome  (outcome='guessed')

advanceSubRound:
  if subRound < subRoundCap      → round (next круг, speakingIndex=0, vote=null)
  else                            → outcome (outcome='survived')

outcome
  └─ nextRound                  → reveal   (same difficulty, new word+imposter+hint)
  └─ endTournament              → finale

finale
  └─ restartTournament          → lobby    (keep players, reset scores/history/current)
  └─ resetAll                   → lobby    (wipe everything)
```

`castKick` short-circuits to outcome when the kicked player is the imposter (always `caught`, regardless of sub-round). Otherwise it calls `advanceSubRound`. The cap-survived logic only exists in `advanceSubRound`. This keeps the user flow tight: tap a name, the round resolves.

## Score computation

`src/game/scoring.ts` exports `resolveOutcome(current, playerIds) → { deltas, record }`:

```ts
function resolveOutcome(current: CurrentRound, playerIds: PlayerId[]) {
  const deltas: Record<PlayerId, number> = Object.fromEntries(
    playerIds.map(id => [id, 0])
  );

  switch (current.resolvedOutcome) {
    case 'guessed':
      deltas[current.imposterId] += 5;
      break;
    case 'survived':
      deltas[current.imposterId] += 7;
      break;
    case 'caught': {
      const N = current.subRound;
      const imposterBonus = Math.floor(N / 2);
      const knowerBonus = Math.max(1, 4 - N);
      const kicked = new Set(current.kickedOutIds ?? []);
      deltas[current.imposterId] += imposterBonus;
      for (const id of playerIds) {
        if (id === current.imposterId) continue;
        if (kicked.has(id)) continue;  // kicked-out players get 0
        deltas[id] += knowerBonus;
      }
      break;
    }
  }

  const record: RoundRecord = {
    word: current.word,
    hintUsed: current.hintUsed,
    difficulty: current.difficulty,
    imposterId: current.imposterId,
    outcome: current.resolvedOutcome,
    caughtAtSubRound: current.resolvedOutcome === 'caught' ? current.subRound : null,
    kickedOutIds: [...(current.kickedOutIds ?? [])],
    deltas,
  };
  return { deltas, record };
}
```

**Key rule:** When the outcome is `caught`, any player whose id appears in `current.kickedOutIds` (wrongly kicked in a previous круг) receives **0 points** — they do not share the knower bonus. The imposter's own bonus is unaffected.

## Sub-round cap

```ts
// src/game/subRoundCap.ts
export function computeSubRoundCap(players: Player[]): number {
  return Math.max(2, Math.ceil(players.length / 2));
}
```

The store exposes both `subRoundCapOverride` (user-set) and a derived `effectiveCap` selector that picks `override ?? computeCap(players)`.

## Persistence

- Key: `dubara-game-v2`.
- `partialize` excludes transient UI fields (`timerNow`, modal open flags).
- `version: 1` and a `migrate(persisted, version)` no-op are in place so we can ship a schema change later without breaking existing clients.
- On hydration, an unfinished reveal/round/vote/outcome is moved to the lobby while its original phase is stored in `resumePhase`.
- A `<ResumeBanner />` is rendered for that unfinished round. Its `Врати се` button restores the saved phase through `resumeRound()`.

## Component contracts

| Component | Props | Reads from store | Writes to store |
|---|---|---|---|
| `Screen` | `children`, `padded?` | — | — |
| `Header` | `title?` | `scores` (link) | `resetAll` |
| `ResumeBanner` | — | `current` | (none — sets a local dismissed flag) |
| `Lobby` | — | `players`, `subRoundCapOverride`, `history.length>0` | `addPlayer`, `removePlayer`, `setSubRoundCapOverride`, `startTournament`, `endTournament` |
| `DifficultyPick` | — | — | `setDifficulty(d)` — shows 3 bare tiles; tap picks difficulty and transitions to reveal |
| `RevealQueue` | — | `current.revealOrder`, `current.revealIndex`, `players` | `advanceReveal` |
| `WordCard` | `word`, `isImposter` | — | local-only auto-blur timer |
| `RoundOrder` | — | `current.subRound`, `current.subRoundCap`, `current.kickedOutIds`, timer | `openVote`, `imposterGuessed` — displays 5-min timer, "Круг X/Y" chip, kicked-out banners |
| `Vote` | — | `current.vote`, `current.subRound`, `current.subRoundCap`, `players`, `current.kickedOutIds` | `castKick`, `imposterGuessed` — filters out kicked players, shows "Исфрлен" indicator |
| `Outcome` | — | `current`, `scores` | `resolveOutcome`, `nextRound`, `endTournament` — no longer shows "Сите нивоа" |
| `Scoreboard` | — | `scores`, `players`, `history` | — |
| `Finale` | — | `scores`, `history` | `restartTournament` (not `resetAll`) |
| `HowToPlay` | `open`, `onClose` | — | — | (called via local Lobby state) |

`App.tsx` is a thin phase router:

```tsx
switch (phase) {
  case 'lobby':          return <Lobby />;
  case 'difficultyPick': return <DifficultyPick />;
  case 'reveal':         return <RevealQueue />;
  case 'round':          return <RoundOrder />;
  case 'vote':           return <Vote />;
  case 'outcome':        return <Outcome />;
  case 'finale':         return <Finale />;
}
```

`phase` is derived from `current?.resolvedOutcome` / `current === null` / a top-level `phase` field. See `store/selectors.ts` for the derivation.

## Animation tokens

The app registers custom CSS keyframes as Tailwind animation tokens in `src/index.css` (`@theme` block). These are used throughout the UI for playful interactions:

| Token | Keyframe | Use case |
|---|---|---|
| `animate-float` | `float` | Gentle vertical bob on emoji / icons |
| `animate-shake` | `shake` | Error feedback, wrong-kick reaction |
| `animate-pulse-fast` | `pulse-fast` | Urgent indicators, vote-prompt pulsing |
| `animate-pop-in` | `pop-in` | Card / modal entry (cubic-bezier overshoot) |
| `animate-confetti` | `confetti-fall` | Celebration animation on outcome |
| `animate-spin-slow` | `spin-slow` | Decorative spinner, emoji rotation |
| `animate-glow-pulse` | `glow-pulse` | Accent glow on highlighted elements |
| `animate-fade-in` | `fade-in` | Overlay / backdrop entrance |
| `animate-wiggle` | `wiggle` | Playful wobble on interactive elements |

## Pure-function invariants

The store actions are intentionally pure-state: no DOM, no timers, no fetches. The 5-minute soft timer is the only piece of transient UI state and lives entirely in the `RoundOrder` component via `useEffect` + `setInterval`. It reads `Date.now()` directly and does not need store access.

The 15-second auto-blur in `WordCard` is similarly local.

This keeps the store trivially serializable and means a mid-round page refresh restores the round exactly where it left off.

## Word dictionary

`src/game/words.ts` exports a typed array of `Word` records. Phase 1 ships a small placeholder set so the build compiles and screens have something to display; the full ~50-entry Macedonian dictionary lands in phase 9 with a review pass on spelling and category fit.
