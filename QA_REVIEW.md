# Dubara — QA Review

**Date:** 2026-07-12  
**Tests:** 54/54 passing (vitest)  
**Review scope:** All source files in `src/`, docs (`README.md`, `IMPLEMENTATION.md`, `TECH.md`)

---

## Severity Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P1       | 2     | Scoring/spec mismatch, broken resume |
| P2       | 5     | Public API guards, data hygiene, copy errors |
| P3       | 4     | Dead code, outdated docs, minor type issues |

---

## Defects

### 1. [P1] Catching the imposter at the cap sub-round applies wrong scoring

**Files:** `src/store/gameStore.ts:167-184`, `src/store/gameStore.test.ts:236-261`  
**Severity:** P1 — incorrect scoring for a core game rule; players see wrong points.

**What's wrong:**  
The `castKick` action treats catching the imposter identically regardless of which sub-round it is. The README explicitly says catching the imposter at the cap sub-round should be treated as **survived** (+3 imposter, 0 knowers), not caught. The current code always resolves as `'caught'` with the standard `+floor(N/2)` / `+N` formula.

From README (line 96):
```
- Caught at sub-round 3 (cap): imposter +3, Knowers 0
  (imposter survived the cap; sub-round caught at the cap is treated as surviving).
```

From `castKick` (lines 170-183):
```ts
const caught = id === current.imposterId;
if (caught) {
  set({
    current: {
      ...current,
      vote: { kickedId: id },
      resolvedOutcome: 'caught',       // ← always 'caught', never checks cap
    },
    phase: 'outcome',
  });
  get().resolveOutcome('caught');      // ← always 'caught' scoring
}
```

**Evidence:** The test "wrong kick then catching imposter resolves as caught at sub-round 2" (line 236) asserts the buggy behaviour for 3 players (cap=2). It expects `imposter +1, knowers +2` where the spec requires `imposter +3, knowers 0`.

**Trigger:** In a game where the imposter is kicked on the last sub-round allowed by the cap. For example:
- 3 players (cap=2): caught at sub-round 2
- 5–6 players (cap=3): caught at sub-round 3
- 7–8 players (cap=4): caught at sub-round 4
- 9–10 players (cap=5): caught at sub-round 5

**Suggested fix:** Add a cap check inside the `caught` branch of `castKick`:
```ts
if (caught) {
  const cap = get().subRoundCapOverride ?? computeSubRoundCap(get().players);
  const isCapSubRound = current.subRound >= cap;
  const outcome = isCapSubRound ? 'survived' : 'caught';
  set({
    current: {
      ...current,
      vote: { kickedId: id },
      resolvedOutcome: outcome,
    },
    phase: 'outcome',
  });
  get().resolveOutcome(outcome);
}
```

Also fix the test on line 236 to expect survived scoring (3 / 0) instead of caught scoring (1 / 2).

**Test gap:** Yes — the existing test on line 236 asserts the wrong scoring. A new test variant for cap-boundary catching is needed (e.g., 5 players, cap=3, caught at sub-round 3 → survived).

---

### 2. [P1] `resumeDismissed` is persisted, breaking the resume banner after page refresh

**Files:** `src/store/gameStore.ts:271-279` (partialize), `src/store/selectors.ts:48-50` (useIsResumable)  
**Severity:** P1 — the resilience feature (resuming mid-round after refresh) is silently broken.

**What's wrong:**  
`resumeDismissed` is included in the `partialize` block (line 278), so it is saved to `localStorage`. Once set to `true` (by `startTournament`, `previewDifficulty`, or the user tapping "Продолжи" / "✕"), it persists across page refreshes. Since `useIsResumable` returns `!s.resumeDismissed && s.current !== null`, a page refresh while mid-round with `resumeDismissed: true` never shows the resume banner.

**Trigger:**
1. Start a tournament → `resumeDismissed = true` (persisted)
2. Play partway into a round
3. Refresh the page
4. Hydrate from localStorage: `current` is non-null, `resumeDismissed` is `true`
5. `useIsResumable()` returns `false` → no banner, user lost in the round

