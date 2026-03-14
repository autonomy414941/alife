# Session Plan — 2026-03-14

## Compact Context
- The current canonical founder comparison is still `cladeHabitatCoupling=0.75`, `adaptiveCladeHabitatMemoryRate=0`, and `newCladeSettlementCrowdingGraceTicks=36`, with ecology-gate follow-ups varying `cladogenesisEcologyAdvantageThreshold`.
- Founder grace remains the best committed active-clade gain, moving `activeCladeDeltaVsNullMean` from `-36.25` to `-23.75`; the ecology gate reaches `-17` at threshold `1.0` but loses `28.93` to `48.36` of persistent activity versus founder grace.
- `newCladeEncounterRestraintGraceBoost=2` is pruned, but its smoke / horizon / review commands still exist on the active `study:` surface.
- Matched-schedule pseudo-clade helpers now live outside `src/activity.ts`, but the relabel-null baseline still preserves only clade birth counts by tick.
- `src/activity.ts` is still 2192 lines and `src/simulation.ts` is still 2386 lines; `TaxonHistory.timeline` and `localityFrames` still scale with run horizon.
- `package.json` now exposes 25 active `study:` scripts, 11 of which still write directly to stdout, and the local `docs/clade_activity_relabel_null_disturbance_opening_horizon_2026-03-14.json` file is currently zero bytes.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique / planning | 3 | c15ee73 |
| Artifact hygiene / CLI output | 2 | d3e9301 |
| Founder-establishment harness consolidation | 2 | 8af57d0 |
| Founder-age diagnostics / validation | 2 | a2247f8 |
| Matched-null helper extraction | 1 | 4f1ae6b |

Dominant axis: Structural critique / planning (3/10)
Underexplored axes: stricter matched-null fidelity, disturbance-mediated recolonization, dead-axis reverts, simulation-loop modularization

## Project State
- Canonical March 14 evidence now includes founder-grace and ecology-gate horizon comparisons, matched-schedule helpers, and founder-age review code; founder grace still remains the best committed active-clade improvement.
- Recent sessions concentrated on founder-establishment follow-ups plus wrapper cleanup, but the next bottleneck is evaluation fidelity: the current null still ignores founder context, and one local disturbance-opening horizon artifact is still empty.
- The important gap is a bounded pass that makes the next mechanism decision less blind by tightening the null, shrinking the active study surface, and removing already-pruned axes from everyday use.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proceedings of the Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): priority effects can preserve incumbents without creating durable coexistence, so founder-protection gains should be checked against controls that separate arrival timing from founder habitat or crowding context.

## Research Gaps
- Does founder grace still beat the relabel-null baseline when pseudo-clade founders are also matched on one birth-context signal such as founder habitat bin or local crowding?
- Which remaining direct-output study wrappers can still produce empty or contaminated JSON artifacts under `--output`, and can they all be reduced to the shared emitter path?

## Current Anti-Evidence
- Even after the best March 14 follow-up, actual active clades are still below the matched null by `17` to `23.75` on the canonical panel, so the system still fails its own coexistence baseline.
- The relabel-null baseline still ignores founder habitat and crowding, and the local March 14 disturbance-opening horizon artifact is currently zero bytes, so the loop can still mis-score gains or fail to preserve evidence cleanly.

## Bet Queue
- [validate] Compare founder-grace deficits against a stricter relabel-null that also matches founder habitat or local crowding at birth
- [cleanup] Standardize the remaining 11 direct-stdout relabel-null entry points onto `emitStudyJsonOutput`
- [revert] Remove pruned new-clade encounter-restraint commands from the active `study:` surface

### Bet 1: [validate] Tighten Matched-Null Founder Context
Add one stricter relabel-null family that keeps the existing birth-schedule match but also matches pseudo-clade founders on one birth-context signal such as founder habitat bin or local crowding, then replay the canonical founder-grace panel through it. This is the next validation gate because the current null can still credit founder protection for wins that are really just birth-context selection.

#### Success Evidence
- A deterministic artifact or test compares the canonical founder-grace panel under the current and stricter null families and reports whether `activeCladeDeltaVsNullMean` still improves.

#### Stop Conditions
- Stop after adding one extra founder-context matching dimension and replaying the canonical founder-grace panel only.
- Stop if the work starts changing simulation semantics or adding cause-of-death ledgers.

### Bet 2: [cleanup] Standardize Remaining Study Emitters
Move the remaining 11 active direct-stdout relabel-null entry points onto `emitStudyJsonOutput` so every active study path can write atomic `--output` artifacts. This closes the remaining near-duplicate wrapper surface and directly addresses the zero-byte or contaminated artifact risk still visible in the workspace.

#### Success Evidence
- A representative CLI test covers at least one smoke study, one base or sweep study, and one diagnostic runner writing parseable JSON through `--output`, and the active `study:` entry points no longer bypass the shared emitter.

#### Stop Conditions
- Stop after active `study:` scripts are standardized; do not rewrite archived exporters in the same session.
- Stop if the change starts altering artifact schemas instead of only the emission path.

### Bet 3: [revert] Prune Dead Encounter-Restraint Surface
Remove the pruned encounter-restraint smoke, horizon, and review commands from the active `study:` surface, or archive them behind explicit non-active names, so future sessions stop spending attention on a knob family already rejected by horizon evidence. This satisfies the revert trigger without touching historical artifacts or baseline simulation behavior.

#### Success Evidence
- `package.json` no longer exposes active `study:` commands for new-clade encounter restraint, and the remaining references or tests clearly mark the axis as archived or removed.

#### Stop Conditions
- Stop after the CLI surface and lightweight references are cleaned; do not delete historical result files.
- Stop if the change starts modifying unrelated encounter mechanics instead of just removing the dead axis from active use.

## Assumptions / Unknowns
- Assumption: founder habitat or local crowding at birth is the next missing confounder in the relabel-null baseline, rather than later maintenance alone.
- Unknown: the zero-byte disturbance-opening horizon artifact may be a stale local file, but the active direct-output study surface is still large enough that it is worth treating as a live artifact-risk signal.
