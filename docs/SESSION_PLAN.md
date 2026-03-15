# Session Plan — 2026-03-15

## Compact Context
- `MatchedNullFounderContext` now supports `'none'`, `'founderHabitatBin'`, and `'founderHabitatAndCrowdingBin'`; the March 15, 2026 founder-crowding validation artifact is already present at [docs/clade_activity_relabel_null_new_clade_establishment_founder_crowding_validation_2026-03-15.json](/home/dev/projects/alife-auto-dev/alife/docs/clade_activity_relabel_null_new_clade_establishment_founder_crowding_validation_2026-03-15.json).
- On that March 15, 2026 validation panel, founder grace still beats the static-habitat baseline under the stricter null, but its absolute active-clade delta versus null remains negative (`-25.75` at habitat-plus-crowding matching, with `+9` improvement over static habitat at cladogenesis threshold `1.0` and `+4` at `1.2`).
- The best March 14, 2026 ecology-gate follow-up narrows the active-clade deficit to `-17` at cladogenesis threshold `1.0`, but persistent activity drops from `35.49` to `3.03` at `minSurvivalTicks=50`.
- Recent refactors already extracted `src/activity-study-results.ts`, `src/clade-activity-relabel-null-study-runner.ts`, `src/simulation-history.ts`, and `src/simulation-evolution-history.ts`, but [src/activity.ts](/home/dev/projects/alife-auto-dev/alife/src/activity.ts) is still 1860 lines, [src/simulation.ts](/home/dev/projects/alife-auto-dev/alife/src/simulation.ts) is still 2192 lines, and [src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts](/home/dev/projects/alife-auto-dev/alife/src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts) is 689 lines.
- `buildMatchedSchedulePseudoClades()` still repartitions realized species histories, so any intervention that increases upstream species origination or persistence is partly inherited by the matched null.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique / backlog maintenance | 3 | 7aea5af |
| Activity-study modularization | 3 | adbab9d |
| Simulation-history modularization | 2 | 8195aff |
| Founder-context validation | 2 | ba716d6 |
| Alternative null decomposition | 0 | none |
| Disturbance / artifact hygiene | 0 | none |
| Runtime founding-loop modularization | 0 | none |

Dominant axis: Structural critique / backlog maintenance (3/10, tied with activity-study modularization)
Underexplored axes: alternative null decomposition, disturbance / artifact hygiene, runtime founding-loop modularization

## Project State
- Canonical evidence now includes habitat-matched and habitat-plus-crowding-matched founder validations, archived encounter-restraint studies, and CLI-output coverage for representative study families.
- Recent sessions shifted from raw mechanism sweeps toward refactoring the study/runtime surface, but no mechanism yet closes the absolute active-clade deficit against null.
- The important gap is that the current evaluation still conflates upstream species-generation gains with downstream clade packing because the matched null reuses realized species histories.

