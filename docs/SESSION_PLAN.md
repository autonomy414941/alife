# Session Plan — 2026-03-14

## Compact Context
- The strongest validated long-horizon result is still `BEST_SHORT_STACK_SIMULATION_CONFIG + cladeHabitatCoupling=0.75`; it makes persistent activity positive on the 4000-step panel but still leaves active-clade delta negative on every canonical panel.
- `adaptiveCladeHabitatMemoryRate=0.2` is now in `main`; on the 1000-step habitat-coupled smoke it raised `persistentActivityMeanDeltaVsNullMean` from `+14.93` to `+24.25`, but `activeCladeDeltaVsNullMean` only moved from `-33` to `-32.75`.
- Disturbance openings improved less than the habitat axis on the canonical horizon, so more disturbance-only tuning is not the best immediate bet.
- The repo already supports a good workflow for bounded sessions: generic relabel-null smoke studies, dedicated horizon wrappers, tests, and machine-readable JSON artifacts under `docs/`.
- `src/activity.ts` (`2695` lines) and `src/simulation.ts` (`2472` lines) are still the main structural risks; current habitat and relabel-null work keeps landing inside those monoliths.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Disturbance recolonization openings | 3 | d2d8fac |
| Clade habitat coupling / adaptive memory | 2 | 0b2d042 |
| Core helper extraction from `src/simulation.ts` | 2 | f1d8891 |
| Relabel-null diagnostics / failed-branch cleanup | 2 | 344d4a3 |
| Repo / plan hygiene | 1 | b831476 |

Dominant axis: Disturbance recolonization openings (3/10)
Underexplored axes: clade interaction coupling, new-clade establishment support, habitat-module split

## Project State
- The codebase has a repeatable experimental loop now: short relabel-null smoke studies promote promising mechanics into thin horizon validators with tests and JSON outputs.
- Recent sessions moved from disturbance recolonization into habitat-coupled clade memory, and the habitat axis is now the strongest positive signal.
- The main gap is that recent gains improve persistence inside clades more than simultaneous clade coexistence, so the project still lacks a strong mechanism for sustained concurrent diversification.

