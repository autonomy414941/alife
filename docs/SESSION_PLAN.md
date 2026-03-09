# Session Plan — 2026-03-09

## Compact Context
- `npm` is the package manager; the standard verification baseline is `npm test && npm run build`.
- `src/simulation.ts` now supports opt-in cladogenesis: `cladogenesisThreshold=-1` disables new clades, and non-negative thresholds found a new clade when a new species is far enough from its lineage founder genome.
- `docs/species_activity_seed_panel_2026-03-07.json` is strong species-side evidence: all 4 fixed seeds keep positive persistent post-burn-in species novelty at survival thresholds `50` and `100`.
- `docs/clade_activity_seed_panel_2026-03-08.json` is still baseline-negative: with default cladogenesis disabled, all 4 fixed seeds have zero persistent post-burn-in clade novelty.
- `docs/clade_activity_cladogenesis_sweep_2026-03-08.json` makes clade novelty positive at thresholds `0.25`, `0.4`, and `0.6`, but mean active/total clade-to-species ratios rise to about `0.56-0.87` and `0.39-0.87`.
- `lineage` is still bookkeeping, not ecology: clade IDs change taxon history and founder-genome comparisons, but they do not directly affect interaction, selection, or survival.

## Project State
- The repo already has deterministic simulation runs, disturbance/locality studies, species/clade activity probes, opt-in cladogenesis, and tested JSON export for the current clade-threshold sweep.
- Recent sessions moved from path-dependence/locality falsifiers into direct novelty measurement, then into enabling and calibrating clade birth.
- The underdeveloped area is the coarse-scale boundary: the current threshold grid stops at `0.6`, so there is still no evidence whether clade persistence survives once clades become materially coarser than the current `0.56` active-ratio / `0.39` total-ratio regime.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests*: activity-based open-endedness conclusions changed with the chosen component, so a positive result that only appears under one grouping scale is weak evidence. Source: https://arxiv.org/abs/2603.01701
- Moreno, Hasanzadeh Fard, Zaman, and Dolson, *Extending a Phylogeny-based Method for Detecting Signatures of Multi-level Selection for Applications in Artificial Life*: higher-level evolutionary claims are sensitive to phylogenetic grouping and normalization, so grouping-scale sensitivity is itself informative. Source: https://arxiv.org/abs/2508.14232

## Research Gaps
- If `cladogenesisThreshold` is pushed above `0.6`, does persistent clade novelty remain positive at any clearly coarser grouping scale, or does the signal collapse as soon as clades stop tracking species so closely?

## Current Anti-Evidence
- `docs/horizon_path_dependence_2026-03-06.json` is still robust-negative at `320` and `420` steps, so the project still lacks a durable long-horizon positive open-endedness signal.
- Current clade-side positives are compatible with relabeled species turnover: they appear only when clades remain a large fraction of species counts, and `lineage` still has no causal ecological role.

## Candidate Bets
- A: Extend the baseline cladogenesis sweep upward to a coarse threshold grid and measure where persistent clade activity collapses relative to clade/species compression.
  Why now: The current sweep ends before the grouping-scale boundary is known, and that boundary is the cleanest next falsifier for the new clade signal.
  Est. low-context human time: 35m
  Expected information gain: high
  Main risk: The added coarse thresholds may all go to zero quickly, yielding a short negative result.
- B: Re-run the existing cladogenesis sweep inside the lone robust-positive locality regime and compare compression-versus-persistence against baseline.
  Why now: If ecology can rescue higher-level novelty, the only supported locality cell is the least ambiguous place to check.
  Est. low-context human time: 50m
  Expected information gain: medium
  Main risk: Two moving knobs make attribution murkier than a baseline-only boundary test.
- C: Add one minimal lineage-mediated ecological feedback and test whether clade persistence changes on the existing seed panel.
  Why now: `lineage` is still non-causal, which limits the meaning of any clade-level positive.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: Mechanism design and calibration are too open-ended for one bounded session.

## Selected Bet
Extend the existing `runCladeActivityCladogenesisSweep` into a small coarse-threshold boundary study anchored at the current positive edge. Use the same fixed seeds and persistence windows, keep `-1` and `0.6` as anchors, add a few thresholds above `0.6`, and export the same activity and clade/species count aggregates. The session should answer one narrow question: does any threshold above `0.6` keep clade persistence positive while materially reducing clade-to-species ratios, or does the signal disappear once grouping becomes genuinely coarser?

## Why This Fits The Horizon
- It reuses existing sweep logic, export schema, and test patterns instead of introducing new ecology or a new measurement family.
- Success is autonomously verifiable with one deterministic test plus one fixed JSON artifact from a short threshold list and the current seed panel.

## Success Evidence
- A new JSON export under `docs/` for a fixed threshold grid such as `-1`, `0.6`, `0.8`, `1.0`, and `1.2`, including `activityAggregates` and `countAggregates` for each threshold.
- `npm test && npm run build`, plus a deterministic test showing repeated runs of the same coarse-threshold grid produce identical sweep output.

## Stop Conditions
- Stop if the work starts drifting into threshold auto-tuning, new lineage feedback, or locality/disturbance combinations.
- If runtime or artifact size grows too much, shrink to three thresholds above `0.6` and finish the boundary comparison cleanly instead of expanding scope.

## Assumptions / Unknowns
- Assumption: clade-to-species count ratios are a sufficient first-pass proxy for whether clades are meaningfully coarser than species.
- Unknown: whether thresholds above `0.6` preserve any evaluable persistent clade novelty before clade counts collapse back toward the baseline-zero regime.
