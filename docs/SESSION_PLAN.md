# Session Plan — 2026-03-12

## Compact Context
- `src/simulation.ts` is `2809` lines and `src/activity.ts` is `2695`, so the next bet should avoid widening either god file unless it clearly pays for itself.
- The current best short stack is still `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, and `offspringSettlementEcologyScoring=true`, with short-horizon `persistentActivityMeanDeltaVsNullMean=29.25`.
- The canonical `4000`-step best-stack comparison improved versus `2026-03-10` but remains negative in all four cells: `-34.63`, `-111.78`, `-18.24`, `-93.65`.
- Four recent March 12 feature knobs all worsened the short winner: `encounterRiskAversion=1` to `-60.79`, `trophicOpportunityAttraction=1` to `-17.25`, `cladogenesisEcologyAdvantageThreshold=0.1` to `5.29`, and disturbance openings to `11.75`.
- The shared relabel-null smoke harness now emits diagnostic snapshots, but there is still no single artifact ranking the failed knobs by `activeCladeDeltaVsNull`, raw-vs-persistent tradeoff, and loss mode.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Juvenile settlement / local ecology scoring | 4 | 496f1a8 |
| Cladogenesis gating | 2 | 8e477ff |
| Relabel-null tooling / diagnostics | 2 | 5cbd5f7 |
| Long-horizon validation | 1 | a843a91 |
| Recycling feedback | 1 | 6631bd9 |
| Revert / codebase simplification | 0 | — |
| Simulation split / module extraction | 0 | — |

Dominant axis: Juvenile settlement / local ecology scoring (4/10)
Underexplored axes: long-horizon validation, recycling feedback, revert / codebase simplification, simulation split / module extraction

## Project State
- The project has a reusable short relabel-null smoke harness, a validated best-short-stack preset, and diagnostic loss-mode classification in `activity.ts`.
- Recent sessions have kept adding settlement-scoring and founder-gating mechanics on top of the short winner, but most March 12 additions made the short metric worse instead of better.
- The biggest evidence gap is not another knob; it is the lack of one compact comparison showing which failed knobs are true dead ends versus coexistence-improving tradeoffs that collapse persistence.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): sustained coexistence and post-founding ecological performance matter more than just producing more founders, which matches the current short-stack `activeCladeDeficit` signal.
- Botta & Mitarai, `Patch disturbances accelerate nature-based solutions in vegetation ecosystems`: disturbance can create useful heterogeneity, but the checked-in `2026-03-12` smoke artifact shows the current opening implementation did not translate that idea into better relabel-null persistence.

## Research Gaps
- Which recent default-off knobs are pure regressions, and which ones improve `activeCladeDeltaVsNullMean` while paying too much persistence cost?
- Do the negative March 11-12 add-ons mostly fail through `activeCladeDeficit`, `founderSuppression`, or `persistenceFailure` when measured under one shared diagnostic artifact?

## Current Anti-Evidence
- The best validated `4000`-step stack is still below matched-null persistent activity in every canonical cell, so durable above-null clade persistence is still unproven.
- Even the short-stack winner that reaches `+29.25` still shows `activeCladeDeltaVsNullMean=-36.75`, so the system still lacks a reliable coexistence mechanism.

## Candidate Bets
- A: [investigate] Add a single regression-diagnostic study that reruns the best short stack plus the recent failed March 11-12 knobs and ranks them by persistent delta, active-clade delta, raw-vs-persistent penalty, and dominant loss mode.
  Why now: four consecutive feature experiments worsened the short winner, so another mechanic without a consolidated failure map is likely blind thrash.
  Est. low-context human time: 40m
  Main risk: it may only confirm that the recent knobs are bad without revealing an immediately salvageable pattern.
- B: [revert] Remove the default-off knobs with only negative smoke evidence from the active search surface: encounter risk, trophic opportunity, decomposition spillover, lineage offspring crowding, cladogenesis gates, and disturbance settlement openings.
  Why now: there are already more than five default `0`/`-1` knobs with no positive checked-in result, and they are inflating `simulation.ts` faster than insight.
  Est. low-context human time: 55m
  Main risk: a later interaction could make one reverted knob useful again.
- C: [feat] Add a more targeted recolonization mechanic that only boosts offspring settlement into recently disturbed cells when the parent's lineage is absent there, then rerun the short relabel-null smoke.
  Why now: the current disturbance opening improved `activeCladeDeltaVsNullMean` slightly (`-36.75` to `-31.25`) but hurt persistence, suggesting the coexistence lever may need to be lineage-targeted instead of global.
  Est. low-context human time: 55m
  Main risk: it is still another new knob on the dominant axis before the current failures are properly sorted.

## Selected Bet
Choose A. The immediate bottleneck is no longer missing instrumentation inside the smoke harness; it is the lack of one compact artifact that turns the recent failed knobs into an actionable map of failure modes. Build that comparison first, then use it to decide what to revert and which tradeoffs are worth another mechanics pass.

## Why This Fits The Horizon
- It is bounded to one study wrapper plus one focused export shape, reusing existing smoke-study builders instead of touching broad simulation logic.
- Success is autonomously verifiable with a deterministic test and a generated artifact that clearly ranks the recent knobs under one schema.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_regression_diagnostics_2026-03-12.json` lists the best short stack and selected failed knobs with comparable `persistentActivityMeanDeltaVsNullMean`, `activeCladeDeltaVsNullMean`, `persistencePenaltyVsRawDeltaMean`, and `dominantLossMode`.
- Specific verification command or output: `npm test && npx tsx src/clade-activity-relabel-null-regression-diagnostics-study.ts --generated-at 2026-03-12T00:00:00.000Z`.

## Stop Conditions
- Stop after comparing the best short stack plus the recent negative knobs that touch juvenile settlement or cladogenesis; do not expand the same session into new mechanics or 4000-step reruns.
- If integrating every failed knob becomes messy, shrink scope to the best short stack plus `encounterRiskAversion`, `trophicOpportunityAttraction`, `cladogenesisTraitNoveltyThreshold`, and disturbance openings, and ship that smaller diagnostic table.

## Assumptions / Unknowns
- Assumption: the current smoke-study diagnostic snapshot is already sufficient to separate coexistence gains from persistence losses without changing simulation code.
- Unknown: whether older March 11 studies need to be rerun under the new diagnostic schema to make the comparison fair enough for revert decisions.