The same happens if the user dismisses the banner manually and later refreshes.

**Suggested fix:** Remove `resumeDismissed` from `partialize`. It is a session-only UI flag:
```ts
partialize: (s) => ({
  players: s.players,
  subRoundCapOverride: s.subRoundCapOverride,
  scores: s.scores,
  history: s.history,
  current: s.current,
  phase: s.phase,
  // resumeDismissed intentionally NOT persisted — it must start false on every hydrate
}),
```

`dismissResume()` still works for the current session. The initial state of `resumeDismissed` is `false`, so on every hydrate the banner can appear if there's a mid-round `current`.

**Test gap:** Yes — no test covers the hydrate-and-resume path or the `useIsResumable` selector with different `resumeDismissed` values after persistence restoration.

---

### 3. [P2] `resolveOutcome` is a public, unguarded store action

**Files:** `src/store/gameStore.ts:226-241`, `src/store/types.ts:94`  
**Severity:** P2 — if called directly from outside at the wrong time, it silently creates a malformed history record.

**What's wrong:**  
`resolveOutcome` is part of the public `GameStore` interface and can be called directly by any code that holds a store reference. When called while `current.resolvedOutcome` is `null` and `kind` is anything non-null, the scoring function's `switch` block hits the `default: break` (no deltas applied), then the record fallback `(current.resolvedOutcome ?? 'caught') as OutcomeKind` produces a record with `outcome: 'caught'` and zero-point deltas for all players:

```ts
// scoring.ts line 53
outcome: (current.resolvedOutcome ?? 'caught') as OutcomeKind,
```

**Trigger:** Calling `resolveOutcome(someKind)` when `current` is non-null but `resolvedOutcome` hasn't been set by an upstream action (i.e., before `castKick`/`imposterGuessed`/`advanceSubRound` have run their pre-setup).

**Component table inaccuracy:** The IMPLEMENTATION.md component table says `Outcome` calls `resolveOutcome`, but the actual `Outcome.tsx` component does not import or call it. This is good (prevents double-calling), but the table is misleading.

**Suggested fix:** Either:
- (a) Make `resolveOutcome` private — don't expose it on the `GameStore` type, keep it as an internal helper called only by `castKick`, `imposterGuessed`, and `advanceSubRound`.
- (b) Add a guard:
```ts
resolveOutcome(kind: OutcomeKind) {
  const { current } = get();
  if (!current || current.resolvedOutcome === null) return;  // guard
  const draft: CurrentRound = { ...current, resolvedOutcome: kind };
  // ...
}
```

Option (a) is cleaner since `resolveOutcome` is never meant to be called by UI components.

**Test gap:** Yes — no test for calling `resolveOutcome` directly with a null `resolvedOutcome` on current.

---

### 4. [P2] Macedonian gender agreement error in Outcome screen

**Files:** `src/components/Outcome.tsx:52`  
**Severity:** P2 — visible copy error on a key screen.

**What's wrong:**  
Line 52 reads:
```ts
subtitle: 'ДУБАРАта беше откриена.',
```
The past participle "откриена" is feminine. In standard Macedonian, "дубара" (a person who bluffs) is grammatically **masculine** (like судија, колега — agent nouns ending in -а that are masculine). The correct form is:

```
'ДУБАРАта беше откриен.'
```

**Suggested fix:** Change "откриена" → "откриен" on line 52.

---

### 5. [P2] Non-Macedonian phrase in Finale stats

**Files:** `src/components/Finale.tsx:92`  
**Severity:** P2 — visible copy issue.

**What's wrong:**  
Line 92 reads:
```ts
<p className="text-xs text-text-dim mt-0.5">Импостер победи</p>
```
"Импостер" is not a Macedonian word; it's the English "imposter" transliterated. The rest of the app uses "ДУБАРА" consistently. The stat label should use Macedonian.

**Suggested fix:** Change to something like:
```
Победи на ДУБАРАта
```
Or keep it compact:
```
ДУБАРА победи
```

