# Session Plan — 2026-03-15

## Compact Context
- The March 15, 2026 habitat-plus-crowding validation artifact is committed (5.6M); founder grace still beats static habitat under the stricter null (`+9` delta improvement at cladogenesis threshold `1.0`, `+4` at `1.2`), but absolute active clades remain negative (`-25.75` versus null).
- Recent commits (cb7d657 through dfd048a) completed founder-establishment and simulation-history refactors, resolved the disturbance-opening artifact bug, and added species decomposition to the relabel-null horizon study.
- `src/activity.ts` (1863 lines), `src/simulation.ts` (2160 lines), `src/types.ts` (1225 lines) remain large; `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts` now 414 lines after recent extractions.
- `buildMatchedSchedulePseudoClades()` still repartitions realized species histories, so any intervention improving species origination or persistence leaks into the null baseline.
- The research agenda now prioritizes evaluation-surface honesty and species-versus-clade decomposition before more mechanism sweeps.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique / backlog maintenance | 3 | cb7d657 |
| Activity-study / history modularization | 3 | adbab9d |
| Simulation-history extraction | 2 | 8195aff |
| Founder-context validation | 1 | c0c33df (species decomposition) |
| Artifact hygiene | 1 | 1aa3677 (disturbance-opening fix) |
| Runtime founding-loop extraction | 0 | none |
| Abundance-weighted metrics | 0 | none |
| Multi-resource / interaction richness | 0 | none |

Dominant axis: Structural critique and activity-study modularization (tied at 3/10)
Underexplored axes: runtime founding-loop extraction, abundance-weighted metrics, multi-resource/interaction richness

## Project State
- The March 15, 2026 founder-crowding validation removed the most obvious founder-context confounder; founder grace still improves over static habitat under the stricter null.
- Recent sessions focused heavily on refactoring study/runtime surfaces (7/10 commits), with only 2/10 commits adding new evaluation capabilities or validations.
- The important gap is that the matched null still inherits realized species histories, so the current headline delta cannot distinguish upstream species-generation gains from downstream clade packing.

