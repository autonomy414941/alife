# Session Plan — 2026-03-16

## Compact Context
- `3eb3007` extracted encounter resolution behind `EncounterOperator` interface; `dominantEncounterOperator` preserves existing behavior while opening a seam for alternative encounter models.
- `caf1b53` refreshed the canonical founder-grace / ecology-gate horizon artifact with decomposition and non-species-conditioned null; absolute active-clade deltas remain negative under species-conditioned matching.
- The simulator now has one working mechanism seam (encounter operators) and the plumbing to track both null families.
- `src/simulation.ts` still locks physiology to one resource pool, inheritance to clonal mutation, and movement to greedy one-step local scoring.
- Package manager is npm (`package-lock.json`).

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Planner governance | 5 | 0e1d76f |
| Mechanism-surface extraction | 1 | 3eb3007 |
| Evaluation-surface honesty | 1 | caf1b53 |
| Metric instrumentation | 1 | 662767d |
| Runtime modularization | 1 | 77de075 |
| Study-surface refactors | 1 | 52c2de0 |
| Alternative mechanism implementations | 0 | n/a |
| Scalability measurement | 0 | n/a |

Dominant axis: Planner governance (5/10)
Underexplored axes: alternative mechanism implementations, scalability measurement

## Project State
- The encounter operator seam landed in the last session (`3eb3007`), creating the first pluggable mechanism slot.
- The project has evaluation infrastructure (relabel nulls, decomposition, abundance metrics) but still no alternative mechanism implementation behind the new seam.
- Recent sessions focused on planning and evaluation plumbing rather than building and testing a second encounter operator or other mechanism family.

## External Context
- [Functional coexistence theory: Identifying mechanisms linking biodiversity and ecosystem function](https://esajournals.onlinelibrary.wiley.com/doi/10.1002/ecm.70033) (Ecological Monographs, Jan 2025): Integrates mechanistic understanding of species interactions with ecosystem function, arguing for explicit linkage between coexistence mechanisms and functional outcomes.
- [Species coexistence as an emergent effect of interacting mechanisms](https://www.sciencedirect.com/science/article/pii/S0040580924001084) (Theoretical Population Biology, 2025): Mechanism combinations extend coexistence times more than tenfold versus singular mechanisms, emphasizing interaction over individual tuning.
- [Coexistence in diverse communities with higher-order interactions](https://www.pnas.org/doi/10.1073/pnas.2205063119) (PNAS, 2022): Three-or-more species interactions modify theoretical coexistence understanding beyond pairwise frameworks.

## Research Gaps
- The encounter operator seam exists but has no second implementation to test whether the abstraction boundary is stable or whether it forces premature design commitments.
- Does a pairwise encounter operator (matching each pair rather than dominant-takes-all) reveal structural API deficiencies or remain compatible with the current `EncounterOperatorContext`?

## Current Anti-Evidence
- No tested configuration beats its species-conditioned relabel null in absolute active clades; the refreshed canonical artifact shows founder grace at `-23.75` and ecology gate at `-20.25` versus null at threshold `1.0`.
- The encounter operator seam is the only mechanism slot; resource allocation, inheritance, and settlement remain hard-coded, so the system cannot yet test whether mechanism combinations are the missing leverage or whether encounters alone are sufficient.

## Bet Queue
Selected from backlog:

### Bet 1: [feat] Implement Pairwise Encounter Operator
Build a second encounter operator that resolves conflicts pairwise (each pair interacts once per cell) instead of collapsing to one dominant. This is the cheapest way to test whether the `EncounterOperator` seam is stable and whether a different interaction topology changes coexistence structure without redesigning the whole simulator.

#### Success Evidence
- A new `pairwiseEncounterOperator` exports from `src/encounter.ts` alongside `dominantEncounterOperator`, consumes the same `EncounterOperatorContext`, and is substitutable at runtime with deterministic test coverage.

#### Stop Conditions
- Stop after one working pairwise operator passes tests and integrates with the existing encounter call site.
- Stop if the work reveals that the current `EncounterOperatorContext` is insufficient and forces a breaking seam redesign before the second operator can function.

### Bet 2: [validate] Compare Dominant Versus Pairwise On Canonical Stack
Run the canonical founder-grace / ecology-gate configuration with both encounter operators and export comparative active-clade, persistence, and abundance-weighted deltas. The hypothesis is that pairwise encounters reduce dominance exclusion and improve absolute active-clade outcomes versus null, but this bet measures rather than assumes.

#### Success Evidence
- One comparative study artifact exports both encounter operators on the same stack, surfaces absolute and delta active-clade outcomes, and includes deterministic test coverage for the comparison harness.

#### Stop Conditions
- Stop after one artifact comparing both operators on the canonical stack.
- Stop if results show no difference, suggesting the encounter topology change does not affect coexistence under the current one-resource, clonal architecture.

### Bet 3: [benchmark] Measure History Memory Scaling At Extended Horizons
Quantify how `TaxonHistory.timeline` and per-tick `localityFrames` memory and runtime cost scale with horizon length and taxon count. The backlog has flagged this as a blocker for longer-run regimes, but no session has measured actual cost curves to scope streaming-history work.

#### Success Evidence
- One benchmark script or test exports memory footprint and wall-time measurements across horizon lengths (500, 1000, 2000, 5000 ticks) and reports whether cost is linear, quadratic, or bounded by active taxon count.

#### Stop Conditions
- Stop after one measurement artifact with clear scaling characterization.
- Stop if memory cost is negligible even at 5000 ticks, which would invalidate the streaming-history priority.

### Bet 4: [split] Continue Extracting Reproduction Loop From simulation.ts
`src/simulation.ts` is still 1989 lines; reproduction logic has been partially extracted to `simulation-reproduction.ts`, but settlement, offspring placement, and cladogenesis checks remain in the main file. Continue the split to shrink the main simulation module and clarify the reproduction versus settlement boundary.

#### Success Evidence
- `src/simulation.ts` shrinks by at least 100 lines, settlement / offspring logic moves behind a focused module boundary, and all existing reproduction tests pass without behavior change.

#### Stop Conditions
- Stop after one extraction pass that reduces `simulation.ts` size and passes tests.
- Stop if the work starts redesigning reproduction logic instead of relocating existing code.

## Assumptions / Unknowns
- Assumption: pairwise encounters are the simplest second operator to implement and will stress-test the `EncounterOperator` seam more cheaply than building a multi-resource or recombination layer.
- Unknown: whether pairwise encounter resolution improves absolute active-clade outcomes or whether coexistence is still capped by single-resource and clonal constraints regardless of interaction topology.
- Assumption: history memory is a genuine scaling bottleneck; this bet measures to confirm or refute before investing in streaming infrastructure.
- Observation: the dominant exploration axis is planner governance (5/10 commits), while alternative mechanism implementations remain at zero despite the encounter seam landing last session.
