# Session Plan — 2026-03-14

## Compact Context
- `cladeHabitatCoupling=0.75` is still the only canonical 4000-step persistence win, but every canonical habitat-coupled panel still trails the matched null on active clades.
- `adaptiveCladeHabitatMemoryRate=0.2` is not a safe baseline: on the 4000-step horizon it reduced persistent activity by `29.57` versus the static habitat baseline and slightly worsened the active-clade deficit.
- `newCladeSettlementCrowdingGraceTicks=36` improved the canonical static-habitat active-clade delta from `-36.25` to `-23.75`, but it worsened the threshold-`1.0` / `50`-tick persistent delta by `16.30`.
- `newCladeEncounterRestraintGraceBoost=2` did not generalize cleanly at horizon: on the founder-grace baseline it worsened the threshold-`1.0` active-clade delta from `-23.75` to `-28`, and only improved the threshold-`1.2` panel from `-23.75` to `-23` while keeping matched birth schedules.
- `cladogenesisEcologyAdvantageThreshold=0.1` on top of founder grace improved the short-run active-clade delta from `-28.5` to `-25.25` while keeping `persistentActivityMeanDeltaVsNullMean` positive, making it the current best selective-coexistence smoke signal on the founder-grace stack.
- `src/simulation.ts` (`2473` lines) and `src/activity.ts` (`2695` lines) remain the main structural bottlenecks, and many relabel-null smoke-study files differ only in constants.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Founder establishment / early competition | 4 | 956169d |
| Habitat-coupled persistence / memory | 4 | 56c9e6c |
| Disturbance openings | 1 | d2d8fac |
| Repo hygiene | 1 | b831476 |

Dominant axis: Founder establishment / early competition (4/10, tied with habitat-coupled persistence / memory)
Underexplored axes: cladogenesis quality gates, clade-age diagnostics, dead-knob reverts, relabel-null harness refactors

## Project State
- The repo has repeatable smoke studies, horizon validators, tests, and JSON artifacts for matched relabel-null comparisons.
- Recent sessions validated founder grace and newborn encounter restraint on the canonical horizon, and the newest evidence points more toward founder-quality gating than additional unconditional shielding.
- The main gap is still selective coexistence: founder support can improve horizon active-clade counts, but no canonical run yet shows a founder-selective mechanism that beats the `-23.75` active-clade mark while also preserving persistence.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proceedings of the Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): arrival-time advantages can create priority effects unless niche differentiation also shifts, which supports pairing founder grace with a founder-quality filter instead of adding more unconditional shielding.

## Research Gaps
- Does pairing `newCladeSettlementCrowdingGraceTicks=36` with `cladogenesisEcologyAdvantageThreshold=0.1` recover the threshold-`1.0` / `50`-tick persistence loss while keeping the improved active-clade delta on the canonical 4000-step horizon?
- Is `newCladeEncounterRestraintGraceBoost` a threshold-`1.2`-specific rescue, or does its threshold-`1.0` active-clade regression mean it should be pruned instead of tuned further?

## Current Anti-Evidence
- The best current canonical founder-support panel still ends at `activeCladeDeltaVsNullMean=-23.75`, so the system still supports fewer concurrent active clades than a birth-matched relabeled null.
- Recent wins are still tradeoff-shaped: founder grace improves horizon active clades but loses the threshold-`1.0` / `50`-tick persistent comparison, and encounter restraint only helps the threshold-`1.2` panel while regressing threshold `1.0`.
- The founder-grace ecology-gate result is still smoke-only, so the most selective short-run signal has not yet survived horizon validation.

## Bet Queue
1. [validate] Horizon-validate founder grace plus a cladogenesis ecology gate
2. [split] Continue extracting settlement / founding / early-competition logic from `src/simulation.ts`
3. [review] Decide whether newborn encounter restraint is a keeper or a dead axis

### Bet 1: [validate] Horizon-Validate Founder Grace With A Cladogenesis Ecology Gate
Add a canonical 4000-step comparison for `cladogenesisEcologyAdvantageThreshold=-1` versus `0.1` on the static habitat + founder-grace baseline. The smoke result improved `activeCladeDeltaVsNullMean` from `-28.5` to `-25.25` while staying positive on persistence, so the next high-leverage question is whether founder selectivity survives the full horizon where unconditional shielding traded away persistence.

#### Success Evidence
- A new horizon artifact contains all canonical comparison rows, keeps matched birth schedules, and either improves `activeCladeDeltaVsNullMean` versus the founder-grace `-23.75` baseline or materially reduces the threshold-`1.0` / `50`-tick persistence loss that founder grace introduced.

#### Stop Conditions
- Stop after one two-point horizon comparison (`-1`, `0.1`); do not tune multiple ecology thresholds.
- Stop if the comparison requires changing core simulation behavior rather than composing existing knobs.

### Bet 2: [split] Continue Extracting Settlement / Founding / Early-Competition Logic From `src/simulation.ts`
Move the remaining settlement scoring, founder-grace lookups, newborn encounter-restraint boost, and new-clade founding seam out of `LifeSimulation` into dedicated helpers while preserving behavior. Recent coexistence bets still edit the same simulation region, so finishing that seam is the shortest path to faster iteration on the founder-selective axis.

#### Success Evidence
- `src/simulation.ts` shrinks materially again, the extracted seam lives outside `LifeSimulation`, and the existing settlement/simulation tests still pass without artifact changes.

#### Stop Conditions
- Stop if disturbance or analytics code needs to move too.
- Stop if behavior changes are required to make the split compile; this bet is refactor-only.

### Bet 3: [review] Decide Whether Newborn Encounter Restraint Is A Keeper Or A Dead Axis
Use the new smoke and horizon artifacts to decide whether `newCladeEncounterRestraintGraceBoost` should stay in the canonical stack. The horizon validator now shows threshold-specific behavior, so the next bounded decision is whether to narrow future work to threshold-`1.2` diagnostics or prune the knob and focus on founder-quality gating instead.

#### Success Evidence
- One bounded change lands: either a small diagnostic comparison that explains the threshold split, or a revert/prune that removes the knob from future canonical stacks.

#### Stop Conditions
- Stop if the review expands into tuning multiple restraint values or mixed-mechanism stacks.
- Stop if the existing artifacts are insufficient to support a clear keep/prune decision.

## Assumptions / Unknowns
- Assumption: the founder-grace horizon tradeoff is caused by low-quality founder retention rather than unrelated habitat-coupling drift.
- Unknown: the founder-grace ecology gate may still collapse at horizon if short-run improvement was mostly suppressing noisy weak clades rather than stabilizing durable coexistence.
- Unknown: `newCladeEncounterRestraintGraceBoost` may be genuinely threshold-specific or merely noisy; the current evidence is mixed rather than uniformly positive or negative.
