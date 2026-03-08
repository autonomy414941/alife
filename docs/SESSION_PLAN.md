# Session Plan — 2026-03-08

## Compact Context
- `src/activity.ts` already ships species-level probe, persistence sweep, horizon sweep, and fixed seed-panel analytics with deterministic tests.
- `src/simulation.ts` exports both `species` and `clades` as `TaxonHistory[]` with `firstSeenTick`, `extinctTick`, and full timelines.
- `docs/species_activity_seed_panel_2026-03-07.json` shows 4/4 baseline seeds keep persistent post-burn-in species novelty positive across all evaluable windows for thresholds `50` and `100` at `2000` steps.
- `docs/species_activity_horizon_sweep_2026-03-07.json` stays positive through `1000`, `1500`, and `2000` steps, but only for one seed.
- `docs/horizon_path_dependence_2026-03-06.json` is robust-negative by `320` and `420` steps.
- `docs/locality_regime_sweep_2026-03-07.json` has one robust-positive locality cell and otherwise ambiguous support.

## Project State
- The repo now has deterministic simulation, taxon-history export, disturbance/locality studies, and species-level novelty instrumentation with landed multi-seed robustness.
- Recent sessions moved from disturbance/path-dependence falsifiers toward direct novelty measurement, and the species persistence signal did not collapse under a 4-seed panel.
- The important gap is component sensitivity: novelty evidence is still species-only even though clade histories are already available.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (arXiv, submitted March 2, 2026): their conclusion changed with the chosen activity component and they explicitly note follow-up work should repeat the test with different units such as species. Source: https://arxiv.org/abs/2603.01701
- Moreno, Rodriguez-Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (arXiv v2, November 21, 2024): phylogenetic signatures can generalize across equivalent unit definitions, but interpretation depends on metric choice and high-resolution histories. Source: https://arxiv.org/abs/2405.07245

## Research Gaps
- If the current persistence filter is applied to clade histories on the same baseline seed panel, does post-burn-in new activity remain positive or collapse at the coarser taxonomic level?

## Current Anti-Evidence
- The evidence is not convergent: species persistence looks strong, but longer-horizon path-dependence evidence is robust-negative and locality support is isolated to one regime.
- The best novelty result still depends on one component choice (`species`), so measurement sensitivity remains unresolved.

## Candidate Bets
- A: Add a clade-level activity persistence seed panel for the current `2000`-step baseline and thresholds `50`/`100`, mirroring the landed species artifact.
  Why now: Species seed robustness already landed, and clade histories are already exported in the same timeline format.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: A taxon-generic refactor could sprawl if it tries to redesign every existing activity interface.
- B: Add a multi-seed species persistence horizon sweep beyond `2000` steps for the existing baseline thresholds.
  Why now: The current positive novelty result is still horizon-limited even after the seed-panel win.
  Est. low-context human time: 55m
  Expected information gain: medium
  Main risk: Runtime and artifact size may consume the session without resolving component sensitivity.
- C: Compare the lone robust-positive locality regime (`radius=1`, `refugia=0.35`) against the baseline using the existing species persistence seed panel.
  Why now: It tests whether the only supported spatial intervention also strengthens novelty.
  Est. low-context human time: 40m
  Expected information gain: medium
  Main risk: It mixes regime comparison into a measurement stack that still has unresolved component dependence.

## Selected Bet
Add a clade-level persistence seed panel for the existing `2000`-step baseline, reusing the same windowing and survival-threshold logic already used for species. Keep it narrow: one taxonomic change (`species` to `clades`), the existing 4-seed panel, thresholds `50` and `100`, and one machine-readable artifact that answers whether the current novelty claim survives at a higher phylogenetic level.

## Why This Fits The Horizon
- The work is local to activity/types/tests plus one JSON artifact, and it can reuse `TaxonHistory`-based logic without touching simulation dynamics.
- Success is autonomously verifiable with deterministic tests/build and an artifact that either preserves positive clade persistence or cleanly falsifies it.

## Success Evidence
- Artifact: `docs/clade_activity_seed_panel_2026-03-08.json` with the exact seed list, per-seed clade raw summaries, per-threshold persistence summaries, and aggregates such as `minPersistentWindowFraction`.
- Verification command or output: `npm test && npm run build`, then inspect whether thresholds `50` and `100` keep clade `postBurnInWindowsWithPersistentNewActivity > 0` across evaluable windows or reveal collapse.

## Stop Conditions
- Stop if the session starts expanding into CLI redesign, locality comparisons, or new open-endedness metrics; keep scope on clade measurement for the baseline regime only.
- If a taxon-generic abstraction starts touching disturbance/export paths, shrink to a clade-only mirror of the existing species functions and document the missing generalization.

## Assumptions / Unknowns
- Assumption: clade histories are semantically comparable enough to species histories for the same persistence-window analysis because both are exported as timeline-based `TaxonHistory`.
- Unknown: whether clade originations are frequent enough by `2000` steps for a meaningful persistence signal, or whether a null result will mostly reflect coarse aggregation.