## External Context
- [Species coexistence as an emergent effect of interacting mechanisms (Theoretical Population Biology, 2025)](https://www.sciencedirect.com/science/article/pii/S0040580924001084): mechanistic simulation grounded in neutral theory shows coexistence times can extend more than tenfold when mechanisms combine (storage effect, intransitivity, resource partitioning), compared to individual mechanisms. Studying individual mechanisms in isolation may be insufficient.
- [Detecting non-neutral modules in species co-occurrence (Royal Society Open Science, 2025)](https://royalsocietypublishing.org/rsos/article/12/7/241375/235382/Detecting-non-neutral-modules-in-species-co): neutral theory provides robust null hypothesis methodology; key property is "rank consistency" where species presence probabilities should be ordered similarly across sites within a common regional pool.
- [Guiding Evolution of Artificial Life Using Vision-Language Models (2025)](https://arxiv.org/pdf/2509.22447): ASAL++ uses vision-language models to propose evolutionary targets from simulation visual history, inducing trajectories with increasingly complex targets.

## Research Gaps
- How much of the current founder-grace signal survives when decomposed into upstream species-generation gains (more species produced, better species persistence) versus downstream clade-structuring gains (better assignment of realized species into clades)?
- Can the system produce emergent coexistence from mechanism interaction (per recent coexistence theory), or is it still confined to single-mechanism tuning because the interaction alphabet is too sparse (only movement, harvest, energy theft, reproduction)?

## Current Anti-Evidence
- Founder grace sits at `-25.75` active clades versus the habitat-plus-crowding matched null, and the best ecology gate reaches only `-17` by sacrificing most persistent-activity gains, so the system still fails its own coexistence baseline in absolute terms.
- The matched null repartitions realized species histories, so any improvement in species origination timing, abundance, or persistence is inherited by the null. The headline clade-vs-null delta therefore conflates "opened more upstream innovation opportunities" with "reassigned the same realized species substrate into clades differently."

## Bet Queue
- [validate] Add a decomposition panel with a second null that does not condition on realized species histories, and report upstream species-generation gains separately from downstream clade-structuring gains on the canonical founder-grace / ecology-gate panel
- [split] Extract founder-establishment horizon / habitat-validation / crowding-validation comparison builders out of `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts`
- [split] Continue extracting the reproduction / founding loop from `src/simulation.ts`
- [validate] Add abundance-weighted or energy-weighted activity metrics to complement occupancy-only activity, so the evaluation can distinguish barely-alive label persistence from ecologically consequential expansion

### Bet 1: [validate] Decompose Species-Conditioned Null Leakage
Add one alternative null or paired decomposition that does not inherit realized species histories, then report canonical founder-grace and ecology-gate results as separate upstream species-generation and downstream clade-structuring components. The March 15, 2026 crowding validation removed the most obvious founder-context confounder; the next bounded question is whether the remaining signal survives when the null does not reuse realized species. The recent coexistence-theory literature emphasizes that mechanism interaction matters, but the current evaluation cannot tell whether the system is improving species-level innovation or merely clade-level packing.

#### Success Evidence
- Deterministic tests cover the new decomposition output, and one canonical study artifact reports both species-generation and clade-structuring components for founder grace and ecology gate with clear separation of what each null controls.

#### Stop Conditions
- Stop after adding one non-species-conditioned null family or decomposition view and wiring it into the canonical founder-grace / ecology-gate panel.
- Stop if the work starts redesigning the full study surface or changing simulation mechanics instead of evaluation logic.

### Bet 2: [split] Extract Founder-Establishment Comparison Builders
Move the horizon, habitat-validation, and crowding-validation comparison builders out of `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts` (now 414 lines after recent extractions) into focused helpers without changing study schemas. This is the highest-value study-layer split because the decomposition work will keep touching exactly this family, and the recent activity-study / simulation-history refactors already demonstrated the value of isolating result-builder logic.

#### Success Evidence
- `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts` shrinks materially (target: under 300 lines), exported study shapes stay stable, and the founder-establishment tests still pass.

#### Stop Conditions
- Stop after behavior-preserving extraction; do not redesign metrics or artifact schemas in the same bet.
- Stop if the refactor starts touching unrelated study families or generic export code.

### Bet 3: [split] Continue Isolating the Reproduction / Founding Loop
Extract more of the reproduction and new-clade founding path from `src/simulation.ts` (2160 lines) into focused helpers while preserving behavior. Recent commits (52ee463, 5443783) already extracted reproduction coordination helpers and founder establishment comparisons; this bet continues that axis. This sets up future establishment or persistence mechanism work without reopening the whole runtime loop, and addresses the backlog item before other sessions re-pollute the same code.

#### Success Evidence
- `src/simulation.ts` shrinks materially (target: under 2000 lines), reproduction / cladogenesis tests still pass, and snapshot/history exports are unchanged.

#### Stop Conditions
- Stop after a behavior-preserving extraction of the founding path; do not attempt scheduler redesign or streaming-history changes in the same bet.
- Stop if the refactor starts altering movement, encounter, or reproduction semantics.

### Bet 4: [validate] Add Abundance-Weighted Activity Metrics
Add abundance-weighted or energy-weighted activity metrics to complement the existing occupancy-only activity counters, so the evaluation surface can distinguish barely-alive label persistence (one survivor per tick) from ecologically consequential expansion (dominates many cells or carries significant energy). The backlog [critic] item "Occupancy-Only Success Proxy" flags this: the canonical activity probes increment once per occupied tick regardless of whether a taxon has one survivor or dominates half the world. Wire the new metrics into one representative study so future actors can see whether founder-protection gains hold up under abundance weighting.

#### Success Evidence
- Deterministic tests cover the new abundance-weighted or energy-weighted activity metrics, and one canonical study artifact reports both occupancy-based and abundance-based activity for at least one representative mechanism (founder grace or ecology gate).

#### Stop Conditions
- Stop after adding one abundance-weighted metric variant and wiring it into one representative study.
- Stop if the work starts redesigning the full activity-tracking surface or changing how the simulation records population counts.

## Assumptions / Unknowns
- Assumption: a non-species-conditioned comparison is now the shortest path to an honest read on founder-grace and ecology-gate gains because habitat-plus-crowding validation already landed.
- Unknown: the cleanest second null may be a birth-schedule-only pseudo-clade baseline (no species inheritance), a paired decomposition reporting species-level versus clade-level deltas separately, or a neutral-theory-inspired rank-consistency check that does not condition on realized species substrate.
- Assumption: abundance-weighted metrics will reveal whether current gains are driven by a few persistent label survivors or by genuinely expanded populations, aligning with the backlog [critic] feedback that occupancy-only activity cannot distinguish these cases.
- Unknown: whether the current founder-protection signal is upstream species-generation (more species, better species persistence) or downstream clade-structuring (better packing of realized species into clades), which the decomposition work will clarify.
