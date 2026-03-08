# Session Plan — 2026-03-08

## Compact Context
- `npm` is the package manager; the verification baseline is `npm test && npm run build`, and the current test suite is green.
- `src/activity.ts` already has deterministic species/clade persistence panels, and `src/simulation.ts` already supports opt-in `cladogenesisThreshold`.
- `docs/species_activity_seed_panel_2026-03-07.json` is strong species-side evidence: 4/4 seeds keep positive persistent post-burn-in novelty at thresholds `50` and `100`.
- `docs/clade_activity_seed_panel_2026-03-08.json` is still baseline-negative: 4/4 seeds show zero persistent post-burn-in clade novelty at the same thresholds.
- `docs/clade_activity_cladogenesis_probe_2026-03-08.json` proves the new mechanism only in a tiny micro-regime, not the default ecology.
- `lineage` is currently a history label, not a behavioral driver; clade IDs do not feed back into ecology or selection.

## Project State
- The repo now has deterministic spatial dynamics, taxon-history export, disturbance/locality studies, species/clade activity probes, and landed opt-in cladogenesis.
- Recent sessions moved from disturbance/path-dependence falsifiers toward direct novelty measurement and then to enabling clade birth in code.
- The underdeveloped area is baseline-scale calibration: there is no machine-readable evidence for which cladogenesis settings produce persistent clade novelty without making clades behave like near-species aliases.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (arXiv, 2026-03-02): open-endedness conclusions changed with the chosen activity component, so component-specific positives need cross-component calibration. Source: https://arxiv.org/abs/2603.01701
- Bonetti Franceschi, Dolson, and Volz, *Extending a Phylogeny-based Method for Detecting Signatures of Multi-level Selection for Applications in Artificial Life* (arXiv, 2025-08-20): higher-level evolutionary claims depend on phylogenetic grouping structure and normalization, not just raw descendant counts. Source: https://arxiv.org/abs/2508.14232

## Research Gaps
- In the baseline ecology, is there any small `cladogenesisThreshold` range that yields persistent post-burn-in clade novelty while keeping clades materially coarser than species on the same seeds?
- Does the best clade threshold leave the existing species-side novelty signal and end-state ecology roughly intact?

## Current Anti-Evidence
- No documented baseline regime currently shows persistent clade novelty, and any future positive clade counts are still suspect because `lineage` has no causal role in the dynamics.
- Independent anti-evidence remains: `docs/horizon_path_dependence_2026-03-06.json` is robust-negative at `320` and `420` steps.

## Candidate Bets
- A: Add a fixed `cladogenesisThreshold` sweep (`-1`, `0.25`, `0.4`, `0.6`) that exports clade persistence alongside clade/species count ratios on the existing seed panel.
  Why now: The mechanism exists, but the project still lacks evidence about whether it creates meaningful higher-level novelty or mostly relabels species turnover.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: The export schema could sprawl if the comparison is not kept to a few fixed summary fields.
- B: Run the lone robust-positive locality regime (`radius=1`, `refugia=0.35`) with cladogenesis enabled and compare clade persistence against baseline.
  Why now: It tests whether the only supported spatial intervention also supports higher-level novelty.
  Est. low-context human time: 50m
  Expected information gain: medium
  Main risk: Two interacting knobs make attribution murky in one session.
- C: Add one minimal lineage-level ecological feedback and prove it in a micro-regime.
  Why now: Clades currently have no causal role in agent behavior.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: It changes core dynamics without enough time for calibration.

## Selected Bet
Build a deterministic cladogenesis-threshold sweep on top of the existing seed-panel machinery. Reuse the current multi-seed persistence workflow, evaluate a short fixed threshold grid, and export for each threshold clade persistent activity, active/total clade counts, active/total species counts, and simple clade-to-species ratios. The point is to learn whether baseline clade novelty can become positive without collapsing into a near-species relabeling.

## Why This Fits The Horizon
- It reuses existing simulation and activity-panel code, adding one bounded comparison dimension instead of a new evolutionary mechanism.
- Success is autonomously verifiable with deterministic tests and one JSON artifact from fixed seeds and thresholds.

## Success Evidence
- Artifact: a new JSON export under `docs/` listing thresholds `-1`, `0.25`, `0.4`, and `0.6` with per-threshold clade persistent activity plus clade/species count ratios.
- Verification command or output: `npm test && npm run build`, plus a deterministic test that the sweep reproduces the same export for the same seeds and threshold grid.

## Stop Conditions
- Stop if the work starts drifting into threshold auto-tuning, new ecology, or a generalized analytics framework.
- If runtime or schema complexity grows, shrink to fewer thresholds or one ratio metric and record the comparison cleanly rather than expanding scope.

## Assumptions / Unknowns
- Assumption: clade-to-species ratios are a sufficient first-pass proxy for distinguishing higher-level structure from relabeled species turnover.
- Unknown: whether any coarse threshold produces positive clade persistence in the default regime without overly tracking species counts.
