# Session Plan — 2026-03-07

## Compact Context
- `src/activity.ts` already has deterministic species activity probe, horizon sweep, and persistence-filtered sweep support with tests.
- `docs/species_activity_horizon_sweep_2026-03-07.json` stays positive through `2000` steps for seed `20260307`: every post-burn-in window has non-zero species `newActivity`.
- `docs/species_activity_persistence_sweep_2026-03-07.json` shows that thresholds `50` and `100` still keep persistent novelty in all `17` evaluable post-burn-in windows; only the final window is censored.
- `src/simulation.ts` exports both species and clade histories, including `firstSeenTick`, `extinctTick`, and full timelines.
- Disturbance/locality evidence is still mixed: `docs/locality_regime_sweep_2026-03-07.json` has one robust-positive cell, `docs/locality_threshold_sweep_2026-03-07.json` has no supported cell, and `docs/horizon_path_dependence_2026-03-06.json` is robust-negative by `320` and `420` steps.
- The disturbance study path already has seed-block and CI95 machinery in `src/experiment.ts`; the species-activity path does not.

## Project State
- The repo now contains deterministic simulation, turnover/history analytics, disturbance/locality studies, and landed species-level novelty probes with persistence filtering.
- Recent sessions have shifted from disturbance/path-dependence falsifiers toward direct novelty measurement, and the durability-filtered species signal did not collapse.
- The important gap is robustness: the strongest positive novelty evidence still comes from one baseline seed and one baseline configuration.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (arXiv, March 2, 2026): open-endedness conclusions changed when the measured activity component changed, which raises the bar for claiming success from a narrow slice of evidence. Source: https://arxiv.org/abs/2603.01701
- Kimpton et al., *Uncertainty quantification for agent-based models: a tutorial* (arXiv, February 9, 2024): stochastic ABM claims should be supported by explicit uncertainty summaries rather than single trajectories. Source: https://arxiv.org/abs/2402.04580

## Research Gaps
- Does the current persistence-filtered species novelty signal remain positive across a fixed multi-seed panel, or is the `20260307` baseline an unusually favorable trajectory?

## Current Anti-Evidence
- The best current pro-open-endedness result is still a single-seed species-level trajectory, which is too fragile for a stochastic system.
- Independent criteria are not yet convergent: longer-horizon path-dependence evidence is robust-negative while locality support is isolated to one cell.

## Candidate Bets
- A: Add a bounded multi-seed species-activity persistence sweep for the existing `2000`-step baseline and thresholds `50`/`100`.
  Why now: Persistence filtering already survived on one seed, so the next strongest falsifier is whether that signal generalizes beyond that trajectory.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: The output schema can sprawl if the session tries to reproduce the full disturbance-study statistics stack.
- B: Add clade-level activity and persistence probes using the already-exported clade histories.
  Why now: Component sensitivity remains unresolved, and clade histories already exist in the simulation state.
  Est. low-context human time: 55m
  Expected information gain: high
  Main risk: Generalizing species activity code into a taxon-agnostic layer may exceed the session horizon.
- C: Compare species-activity persistence on the lone robust-positive locality regime (`radius=1`, `refugia=0.35`) against the baseline regime.
  Why now: It tests whether the only currently supported spatial intervention also strengthens novelty.
  Est. low-context human time: 50m
  Expected information gain: medium
  Main risk: It mixes regime comparison into a result that is not yet robust across seeds even in the baseline.

## Selected Bet
Add a fixed-seed-panel species-activity persistence sweep for the current `2000`-step baseline, reusing the landed raw and persistence summaries instead of inventing new novelty definitions. Keep it narrow: one baseline configuration, thresholds `50` and `100`, per-seed outputs plus a small aggregate that answers whether persistent post-burn-in novelty survives beyond the `20260307` run.

## Why This Fits The Horizon
- The work is local to activity/export/tests and one JSON artifact, and it can borrow lightweight uncertainty patterns from `src/experiment.ts` without touching simulation dynamics.
- Success is autonomously checkable with deterministic tests/build and a machine-readable artifact that either shows broad seed robustness or clearly falsifies it.

## Success Evidence
- Artifact: `docs/species_activity_seed_panel_2026-03-07.json` containing the exact seed list, per-seed raw summaries, and per-threshold aggregates such as `minPersistentWindowFraction`, `meanPersistentWindowFraction`, and `seedsWithAllEvaluableWindowsPositive`.
- Verification command or output: `npm test && npm run build`, then inspect whether thresholds `50` and `100` keep `minPersistentWindowFraction > 0` or reveal seed-level collapses.

## Stop Conditions
- Stop if the implementation starts expanding into new dynamics, locality comparisons, or clade metrics; keep the session on baseline seed robustness only.
- If CI/block-style aggregation becomes too large, shrink to a deterministic per-seed panel plus min/mean aggregates and document the missing uncertainty layer instead of thrashing.

## Assumptions / Unknowns
- Assumption: now that persistence filtering stayed positive, seed robustness is the highest-leverage next uncertainty to reduce.
- Unknown: whether a small fixed seed panel is enough to materially update the open-endedness judgment, or whether configuration sensitivity will dominate next.
