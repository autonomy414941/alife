# Session Plan — 2026-03-14

## Compact Context
- `MatchedNullFounderContext` now supports only `'none'` and `'founderHabitatBin'`; March 14 tests and study code already replay founder grace under the habitat-matched null family.
- The canonical founder comparison is still `cladeHabitatCoupling=0.75`, `adaptiveCladeHabitatMemoryRate=0`, and `newCladeSettlementCrowdingGraceTicks=36`.
- Founder grace still improves the static-habitat baseline on active clades (`activeCladeDeltaVsNullMean` from `-36.25` to `-23.75`), while the ecology gate reaches `-17` at threshold `1.0` but drops persistent activity from `35.49` to `3.03` at `minSurvivalTicks=50`.
- New-clade encounter-restraint studies are archived off the active `study:` surface; `package.json` now exposes 22 active `study:` scripts.
- `src/activity.ts` is 2226 lines and `src/simulation.ts` is 2436 lines; `TaxonFounderContext` still records only `habitatMean`, `habitatBin`, and `founderCount`.
- The local `docs/clade_activity_relabel_null_disturbance_opening_horizon_2026-03-14.json` file is still zero bytes even though representative CLI-output tests now cover the emitter path.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique / backlog maintenance | 4 | 82978a6 |
| Study CLI / artifact output hygiene | 2 | 7de60ea |
| Founder-establishment validation | 2 | 82c5466 |
| Matched-null helper extraction | 1 | 4f1ae6b |
| Dead-axis archiving | 1 | 4ad1cd4 |

Dominant axis: Structural critique / backlog maintenance (4/10)
Underexplored axes: richer matched-null founder context, disturbance-mediated recolonization, simulation-loop modularization

## Project State
- Canonical March 14 evidence now includes habitat-matched null support, founder-age review, archived encounter-restraint studies, and CLI-output tests for representative study families.
- Recent sessions concentrated on validating founder-grace follow-ups and cleaning the study surface; comparatively little work has gone into the next missing birth-context control or into shrinking the two core monoliths.
- The important gap is now a bounded pass that makes the next mechanism decision less blind by adding one more founder-context control and isolating the relabel-null / history code that future sessions will keep touching.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proceedings of the Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): priority effects can preserve incumbents without creating durable coexistence, so founder-protection gains should be checked against controls that separate arrival timing from founder habitat or crowding context.

## Research Gaps
- Does founder grace still improve the static-habitat baseline when pseudo-clade founders are also matched on one extra birth-context signal such as local crowding at birth, not just habitat bin?
- Which monolith split removes the most friction without changing behavior: relabel-null seed/null assembly in `activity.ts` or taxon-history / founder-context capture in `simulation.ts`?

## Current Anti-Evidence
- Even after the best March 14 follow-ups, actual active clades are still below the matched null by `17` to `23.75` on the canonical 4000-step panel, so the system still fails its own coexistence baseline.
- The relabel-null baseline still ignores local crowding and disturbance context at birth, so the remaining founder-grace gain could still be a birth-context selection effect rather than a durable coexistence gain.

## Bet Queue
- [validate] Extend matched-null founder context beyond `founderHabitatBin` by matching one extra birth-context signal such as local crowding at birth, then replay the canonical founder-grace panel
- [split] Extract relabel-null seed-result and matched-null comparison helpers out of `src/activity.ts`
- [split] Extract taxon-history / founder-context recording and export helpers out of `src/simulation.ts`

### Bet 1: [validate] Add One More Founder Birth-Context Control
Add one stricter relabel-null family beyond `founderHabitatBin`, ideally a binned local crowding signal that can be captured at taxon birth, then replay only the canonical founder-grace horizon comparison through it. Habitat-bin matching already exists, so this is the next bounded validation gate for deciding whether the remaining founder-grace gain survives a richer birth-context control.

#### Success Evidence
- Tests cover the new founder-context field and a deterministic study output reports founder-grace results under the new matched-null family.

#### Stop Conditions
- Stop after adding one extra founder-context dimension and replaying the canonical founder-grace panel only.
- Stop if the work starts changing simulation mechanics beyond recording birth context and matching it in the null.

### Bet 2: [split] Extract Relabel-Null Assembly from `activity.ts`
Move matched-null schedule construction, seed-result assembly, and closely related comparison helpers out of `src/activity.ts` into focused modules without changing study schemas. This is the highest-value split in the current analysis layer because the next founder-context validation will keep touching exactly this code.

#### Success Evidence
- `src/activity.ts` shrinks materially, relabel-null exports stay stable, and the relabel-null activity / horizon tests still pass.

#### Stop Conditions
- Stop after behavior-preserving extraction; do not redesign metrics or artifact schemas in the same bet.
- Stop if the refactor starts touching unrelated species-activity or export code.

### Bet 3: [split] Extract History / Founder-Context Helpers from `simulation.ts`
Separate taxon-history bookkeeping and founder-context export from the main runtime loop in `src/simulation.ts`, keeping simulation behavior unchanged. This satisfies the split trigger on the largest source file and isolates the history path that future founder-context or genealogy work will continue to modify.

#### Success Evidence
- `src/simulation.ts` shrinks materially, history/founder-context tests still pass, and the exported `EvolutionHistorySnapshot` shape is unchanged.

#### Stop Conditions
- Stop after history/founder-context logic is separated; do not attempt streaming-history redesign or scheduler changes in the same bet.
- Stop if the refactor starts altering movement, encounter, or reproduction semantics.

## Assumptions / Unknowns
- Assumption: local birth crowding is the next most actionable founder-context confounder because habitat-bin matching already exists and the canonical founder-grace panel runs without disturbance.
- Unknown: the zero-byte disturbance-opening artifact may be a stale local file rather than a live emitter bug, so it stays in backlog but does not outrank the founder-context and monolith-split bets.
