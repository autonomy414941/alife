# Session Plan — 2026-03-13

## Compact Context
- `src/simulation.ts` is `2809` lines and `src/activity.ts` is `2695`; recent feature churn is concentrated in the offspring-settlement and cladogenesis seam inside `simulation.ts`.
- The latest short-horizon ranking artifact is `docs/clade_activity_relabel_null_regression_diagnostics_2026-03-12.json`, which compares recent default-off add-ons on top of the current best short stack.
- The best short stack still wins the `1000`-step smoke at `persistentActivityMeanDeltaVsNullMean=29.25`, but the canonical `4000`-step comparison remains negative in all four cells: `-34.63`, `-111.78`, `-18.24`, `-93.65`.
- In the regression diagnostics, `encounterRiskAversion` ranks last at `-60.79` persistent delta and is the only recent add-on whose dominant loss mode is `founderSuppression`; `trophicOpportunityAttraction` is also negative at `-17.25`.
- Disturbance openings and cladogenesis gates slightly reduce the active-clade deficit, so the current weakest branch is the encounter-aware settlement path rather than every recent mechanic.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Relabel-null diagnostics / harness | 3 | cd697f0 |
| Encounter-aware ecology scoring | 2 | 5003c4f |
| Cladogenesis gating | 2 | 8e477ff |
| Disturbance-mediated settlement openings | 1 | 496f1a8 |
| Long-horizon validation | 1 | a843a91 |
| Decomposition recycling | 1 | 6631bd9 |
| Failed-knob revert / cleanup | 0 | — |
| Simulation split / module extraction | 0 | — |

Dominant axis: Relabel-null diagnostics / harness (3/10)
Underexplored axes: disturbance-mediated settlement openings, long-horizon validation, decomposition recycling, failed-knob revert / cleanup, simulation split / module extraction

## Project State
- The repo already has reusable smoke-study scaffolding, a best-short-stack preset, a regression ranking study, and direct simulation tests for recent settlement and cladogenesis knobs.
- Recent sessions shifted from adding new knobs to diagnosing why March 11-12 mechanics underperformed the best short stack.
- The main gap is now code and search-surface discipline: the encounter-aware settlement branch added complexity to `simulation.ts` without any checked-in positive evidence.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): durable coexistence after founding matters more than producing extra founders, which makes founder-suppressing settlement heuristics a poor search direction.

## Research Gaps
- Is there any inspected evidence that encounter-aware settlement scoring improves post-founding coexistence versus the current best short stack, or is it pure founder-suppression noise that should be pruned?

## Current Anti-Evidence
- The best validated `4000`-step stack is still below matched-null persistent activity in every canonical cell, so durable above-null clade persistence is still unproven.
- Even the short-stack winner remains at `activeCladeDeltaVsNullMean=-36.75`, so the system still lacks a reliable coexistence mechanism.

## Candidate Bets
- A: [revert] Remove the encounter-aware settlement branch (`encounterRiskAversion` and `trophicOpportunityAttraction`) from config, simulation logic, smoke studies, diagnostics, and tests.
  Why now: both knobs are bottom-tier in the new ranking artifact, and one is the clearest recent founder-suppression regression.
  Est. low-context human time: 50m
  Main risk: a later interaction-coupling change could have made this branch useful after all.
- B: [split] Extract offspring-settlement and cladogenesis ecology scoring helpers from `simulation.ts` into a dedicated module without changing behavior.
  Why now: nearly all recent feature churn lands in one dense seam of a `2809`-line file, which is now a clear code-health bottleneck.
  Est. low-context human time: 55m
  Main risk: it improves iteration speed but does not directly change the simulation this session.
- C: [feat] Replace the global disturbance opening bonus with a lineage-absent recolonization bonus that only boosts settlement into recently disturbed cells where the parent's lineage is absent.
  Why now: disturbance openings improved `activeCladeDeltaVsNullMean` more than most recent add-ons, but the current global bonus still hurt persistence.
  Est. low-context human time: 60m
  Main risk: it is still another settlement-axis knob before the weakest branches are pruned.

## Selected Bet
Choose A. The diagnostic pass has already paid for itself: there is now enough evidence to prune the encounter-aware settlement branch rather than widening the same seam again. Removing `encounterRiskAversion` and `trophicOpportunityAttraction` reduces code and search-surface noise while preserving the more promising active-clade directions for later follow-up.

## Why This Fits The Horizon
- It is bounded to one weak mechanism family with clear code touchpoints in config, settlement scoring, study wrappers, and tests.
- Success is autonomously verifiable with the existing test/build pipeline plus a no-references check for the removed knobs.

## Success Evidence
- `src/` and `test/` no longer reference `encounterRiskAversion` or `trophicOpportunityAttraction`, and the regression diagnostics no longer include those scenarios.
- Specific verification command or output: `npm test && npm run build && ! rg -n "encounterRiskAversion|trophicOpportunityAttraction" src test package.json`.

## Stop Conditions
- Stop after removing the encounter-aware settlement branch end-to-end; do not expand the session into removing every negative knob or adding a replacement mechanic.
- If the revert starts entangling unrelated predation or clade-interaction logic, shrink scope to `encounterRiskAversion` first and leave `trophicOpportunityAttraction` documented as follow-up.

## Assumptions / Unknowns
- Assumption: no checked-in artifact outside the inspected March 11-12 studies shows a positive result for encounter-aware settlement scoring.
- Unknown: how much reusable occupant-grid support remains worth keeping once these two knobs are gone.