The label "Знајци победија" on line 96 is fine (correct Macedonian plural).

---

### 6. [P2] `removePlayer` leaves stale data in history records

**Files:** `src/store/gameStore.ts:72-79`  
**Severity:** P2 — data consistency issue; could confuse future features that iterate history.

**What's wrong:**  
`removePlayer` filters history to remove rounds where the removed player was the **imposter**, but does NOT clean up deltas/scores for rounds where they were a **knower**:

```ts
removePlayer(id) {
  set((s) => ({
    players: s.players.filter((p) => p.id !== id),
    scores: Object.fromEntries(
      Object.entries(s.scores).filter(([pid]) => pid !== id),
    ),
    history: s.history.filter((r) => r.imposterId !== id),
    // ↑ only removes imposter rounds; knower rounds are untouched
  }));
},
```

**Impact:** The history array still contains records with `deltas[removedId]` entries, but the `scores` dict has no key for that player. The `Scoreboard` and `Outcome` components iterate history for deltas — they would show a `delta` for a player that no longer exists (though the display logic uses `lastRecord?.deltas[p.id]` which chains through current `players`, so the stale delta is simply not shown). This is benign today but is a latent consistency bug.

**Suggested fix:** Purge the removed player's delta entries from all history records:
```ts
history: s.history.map((r) => {
  if (r.deltas[id] === undefined) return r;
  const { [id]: _, ...restDeltas } = r.deltas;
  return { ...r, deltas: restDeltas };
}),
```
A full solution also filters `r.imposterId !== id`.

---

### 7. [P2] `advanceReveal` sets `revealIndex` out of bounds on transition to `round`

**Files:** `src/store/gameStore.ts:128-139`  
**Severity:** P2 — silently writes an invalid array index into persistent state.

**What's wrong:**  
When `advanceReveal` finishes revealing all players, `next` equals `revealOrder.length`, and the action sets:
```ts
current: { ...current, revealIndex: next, speakingIndex: 0 }
```
`revealIndex` is now equal to the array length, which is out of bounds. It is not read during the `'round'` phase (the `RevealQueue` component that accesses `revealOrder[revealIndex]` only renders in `'reveal'` phase), so there's no runtime crash. However:

- The invalid index is persisted to localStorage. If the persisted state were loaded and `revealIndex` read directly, it would be `undefined`.
- It violates the invariant that `revealIndex` should always be a valid index into `revealOrder`.

**Suggested fix:** In the transition branch, reset `revealIndex` to a sentinel or simply leave it at the last valid index:
```ts
if (next >= current.revealOrder.length) {
  set({
    current: { ...current, revealIndex: 0, speakingIndex: 0 },
    // revealIndex is no longer meaningful in 'round' phase, so reset it
    phase: 'round',
  });
}
```
Or set it to `-1` as a clear "no longer in reveal" marker.

---

### 8. [P3] `beginRound` and `startReveal` are dead code

**Files:** `src/store/gameStore.ts:122-149`, `src/store/types.ts:84-86`  
**Severity:** P3 — unnecessary API surface; confusing to maintainers.

**What's wrong:**  
Both `beginRound()` and `startReveal()` are defined on the store and declared in the `GameStore` type, but:

- No component ever imports or calls them
- The phase transitions in `IMPLEMENTATION.md` don't reference `beginRound` at all
- `startReveal` is superseded by the `commitPreview` + phase transition pattern
- No test exercises either action

**Suggested fix:** Remove the dead action definitions from both `gameStore.ts` and `types.ts`, and remove the lines from `IMPLEMENTATION.md`'s store shape section (lines 83-85).

---

### 9. [P3] `useImposter` selector is never used

**Files:** `src/store/selectors.ts:42-46`  
**Severity:** P3 — dead code; increases bundle size marginally.

**What's wrong:**  
The `useImposter()` selector is exported but not imported by any component. A grep across all files confirms zero usages.

**Suggested fix:** Remove `useImposter` from `selectors.ts`, or hook it into a component that could use it (e.g., the `RevealQueue` could use it to get the imposter name for display).

