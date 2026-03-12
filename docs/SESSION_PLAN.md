# Session Plan — 2026-03-12

## Compact Context
- `src/simulation.ts` is `2745` lines and `src/activity.ts` is `2550`; recent mechanism work keeps touching the same local-ecology, settlement, cladogenesis, and disturbance blocks.
- The shared relabel-null smoke harness and best-short-stack preset now exist, so bounded study instrumentation can be reused across multiple variants.
- The current short-stack baseline at `1000` steps / threshold `1` is `+29.25` `persistentActivityMeanDeltaVsNullMean`; `offspringSettlementEcologyScoring=true` beats `false` (`+29.25` vs `+20.29`).
- Recent March 12 toggles mostly regress that baseline: trait novelty `+1.46`, ecology gate `+5.29`, decomposition spillover `+14.86`, trophic opportunity `-17.25`, encounter risk `-60.79`.
- The canonical `4000`-step best-short-stack panel improved versus `2026-03-10` but is still negative in all four cells: `-34.63`, `-111.78`, `-18.24`, `-93.65`.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Recruitment ecology / founder filtering | 4 | 8e477ff |
| Kin-structured local competition | 2 | 37a91c7 |
| Experiment infrastructure | 1 | 07955c8 |
| Long-horizon relabel-null validation | 1 | a843a91 |
| Environmental feedback / recycling | 1 | 6631bd9 |
| Spatial threat response | 1 | e5243bf |
| Disturbance / resilience | 0 | — |
| Communication / signaling | 0 | — |

Dominant axis: Recruitment ecology / founder filtering (4/10)
Underexplored axes: experiment infrastructure, long-horizon relabel-null validation, environmental feedback / recycling, spatial threat response, disturbance / resilience, communication / signaling

## Project State
- The simulation already has localized disturbance/refugia, trophic and defense traits, kin-aware harvest/dispersal/encounter controls, ecology-scored settlement, and cladogenesis gating.
- Recent sessions have stacked kin-aware local competition with ecology-scored recruitment, then tested several founder filters and occupant-aware scoring knobs on top of that best short stack.
- The missing piece is failure diagnosis: current artifacts say which toggle won or lost, but not whether losses come from fewer clade births, weaker persistence after birth, or reduced population/clade occupancy over time.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): ToLSim argues that post-speciation ecological performance matters more than raw founding counts, which matches the current need to separate founder suppression from survival failure.
- [Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity](https://arxiv.org/abs/2406.04235): persistent differentiated niches matter more than novelty alone, which supports instrumenting why current filters flatten clade activity.

## Research Gaps
- Do the recent trait/ecology gates fail mainly by suppressing clade formation volume, by reducing post-founding persistence, or by lowering overall population/activity relative to the current best short stack?
- Are the short-stack gains concentrated in early post-burn-in windows while failed variants collapse later, which would explain the `1000`-step positives but `4000`-step negatives?

## Current Anti-Evidence
- Even the best validated stack is still below matched-null persistent activity in every canonical `4000`-step cell, so durable above-null clade persistence is still unproven.
- Recent founder/ecology variants often shrink actual persistent activity mean and active clades toward the null or below it, implying the system still lacks a reliable niche-creation mechanism.

## Candidate Bets
- A: [investigate] Add a compact diagnostic export to relabel-null smoke and best-stack studies that reports per-seed actual-vs-null persistent activity, raw new-clade activity, final population, and active clade counts, then apply it to the current best stack plus one failed variant.
  Why now: three consecutive feature experiments worsened the short metric, and the current JSON artifacts do not isolate whether the failure is suppressed founding, weak persistence, or general population loss.
  Est. low-context human time: 45m
  Main risk: the scope could sprawl if it tries to emit full time-series traces instead of a small reusable schema.
- B: [split] Extract local ecology scoring, offspring settlement, and cladogenesis gating helpers from `src/simulation.ts` into a focused module.
  Why now: nearly every recent mechanism touched the same `1500`-`2100` block of a `2745`-line file, so the next experiment will otherwise keep paying navigation and merge tax.
  Est. low-context human time: 50m
  Main risk: it improves iteration speed but does not answer the current scientific failure mode by itself.
- C: [feat] Add disturbance-driven fertility rebound around shocked cells and refugia so disturbances create temporary colonization windows instead of only removing energy and resources.
  Why now: disturbance / resilience is still unused as a niche-creation axis and is clearly different from the recent founder-filtering streak.
  Est. low-context human time: 55m
  Main risk: it may raise raw activity without improving matched-null persistence, so diagnostics would still be needed immediately afterward.

## Selected Bet
Choose A. The last several feature sessions mostly made the short-stack baseline worse, and the long-horizon panel is still decisively negative, so the highest-leverage bounded move is to expose the failure mode on the existing relabel-null path before adding another mechanism. The necessary simulation summaries already exist, which keeps this investigation small and directly useful for the next different-axis feature bet.

## Why This Fits The Horizon
- It reuses the existing relabel-null study path and smoke wrappers; no new simulation mechanic, sweep framework, or long benchmark is required.
- Success is autonomously verifiable with tests and regenerated JSON artifacts that contain the new diagnostic section for known studies.

## Success Evidence
- Regenerated best-stack and failed-variant artifacts include a new diagnostic section that makes the dominant loss mode explicit, such as lower actual persistent activity, fewer active clades, or lower population.
- Specific verification command or output: `npm test && npx tsx src/clade-activity-relabel-null-best-short-stack-study.ts --generated-at 2026-03-12T00:00:00.000Z && npx tsx src/clade-activity-relabel-null-cladogenesis-trait-novelty-smoke-study.ts --generated-at 2026-03-12T00:00:00.000Z`.

## Stop Conditions
- Stop after one reusable diagnostic schema is wired into relabel-null smoke and best-stack studies; do not add generic CSV exporters or full per-tick traces in the same session.
- If window-level diagnostics cause heavy type churn, shrink scope to per-seed final-summary and persistent-activity comparisons, then document the remaining blind spot in the artifact output.

## Assumptions / Unknowns
- Assumption: existing step summaries and taxon histories are sufficient to distinguish fewer founders from weaker survivors without changing simulation rules.
- Unknown: whether per-window diagnostics are enough, or whether the real failure only becomes visible in finer step-level turnover traces.
