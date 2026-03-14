# Session Plan — 2026-03-14

## Compact Context
- `src/activity.ts` is `2695` lines and `src/simulation.ts` is `2456` lines; `src/disturbance.ts` and `src/reproduction.ts` are real seams, but the relabel-null core is still mostly monolithic.
- The current best short stack is still lineage harvest crowding + lineage dispersal crowding + lineage encounter restraint + ecology-scored offspring settlement.
- The `2026-03-13` clade-habitat-coupling horizon artifact is now the strongest positive long-horizon signal: `cladeHabitatCoupling=0.75` keeps birth schedules matched and turns persistent-activity delta positive on every measured canonical panel.
- That same horizon still fails through active-clade deficit: active-clade delta stays `-36.25` at threshold `1/50` and `1/100`, and `-29.25` at `1.2/50` and `1.2/100`.
- Disturbance openings improved less than habitat coupling, and the newer `localizedOpeningLineageAbsent` variant already regressed, so more disturbance-only work is no longer the best immediate bet.
- In code, clade habitat preference is still founder-locked: `foundClade` stores one habitat value and `blendedHabitatPreference` keeps reusing that stored clade preference afterward.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Disturbance openings / recolonization | 5 | d2d8fac |
| Relabel-null diagnostics / loss-mode studies | 2 | cd697f0 |
| Reproduction / settlement seam changes | 2 | f1d8891 |
| Clade habitat coupling validation | 1 | 1e81a34 |
| Adaptive clade niches | 0 | — |
| Core module splits | 0 | — |

Dominant axis: Disturbance openings / recolonization (5/10)
Underexplored axes: adaptive clade niches, decomposition spillover follow-up, core module splits

## Project State
- The repo has a repeatable workflow now: short relabel-null smoke studies promote candidates into thin `4000`-step horizon wrappers with dedicated tests and JSON artifacts.
- Recent sessions clustered around disturbance recolonization plus helper extraction, but the newest horizon result moved the strongest positive signal onto clade habitat coupling instead.
- The important gap is a missing mechanism for letting clade-level habitat structure evolve after founding; current coupling improves persistence while still suppressing simultaneous clade coexistence.

## External Context
- [Goyal et al., 2024, "A universal niche geometry governs the response of ecosystems to environmental perturbations"](https://arxiv.org/abs/2403.01276): perturbations help when they reshape effective niche geometry, which fits the current result that habitat coupling helps more than vacancy creation alone. This also suggests testing adaptive clade niches before returning to disturbance tuning. This is an inference from the paper's framing.

## Research Gaps
- Does founder-locked clade habitat memory cause the remaining active-clade deficit, and can a lightweight adaptive update recover active clades without giving back the new persistence gains from `cladeHabitatCoupling=0.75`?

## Current Anti-Evidence
- Even with the best current canonical result, the system still sustains fewer active clades than the matched null on every measured panel.
- The strongest positive mechanism so far appears to work by making clades more persistent, not by maintaining broader long-run coexistence across clades.

## Candidate Bets
- A: [feat] Replace founder-locked clade habitat preference with a small adaptive memory update, then run a short relabel-null comparison at `cladeHabitatCoupling=0.75`.
  Why now: the new horizon result makes habitat coupling the best current axis, and the code already exposes a concrete overconstraint point in `foundClade` / `blendedHabitatPreference`.
  Est. low-context human time: 45m
  Main risk: adaptive clade memory could erase the persistence gain that static coupling just produced.
- B: [investigate] Add time-series diagnostics for active clades and clade occupancy concentration to the habitat-coupling horizon export.
  Why now: current diagnostics label the failure as `activeCladeDeficit`, but they still do not separate weak founding from rapid post-founding collapse.
  Est. low-context human time: 35m
  Main risk: it sharpens the next mechanism choice but does not change dynamics by itself.
- C: [split] Extract relabel-null diagnostics/comparison helpers from `src/activity.ts` into a dedicated module used by the horizon studies.
  Why now: `src/activity.ts` exceeds `2000` lines and every recent validate/investigate study touches the same diagnostic block.
  Est. low-context human time: 60m
  Main risk: useful only if kept strictly behavior-preserving and narrowly scoped.

## Selected Bet
Choose A. It stays off the now-dominant disturbance axis, directly changes simulation mechanics, and targets the specific new anti-evidence from the `2026-03-13` horizon: static clade habitat memory may be boosting persistence by over-constraining descendants to founder niches. A thin adaptive-memory rule plus one short relabel-null study is a bounded way to test that hypothesis before committing to another full canonical horizon.

## Why This Fits The Horizon
- The code change is local to the clade-habitat path in `src/simulation.ts`, and the verification surface can stay short-horizon instead of requiring another full `4000`-step panel first.
- Success is autonomously checkable with one focused test and one JSON artifact showing whether active-clade delta improves while birth schedules remain matched.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_adaptive_clade_habitat_memory_smoke_2026-03-14.json` compares static versus adaptive clade habitat memory on top of `cladeHabitatCoupling=0.75`.
- `npm test -- --runInBand test/clade-activity-relabel-null-adaptive-clade-habitat-memory-smoke-study.test.ts && tsx src/clade-activity-relabel-null-adaptive-clade-habitat-memory-smoke-study.ts --generated-at 2026-03-14T00:00:00.000Z > docs/clade_activity_relabel_null_adaptive_clade_habitat_memory_smoke_2026-03-14.json`

## Stop Conditions
- Stop once the smoke artifact makes the direction clear; do not stack disturbance openings, decomposition spillover, or extra cladogenesis gates into the same session.
- If the adaptive-memory rule starts requiring a broad state-model redesign, shrink to the smallest update rule that can be tested or fall back to the investigation candidate.

## Assumptions / Unknowns
- Assumption: the founder-locked clade habitat snapshot is part of the remaining active-clade bottleneck rather than just a harmless summary statistic.
- Unknown: the best bounded update rule may be divergence-only, birth-triggered, or a simple running average; only the thinnest testable slice should be attempted this session.