---

### 10. [P3] `nextSpeaker` has no upper bound

**Files:** `src/store/gameStore.ts:151-156`  
**Severity:** P3 — UI protects against this, but the action itself has no guard.

**What's wrong:**  
```ts
nextSpeaker() {
  const { current } = get();
  if (!current) return;
  const next = current.speakingIndex + 1;
  set({ current: { ...current, speakingIndex: next } });
},
```
If called when `speakingIndex >= revealOrder.length`, it increments further out of bounds. The `RoundOrder` component gates this behind `allSpoken` (a derived boolean), so it won't happen in normal UI flow. However, if the store is accessed programmatically (tests, dev tools, or future features), this could produce confusing state.

**Suggested fix:** Add a clamp:
```ts
const next = Math.min(current.speakingIndex + 1, current.revealOrder.length);
```
Or return early if all players have spoken:
```ts
if (current.speakingIndex >= current.revealOrder.length) return;
```

---

### 11. [P3] IMPLEMENTATION.md component contracts table is outdated

**Files:** `IMPLEMENTATION.md:198-212`  
**Severity:** P3 — misleads devs reading the spec.

**Specific errors:**

| Component | Table says | Reality |
|-----------|-----------|---------|
| `Header` (line 201) | Writes `resetAll` | Header does NOT call `resetAll`; it receives `onOpenScoreboard` callback as a prop |
| `DifficultyPick` (line 206) | Writes "(triggered by setDifficulty; auto-starts reveal)" | Calls `previewDifficulty` (no `setDifficulty` exists) and `commitPreview`; reveal is NOT auto-started — it's a two-step preview-then-commit flow |
| `Outcome` (line 209) | Writes `resolveOutcome` | Outcome.tsx only calls `nextRound` and `endTournament`; `resolveOutcome` is never called by any component |
| `ResumeBanner` (line 203) | "sets a local dismissed flag" | It calls `dismissResume` which writes to the persisted store, NOT local state |

**Suggested fix:** Update the table to match the actual component contracts.

---

### 12. [P3] `resolvedOutcome ?? 'caught'` fallback in scoring masks bugs

**Files:** `src/game/scoring.ts:53`  
**Severity:** P3 — hides a null case that should never happen.

