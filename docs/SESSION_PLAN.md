# Session Plan — 2026-03-11

## Compact Context
- `npm` is the package manager; the baseline verification path is `npm test && npm run build`.
- `src/simulation.ts` already makes lineage ecologically causal through `cladeHabitatCoupling`, which blends clade and species habitat preference in movement and harvest.
- `test/simulation.test.ts` already proves that same-species agents in different lineages can receive different payoffs when `cladeHabitatCoupling` is enabled.
- `docs/clade_activity_cladogenesis_horizon_2026-03-09.json` keeps threshold `1` clade persistence high through `4000` steps (`meanPersistentWindowFraction` `0.9797` / `0.9392` at `50` / `100` survival ticks).
- `docs/clade_activity_relabel_null_2026-03-10.json` still shows canonical uncoupled actual clades do not beat the matched pseudo-clade null at thresholds `1` and `1.2`.
- `docs/clade_activity_relabel_null_clade_habitat_smoke_2026-03-10.json` shows the coupled short panel produced a non-zero activity delta (`persistentActivityMeanDeltaVsNullMean = -40.93`) but zero persistent-window separation.

## Project State
- The repo now has deterministic species/clade activity analyzers, cladogenesis threshold and horizon studies, a matched relabel-null study, and one coupled smoke artifact around the new lineage mechanic.
- Recent sessions moved from finding clade-positive thresholds to falsifying bookkeeping explanations with matched null controls, then to making lineage identity ecologically causal via habitat coupling.
- The underdeveloped area is dose-response evaluation of that new mechanism: only one `cladeHabitatCoupling = 1` smoke point exists, so the project cannot tell whether the negative result is a weak operating point or a genuine failure of habitat-mediated lineage ecology.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (2026): the open-endedness verdict changed with the component being measured, so clade-level claims need direct component-specific controls. Source: https://arxiv.org/abs/2603.01701
- Moreno, Rodriguez Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (2025): sufficiently strong ecology can leave detectable phylogenetic signatures, which makes a coupling-strength sweep more informative than a single on/off smoke test. Source: https://direct.mit.edu/artl/article/31/2/129/130570/Ecology-Spatial-Structure-and-Selection-Pressure

## Research Gaps
- Across a short fixed seed panel, does actual-vs-null clade separation respond to `cladeHabitatCoupling` strength, and is there any coupling value where persistent clade novelty beats the matched null instead of merely changing it?

## Current Anti-Evidence
- The strongest current result is still negative: on the canonical `4000`-step panel, actual clades are matched or beaten by pseudo-clades built from the same species histories.
- After lineage was made ecologically causal, the only coupled artifact still shows zero persistent-window separation and a negative activity delta, so there is no evidence yet that the new mechanism improves clade-level open-endedness.

## Candidate Bets
- A: Add a clade-habitat-coupling dose-response study that sweeps a small fixed set of `cladeHabitatCoupling` values on the threshold-`1` relabel-null panel and exports per-coupling actual-vs-null deltas.
  Why now: it directly tests whether the newly causal lineage mechanic has a usable operating regime or is only causally real while remaining open-endedness-negative.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: every coupling value may stay flat or negative, leaving no immediate positive mechanism lead.
- B: Extend the coupled relabel-null evaluation from the `1000`-step smoke to the full `4000`-step canonical panel at `cladeHabitatCoupling = 1`.
  Why now: it checks whether the current negative smoke result is just a short-horizon artifact before more code surface is added.
  Est. low-context human time: 30m
  Expected information gain: medium
  Main risk: one point at `1` still cannot distinguish a bad strength choice from a fundamentally weak mechanism.
- C: Add a second lineage-mediated ecological term for encounters or defense and run one matched-null smoke study.
  Why now: habitat coupling proved lineage causality but may be too narrow to influence clade persistence.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: mechanism work can sprawl and obscure whether the real gap is evaluation rather than missing code.

## Selected Bet
Execute A. Build one deterministic study surface around the existing mechanism instead of adding another mechanism immediately. The tight version is a short threshold-`1` relabel-null sweep over a few coupling values such as `0`, `0.25`, `0.5`, `0.75`, and `1`, with tests and export covering both the uncoupled baseline at `0` and the already-known non-zero coupled direction at `1`. The goal is one machine-readable artifact that answers whether any coupling value produces positive actual-vs-null clade separation or whether the whole habitat-coupling family remains negative.

## Why This Fits The Horizon
- It reuses the current relabel-null machinery, the existing `cladeHabitatCoupling` knob, and the March 10 smoke-study pattern instead of opening another simulation-mechanics branch.
- Success is autonomously verifiable with deterministic tests and one fixed-`generatedAt` JSON artifact whose per-coupling deltas can be queried directly.

## Success Evidence
- A new JSON artifact records one row per coupling value for the fixed threshold-`1` seed panel, and the `0` and `1` endpoints respectively reproduce the uncoupled baseline behavior and the current coupled smoke direction.
- `npm test && npm run build`, plus `jq '.results[] | {cladeHabitatCoupling, persistentWindowFractionDeltaVsNullMean, persistentActivityMeanDeltaVsNullMean}' docs/clade_activity_relabel_null_clade_habitat_coupling_sweep_2026-03-11.json`.

## Stop Conditions
- Stop after one threshold (`1`) and a small fixed coupling grid; do not turn this into a joint threshold-by-coupling sweep or another mechanism session.
- If the study/export surface gets messy, shrink to the endpoint comparison (`0` vs `1`) with deterministic tests and a machine-readable artifact instead of thrashing on richer parameter coverage.

## Assumptions / Unknowns
- Assumption: the current `cladeHabitatCoupling` knob is strong enough to produce a measurable dose-response if habitat-mediated lineage ecology is a real leverage point.
- Unknown: whether any positive separation exists inside the current habitat-coupling family, or whether the whole mechanism should be treated as causally real but insufficient for clade-level open-endedness.
