# Dubara — Design polish review

Mobile-portrait review of the current build. Tokens, copy, and tap-target
contract are honored; all suggestions are edits to existing files.

---

## What's working well

- **Clear dark theme.** The `--color-bg` / `--color-surface` / `--color-surface-2`
  ramp reads as intentional and gives cards a quiet, paper-like lift on top of
  the app surface.
- **Strong semantic accents.** Red = imposter (`--color-imposter`), blue =
  knower (`--color-knower`), green/amber/red = tier closeness. The fact that
  these are pulled from the `@theme` block means every screen pulls from the
  same palette.
- **Consistent component primitives.** Every CTA goes through `Button`, every
  screen goes through `Screen`, and every dismissible modal uses the same
  overlay pattern (`fixed inset-0 bg-black/60` + a surface card). The rhythm
  is recognizable across screens.
- **Fluid word typography.** `text-[15vw]` on `WordCard` scales the word to
  the phone width without ever clipping, and the countdown badge keeps the
  auto-blur mechanism visible without competing with the word.
- **Outcome banner does the heavy lifting.** A single colored banner with a
  bold title + muted subtitle communicates the round result in one glance —
  imposter-win, imposter-survive, knower-win all read distinctly.

---

## Prioritized polish list

### P1 — meaningful first-impression wins

#### 1. Knower `WordCard` should use the knower blue, not the global accent purple
- **Files:** `src/components/WordCard.tsx`
- **Current state:** The imposter card uses `border-imposter bg-imposter-bg`,
  but the knower card uses `border-accent bg-surface` — the same purple as the
  primary CTA and the selected difficulty chip.
- **Suggested change:** Swap the knower branch to `border-knower bg-knower-bg`,
  matching the `knower` semantic color already used by the Outcome "caught"
  banner and Finale. Keep the imposter red untouched.
- **Why:** The knower concept is already blue elsewhere in the app — using
  purple here creates a role↔color mismatch that players will re-learn every
  time they switch between the reveal screen and the Outcome screen.

#### 2. Outcome's "Што виде ДУБАРАта" hint is a floating chip in a sea of cards
- **Files:** `src/components/Outcome.tsx` (the `<section>` around line 115)
- **Current state:** Every other Outcome section (`Реалниот збор`, `ДУБАРА
  беше`, `Резултати`) is wrapped in `rounded-2xl bg-surface border border-border
  p-4`. The imposter's hint is just a label + a floating tier-colored chip.
- **Suggested change:** Wrap that section in the same card pattern as its
  neighbors, and put the tier-colored chip inside. For example:
  ```
  <section className="rounded-2xl bg-surface border border-border p-4">
    <p className="text-xs text-text-dim uppercase tracking-wider mb-2">Што виде ДУБАРАта:</p>
    <span className={"inline-block px-4 py-2 rounded-full border text-sm font-medium " + TIER_COLOR[current.difficulty] + " " + TIER_BORDER[current.difficulty] + " " + TIER_BG[current.difficulty]}>
      {current.hintUsed}
    </span>
  </section>
  ```
- **Why:** It's the only section that breaks the card rhythm on the
  information-dense Outcome screen, so it reads as unfinished.

#### 3. Vote screen and RoundOrder screen share too much top chrome
- **Files:** `src/components/Vote.tsx`, `src/components/RoundOrder.tsx`
- **Current state:** Both screens open with an identical danger-red "ДУБАРА го
  погоди зборот" button and an identical `Под-рунда X/Y` chip. The only
  phase cue is the screen-specific body.
- **Suggested change:** On Vote, recolor the sub-round chip to `bg-imposter-bg
  text-imposter border border-imposter/30` (or add a small `ГЛАСАЊЕ` pill next
  to it) so the phase is legible before the user reads the title.
- **Why:** Players passing the phone around mid-round won't always read the
  big title — a glance should tell them whether they're still speaking or
  voting.

---

### P2 — real polish

#### 4. Several interactive elements are below the 48px tap-target floor
- **Files:** `src/components/Lobby.tsx`, `src/components/Header.tsx`,
  `src/components/Scoreboard.tsx`
- **Current state:**
  - Lobby cap chips (`min-h-10` → 40px).
  - Lobby player-removal `✕` (`w-7 h-7 min-h-7` → 28px).
  - Header "Резултати" button (`h-10 px-3` → 40px).
  - Scoreboard close `✕` (`w-10 h-10 min-h-10` → 40px).
- **Suggested change:**
  - Lobby cap chips: bump `min-h-10` → `min-h-12` and add `px-5` for visual
    weight. The accent-coloured active state still pops.
  - Player removal `✕`: keep the 28px visual but pad the hit area:
    `w-12 h-12 min-h-12 flex items-center justify-center -m-2.5 …` (or just
    `w-10 h-10 min-h-10` with `-mr-2` to stay tight to the pill).
  - Header "Резултати" button: `h-10` → `h-12 px-4`.
  - Scoreboard close `✕`: `w-10 h-10 min-h-10` → `w-12 h-12 min-h-12`.
