# Session Plan — 2026-03-13

## Compact Context
- `src/disturbance.ts` and `src/reproduction.ts` now hold extracted helpers, but `LifeSimulation` in `src/simulation.ts` is still `2412` lines and still owns the step loop plus occupancy-driven movement and reproduction decisions.
- `src/activity.ts` is still `2695` lines, and `10+` relabel-null study entrypoints share near-identical wrapper structure around the same smoke-study runner.
- The current short relabel-null best stack still uses lineage crowding plus encounter restraint and reports `persistentActivityMeanDeltaVsNullMean=29.25`, but it also reports `activeCladeDeltaVsNullMean=-36.75` with `dominantLossMode=activeCladeDeficit`.
- The localized disturbance opening smoke study kept birth schedules matched and improved `activeCladeDeltaVsNullMean` from `-36.75` to `-31.25`, but it reduced `persistentActivityMeanDeltaVsNullMean` from `29.25` to `11.75`.
- The validated `4000`-step best-stack comparison is still below matched null at every checked threshold window, so short-horizon wins are not yet durable evidence.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Relabel-null diagnostics / smoke harness | 3 | cd697f0 |
| Disturbance recolonization mechanics | 2 | ecd5c97 |
| Offspring settlement / reproduction seam | 2 | f1d8891 |
| Cladogenesis gating | 2 | 8e477ff |
| Ecology scoring experiments | 1 | 5003c4f |
| Activity analysis split | 0 | — |

Dominant axis: Relabel-null diagnostics / smoke harness (3/10)
Underexplored axes: ecology scoring experiments, activity analysis split

## Project State
- The repo has deterministic disturbance and reproduction tests, reusable relabel-null study scaffolding, and newly extracted disturbance and reproduction helpers.
- Recent sessions moved from adding local coexistence heuristics to diagnosing failures, then started carving simulation seams out of `LifeSimulation`.
- The main mechanism gap is that disturbance openings are still generic vacancy bonuses, so disturbed cells can still be reclaimed by the same local lineage that just lost the patch.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): durable coexistence after founding matters more than founder count alone, which matches this project's persistent `activeCladeDeficit` failure mode.

## Research Gaps
- Can disturbance openings reward local lineage turnover rather than generic recolonization, so disturbed patches preferentially admit lineages that were not already locally dominant?

## Current Anti-Evidence
- The `2026-03-12` best-stack horizon artifact still reports negative persistent activity delta versus matched null at every checked cell: `-34.63`, `-111.78`, `-18.24`, and `-93.65`.
- Even the current short-horizon winner still trails matched null by `36.75` active clades on average, and the disturbance-opening variant still ends in `dominantLossMode=activeCladeDeficit`.

## Candidate Bets
- A: [feat] Add a lineage-absent disturbance recolonization mode so freshly disturbed cells get a settlement bonus only when the parent lineage is not already locally present.
  Why now: localized disturbance openings are the one recent mechanic family that moved the active-clade deficit in the right direction, and the new helper seams make a tighter rule feasible without reviving the removed encounter-aware branch.
  Est. low-context human time: 45m
  Main risk: it may just duplicate existing lineage crowding penalties and lower settlement enough to hurt persistence again.
- B: [split] Split `src/activity.ts` into relabel-null analysis core plus study-definition modules and remove wrapper duplication across the smoke-study entrypoints.
  Why now: `src/activity.ts` still exceeds the split trigger and the repeated study wrappers are now a recurring maintenance cost on every experiment.
  Est. low-context human time: 45m
  Main risk: it improves leverage but does not change simulation behavior this session.
- C: [revert] Remove or quarantine one failed short-stack knob family that is not in `BEST_SHORT_STACK_SIMULATION_CONFIG`, starting with the cladogenesis gate experiments that lowered short-horizon delta in their smoke runs.
  Why now: the current code still carries experimental surface area that recent artifacts do not justify, which raises search-space and maintenance cost.
  Est. low-context human time: 30m
  Main risk: a mechanism that fails in the current stack could still matter in another regime, so reverting too aggressively may discard useful future combinations.

## Selected Bet
Choose A. The best current clue is that disturbance-created vacancies slightly reduce the active-clade deficit, but the effect is too blunt because incumbents can still recolonize their own openings. A lineage-absent recolonization rule is a direct mechanics change on that promising seam, is narrower than the removed encounter-aware settlement branch, and can be verified with deterministic settlement tests plus the existing disturbance-colonization smoke-study surface.

## Why This Fits The Horizon
- It is bounded to one settlement-bias rule on top of the current disturbance opening path; it does not require a new analysis framework or a long benchmark run in the same session.
- Success is verifiable autonomously with targeted tests and a build, and the existing smoke-study harness can prove the new mode is wired correctly.

## Success Evidence
- A new disturbance recolonization mode or config path exists, and a deterministic simulation test shows disturbed cells are favored when the parent lineage is locally absent but not when the same lineage already occupies the opening.
- Specific verification command or output: `npm test -- --runInBand test/simulation.test.ts test/clade-activity-relabel-null-disturbance-colonization-smoke-study.test.ts && npm run build`

## Stop Conditions
- Stop once one lineage-sensitive disturbance recolonization rule is implemented, covered by deterministic tests, and exposed through the existing disturbance-colonization smoke study; do not also run long-horizon sweeps or add unrelated settlement heuristics.
- If expressing local lineage absence requires widening too many APIs, shrink scope to a single boolean or threshold mode that reuses the existing settlement context rather than inventing a broader occupancy abstraction.

## Assumptions / Unknowns
- Assumption: local lineage occupancy near a disturbed patch is a good enough proxy for incumbent advantage to make recolonization more diversity-friendly.
- Unknown: whether improving the short-horizon active-clade deficit on disturbed openings will translate into better `4000`-step persistence instead of repeating the current `29.25 -> 11.75` tradeoff.
