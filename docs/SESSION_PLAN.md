# Session Plan — 2026-03-13

## Compact Context
- `src/simulation.ts` is still `2456` lines and `src/activity.ts` is still `2695` lines, even after recent helper extractions into `src/disturbance.ts` and `src/reproduction.ts`.
- The latest code now supports `disturbanceSettlementOpeningLineageAbsentOnly`, and deterministic coverage exists in `test/simulation.test.ts` plus the disturbance-colonization smoke-study test.
- The saved disturbance colonization artifact under `docs/` still predates that new mode: it only compares `off` vs `localizedOpening`.
- The best saved short disturbance result improved `activeCladeDeltaVsNullMean` from `-36.75` to `-31.25`, but also dropped `persistentActivityMeanDeltaVsNullMean` from `29.25` to `11.75`.
- The canonical `4000`-step best-short-stack validation is still below matched null at every checked threshold window, so short-horizon wins remain anti-evidence until they survive longer horizons.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Disturbance recolonization mechanics | 3 | 5220e6d |
| Relabel-null diagnostics / study infrastructure | 3 | cd697f0 |
| Offspring settlement / reproduction seam | 2 | 344d4a3 |
| Cladogenesis gating | 1 | 8e477ff |
| Ecology-scored interaction mechanics | 1 | 5003c4f |
| Long-horizon validation | 0 | a843a91 |
| Activity / simulation file splits | 0 | — |

Dominant axis: Disturbance recolonization mechanics (3/10, tied)
Underexplored axes: long-horizon validation, activity / simulation file splits, cladogenesis gating, ecology-scored interaction mechanics

## Project State
- Recent sessions added disturbance openings, then narrowed them to lineage-absent recolonization while also improving disturbance and reproduction seams.
- The evaluation layer is lagging the mechanics layer: the latest disturbance feature is tested in code but not yet represented in saved experiment artifacts.
- The main strategic gap is still durable coexistence: current gains are short-horizon and the matched-null comparisons still show an `activeCladeDeficit` story.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): durable coexistence after founding matters more than founder count alone, which makes validating post-disturbance lineage turnover more urgent than adding another local heuristic.

## Research Gaps
- Does `localizedOpeningLineageAbsent` beat both `off` and generic `localizedOpening` on short-horizon `activeCladeDeltaVsNullMean` and `persistentActivityMeanDeltaVsNullMean`, or is the new rule only a wiring success?

## Current Anti-Evidence
- The `2026-03-12` canonical `4000`-step best-stack validation is still negative versus matched null at every checked panel: `-34.63`, `-111.78`, `-18.24`, and `-93.65` persistent-activity delta.
- The latest saved disturbance artifact has no `localizedOpeningLineageAbsent` result, so there is still no experiment evidence that the newest disturbance rule improves the active-clade deficit at all.

## Candidate Bets
- A: [validate] Run the updated disturbance-colonization smoke study and save the first artifact that includes `localizedOpeningLineageAbsent`.
  Why now: the newest mechanic landed after the current artifact, so further disturbance work would otherwise be blind optimization.
  Est. low-context human time: 20m
  Main risk: a short-horizon win may still say little about the long-horizon anti-evidence.
- B: [split] Split `src/activity.ts` into relabel-null analysis core plus study-definition modules while keeping the current CLI entrypoints stable.
  Why now: `src/activity.ts` is past the split trigger and still mixes analytics, defaults, and study runners in one file.
  Est. low-context human time: 45m
  Main risk: it improves iteration speed but does not answer whether the latest mechanic actually helps.
- C: [feat] Add a temporary post-disturbance resource rebound so opened patches become ecologically distinct instead of just vacant.
  Why now: disturbance currently only subtracts energy/resources and opens cells, so the landscape after a shock is still too similar to the one before it.
  Est. low-context human time: 45m
  Main risk: it may increase population recovery without improving clade turnover.

## Selected Bet
Choose A. The current bottleneck is not another disturbance heuristic; it is that the just-landed lineage-absent recolonization rule has no saved evidence yet. Generate that missing artifact first, decide whether the new mode is actually a promising lead, and leave any follow-on mechanic change for a later session.

## Why This Fits The Horizon
- The work is bounded to one existing study surface that already has code paths and tests for the new mode.
- Success is autonomously verifiable from a new JSON artifact with three disturbance modes and from focused tests if the study surface has drifted.

## Success Evidence
- A new `docs/clade_activity_relabel_null_disturbance_colonization_smoke_*.json` artifact exists and includes `off`, `localizedOpening`, and `localizedOpeningLineageAbsent` with matched birth-schedule status plus diagnostic deltas.
- Specific verification command or output: `npm test -- --runInBand test/clade-activity-relabel-null-disturbance-colonization-smoke-study.test.ts && npm run study:clade-activity-relabel-null-disturbance-colonization-smoke > docs/clade_activity_relabel_null_disturbance_colonization_smoke_2026-03-13.json`

## Stop Conditions
- Stop once the new artifact exists and the lineage-absent mode has been compared against both existing baselines; do not add another disturbance mechanic or a `4000`-step sweep in the same session.
- If producing the artifact requires broader code repair than the smoke-study surface, shrink scope to the minimum fix needed for a trustworthy short-horizon result and document the blocker instead of thrashing.

## Assumptions / Unknowns
- Assumption: the short disturbance-colonization smoke study is still the right first filter before any longer rerun.
- Unknown: even if the lineage-absent mode wins on the short smoke study, it may still fail to overturn the `4000`-step anti-evidence.
