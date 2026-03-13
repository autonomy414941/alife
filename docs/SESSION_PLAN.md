# Session Plan — 2026-03-13

## Compact Context
- `f1d8891` already moved pure settlement and cladogenesis helpers into `src/reproduction.ts`, but `LifeSimulation` still owns `reproduce`, disturbance scheduling, settlement-opening state, and disturbance event bookkeeping.
- `src/simulation.ts` is `2562` lines and `src/activity.ts` is `2695`; both still exceed the split trigger, and disturbance behavior is mixed with analytics and history state inside `LifeSimulation`.
- Disturbance-focused verification already exists in `test/disturbance.test.ts` plus multiple disturbance and resilience cases in `test/simulation.test.ts`.
- The current best short relabel-null stack is still `persistentActivityMeanDeltaVsNullMean=29.25` at `1000` steps, but every ranked scenario still reports `dominantLossMode=activeCladeDeficit`.
- Localized disturbance openings improved `activeCladeDeltaVsNullMean` from `-36.75` to `-31.25` while dropping `persistentActivityMeanDeltaVsNullMean` to `11.75`, so the disturbance/recolonization seam is promising but unresolved.
- The checked-in `2026-03-12` JSON artifacts still reference removed knobs such as `encounterRiskAversion` and `trophicOpportunityAttraction`, so current code and tests are a safer source of truth than older rankings.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Relabel-null diagnostics / study harness | 3 | cd697f0 |
| Settlement / recolonization mechanics | 2 | 344d4a3 |
| Cladogenesis gating | 2 | 8e477ff |
| Simulation reproduction seam split | 1 | f1d8891 |
| Trophic opportunity ecology scoring | 1 | 5003c4f |
| Long-horizon relabel-null validation | 1 | a843a91 |
| Disturbance subsystem split | 0 | — |

Dominant axis: Relabel-null diagnostics / study harness (3/10)
Underexplored axes: disturbance subsystem split, simulation reproduction seam split, trophic opportunity ecology scoring, long-horizon relabel-null validation

## Project State
- The repo already has pure reproduction helpers in `src/reproduction.ts`, footprint math in `src/disturbance.ts`, deterministic simulation tests, and reusable relabel-null study scaffolding.
- Recent sessions shifted from short-horizon feature additions to diagnostics, then pruned one failed settlement branch and extracted the first reproduction helpers.
- The main gap is that disturbance scheduling, temporary settlement openings, and disturbance event state still live inside the largest class, which makes the next persistence-focused recolonization mechanic expensive to add safely.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): durable coexistence after founding matters more than founder count alone, which matches the current `activeCladeDeficit` failure mode.
- Martin Fowler’s extract-function and seam-first refactoring guidance remains directly relevant to carving a stable subsystem out of `LifeSimulation`: https://martinfowler.com/articles/refactoring-2nd-changes.html

## Research Gaps
- Can the disturbance scheduling plus recolonization-opening seam be extracted behind a stable interface without changing behavior, so a later lineage-absent recolonization rule can be tested in isolation?
- Does the current disturbance signal justify further work on persistence after founding, given that localized openings improved active clade count but still reduced persistent activity?

## Current Anti-Evidence
- The validated `4000`-step best-stack comparison is still below matched null in every checked cell: `-34.63`, `-111.78`, `-18.24`, and `-93.65` persistent activity delta versus null.
- Even the short-horizon winner still trails matched null by `36.75` active clades on average, and every top-ranked recent scenario is still classified as `activeCladeDeficit`.

## Candidate Bets
- A: [split] Extract disturbance footprint selection, settlement-opening tracking, and disturbance event bookkeeping from `LifeSimulation` into a dedicated disturbance subsystem without changing behavior.
  Why now: localized disturbance is the only recent mechanic family that moved the active-clade deficit in the right direction, but that seam is still embedded in the biggest class.
  Est. low-context human time: 45m
  Main risk: the seam touches agents, resources, tick state, and analytics, so an over-ambitious extraction could sprawl.
- B: [feat] Replace the unconditional disturbance opening bonus with a lineage-absent recolonization bonus that only boosts disturbed cells where the parent lineage is not already locally dominant.
  Why now: localized openings narrowed the active-clade deficit from `-36.75` to `-31.25`, suggesting the next useful mechanic is to stop incumbents from reclaiming disturbed vacancies first.
  Est. low-context human time: 60m
  Main risk: it adds another behavior change before the disturbance seam is isolated, which raises regression risk and muddies attribution.
- C: [split] Split `src/activity.ts` into relabel-null core analysis plus study-specific runners and definitions.
  Why now: `src/activity.ts` is still `2695` lines and remains a separate split trigger with many study entrypoints funneled through one file.
  Est. low-context human time: 45m
  Main risk: it improves maintainability but does not directly address the current persistence bottleneck.

## Selected Bet
Choose A. The dominant empirical problem is still post-founding coexistence, and disturbance openings are the one recent mechanic family that at least nudged active clade counts upward. A behavior-preserving disturbance split targets that exact seam, stays on an underexplored axis, and makes the next persistence-focused mechanic easier to test without adding another poorly isolated knob this session.

## Why This Fits The Horizon
- It is bounded to disturbance scheduling, opening bookkeeping, and disturbance event state; the actor can stop before moving resilience or locality analytics.
- Success is verifiable with existing deterministic disturbance tests plus a normal build, with no long experiment run or hidden judgment.

## Success Evidence
- Disturbance lifecycle helpers or a dedicated module exist, `src/simulation.ts` is materially smaller, and no intended behavior change is introduced.
- Specific verification command or output: `npm test -- --runInBand test/disturbance.test.ts test/simulation.test.ts && npm run build`.

## Stop Conditions
- Stop once disturbance footprint selection, opening marking or lookup, and disturbance event creation or update flow are extracted and verified; do not add lineage-absent recolonization in the same session.
- If the extraction starts pulling resilience analytics or unrelated reproduction code across the boundary, shrink scope to scheduling plus openings plus event creation only.

## Assumptions / Unknowns
- Assumption: the existing disturbance and resilience tests are strong enough to catch behavior drift during extraction.
- Unknown: how representative the `2026-03-12` JSON ranking still is after `344d4a3` and `f1d8891`, since some checked-in artifacts still mention removed knobs.