## External Context
- [Goyal et al., 2024, "A universal niche geometry governs the response of ecosystems to environmental perturbations"](https://arxiv.org/abs/2403.01276): the niche-geometry framing implies durable gains should come from changing how lineages occupy niches, not only from opening empty space, which matches the repo's current habitat-over-disturbance signal. This is an inference from the paper's framing.

## Research Gaps
- Does `adaptiveCladeHabitatMemoryRate=0.2` stay positive on the canonical 4000-step panel, or is its current gain only a short-horizon effect?
- If the active-clade deficit survives, is the failure mainly at clade founding or at post-founding coexistence?

## Current Anti-Evidence
- Even the best canonical runs still sustain far fewer concurrent active clades than the matched relabel-null controls, so the system is not yet outperforming the null on coexistence.
- The newest adaptive-memory gain is short-horizon only and still looks like persistence-without-broader-diversification.

## Candidate Bets
- A: [validate] Add a 4000-step adaptive-clade-habitat-memory horizon study comparing `adaptiveCladeHabitatMemoryRate=0` vs `0.2` on top of `cladeHabitatCoupling=0.75`.
  Why now: the newest short-run gain is unvalidated at the canonical horizon, and the repo already has the exact wrapper pattern for this study.
  Est. low-context human time: 35m
  Main risk: the long-horizon panel may erase the short-run gain and still leave the mechanism choice ambiguous.
- B: [feat] Add a short post-cladogenesis establishment grace that discounts same-lineage settlement pressure for newborn clades, then run a relabel-null smoke study.
  Why now: persistence improved twice on the habitat axis while concurrent clade counts barely moved, which points at an establishment bottleneck.
  Est. low-context human time: 45m
  Main risk: it could create transient founder bursts or break birth-schedule matching.
- C: [investigate] Extend relabel-null diagnostics with per-window new-clade births, surviving new clades, and occupancy concentration on the current habitat stack.
  Why now: `activeCladeDeficit` is still too coarse to distinguish founder suppression from coexistence collapse.
  Est. low-context human time: 35m
  Main risk: it clarifies the next mechanism but does not improve dynamics by itself.
- D: [split] Extract clade habitat preference, adaptive memory, and blending helpers from `src/simulation.ts` into a dedicated habitat/clade module with behavior-preserving tests.
  Why now: `src/simulation.ts` remains a god object, and the current habitat axis keeps editing the same cluster around `foundClade`, adaptation, and habitat scoring.
  Est. low-context human time: 45m
  Main risk: the refactor can sprawl if it expands beyond the habitat seam.
- E: [split] Extract relabel-null diagnostics and threshold aggregation from `src/activity.ts` into a dedicated module.
  Why now: `src/activity.ts` is `2695` lines and every validate/investigate study still depends on the same aggregation path.
  Est. low-context human time: 45m
  Main risk: behavior-preserving extraction could consume a full session without changing research direction.
- F: [refactor] Replace the many tiny smoke-study CLI files with a table-driven study-definition factory around `runCladeActivityRelabelNullSmokeStudy`.
  Why now: there are already many near-identical smoke wrappers, and that duplication will slow the next round of mechanism tests.
  Est. low-context human time: 40m
  Main risk: infrastructure cleanup pays off only if kept narrowly scoped.
- G: [feat] Revisit clade interaction coupling with one narrow smoke study stacked on habitat coupling plus adaptive memory.
  Why now: it is an existing but underexplored coexistence axis, unlike disturbance which has already been pushed harder.
  Est. low-context human time: 45m
  Main risk: attribution gets muddy once another mechanism is stacked onto the habitat baseline.

## Bet Queue

### Bet 1: [validate] Adaptive Clade Memory Horizon
Add a thin horizon wrapper, modeled on the existing habitat-coupling and disturbance-opening horizon studies, that compares static vs adaptive clade habitat memory on top of `BEST_SHORT_STACK_SIMULATION_CONFIG + cladeHabitatCoupling=0.75`. The goal is not to tune rates; it is to learn whether the current short-horizon gain survives the canonical 4000-step relabel-null panel and whether active clade counts move at all.

#### Success Evidence
- `docs/clade_activity_relabel_null_adaptive_clade_habitat_memory_horizon_2026-03-14.json` exists with all four canonical comparison rows and matched birth schedules, making the sign of the adaptive-memory horizon delta unambiguous.

#### Stop Conditions
- Stop once the horizon artifact and its test exist; do not tune multiple memory rates or stack new mechanisms into the same session.
- Stop if the study cannot stay a thin wrapper over the existing relabel-null horizon pattern.

### Bet 2: [feat] New-Clade Establishment Grace
Add one bounded founder-support mechanism that helps just-founded clades hold a few settlement sites without reusing disturbance openings, ideally by temporarily discounting same-lineage settlement pressure during early establishment. Verify it with one short relabel-null smoke study on top of the current habitat baseline (`cladeHabitatCoupling=0.75`, `adaptiveCladeHabitatMemoryRate=0.2`).

#### Success Evidence
- A new smoke artifact such as `docs/clade_activity_relabel_null_new_clade_establishment_smoke_2026-03-14.json` keeps `birthScheduleMatchedAllSeeds=true`, keeps persistent activity positive, and makes `activeCladeDeltaVsNullMean` less negative than the current `-32.75` habitat-memory baseline.

#### Stop Conditions
- Stop after one mechanism and one smoke artifact; do not chain multiple founder-support knobs together.
- Stop if birth schedules stop matching or if active-clade delta worsens further.

### Bet 3: [split] Extract Habitat / Clade Logic From `src/simulation.ts`
Pull the clade habitat preference, adaptive memory, and habitat-blending helpers into a dedicated module so the current research axis stops accumulating more changes inside the remaining `LifeSimulation` god object. Keep the behavior identical and let existing simulation tests carry the verification.

#### Success Evidence
- `src/simulation.ts` delegates the habitat/clade helper cluster to a new module, and the existing habitat-coupling and adaptive-memory tests still pass without artifact changes.

#### Stop Conditions
- Stop if the extraction starts pulling disturbance or reproduction logic back into scope.
- Stop if behavior changes are needed to make the split compile; this bet is refactor-only.

## Assumptions / Unknowns
- Assumption: the active-clade deficit is the most important current bottleneck, not just a metric artifact.
- Unknown: the adaptive-memory gain may disappear on the 4000-step panel or remain threshold-specific even if it survives in one panel.
