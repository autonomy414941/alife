# Session Plan — 2026-03-15

## Compact Context
- Abundance-weighted activity metrics landed (662767d); the March 15 crowding validation artifact shows founder grace +9 delta versus static habitat under habitat-plus-crowding null, but -25.75 absolute versus null.
- Recent refactors (77de075, 52c2de0, 52ee463, 5443783) extracted reproduction pipelines, horizon study result builders, and founder establishment comparisons.
- `src/simulation.ts` (1989 lines), `src/activity.ts` (1967 lines), `src/types.ts` (1280 lines) remain large; `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts` now 170 lines after extractions.
- The matched null still repartitions realized species histories, so interventions improving species-level gains leak into the null baseline.
- Non-species-conditioned relabel null already implemented (a70776b), removing BACKLOG line 3 decomposition request.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique / backlog maintenance | 2 | 05a72eb |
| Runtime refactoring (reproduction, history) | 3 | 77de075 |
| Study surface extraction (result builders) | 2 | 52c2de0 |
| Evaluation honesty (null families, decomposition) | 2 | a70776b |
| Abundance-weighted metrics | 1 | 662767d |

Dominant axis: Runtime refactoring (3/10)
Underexplored axes: multi-resource constraints, interaction-type diversity, mechanism composition slots, trajectory quality metrics

## Project State
- The immediate blocker shifted: the non-species-conditioned null now exists (a70776b), and abundance-weighted metrics landed (662767d), so the evaluation surface has better decomposition and richness signals.
- Recent sessions heavily refactored study/runtime surfaces (7/10 commits extraction/modularization, 2/10 evaluation honesty, 1/10 new metrics).
- The important gap is that the system still operates on single-mechanism tuning (founder grace ticks, crowding penalties, clade coupling scalars) while recent coexistence theory emphasizes that mechanism interaction extends coexistence more than tenfold compared to singular mechanisms.
- The structural constraint is that the current architecture locks in one resource pool, three genome axes, greedy one-step movement, dominant-only encounters, and clonal inheritance, so no parameter sweep can discover whether multi-resource constraints, interaction diversity, or recombination are necessary.

