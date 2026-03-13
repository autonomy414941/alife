# Session Plan — 2026-03-13

## Compact Context
- `src/activity.ts` is still `2695` lines and `src/simulation.ts` is still `2456` lines, but recent helper extractions mean disturbance and reproduction seams now exist outside the monoliths.
- The `2026-03-13` disturbance artifact now covers `off`, `localizedOpening`, and `localizedOpeningLineageAbsent`, so the prior plan's missing-artifact gap is closed.
- In that artifact, `localizedOpening` improved `activeCladeDeltaVsNullMean` from `-36.75` to `-31.25`, but reduced `persistentActivityMeanDeltaVsNullMean` from `29.25` to `11.75`.
- The new `localizedOpeningLineageAbsent` mode regressed both short-horizon signals versus generic openings: `activeCladeDeltaVsNullMean -35` and `persistentActivityMeanDeltaVsNullMean 7.89`.
- The `2026-03-12` regression-diagnostics artifact still ranks the plain best short stack first; nearly every recent add-on still fails mainly as `activeCladeDeficit`.
- The canonical `4000`-step best-short-stack validation from `2026-03-12` remains below matched null at every checked threshold window.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Disturbance recolonization / openings | 4 | d0ed024 |
| Relabel-null diagnostics / study harness | 3 | cd697f0 |
| Offspring settlement / reproduction seams | 2 | 344d4a3 |
| Cladogenesis gating | 1 | 8e477ff |
| Long-horizon validation | 0 | a843a91 |
| Activity / simulation file splits | 0 | — |

Dominant axis: Disturbance recolonization / openings (4/10)
Underexplored axes: long-horizon validation, activity / simulation file splits, cladogenesis gating

## Project State
- The current workflow is a best-short-stack baseline plus small relabel-null smoke studies for each new knob.
- Disturbance openings are the only recent knob that improved the short-horizon active-clade gap, but the stronger lineage-absent variant already looks worse than generic openings.
- The main gap is still durable coexistence against the matched null, not short-run wiring success.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): durable coexistence after founding matters more than founder count alone, which makes long-horizon validation of the best disturbance regime more urgent than another short smoke-study tweak.

## Research Gaps
- Does `localizedOpening` still help on the canonical `4000`-step relabel-null panel, or is its short-horizon active-clade gain just a transient disturbance burst?

## Current Anti-Evidence
- The `2026-03-12` canonical best-short-stack validation is still negative versus matched null at all four checked panels: `-34.63`, `-111.78`, `-18.24`, and `-93.65` persistent-activity delta.
- Recent short-horizon add-ons still leave actual final active clades below matched null, so the system is not yet sustaining concurrent lineages better than a relabeled null.

## Candidate Bets
- A: [validate] Add a dedicated `4000`-step disturbance-opening horizon comparison that measures `bestShortStack` versus `bestShortStack + localizedOpening`.
  Why now: validation has been absent since `a843a91`, and generic localized opening is the only recent knob that improved the active-clade gap without obvious wiring problems.
  Est. low-context human time: 45m
  Main risk: the long-horizon result may simply confirm that short-run disturbance gains do not persist.
- B: [investigate] Extend relabel-null diagnostics with window-level active-clade and raw-to-persistent deltas for `bestShortStack`, `localizedOpening`, and `localizedOpeningLineageAbsent`.
  Why now: three recent feat experiments underperformed the baseline, and the current `activeCladeDeficit` label is too coarse to tell whether disturbance fails early or late.
  Est. low-context human time: 45m
  Main risk: better diagnosis may still leave the next mechanism choice ambiguous.
- C: [feat] Add a temporary post-disturbance fertility / regen rebound on affected cells so shocks create transient niches instead of pure vacancies.
  Why now: the `2026-03-13` artifact suggests vacancy plus settlement bonus alone does not preserve more active clades over the short horizon.
  Est. low-context human time: 60m
  Main risk: it adds new per-cell state and tests, and could improve recovery speed without improving coexistence.

## Selected Bet
Choose A. The new short-horizon artifact already ruled out `localizedOpeningLineageAbsent` as the likely lead, but generic `localizedOpening` still improved the active-clade gap enough to deserve one canonical long-horizon check. Validate that regime now before adding another disturbance mechanic or growing the diagnostics surface again.

## Why This Fits The Horizon
- Existing best-short-stack comparison code and disturbance smoke-study config paths make this a narrow extension instead of a new analysis framework.
- Success is autonomously verifiable from one focused test and one JSON artifact with matched-schedule status plus per-threshold delta comparisons.

## Success Evidence
- A new `docs/clade_activity_relabel_null_disturbance_opening_horizon_2026-03-13.json` artifact exists and compares `bestShortStack` vs `localizedOpening` on the canonical `4000`-step panel.
- `npm test -- --runInBand test/clade-activity-relabel-null-disturbance-opening-horizon-study.test.ts && npm run study:clade-activity-relabel-null-disturbance-opening-horizon > docs/clade_activity_relabel_null_disturbance_opening_horizon_2026-03-13.json`

## Stop Conditions
- Stop once the new artifact makes the long-horizon sign clear; do not add lineage-absent or fertility-rebound mechanics in the same session.
- If the new validation surface starts forcing broad `activity.ts` surgery, shrink to the thinnest wrapper around existing comparison helpers and record the result instead of thrashing.

## Assumptions / Unknowns
- Assumption: `localizedOpening` is the only disturbance mode still worth promoting from short smoke test to canonical horizon validation.
- Unknown: even if `localizedOpening` narrows the active-clade deficit, it may still lose on persistent activity badly enough that disturbance should be abandoned or redesigned.
