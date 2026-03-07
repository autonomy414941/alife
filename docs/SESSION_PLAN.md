# Session Plan — 2026-03-07

## Compact Context
- `runSpeciesActivityProbe()` and `runSpeciesActivityHorizonSweep()` already exist, are deterministic under test, and export JSON.
- `docs/species_activity_horizon_sweep_2026-03-07.json` stays positive through `2000` steps: every post-burn-in window has non-zero `newActivity`, and `finalNewActivity` remains non-zero at all three horizons.
- The current activity artifacts use `windowSize=100`, `burnIn=200`, and seed `20260307`, so a filtered comparison can stay directly comparable to existing outputs.
- `src/simulation.ts` already records per-species `firstSeenTick`, `extinctTick`, and full timelines, plus aggregate `extinctLifespan` and `activeAge`.
- Disturbance/locality evidence is still mixed: `docs/locality_regime_sweep_2026-03-07.json` has one robust-positive cell, `docs/locality_threshold_sweep_2026-03-07.json` has none, and `docs/horizon_path_dependence_2026-03-06.json` turns robust-negative by `steps=320`.

## Project State
- The codebase now has deterministic simulation, export helpers, disturbance/locality studies, and landed species-activity probe/horizon sweep coverage in `src/` and `test/`.
- Recent sessions moved from path-dependence/locality falsifiers toward direct novelty instrumentation, and the first horizon extension did not collapse the activity signal.
- The important gap is durability: current `newActivity` credits origin-window occupancy even when a species may disappear soon after appearing.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (arXiv, 2026-03-02): open-endedness conclusions changed when cumulative activity and new activity were separated. Source: https://arxiv.org/abs/2603.01701
- Lopez-Diaz et al., *Quantifying open-ended evolution in random Boolean networks* (arXiv, 2025-09-22): residence-time-weighted measures are used to separate enduring innovation from transient noise. Source: https://arxiv.org/abs/2509.18098

## Research Gaps
- Does the current positive species-level `newActivity` signal remain positive after only counting newly originated species that survive at least `50` or `100` ticks?
- How much post-burn-in novelty disappears once windows too close to the horizon are treated as censored instead of silently counted as zeros?

## Current Anti-Evidence
- `newActivity` can stay high under rapid speciation/extinction churn because it only credits occupancy inside the origin window.
- The spatial/path-dependence story is not convergent yet: one locality cell is robust-positive, but threshold and longer-horizon path-dependence results are ambiguous or negative.

## Candidate Bets
- A: Add a persistence-filtered species-activity sweep that reports raw vs survival-threshold novelty (`50` and `100` ticks) on the existing `2000`-step baseline.
  Why now: It directly targets the strongest remaining anti-evidence and reuses species-history data the simulation already exports.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: Threshold semantics can sprawl if the session chases too many alternative persistence definitions.
- B: Add seed-blocked reproducibility for raw species-activity horizons at `1000`, `1500`, and `2000` steps.
  Why now: The current positive activity story is still anchored to one deterministic seed.
  Est. low-context human time: 55m
  Expected information gain: medium
  Main risk: Reproducing the raw metric still leaves transient-churn anti-evidence unresolved.
- C: Compare species-activity output on the lone robust-positive locality regime (`radius=1`, `refugia=0.35`) against the baseline horizon.
  Why now: It is the only current spatial intervention with robust-positive CI95 support.
  Est. low-context human time: 50m
  Expected information gain: medium
  Main risk: It mixes parameter comparison with an unresolved metric-definition problem.

## Selected Bet
Add a bounded survival-threshold extension to species activity and export one deterministic `2000`-step comparison artifact for thresholds `50` and `100`. Reuse existing species histories and keep the definition narrow: a species only contributes to filtered novelty if its observed lifetime reaches the threshold, and windows without enough follow-up are marked censored instead of being silently counted as zeros.

## Why This Fits The Horizon
- The work is local to `src/activity.ts`, export/tests, and one JSON artifact; no simulation dynamics or disturbance machinery needs to change.
- Success is autonomously checkable with deterministic tests/build plus a single artifact whose filtered `postBurnInWindowsWithPersistentNewActivity` either stays non-zero or collapses.

## Success Evidence
- Artifact: `docs/species_activity_persistence_sweep_2026-03-07.json` with one entry per threshold including `minSurvivalTicks`, `censoredPostBurnInWindows`, `postBurnInWindowsWithPersistentNewActivity`, and `finalPersistentNewActivity`.
- Verification command or output: `npm test && npm run build`, then inspect whether thresholds `50` and `100` keep non-zero persistent novelty outside censored windows.

## Stop Conditions
- Stop if the definition expands beyond a simple lifespan cutoff plus censoring; do not add cross-seed blocks, locality comparisons, or multiple alternative persistence formulas in the same session.
- If horizon-censoring logic starts dominating the implementation, shrink to one threshold (`100`) and document the remaining threshold-sensitivity instead of thrashing.

## Assumptions / Unknowns
- Assumption: durability of novelty is the highest-leverage next falsifier now that raw horizon persistence is already positive through `2000` steps.
- Unknown: whether `50`/`100` ticks are a sufficiently informative provisional persistence cutoff, or whether later work will need a different survival notion.