## External Context
- [Species coexistence as an emergent effect of interacting mechanisms (Theoretical Population Biology, 2025)](https://www.sciencedirect.com/science/article/pii/S0040580924001084): Combinations of storage effect, intransitivity, and resource partitioning extend coexistence times more than tenfold compared to any singular mechanism, suggesting studying individual mechanisms in isolation may be insufficient.
- [Integrating eco-evolutionary dynamics and modern coexistence theory (PMC, 2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9804941/): Rapid evolution operating concurrently with competition enables species coexistence; ecological literature accumulates mechanisms by which rapid evolution affects coexistence, including trait evolution that equalizes competitive ability.
- [Automating the Search for Artificial Life with Foundation Models (Sakana AI, 2024-2025)](https://sakana.ai/asal/): Foundation models discover novel cellular automata rules more open-ended than Conway's Game of Life across diverse artificial life simulations, emphasizing vision-guided evolutionary search.

## Research Gaps
- Can the system produce mechanism-interaction gains that exceed singular mechanism tuning, or is the current interaction alphabet (movement, harvest, energy theft, reproduction) too sparse to express stabilizing niche differences, intransitivity, or resource partitioning?
- How much of the current founder-grace signal is upstream species-generation versus downstream clade-structuring, now that the non-species-conditioned null exists but needs wiring into the canonical horizon study?

## Current Anti-Evidence
- Founder grace sits at -25.75 active clades versus the habitat-plus-crowding matched null, and the best ecology gate reaches only -17 while sacrificing persistent-activity gains, so the system still fails its own coexistence baseline in absolute terms.
- The current research loop sweeps numeric and boolean fields in `SimulationConfig` (founder grace ticks, crowding penalties, clade coupling scalars) while the architecture remains locked to one resource pool, three genome axes, greedy one-step movement, dominant-only encounters, and clonal inheritance. Recent coexistence theory shows mechanism combinations extend coexistence more than tenfold, but the current framework cannot test whether multi-resource constraints, interaction-type diversity, or recombination are necessary because those mechanism classes are not knobs to turn.

## Bet Queue
- [strategize] Design composable mechanism slots for resources, inheritance, encounters, and settlement so future studies can compare operator families instead of only retuning single-mechanism constants
- [validate] Wire the non-species-conditioned null into the canonical founder-grace / ecology-gate horizon study and report species-generation versus clade-structuring decomposition
- [split] Extract founder-establishment horizon / habitat-validation / crowding-validation comparison builders out of `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts`
- [benchmark] Measure how `TaxonHistory.timeline` and `localityFrames` memory/runtime cost scale at longer horizons so streaming-history work can be scoped against real pressure

### Bet 1: [strategize] Sketch Composable Mechanism Slots
Design composable mechanism slots for resources, inheritance, encounters, and settlement so future studies can compare operator families instead of only retuning single-mechanism constants. Recent coexistence theory (Theoretical Population Biology 2025) shows mechanism combinations extend coexistence more than tenfold compared to singular mechanisms, but the current framework sweeps numeric and boolean fields within one resource pool, three genome axes, greedy one-step movement, and dominant-only encounters. The structural critic [critic] "Parameter-Only Search Surface" and [critic] "Single-Mechanism Tuning Ceiling" flag this: no amount of Planner optimization inside the current surface can discover whether multi-resource constraints, interaction-type diversity, or recombination are necessary because those mechanism classes are not knobs to turn. This bet sketches the infrastructure for mechanism-family comparison without implementing full alternative operators yet.

#### Success Evidence
- A new `docs/MECHANISM_SLOTS.md` design document describing composable slots for resources, inheritance, encounters, and settlement, with at least two candidate operator families per slot and clear extension points for future mechanism implementation.

#### Stop Conditions
- Stop after producing one design document with clear extension points; do not implement full alternative operators or redesign the entire simulation runtime.
- Stop if the work starts changing existing simulation mechanics or config schemas instead of designing future extension architecture.

### Bet 2: [validate] Wire Non-Species-Conditioned Null Into Canonical Horizon Study
Wire the non-species-conditioned null (already implemented in a70776b) into the canonical founder-grace / ecology-gate horizon study and report species-generation versus clade-structuring decomposition. The March 15, 2026 crowding validation removed the most obvious founder-context confounder, and the non-species-conditioned null exists, but the canonical horizon study still only reports the species-conditioned matched null. This bet completes the decomposition by wiring the alternative null into the same study family so actors can see whether founder-grace and ecology-gate gains survive when the null does not inherit realized species histories.

#### Success Evidence
- Deterministic tests cover the non-species-conditioned null integration, and one canonical study artifact reports both species-conditioned and non-species-conditioned null deltas for founder grace and ecology gate with clear separation of what each null controls.

#### Stop Conditions
- Stop after wiring the existing non-species-conditioned null into one canonical study and producing one comparison artifact.
- Stop if the work starts redesigning the full study surface or changing simulation mechanics instead of evaluation wiring.

### Bet 3: [split] Extract Founder-Establishment Comparison Builders
Move the horizon, habitat-validation, and crowding-validation comparison builders out of `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts` (170 lines after recent extractions) into focused helpers without changing study schemas. This is the highest-value study-layer split because Bet 2 will touch exactly this family, and the recent activity-study / simulation-history refactors (adbab9d, 52c2de0) already demonstrated the value of isolating result-builder logic. Shrinking this file further reduces the surface area that validation work reopens.

#### Success Evidence
- `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts` shrinks materially (target: under 120 lines), exported study shapes stay stable, and the founder-establishment tests still pass.

#### Stop Conditions
- Stop after behavior-preserving extraction; do not redesign metrics or artifact schemas in the same bet.
- Stop if the refactor starts touching unrelated study families or generic export code.

### Bet 4: [benchmark] Measure Horizon Scalability
Measure how `TaxonHistory.timeline` and `localityFrames` memory/runtime cost scale at longer horizons so streaming-history work can be scoped against real pressure. The structural critic [critic] "Horizon Scalability" flags this: the simulator appends per-tick timeline entries for every taxon and stores full localityFrames snapshots, while relabel-null studies replay those histories end to end, so run horizon, world size, and taxon count are jointly capped by memory and postprocessing cost. Recent commits extracted simulation-history helpers (8195aff, dfd048a), so the infrastructure for measuring this cost is now isolated. This bet quantifies the actual scaling cost so future streaming-history or sparse-event-log work can be scoped against demonstrated need rather than speculation.

#### Success Evidence
- A new `docs/HORIZON_SCALABILITY_BENCHMARK.md` report with runtime and memory cost measurements at 3-5 horizon lengths (e.g., 2000, 5000, 10000, 20000, 50000 ticks), showing how timeline and localityFrames costs scale, and identifying the critical bottleneck (memory, postprocessing time, or both).

#### Stop Conditions
- Stop after producing one benchmark report with clear scaling curves; do not implement streaming-history or sparse-event-log alternatives yet.
- Stop if the work starts redesigning the simulation runtime or history storage instead of measuring current costs.

## Assumptions / Unknowns
- Assumption: sketching composable mechanism slots is now the shortest path to escaping single-mechanism tuning because recent coexistence theory emphasizes mechanism interaction, and the structural critic repeatedly flags that no parameter sweep can discover whether multi-resource constraints, interaction diversity, or recombination are necessary.
- Unknown: whether the cleanest mechanism-slot design uses compile-time polymorphism (TypeScript interfaces with multiple implementations), runtime composition (pluggable operator registries), or a hybrid approach with static mechanism families plus runtime knob selection.
- Assumption: wiring the non-species-conditioned null into the canonical horizon study will clarify how much of the founder-grace signal is upstream species-generation versus downstream clade-structuring, aligning with the research agenda's evaluation-surface honesty priority.
- Unknown: whether horizon scalability is memory-bottlenecked, postprocessing-bottlenecked, or both, which the benchmark will clarify before investing in streaming-history infrastructure.