**What's wrong:**  
```ts
outcome: (current.resolvedOutcome ?? 'caught') as OutcomeKind,
```
If `current.resolvedOutcome` is null (shouldn't happen), the record silently defaults to `'caught'`. The `as` cast then suppresses the type error. A better approach is to fail loudly if the invariant is violated:

**Suggested fix:**
```ts
if (!current.resolvedOutcome) {
  throw new Error('resolveOutcome called without a resolved outcome');
}
const outcome = current.resolvedOutcome;
```
Then use `outcome` directly without the `??` fallback or `as` cast.

---

## Test Coverage Gaps

All 54 tests pass. The following high-value behaviours are **untested**:

| Area | Risk | Notes |
|------|------|-------|
| `useIsResumable` after localStorage hydrate | P1 | Would catch defect #2 — need a test that simulates a persisted state with `resumeDismissed: true` and verifies `useIsResumable()` returns `false` (or `true` after the fix) |
| `castKick` catching at cap sub-round (5-player game, cap=3) | P1 | Would catch defect #1 — the existing test at line 236 uses cap=2 which is also wrong, but a dedicated cap=3 test would make it more obvious |
| `resolveOutcome` called with null `resolvedOutcome` | P2 | Verifies that defect #3's guard works |
| `castKick` with non-existent player ID | P3 | Verify it advances sub-round (treats as wrong kick) rather than crashing |
| `advanceReveal` with `current === null` | P3 | Verify no-op |
| `nextSpeaker` at/above `revealOrder.length` | P3 | Verify bound behavior |
| `previewDifficulty` with <3 players | P3 | Verify no-op |
| `removePlayer` while `current` is mid-round (stale references) | P2 | Verify the game doesn't crash if a phantom player ID appears in revealOrder |
| `dismissResume` + refresh → `useIsResumable` | P1 | End-to-end persistence roundtrip for the resume flow |

---

## Persistence Audit

| Field | Persisted? | Correct? |
|-------|-----------|----------|
| `players` | ✓ | ✓ |
| `subRoundCapOverride` | ✓ | ✓ |
| `scores` | ✓ | ✓ |
| `history` | ✓ | ✓ |
| `current` | ✓ | ✓ (includes `startedAt` which is a `Date.now()` timestamp — stale after days but harmless since no feature reads it yet) |
| `phase` | ✓ | ✓ |
| `resumeDismissed` | ✓ | ✗ — **should NOT be persisted** (defect #2) |

Note: `TECH.md` line 84 says "`timerNow` and any UI-only flags are excluded" — `timerNow` does not exist in the codebase, which is fine. But `resumeDismissed` IS being persisted while it should be excluded.

---

## Race Condition Analysis

### `castKick` → `resolveOutcome` double-set

The `castKick` action calls `set()` (to update `current` + `phase`) then immediately calls `get().resolveOutcome(kind)` (which calls another `set()`). Both are synchronous. Zustand v5's `set()` with an object argument is synchronous, so the second `set()` sees the first's state. The two `set()` calls result in a single React re-render (React batches synchronous updates from event handlers). **No visible race condition.**

### `resolveOutcome` state consistency

When `castKick` calls `get().resolveOutcome('caught')`, the `resolveOutcome` action reads `get().current` (which already has `resolvedOutcome: 'caught'` from the first `set()`), then applies a redundant `{ ...current, resolvedOutcome: kind }` spread. The second `set()` overwrites the first with equivalent data. **No data corruption, but redundant.**

### State transition atomicity

When `advanceSubRound` transitions to `'round'` (nextSub ≤ cap), it sets `phase: 'round'` but also `vote: null`. This correctly resets the vote state for the new sub-round. ✓

When `advanceSubRound` transitions to `'outcome'` (nextSub > cap), it calls `get().resolveOutcome('survived')` which performs its own `set()`. Same pattern as `castKick` — fine. ✓

---

## Miscellaneous Observations

1. **WordCard auto-blur ref pattern is correct** — The `onDismissRef` is updated in a `useEffect` and read in the timeout closure. No stale closure. ✓
2. **3-player minimum** — All relevant actions (`startTournament`, `previewDifficulty`) check for `players.length >= 3`. ✓ No crash when called with an empty roster.
3. **10-player chip fit** — Header chips use inline `px-3 py-1.5` and the speaking order list scrolls in a flex column. Should fit on mobile, but this is a layout concern, not a logic defect.
4. **No component renders its own `Screen` or `Header`** — All components return bare JSX. `App.tsx` wraps in `<Screen>` and `<Header>`. ✓
5. **`RevealQueue` component uses `current?.revealIndex ?? 0`** — With `phase === 'reveal'`, `revealIndex` is always valid (0 to `revealOrder.length - 1`). The guard at line 24 checks `!current`. The `??` is defensive but harmless. ✓
6. **`startedAt: Date.now()` on `CurrentRound`** — This field is not read by any component or selector. It is persisted and will become stale after a page refresh (days-old timestamp). Since nothing consumes it, this is not an active defect but is dead weight in the serialized state.

---

## Overall Verdict

**Correctness: 85%** — The core game loop works, phase transitions are consistent, and 54 tests pass. Two P1 defects need immediate attention:

1. **Defect #1 (scoring at cap):** The imposter-caught-at-cap rule from the README is not implemented. This means the scoring is wrong at the most dramatic moment of the game (final sub-round showdown).
2. **Defect #2 (resume after refresh):** The `resumeDismissed` persistence bug defeats the entire purpose of the serialized round state. Players who refresh mid-round are dropped into the round with no orientation.

The P2 issues (public `resolveOutcome`, Macedonian grammar, data consistency in `removePlayer`) are important for polish but don't block gameplay.

The P3 issues (dead code, doc drift) are low-risk cleanup.
