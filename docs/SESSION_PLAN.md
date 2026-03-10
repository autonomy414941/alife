# Session Plan — 2026-03-10

## Compact Context
- `npm` is the package manager; the baseline verification path is `npm test && npm run build`.
- `src/simulation.ts` gives ecological consequences to species-level traits (`habitatPreference`, `trophicLevel`, `defenseLevel`); `lineage` currently only affects clade founding, grouping, and history/export.
- `docs/clade_activity_cladogenesis_horizon_2026-03-09.json` keeps persistent clade novelty positive through `4000` steps for `cladogenesisThresholds` `1.0` and `1.2`, while baseline `-1` stays at zero.
- `docs/clade_species_activity_coupling_2026-03-09.json` shows clade persistent-window fractions nearly match species at `4000` steps, but clade persistent-activity means remain much smaller.
- `docs/horizon_path_dependence_2026-03-06.json` is still `robustNegative` at `320` and `420` steps.

## Project State
- The repo now has deterministic species/clade activity probes, persistence sweeps, coupling studies, and cladogenesis boundary/horizon studies with machine-readable artifacts under `docs/`.
- Recent sessions moved from finding clade-positive thresholds to checking whether those regimes survive to `4000` steps and how closely clade persistence tracks species persistence on the same runs.
- The missing piece is a matched null: nothing yet tests whether the clade-positive result beats a relabeling/compression baseline built from the same species histories.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (2026): the verdict changed with the component being measured, so component-level claims need direct controls instead of a single aggregate story. Source: https://arxiv.org/abs/2603.01701
- Sayama, *Non-Spatial Hash Chemistry as a Minimalistic Open-Ended Evolutionary System* (2024): the positive claim relied on sustained higher-order entity growth, which is stronger evidence than relabeling lower-level turnover. Source: https://arxiv.org/abs/2404.18027

## Research Gaps
- If the actual clade birth schedule is held fixed but species are randomly reassigned into pseudo-clades, do thresholds `1.0` and `1.2` still show more persistent clade activity than that matched null on the existing `4000`-step seed panel?

## Current Anti-Evidence
- Higher-level novelty is still bookkeeping-compatible: clades are born only on species divergence events, and no lineage-level state changes movement, interaction, resource uptake, or survival.
- Path dependence remains robust-negative at `320` and `420` steps, so the project still lacks a broader open-endedness claim even with durable clade activity.

## Candidate Bets
- A: Add a matched-schedule pseudo-clade null study on the existing `4000`-step seeds for thresholds `1.0` and `1.2`, exporting actual-vs-null persistent-window and persistent-activity deltas.
  Why now: the March 9 coupling study narrowed the uncertainty to whether actual clade assignments beat relabeling.
  Est. low-context human time: 50m
  Expected information gain: high
  Main risk: the null design could sprawl if it tries to preserve too many invariants.
- B: Expand the `4000`-step coupling study to a larger fixed seed panel and add uncertainty intervals for thresholds `1.0` and `1.2`.
  Why now: current means rest on four seeds, and one seed already collapses to very few active clades.
  Est. low-context human time: 40m
  Expected information gain: medium
  Main risk: it strengthens robustness without resolving the bookkeeping critique.
- C: Add one lineage-mediated ecological effect with deterministic tests so clade identity changes interactions or resource use.
  Why now: it directly attacks the strongest causal gap in the current model.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: mechanism choice and retuning could consume the session before yielding interpretable evidence.

## Selected Bet
Execute A. Keep the simulation mechanics fixed and add one matched relabeling null rather than another sweep. For each existing `4000`-step seed/threshold run, preserve actual clade birth counts by tick, randomize species-to-pseudo-clade assignment under that schedule, aggregate pseudo-clade histories, and compare actual clade persistence against the null.

## Why This Fits The Horizon
- It reuses the existing `TaxonHistory`-based activity analysis and the already-validated March 9 seed panel instead of changing ecology or retuning parameters.
- Success is autonomously verifiable with deterministic tests plus one fixed-`generatedAt` JSON artifact containing actual/null/delta fields.

## Success Evidence
- A new machine-readable artifact such as `docs/clade_activity_relabel_null_2026-03-10.json` containing, for thresholds `1.0` and `1.2`, actual clade persistence, matched-null persistence, and actual-minus-null deltas at `minSurvivalTicks` `50` and `100`.
- `npm test && npm run build`, plus a fixed-`generatedAt` study command whose output includes aggregate fields like `meanPersistentWindowFractionDeltaVsNull` and `meanPersistentActivityDeltaVsNull`.

## Stop Conditions
- Stop after one matched null design that preserves clade birth count and birth timing; do not add new horizons, bigger seed panels, or ecological mechanics in the same session.
- If schedule matching becomes too complex, shrink to preserving total clade count plus clade `firstSeenTick` distribution and document the approximation instead of adding new simulation instrumentation.

## Assumptions / Unknowns
- Assumption: the current species histories and clade `firstSeenTick` data are sufficient to build a meaningful matched relabeling null without changing simulation internals.
- Unknown: whether actual clades will materially beat the null, or whether the March 9 positive signal will collapse to a coarse-graining artifact.
