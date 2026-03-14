# Session Plan — 2026-03-14

## Compact Context
- `cladeHabitatCoupling=0.75` is still the only canonical 4000-step win; it lifts persistent activity versus the best short stack but leaves `activeCladeDeltaVsNullMean` negative on every canonical panel.
- `adaptiveCladeHabitatMemoryRate=0.2` is not a safe new baseline: it helped at 1000 steps, then regressed on the 4000-step horizon and slightly worsened the active-clade deficit.
- `newCladeSettlementCrowdingGraceTicks=36` is the newest positive signal: on the 1000-step smoke it improved `persistentActivityMeanDeltaVsNullMean` from `+24.25` to `+33.5` and `activeCladeDeltaVsNullMean` from `-32.75` to `-28.75`, with matched birth schedules.
- Disturbance openings remain weaker than the habitat axis and still produce large negative active-clade deltas at horizon.
- `src/simulation.ts` (`2479` lines) and `src/activity.ts` (`2695` lines) are still the main structural bottlenecks; settlement/cladogenesis work keeps landing in the same `LifeSimulation` region.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Habitat-coupled clade memory / helpers | 4 | 56c9e6c |
| Disturbance openings / recolonization | 4 | d2d8fac |
| Founder-support settlement grace | 1 | 82a07a8 |
| Repo hygiene | 1 | b831476 |

Dominant axis: Habitat-coupled clade memory / helpers (4/10, tied with disturbance openings)
Underexplored axes: founder support beyond settlement, cladogenesis quality gates, clade interaction coupling on the habitat baseline, settlement/cladogenesis module split

## Project State
- The repo now has a repeatable loop for short smoke studies, horizon validators, tests, and machine-readable JSON artifacts under `docs/`.
- Recent sessions moved from disturbance recolonization into habitat-coupled clade persistence and then into the first founder-support mechanic.
- The main gap is still concurrent diversification: even when persistence improves, the system keeps losing on active clades versus relabel-null controls.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proc. Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): small arrival-time gaps can produce ecological character displacement and coexistence, while large timing gaps produce priority-effect monopolization. That maps directly onto the new-clade establishment window, so founder-timing mechanics are a better next bet than more habitat-memory tuning.

## Research Gaps
- Does `newCladeSettlementCrowdingGraceTicks=36` stay positive on the canonical 4000-step panel when adaptive memory is removed, or is its current gain only a short-horizon stack artifact?
- Is the remaining `activeCladeDeficit` mostly first-100-tick founder loss or later monopolization by already-established clades?

## Current Anti-Evidence
- No canonical-horizon run yet beats the matched relabel-null control on concurrent active clades; the best habitat-coupled panel still sits at `-36.25` / `-29.25` active clades versus null.
- Adaptive memory looked promising in smoke and then regressed on the full horizon, so the system is still vulnerable to short-horizon wins that do not survive extension.

## Candidate Bets
- A: [validate] Add a 4000-step founder-grace horizon study comparing `newCladeSettlementCrowdingGraceTicks=0` vs `36` on `BEST_SHORT_STACK_SIMULATION_CONFIG + cladeHabitatCoupling=0.75`, with adaptive memory fixed at `0`.
  Why now: the newest positive signal is founder support, and the prior adaptive-memory horizon failure makes long-horizon validation the fastest way to avoid another short-run false positive.
  Est. low-context human time: 35m
  Main risk: the short smoke gain may depend on the adaptive-memory stack or disappear over longer horizons.
- B: [feat] Extend newborn-clade grace from settlement-only relief into early post-founding competition, then run one short relabel-null smoke study on the static habitat baseline.
  Why now: settlement-only grace improved active clades but left a large deficit, which suggests founders may survive site choice yet still lose the first local competition window.
  Est. low-context human time: 45m
  Main risk: extra founder protection could inflate transient clades or break birth-schedule matching.
- C: [synthesize] Run a narrow habitat-baseline smoke combining founder grace with `cladogenesisEcologyAdvantageThreshold=0.1`.
  Why now: earlier diagnostics showed the ecology gate had the best active-clade delta among older knobs, and combining better founder quality with founder support is a cheap test before inventing a new mechanism.
  Est. low-context human time: 35m
  Main risk: reducing low-quality founders may erase the gross activity gain even if coexistence improves.
