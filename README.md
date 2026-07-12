# Dubara

A real-life, single-device word guessing game in Macedonian. One phone coordinates a group of players who speak out loud. The Macedonian word **ДУБАРА** means "one who bluffs" — that is the imposter.

The app does **not** host the game. It coordinates it. All dialogue, association words, and discussion happen out loud.

Macedonian terminology used in the UI:

| Term | Meaning |
|---|---|
| **ДУБАРА** | The imposter — "one who bluffs" |
| **Знајци** | Knowers — all players except the imposter |
| **круг** | A sub-round within a round (not "под-рунда") |
| **турнир** | Tournament — a series of rounds with the same player group |

---

## Roles

- **Знајци** (Knowers) — every player except one. Each sees the **real word**.
- **ДУБАРА** (Imposter) — exactly one player. Sees a **related hint word** instead of the real word, with the closeness of that hint chosen by the group's difficulty vote.

---

## Game flow

### 1. Lobby
- 3 to 10 players enter their names.
- The app shows the auto-derived sub-round cap (see below).
- Optional manual override of the cap.

### 2. Difficulty pick (once per tournament)
At the start of a tournament, the group picks the difficulty by tapping one of three tiles. **All subsequent rounds reuse the same difficulty** — there is no re-vote.

| Tier | Imposter's hint closeness | Imposter difficulty |
|---|---|---|
| Тешко | слаб и поширок hint | потешко за погодување |
| Средно | контекстуален hint | балансирано |
| Лесно | близок и карактеристичен hint | полесно за погодување |

### 3. Reveal
The phone is passed around. For each player, in random order, the app displays a "Pass the phone to *Name*" prompt. When that player taps, the full-screen word card appears — either the real word (Knowers) or the imposter's hint (Imposter). When they tap **Следно**, the card clears and the next player's pass prompt shows.

The word card auto-blurs after 15 seconds if no one taps, in case the phone is forgotten face-up.

### 4. Круг (round)
A round plays out over **N круга** (the cap, see below). At the start of each round, the app randomly picks the **first speaker** from all players and displays their name prominently on the round screen. Speaking proceeds in the same fixed order each круг (the reveal order from step 3). Each круг:

1. **Speaking** — players speak their **association word** one by one out loud, starting with the randomly chosen speaker. Associations should be **fresh** each круг (no repeats).
2. **Vote** — when the group is done speaking, anyone taps **Гласајте** on the app to open the vote screen. The group discusses verbally, then anyone taps the player they want to kick on the app. The kick is locked in.

**Wrong kick:** If the group votes for a player who is **not** the imposter, that player is **kicked out for the rest of the round** — they cannot speak or be voted out again. The app records this and advances to the next круг. If the imposter is later caught in a subsequent круг, the wrongly-kicked player scores **0** (they do not share the knower bonus).

### 5. Resolution
A round ends when any of these happens:

- **Imposter guessed correctly** — anyone taps the **ДУБАРА го погоди зборот** button on the vote screen if the imposter shouted the real word out loud.
- **Imposter voted out** — the group kicked the imposter.
- **Cap reached** — кругови ran out without the imposter being caught.

### 6. Outcome
The outcome screen reveals:

- The real word.
- The imposter's identity.
- The hint the imposter actually saw.
- All three difficulty tiers' hint lists (so the group sees how close/far the imposter was).
- Scoreboard deltas.

### 7. Next round / tournament end
- **Следна рунда** — play another round at the same difficulty (no re-vote). A new word, imposter, and hint are picked.
- **Нов турнир** — start a fresh tournament with the **same players**. Scores, history, and current round are reset; the phase returns to lobby. Available during `finale`.
- **Заврши турнир** — open from the scoreboard to end the tournament early. Final standings shown.

---

## Sub-round cap

The cap is auto-derived from player count: `max(2, ceil(players / 2))`.

| Players | Cap |
|---|---|
| 3 | 2 |
| 4 | 2 |
| 5 | 3 |
| 6 | 3 |
| 7 | 4 |
| 8 | 4 |
| 9 | 5 |
| 10 | 5 |

Manual override is available on the lobby.

---

## Scoring

| Outcome | Imposter | Each Knower | Kicked-out player |
|---|---|---|---|---|
| Imposter guessed the word | **+5** | 0 | 0 |
| Imposter survived the cap | **+7** | 0 | 0 |
| Imposter caught at круг N | 0 / +1 / +2 depending on the circle | +3, then +2, then +1 | **0** (excluded) |

Examples for a 5-player game (cap 3):

- Caught at круг 1: imposter 0, each active Knower +3.
- Caught at круг 2: imposter +1, each Knower +2.
- Caught at круг 3 (cap): imposter +1, each active Knower +1. Catching the imposter is **always** `caught` regardless of sub-round. The `survived` outcome only fires when wrong kicks exhaust the cap (`advanceSubRound` path), awarding the imposter **+7**.
- Caught at круг 4 or 5: imposter +2, each active Knower +1.
- Wrongly kicked player when imposter caught at круг 3: **0** (the kick happened in a previous круг, that player is excluded).

---

## Hints & replayability

Every word in the bundled dictionary has a **category**, three hint tiers, and multiple hint candidates in each tier. The game picks one unused word per tournament and one candidate from the chosen tier at random. When the dictionary is exhausted, a fresh cycle begins.

Example entry shape:

```ts
{
  word: 'куче',
  category: 'животни',
  hints: {
    low:  ['верност', 'домашно', 'чувар'],
    mid:  ['милениче', 'сопственик', 'поводник'],
    high: ['лае', 'опашка', 'поводник'],
  },
}
```

---

## Testing

Tests use [Vitest](https://vitest.dev/) with `happy-dom` and global test functions (`describe`/`it`/`expect`).

```bash
bun run test       # run once
bun run test:watch # watch mode
```

### Coverage

- **Game logic** — `src/game/shuffle.test.ts`, `src/game/subRoundCap.test.ts`, `src/game/scoring.test.ts`
- **Store** — `src/store/gameStore.test.ts`

### Test utilities

The store reset helper lives at `src/test-utils/resetStore.ts` and provides:

- `resetStore()` — clears `localStorage` and resets the Zustand store to initial state
- `seedPlayers(names)` — adds players by name and returns their auto-generated IDs
- `makePlayers(n, prefix?)` — creates `n` deterministic `Player` objects for game logic tests

Each store test calls `resetStore()` in `beforeEach` so every test starts clean.

---

## Rules summary

- 3 to 10 players.
- One device, passed around.
- Knowers give a fresh association each круг (verbal rule).
- Imposter wins by guessing the real word, but earns the biggest bonus by surviving the cap.
- Knowers win by voting the imposter out.
- Wrongly kicking a non-imposter removes that player for the rest of the round; they score 0 if the imposter is later caught.
- Tournament has no target score — players end it manually.
- **Нов турнир** resets scores but keeps the same players.

---

## How to play (in-app)

The **Lobby** screen includes a "Како се игра?" button that opens a full-screen, step-by-step guide (`HowToPlay` component). It walks through the four core phases:

1. **📱🤝 Предај го телефонот** — Each player sees the word (or hint) in private.
2. **💬 Секој кажува збор** — Players take turns speaking an association word out loud.
3. **👆🗳️ Гласајте** — Tap the suspected imposter to kick them out.
4. **🎭 Откријте ја ДУБАРАта** — Reveal whether the knowers caught the imposter.

The guide uses animated emoji and a stepper dot navigation. Tap outside or the ✕ button to dismiss.
