# Session Plan — 2026-03-13

## Compact Context
- `src/simulation.ts` is `2604` lines, `src/activity.ts` is `2695`, `test/simulation.test.ts` is `3149`, and `test/activity.test.ts` is `2073`; the hottest mechanic seam is still offspring settlement plus disturbance-opening plus cladogenesis logic inside `simulation.ts`.
- Commit `344d4a3` on `2026-03-13` already removed the encounter-aware settlement branch; current `src/` and `test/` no longer reference those knobs, so the prior plan is stale.
- The checked-in JSON artifacts are from `2026-03-12`, before that revert. They still show the current best short stack at `persistentActivityMeanDeltaVsNullMean=29.25` over `1000` steps.
- The canonical `4000`-step best-stack comparison is still negative in every cell: `-34.63`, `-111.78`, `-18.24`, and `-93.65` persistent activity delta versus matched null.
- In the latest short ranking, decomposition spillover (`14.86`) and disturbance localized opening (`11.75`) are the best non-baseline add-ons, but both still trail the current best short stack and leave an active-clade deficit.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Relabel-null diagnostics / harness | 3 | cd697f0 |
| Settlement / recolonization mechanics | 2 | 496f1a8 |
| Cladogenesis gating | 2 | 8e477ff |
| Long-horizon validation | 1 | a843a91 |
| Decomposition recycling | 1 | 6631bd9 |
| Failed-knob revert / cleanup | 1 | 344d4a3 |
| Simulation seam split / module extraction | 0 | — |

Dominant axis: Relabel-null diagnostics / harness (3/10)
Underexplored axes: long-horizon validation, decomposition recycling, failed-knob revert / cleanup, simulation seam split / module extraction

## Project State
- The repo already has reusable relabel-null smoke-study scaffolding, a best-short-stack preset, regression diagnostics, and deterministic simulation tests for disturbance openings, offspring settlement scoring, decomposition spillover, and cladogenesis gates.
- Recent sessions moved from adding short-horizon knobs on `2026-03-12` to diagnosing them and pruning the weakest settlement branch on `2026-03-13`.
- The main gap is now structural: the next recolonization or coexistence mechanic still has to land in one oversized `simulation.ts` seam that mixes settlement scoring, disturbance bonuses, and clade-founding rules.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): durable coexistence after founding matters more than merely producing more founders, so the settlement and persistence seam remains the highest-leverage simulation surface.
- Martin Fowler’s extract-function refactoring guidance is directly relevant to the current long-method bottleneck before adding more logic to it: https://martinfowler.com/articles/refactoring-2nd-changes.html

## Research Gaps
- Can the current settlement plus disturbance-opening plus cladogenesis seam be extracted into coherent helpers or modules without changing behavior, so the next recolonization mechanic can be added and tested in isolation?
- Are the existing deterministic settlement and cladogenesis tests strong enough to lock down that extraction?

## Current Anti-Evidence
- The best validated `4000`-step stack is still below matched-null persistent activity in all canonical cells, so durable above-null clade persistence is still unproven.
- Even the short-horizon winner remains at `activeCladeDeltaVsNullMean=-36.75`, so the system still sustains fewer concurrent clades than the matched-null baseline.

## Candidate Bets
- A: [split] Extract offspring-settlement scoring, disturbance-opening bonus logic, and cladogenesis gating helpers out of `src/simulation.ts` without changing behavior.
  Why now: the weakest branch is already gone, which makes this seam smaller and safer to extract before adding another recolonization mechanic.
  Est. low-context human time: 55m
  Main risk: it improves leverage and safety more than metrics in this session.
- B: [feat] Replace the unconditional disturbance opening bonus with a lineage-absent recolonization bonus that only boosts freshly disturbed cells the parent lineage does not already dominate.
  Why now: disturbance localized opening was the best recent active-clade improvement outside the baseline, but the current bonus still allows dominant lineages to refill vacancies immediately.
  Est. low-context human time: 60m
  Main risk: it is still another settlement-axis knob in a seam that is already hard to change safely.
- C: [refactor] Convert the remaining single-purpose relabel-null smoke-study wrappers into a small declarative registry on top of the shared smoke-study harness.
  Why now: there are still multiple near-identical study entrypoints, and every new knob currently adds boilerplate around the same harness.
  Est. low-context human time: 40m
  Main risk: it reduces duplication but does not address the main simulation bottleneck.

## Selected Bet
Choose A. The code-health triggers are active, the previous revert already simplified the target seam, and every plausible next mechanism still depends on the same settlement and clade-founding block in `src/simulation.ts`. A behavior-preserving split is the highest-leverage bounded bet because it removes the current bottleneck without widening the mechanic search space again this session.

## Why This Fits The Horizon
- It is bounded to one coherent seam inside `src/simulation.ts`; the actor can stop once settlement, disturbance-opening, and cladogenesis helpers are extracted behind a stable internal interface.
- Success is autonomously verifiable with existing deterministic tests and a normal build, with no need for long experiment runtime or hidden human judgment.

## Success Evidence
- `src/simulation.ts` is materially smaller and the extracted settlement or cladogenesis helpers live in dedicated module(s) or helper file(s) with no intended behavior change.
- Specific verification command or output: `npm test -- --runInBand test/simulation.test.ts test/activity.test.ts && npm run build`.

## Stop Conditions
- Stop after the settlement plus disturbance-opening plus cladogenesis seam is extracted and verified; do not continue into adding a new mechanic in the same session.
- If the extraction starts requiring broad exposure of unrelated simulation internals, shrink scope to offspring-settlement plus disturbance-opening helpers first and leave cladogenesis gating in place.

## Assumptions / Unknowns
- Assumption: the current deterministic tests around settlement, disturbance openings, and clade founding are sufficient to catch behavior drift during extraction.
- Unknown: whether a clean module boundary is possible without threading too much mutable simulation state through helper APIs.