- **Why:** A 48px tap target is the explicit constraint in TECH.md; several
  buttons quietly violate it.

#### 5. ResumeBanner has two dismiss controls that do the same thing
- **Files:** `src/components/ResumeBanner.tsx`
- **Current state:** The banner has a "Продолжи" `Button` and a separate `✕`
  icon button, both wired to `dismissResume`. The label "Продолжи" also
  suggests the action resumes the round, when in fact it just hides the
  banner — the round is already running underneath.
- **Suggested change:** Drop the separate `✕` button. Keep one prominent
  `Button variant="primary" size="md"` labeled "Продолжи" on the right.
  Optionally tighten the copy to "Врати се на рундата" so the affordance is
  "go back to what I was doing", not "continue from a stopped state".
- **Why:** Two dismiss controls that look different but do the same thing is
  a learnability tax. The current label also misrepresents what tapping does.

#### 6. Finale "Победник:" label is misleading — it shows the whole table
- **Files:** `src/components/Finale.tsx` (line 36)
- **Current state:** The section header reads `Победник:` (singular "Winner:")
  but the section lists every player sorted by score, with only the top one
  highlighted as the actual winner.
- **Suggested change:** Rename to `Конечен редослед` (final standings) or
  `Поени` (scores). Keep the crown-on-top-row treatment unchanged.
- **Why:** "Победник:" + a list of 5 names is a contradiction; new players
  will scan for the winner and miss the standings.

#### 7. Finale uses "Импостер" instead of the in-world term "ДУБАРА"
- **Files:** `src/components/Finale.tsx` (line 92)
- **Current state:** The stats grid says `Импостер победи` while every other
  surface (Outcome banner, WordCard label, primary CTA on Round/Vote, lobby
  empty state copy) calls the role `ДУБАРА`.
- **Suggested change:** Change to `ДУБАРА победи` to match the rest of the
  game. Keep the value coloured with `text-imposter` for the semantic link.
- **Why:** Mixing the two terms in the final scoreboard undercuts the game's
  own vocabulary right at the moment players are most likely to share it.

---

### P3 — nice-to-have

#### 8. Tier "high" red collides visually with the imposter red
- **Files:** `src/components/Outcome.tsx`, `src/components/DifficultyPick.tsx`,
  tokens in `src/index.css`
- **Current state:** `--color-tier-high` and `--color-imposter` are both
  `#ef4444`. On the Outcome screen a player reading red text must
  context-switch between "this is the hard tier" and "this is the imposter".
- **Suggested change:** Either swap `--color-tier-high` to a warmer orange
  like `#f97316` (keeping mid at amber) or accept the overlap and only use
  tier color on the **small** tier labels, not on the imposter's hint chip
  (let the chip use `text-imposter` and show the tier as a separate pill).
- **Why:** Players reaching Outcome after a tense round shouldn't have to
  decode which red means what.

#### 9. Outcome label "ДУБАРА беше:" is missing the definite article
- **Files:** `src/components/Outcome.tsx` (line 109)
- **Current state:** Section label is `ДУБАРА беше:` ("Imposter was:").
  Macedonian prefers the definite article here: `ДУБАРАта беше:`.
- **Suggested change:** Replace `ДУБАРА беше:` → `ДУБАРАта беше:`.
- **Why:** Matches the surrounding definite-article phrasing (`Реалниот
  збор`, `Што виде ДУБАРАта`) and reads more naturally.

#### 10. `safe-bottom` class in `Screen.tsx` is undefined
- **Files:** `src/components/Screen.tsx` (line 13)
- **Current state:** `Screen` renders `… bg-bg text-text flex justify-center
  safe-bottom`. `safe-bottom` is not defined anywhere in the project
  (`@theme` block, no custom plugin), so it's a no-op.
- **Suggested change:** Either remove the class, or add a real safe-area
  utility — e.g. add `padding-bottom: env(safe-area-inset-bottom);` as a
  `.safe-bottom { … }` rule under `@theme` in `src/index.css`. The current
  `pb-8` on the container is doing the heavy lifting either way.
- **Why:** Dead classes are confusing for future edits; if the intent is
  iPhone-notch safety, the rule should actually exist.

---

## What I considered but did not recommend

- **Vote screen needs a confirmation step before resolving.** Tapping a player
  is currently one-tap-kick. This is by design (the README explicitly says
  "the kick is locked in") and would change the social contract of the app,
  not just its look — out of scope.
- **Replace `window.confirm` in Lobby/Finale with `ConfirmDialog`.** A real
  polish issue but a code-shape change rather than a visual one.
- **Re-think the tier-high red token globally.** Touches every screen; risky
  for a polish pass.
