# Session Plan — 2026-03-12

## Compact Context
- `src/simulation.ts` is `2745` lines, `src/activity.ts` is `2550`, and ten `src/clade-activity-relabel-null-*-smoke-study.ts` entrypoints repeat the same `DEFAULT_STUDY_INPUT` / `parseCli` / summary scaffold.
- The current best validated stack is still `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, `lineageOffspringSettlementCrowdingPenalty=0`, `offspringSettlementEcologyScoring=true`, `encounterRiskAversion=0`, `decompositionSpilloverFraction=0`.
- `docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json` improved the canonical `4000`-step panel versus `2026-03-10`, but `persistentActivityMeanDeltaVsNullMean` remains negative in all four canonical cells: `-34.63`, `-111.78`, `-18.24`, `-93.65`.
- Recent short smokes show fragile gains: trait novelty dropped the threshold-`1` delta from `+29.25` to `+1.46`; trophic opportunity fell to `-17.25`; ecology gain fell to `+5.29`; decomposition spillover only reached `+14.86`.
- `test/simulation.test.ts` already covers encounter-risk scoring, trophic opportunity attraction, ecology-scored settlement, ecology-gated and trait-novelty-gated cladogenesis, and decomposition spillover, so missing mechanism tests are not the current bottleneck.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Founder filtering / recruitment ecology | 4 | 8e477ff |
| Kin-structured local competition | 2 | 37a91c7 |
| Long-horizon relabel-null validation | 1 | a843a91 |
| Environmental feedback / nutrient recycling | 1 | 6631bd9 |
| Spatial interaction / risk-aware movement | 1 | e5243bf |
| Trophic opportunity / prey-seeking | 1 | 5003c4f |
| Disturbance / resilience | 0 | — |
| Communication / signaling | 0 | — |

Dominant axis: Founder filtering / recruitment ecology (4/10)
Underexplored axes: long-horizon relabel-null validation, environmental feedback / nutrient recycling, spatial interaction / risk-aware movement, trophic opportunity / prey-seeking, disturbance / resilience, communication / signaling

## Project State
- The simulation already has cladogenesis, habitat and interaction coupling, kin-aware harvest/dispersal/encounter controls, ecology-scored juvenile placement, occupant-aware risk/opportunity scoring, disturbance, and decomposition recycling.
- Recent sessions have been iterating short threshold-`1` relabel-null toggle studies around the same best kin-aware stack, then checking whether the most promising stack survives the canonical `4000`-step panel.
- The main gap is now twofold: long-horizon persistence is still weaker than the matched null, and the experiment surface is slowed by duplicated smoke-study entrypoints plus oversized core files.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): ToLSim suggests post-speciation ecological performance matters more than raw founding counts, which matches the current need to compare mechanism families cleanly rather than keep adding one-off founder filters.
- [Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity](https://arxiv.org/abs/2406.04235): sustained diversity improves when search preserves differentiated niches, so faster standardized evaluation across underexplored mechanisms is more valuable now than another bespoke smoke script.

## Research Gaps
- Which underexplored mechanism family can beat the current short threshold-`1` baseline of `+29.25` `persistentActivityMeanDeltaVsNullMean` and still warrant promotion to the canonical `4000`-step panel once all candidates are evaluated through the same harness?

## Current Anti-Evidence
- Even the best validated stack still loses to the matched relabel-null in every canonical `4000`-step cell, so the system still lacks durable above-null clade persistence.
- Recent short-run improvements are brittle and non-monotonic: multiple new toggles regress the current short baseline, suggesting the search process is producing noise faster than reusable knowledge.

## Candidate Bets
- A: [refactor] Extract a shared short relabel-null smoke-study harness plus a single exported best-short-stack preset, then convert the March 11-12 smoke scripts into thin wrappers.
  Why now: code-health triggers are active and the bottleneck is comparable iteration across axes, not another copy-pasted toggle script.
  Est. low-context human time: 45m
  Main risk: no simulation behavior changes this session.
- B: [feat] Add disturbance-coupled fertility rebound so shocked cells become temporary high-resource niches instead of pure losses.
  Why now: disturbance / resilience is still untouched as a niche-creation mechanism, while current mechanics mostly filter existing founders rather than create new ecological openings.
  Est. low-context human time: 50m
  Main risk: it may inflate activity without improving matched-null persistence.
- C: [validate] Run the canonical `4000`-step relabel-null panel for the trait-novelty gate to retire or confirm the founder-filtering branch.
  Why now: the short threshold-`1` delta fell from `+29.25` to `+1.46`, so this branch may already be near dead.
  Est. low-context human time: 35m
  Main risk: likely negative evidence only, while duplication debt keeps slowing every next experiment.

## Selected Bet
Refactor the experiment surface, not the simulation core: extract one shared relabel-null smoke harness and one shared best-stack config, then collapse the ten near-identical March 11-12 smoke entrypoints into thin wrappers. The latest founder-gating and ecology toggles already have enough negative short-run evidence that the highest-leverage bounded move is to make the next axis change cheap, consistent, and less error-prone.

## Why This Fits The Horizon
- The scope is bounded to duplicated smoke entrypoints and shared study config; it avoids broad surgery inside `src/simulation.ts` or `src/activity.ts`.
- Success is autonomously verifiable without new scientific claims: builds and tests stay green, and representative scripts reproduce the existing `2026-03-12` summaries from current JSON artifacts.

## Success Evidence
- Representative reruns match current summaries from `docs/clade_activity_relabel_null_cladogenesis_trait_novelty_smoke_2026-03-12.json` and `docs/clade_activity_relabel_null_trophic_opportunity_smoke_2026-03-12.json`, especially `+29.25 -> +1.46` for trait novelty and `+29.25 -> -17.25` for trophic opportunity.
- Specific verification command or output: `npm run build && npm test && npx tsx src/clade-activity-relabel-null-cladogenesis-trait-novelty-smoke-study.ts && npx tsx src/clade-activity-relabel-null-trophic-opportunity-smoke-study.ts`.

## Stop Conditions
- Stop after one generic smoke helper plus one shared best-stack preset and the wrapper conversions for the relabel-null smoke scripts that already share the same summary shape; do not refactor sweep studies or split `src/simulation.ts` in the same session.
- If a generic helper starts requiring awkward generic typing across incompatible result shapes, shrink scope to shared preset/config plus shared CLI and summary extraction for the March 12 smoke scripts only.

## Assumptions / Unknowns
- Assumption: duplicated study scaffolding is now consuming more future progress than another single toggle would add.
- Unknown: whether one helper can cleanly cover both boolean and numeric toggle scripts without forcing a larger `activity.ts` redesign.