## External Context
- Inference from [Fajgenblat, De Meester, and Urban, 2024, "Dispersal evolution alters evolution-mediated priority effects in a metacommunity" (Philosophical Transactions of the Royal Society B)](https://pubmed.ncbi.nlm.nih.gov/38913063/): early-arrival advantages can create patch monopolization that depends on dispersal opportunity, so a founder-grace win should be treated as incumbency evidence unless the evaluation also separates true coexistence gains from assembly-history inheritance.
- Inference from ["Microbial Dormancy Supports Multi-Species Coexistence Under Resource Fluctuations" (Ecology Letters, 2024)](https://pubmed.ncbi.nlm.nih.gov/39354904/): fluctuation-linked persistence mechanisms can stabilize coexistence beyond simple arrival advantages, which reinforces that the current project should not overfit one founder-protection knob before its evaluation surface is trustworthy.

## Research Gaps
- How much of the current founder-grace or ecology-gate signal survives when clade results are decomposed into upstream species-generation gains and downstream clade-structuring gains with a null that does not inherit realized species histories?
- Which extraction removes more immediate friction for that work: isolating the founder-establishment comparison builders or separating the reproduction / founding loop from `src/simulation.ts`?

## Current Anti-Evidence
- Even after the March 15, 2026 habitat-plus-crowding validation, founder grace still sits at `-25.75` active clades versus its stricter null, and the best March 14, 2026 ecology gate only reaches `-17` by sacrificing most persistent-activity gains, so the system still fails its own coexistence baseline.
- The matched null still conditions on realized species histories, so the current headline clade-vs-null delta cannot tell whether an intervention opened more upstream innovation opportunities or merely repartitioned the same realized species substrate.

## Bet Queue
- [validate] Add a decomposition panel with a second null that does not condition on realized species histories, and report upstream species-generation gains separately from downstream clade-structuring gains on the canonical founder-grace / ecology-gate panel
- [split] Extract founder-establishment horizon / habitat-validation / crowding-validation comparison builders out of `src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts`
- [split] Continue extracting the reproduction / founding loop from `src/simulation.ts`
- [validate] Reproduce the disturbance-opening horizon CLI output and explain whether the zero-byte `2026-03-14` artifact is a stale local file or a remaining emitter bug

### Bet 1: [validate] Decompose Species-Conditioned Null Leakage
Add one alternative null or paired decomposition panel that does not inherit realized species histories, then report canonical founder-grace and ecology-gate results as separate upstream species-generation and downstream clade-structuring components. The March 15, 2026 crowding validation removed the most obvious founder-context confounder, so the next bounded question is whether the remaining signal survives a less self-conditioning baseline.

#### Success Evidence
- Deterministic tests cover the new decomposition output, and one canonical study artifact reports both the species-conditioned and non-species-conditioned components for founder grace and the ecology gate.

#### Stop Conditions
- Stop after adding one additional null family or decomposition view and wiring it into the canonical founder-grace / ecology-gate panel only.
- Stop if the work starts redesigning the full study surface or changing simulation mechanics instead of evaluation logic.

### Bet 2: [split] Extract Founder-Establishment Comparison Builders
Move the horizon, habitat-validation, and crowding-validation comparison builders out of [src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts](/home/dev/projects/alife-auto-dev/alife/src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts) into focused helpers without changing study schemas. This is the highest-value study-layer split because the decomposition work will keep touching exactly this family.

#### Success Evidence
- [src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts](/home/dev/projects/alife-auto-dev/alife/src/clade-activity-relabel-null-new-clade-establishment-horizon-study.ts) shrinks materially, exported study shapes stay stable, and the founder-establishment tests still pass.

#### Stop Conditions
- Stop after behavior-preserving extraction; do not redesign metrics or artifact schemas in the same bet.
- Stop if the refactor starts touching unrelated study families or generic export code.

### Bet 3: [split] Continue Isolating the Reproduction / Founding Loop
Extract more of the reproduction and new-clade founding path from [src/simulation.ts](/home/dev/projects/alife-auto-dev/alife/src/simulation.ts) into focused helpers while preserving behavior. This sets up future establishment or persistence mechanism work without reopening the whole runtime loop.

#### Success Evidence
- [src/simulation.ts](/home/dev/projects/alife-auto-dev/alife/src/simulation.ts) shrinks materially, reproduction / cladogenesis tests still pass, and snapshot/history exports are unchanged.

#### Stop Conditions
- Stop after a behavior-preserving extraction of the founding path; do not attempt scheduler redesign or streaming-history changes in the same bet.
- Stop if the refactor starts altering movement, encounter, or reproduction semantics.

### Bet 4: [validate] Resolve the Disturbance-Opening Artifact Mismatch
Reproduce the disturbance-opening horizon CLI with the real output path, determine whether the zero-byte March 14, 2026 file is stale local state or a remaining overwrite bug, and leave behind either a regenerated artifact or a minimal emitter fix. The current docs and tests disagree, so this is a bounded hygiene pass that removes one known ambiguity from the study surface.

#### Success Evidence
- The cause of the zero-byte file is demonstrated with a reproducible command or test, and the repository ends with either a valid regenerated artifact or a targeted fix that prevents the zero-byte outcome.

#### Stop Conditions
- Stop after the root cause is explained and the minimal corrective action is applied.
- Stop if the investigation starts turning into a broad study-surface rewrite instead of a single artifact-path fix.

## Assumptions / Unknowns
- Assumption: a non-species-conditioned comparison is now the shortest path to a more honest read on founder-grace and ecology-gate gains because the March 15, 2026 founder-crowding validation already landed.
- Unknown: the cleanest second null may be a birth-schedule-only pseudo-clade baseline, a species-generation decomposition panel, or another lightweight construction that avoids realized-species leakage without exploding run cost.
