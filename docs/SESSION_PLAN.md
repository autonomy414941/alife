# Session Plan — 2026-03-14

## Compact Context
- The current static-habitat founder baseline is `cladeHabitatCoupling=0.75`, `adaptiveCladeHabitatMemoryRate=0`, and `newCladeSettlementCrowdingGraceTicks=36`.
- On the canonical 4000-step panel, founder grace improved `activeCladeDeltaVsNullMean` from `-36.25` to `-23.75`, but actual active clades still trail matched-null active clades heavily.
- Raising `cladogenesisEcologyAdvantageThreshold` from `-1` to `0.1` improved the active-clade deficit to `-17` at cladogenesis threshold `1.0`, but it reduced persistent-activity deltas by `28.93` to `48.36` versus founder grace across the March 14 horizon comparisons.
- `newCladeEncounterRestraintGraceBoost=2` is pruned: its `+1.25` smoke gain reversed to a mean horizon regression of `-1.75`.
- `src/activity.ts` (2361 lines) still owns pseudo-clade null construction and study assembly, and `src/simulation.ts` (2386 lines) still owns most of the runtime loop.
- The relabel-null study surface still has 26 entry points, and 17 of them still bypass `emitStudyJsonOutput`, which is why March 14 produced malformed review / horizon artifacts.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique / planning | 3 | ae0bb60 |
| Study harness consolidation | 2 | 8af57d0 |
| Founder-selective validation | 2 | f6a495f |
| Artifact hygiene | 1 | ba0975e |
| Dead-axis archival | 1 | 1c36a23 |
| Activity-threshold extraction | 1 | 15998c4 |

Dominant axis: Structural critique / planning (3/10)
Underexplored axes: matched-null fidelity / founder-age diagnostics, simulation seam extraction, disturbance-mediated recolonization, trait-space expansion

## Project State
- Canonical horizon artifacts now exist for static habitat, founder grace, founder grace plus ecology gate, and encounter-restraint review; founder grace remains the best committed active-clade improvement.
- Recent sessions concentrated on founder-establishment follow-ups and wrapper consolidation, but the next decision bottleneck is causal visibility: current exports do not say whether losses happen during founding, early crowding, or later maintenance.
- The important gap is a bounded diagnostic and cleanup pass that makes the next mechanism change less blind and less expensive than the last one.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proceedings of the Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): arrival-time advantages can stabilize incumbents unless niche differences also shift, which fits the founder-grace result and explains why a simple ecology gate may trade persistence for fewer, more selective founders.

## Research Gaps
- At what clade ages does founder grace still lose to the matched null, and does the ecology gate help by improving true early establishment or only by shrinking later matched-null expansion?
- Can the matched-null and output seams be isolated enough that the next establishment mechanism can be swapped in without touching `src/activity.ts` or hand-writing JSON emitters?

## Current Anti-Evidence
- Even after the best March 14 follow-up, actual active clades are still below the matched null by `17` to `23.75` on the canonical panel, so the system still fails its own coexistence baseline.
- The current instrumentation cannot attribute losses by founder age, habitat context, or cause, and the relabel-null baseline still ignores founder habitat and crowding, so the present loop can overfit proxy gains without explaining them.

## Bet Queue
- [validate] Replay the canonical founder-grace vs ecology-gate horizon comparison through clade-age loss buckets
- [split] Extract matched-null pseudo-clade builders and birth-schedule helpers from `src/activity.ts`
- [cleanup] Normalize the remaining relabel-null horizon / review entry points onto `emitStudyJsonOutput`

### Bet 1: [validate] Replay Founder Grace Through Clade-Age Loss Buckets
Add a bounded review that consumes the existing canonical founder-grace and ecology-gate horizon surface and breaks clade outcomes into age buckets such as founder phase versus later maintenance. This is the next decision point because the ecology gate improved active-clade delta while crushing persistent activity, and the current summaries cannot say where that tradeoff happens.

#### Success Evidence
- A deterministic review artifact or test reports founder-grace vs ecology-gate deltas by clade-age bucket on the canonical horizon inputs.

#### Stop Conditions
- Stop after comparing the existing founder-grace and ecology-gate horizon surface only.
- Stop if the work requires changing simulation semantics or introducing a new experimental axis.

### Bet 2: [split] Isolate Matched-Null Builders From `src/activity.ts`
Move the pseudo-clade relabel-null construction and birth-schedule helpers into a dedicated module. This directly attacks the file that every relabel-null validation still edits and makes stricter-null or diagnostic follow-ups cheaper without changing study semantics.

#### Success Evidence
- `buildMatchedSchedulePseudoClades` and its birth-schedule helpers move out of `src/activity.ts`, the file shrinks materially, and relabel-null tests still pass.

#### Stop Conditions
- Stop after one coherent matched-null seam is isolated; do not redesign the null family in the same session.
- Stop if the extraction starts pulling unrelated activity aggregation code into the same change.

### Bet 3: [cleanup] Standardize Horizon / Review JSON Emission
Normalize the remaining relabel-null horizon and review entry points that still write directly to stdout onto the shared JSON-output helper. This closes the concrete artifact-fidelity gap behind the malformed March 14 files without depending on mechanism results.

#### Success Evidence
- The remaining horizon / review entry points accept `--output` and use atomic JSON emission, and a CLI-oriented test or smoke verification prevents npm-preamble or truncation regressions.

#### Stop Conditions
- Stop after the active horizon / review scripts are standardized; do not rewrite archived exporters or rename public script commands in the same session.
- Stop if the change starts altering artifact schemas instead of only the emission path.

## Assumptions / Unknowns
- Assumption: clade-age buckets are enough to separate early establishment failure from later maintenance collapse without adding full cause-of-death ledgers first.
- Unknown: the malformed March 14 review and disturbance artifacts may hide additional output-path bugs outside the relabel-null horizon / review scripts.
