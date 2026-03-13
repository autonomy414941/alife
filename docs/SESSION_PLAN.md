# Session Plan — 2026-03-13

## Compact Context
- `src/activity.ts` is still `2695` lines and `src/simulation.ts` is still `2456` lines, although `src/disturbance.ts` and `src/reproduction.ts` now provide real seams outside the monoliths.
- The new `2026-03-13` disturbance-opening horizon artifact shows `localizedOpening` improves persistent-activity deltas versus the best short stack, but every canonical `4000`-step panel is still negative versus the matched null.
- In that same horizon artifact, `localizedOpening` still carries a large active-clade deficit where measured: `-37.5` at threshold `1/50` and `-40.75` at `1.2/50`.
- The older `2026-03-11` clade-habitat coupling sweep is still the strongest underused positive signal: `cladeHabitatCoupling=0.75` reached `persistentActivityMeanDeltaVsNullMean -39.89` versus `-90.68` at `0`.
- The `2026-03-12` regression-diagnostics artifact still ranks most recent add-ons below the best short stack; failure modes are still dominated by `activeCladeDeficit` or `persistenceFailure`.
- The missing evidence is durable coexistence against the matched null, not another short-horizon founder burst.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Disturbance openings / recolonization | 5 | d2d8fac |
| Relabel-null diagnostics / study harness | 3 | cd697f0 |
| Settlement / reproduction branch work | 2 | 344d4a3 |
| Clade habitat / interaction coupling | 0 | — |
| Activity / simulation file splits | 0 | — |

Dominant axis: Disturbance openings / recolonization (5/10)
Underexplored axes: clade habitat / interaction coupling, activity / simulation file splits

## Project State
- The current workflow is a best-short-stack baseline plus focused relabel-null smoke and horizon studies for one knob at a time.
- Recent sessions kept pushing disturbance mechanics and diagnostics; the latest validation now shows disturbance openings are not enough by themselves.
- An underused positive axis already exists in code and artifacts: clade-level habitat coupling has sweep support but no canonical horizon verdict.
- The biggest structural gap is that study logic still accumulates inside `src/activity.ts`, making each new comparison slower to add safely.

## External Context
- [Goyal et al., 2024, "A universal niche geometry governs the response of ecosystems to environmental perturbations"](https://arxiv.org/abs/2403.01276): perturbations help only when they shift effective niche structure, which makes clade-level habitat coupling a better next axis than another vacancy-only opening tweak. This is an inference from the paper's framing.

## Research Gaps
- Does `bestShortStack + cladeHabitatCoupling=0.75` still beat the uncoupled baseline on the canonical `4000`-step relabel-null panel, or was the sweep gain just a shorter-horizon artifact?

## Current Anti-Evidence
- Even after the `2026-03-13` disturbance-opening validation, the matched-null persistent-activity deltas stay negative on every canonical panel: `-12.28`, `-69.22`, `-4.32`, and `-69.33`.
- The system still does not sustain enough simultaneously active clades; the latest disturbance horizon keeps active-clade delta around `-38` to `-41` where measured.

## Candidate Bets
- A: [validate] Add a dedicated `4000`-step relabel-null horizon comparison for `bestShortStack` versus `bestShortStack + cladeHabitatCoupling=0.75`.
  Why now: the `0.75` sweep point is the strongest underused positive signal in existing artifacts, and it targets niche differentiation instead of more vacancy creation.
  Est. low-context human time: 45m
  Main risk: the sweep win may disappear at canonical horizon or improve persistence while still missing active clades.
- B: [split] Extract the relabel-null comparison / pseudo-clade / diagnostics block from `src/activity.ts` into a dedicated module without changing outputs.
  Why now: `src/activity.ts` is the largest `src/` file and every recent validate/investigate session keeps growing the same relabel-null cluster.
  Est. low-context human time: 60m
  Main risk: it improves iteration speed but may not change the next mechanism choice immediately.
- C: [revert] Remove `localizedOpeningLineageAbsent` from disturbance configs and study surfaces until it has a positive result.
  Why now: the `2026-03-13` smoke artifact regressed versus plain `localizedOpening` while adding extra same-lineage occupancy logic.
  Est. low-context human time: 20m
  Main risk: the mode might be salvageable with better diagnosis, so removal could be slightly premature.

## Selected Bet
Choose A. It switches away from the now-dominant disturbance axis, uses an already-implemented but undervalidated coexistence mechanism, and can be answered with one thin horizon study instead of another broad refactor or another blind new knob.

## Why This Fits The Horizon
- The repo already has clade-habitat coupling sweep code and a recent disturbance horizon-study pattern to copy, so this is a narrow comparison rather than a new analysis framework.
- Success is autonomously verifiable from one focused test and one JSON artifact with matched-schedule status plus per-threshold delta comparisons.

## Success Evidence
- A new `docs/clade_activity_relabel_null_clade_habitat_coupling_horizon_2026-03-13.json` artifact exists and compares baseline versus `cladeHabitatCoupling=0.75` on the canonical `4000`-step panel.
- `npm test -- --runInBand test/clade-activity-relabel-null-clade-habitat-coupling-horizon-study.test.ts && npm run study:clade-activity-relabel-null-clade-habitat-coupling-horizon > docs/clade_activity_relabel_null_clade_habitat_coupling_horizon_2026-03-13.json`

## Stop Conditions
- Stop once the artifact makes the sign clear; do not combine habitat coupling with disturbance openings or extra new knobs in the same session.
- If the comparison starts forcing a broad `activity.ts` refactor, shrink to the thinnest wrapper around existing relabel-null helpers and record the horizon result.

## Assumptions / Unknowns
- Assumption: `cladeHabitatCoupling=0.75` is the best existing coupling point worth promoting from sweep to canonical horizon.
- Unknown: the sweep artifact tracked persistent-activity deltas, but canonical-horizon active-clade behavior may still be poor.