- D: [investigate] Add clade-age-bucket diagnostics (`0-25`, `26-100`, `>100` ticks) to relabel-null studies on the habitat baseline.
  Why now: `activeCladeDeficit`, `rawNewCladeActivityMeanDeltaVsNull`, and `persistencePenaltyVsRawDelta` are still too coarse to say whether the remaining loss is founder suppression or later monopolization.
  Est. low-context human time: 40m
  Main risk: it explains the bottleneck without improving dynamics by itself.
- E: [split] Extract settlement, cladogenesis, and founder-support helpers from `src/simulation.ts` into a dedicated module with behavior-preserving tests.
  Why now: every coexistence bet touches the same `LifeSimulation` seam around settlement context, grace logic, and clade founding, and `src/simulation.ts` is already `2479` lines.
  Est. low-context human time: 45m
  Main risk: the refactor can sprawl into unrelated disturbance or habitat logic.
- F: [refactor] Replace the near-identical `src/clade-activity-relabel-null-*-smoke-study.ts` wrappers with a table-driven smoke-study factory.
  Why now: the repo now has many one-off smoke CLI files, and each new coexistence bet is adding more surface area faster than the experiment harness is being consolidated.
  Est. low-context human time: 40m
  Main risk: harness cleanup is useful but lower immediate research leverage than a founder/coexistence study.
- G: [synthesize] Re-test `cladeInteractionCoupling` with a two-point smoke (`0`, `0.25`) on the habitat baseline instead of the older uncoupled baseline.
  Why now: the existing interaction sweep is underexplored and predates both habitat coupling and founder support, so a narrow re-check could uncover a dormant coexistence axis.
  Est. low-context human time: 35m
  Main risk: the earlier sweep was negative at every value, so this may still be a dead end.

## Bet Queue

### Bet 1: [validate] Founder Grace Horizon On The Static Habitat Baseline
Add a thin horizon wrapper that compares `newCladeSettlementCrowdingGraceTicks=0` vs `36` on top of `BEST_SHORT_STACK_SIMULATION_CONFIG + cladeHabitatCoupling=0.75`, with `adaptiveCladeHabitatMemoryRate=0`. The goal is to learn whether founder support survives the canonical 4000-step relabel-null panel without leaning on a mechanism that already failed at horizon.

#### Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_new_clade_establishment_horizon_2026-03-14.json` exists with all four canonical comparison rows, matched birth schedules, and an unambiguous founder-grace delta versus the static habitat baseline.

#### Stop Conditions
- Stop after one horizon comparison and its test; do not tune multiple grace durations or restack adaptive memory in the same session.
- Stop if the work cannot stay a thin wrapper over the existing horizon-study pattern.

### Bet 2: [feat] Extend Founder Support Into Early Post-Founding Competition
Add one bounded founder-support mechanism that applies only to newborn clades after founding, such as temporarily softening same-lineage encounter or harvest crowding during the same early grace window, then verify it with one short relabel-null smoke study on the static habitat baseline. The point is to test whether the remaining deficit happens after site acquisition rather than during settlement itself.

#### Success Evidence
- A new smoke artifact keeps `birthScheduleMatchedAllSeeds=true`, keeps `persistentActivityMeanDeltaVsNullMean` positive, and improves `activeCladeDeltaVsNullMean` versus the current founder-grace short-run mark of `-28.75`.

#### Stop Conditions
- Stop after one new mechanic and one smoke artifact; do not chain multiple founder-support knobs together.
- Stop if matched birth schedules fail or if persistent activity turns negative across the tested threshold.

### Bet 3: [split] Extract Settlement / Cladogenesis Logic From `src/simulation.ts`
Move settlement context construction, clade founding gates, and founder-grace helpers out of `LifeSimulation` into a dedicated module so the current coexistence axis stops accumulating more code inside the simulation monolith. Keep behavior identical and let existing reproduction and simulation tests carry verification.

#### Success Evidence
- `src/simulation.ts` delegates the settlement/cladogenesis helper cluster to a new module, and the existing relevant tests still pass without artifact changes.

#### Stop Conditions
- Stop if the extraction starts dragging disturbance or analytics code into scope.
- Stop if behavior changes are required to make the split compile; this bet is refactor-only.

## Assumptions / Unknowns
- Assumption: the short-run founder-grace gain is not purely an artifact of stacking on adaptive memory, which already failed at horizon.
- Unknown: the remaining active-clade deficit may be dominated by late coexistence collapse rather than founder loss, in which case more founder support will saturate quickly.
