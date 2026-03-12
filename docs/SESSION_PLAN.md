# Session Plan — 2026-03-12

## Compact Context
- `src/simulation.ts` and `src/activity.ts` are still over `2500` lines, and seven relabel-null smoke entrypoints in `src/` repeat nearly identical CLI and JSON scaffolding.
- The current best validated stack is `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, `lineageOffspringSettlementCrowdingPenalty=0`, `offspringSettlementEcologyScoring=true`, `encounterRiskAversion=0`, `decompositionSpilloverFraction=0`, `cladogenesisEcologyAdvantageThreshold=-1`.
- `docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json` improved the canonical `4000`-step panel versus `2026-03-10`, but `persistentActivityMeanDeltaVsNullMean` is still negative in all four canonical cells: `-34.63`, `-111.78`, `-18.24`, `-93.65`.
- `localEcologyScore()` currently rewards abiotic food and penalizes crowding, same-lineage crowding, and encounter risk; it does not reward biotic prey opportunity, so trophic and defense traits mostly matter only after co-location.
- The `2026-03-12` short smokes show `offspringSettlementEcologyScoring=true` is still the last clear positive addition; `encounterRiskAversion=1`, `decompositionSpilloverFraction=0.5`, and `cladogenesisEcologyAdvantageThreshold=0.1` all regress the `+29.25` threshold-`1` short delta.
- `test/simulation.test.ts` already covers predation pressure, defense mitigation, clade interaction coupling, and settlement scoring, so a small trophic movement/settlement mechanic can be verified deterministically.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Kin-structured local competition | 4 | e5243bf |
| Offspring placement / recruitment | 2 | 2421461 |
| Reproduction mechanics / founder gating | 1 | e512298 |
| Long-horizon relabel-null validation | 1 | a843a91 |
| Environmental feedback / nutrient recycling | 1 | 6631bd9 |
| Clade interaction inheritance | 1 | 220dd20 |
| Trophic dynamics / resource competition | 0 | — |
| Communication / signaling | 0 | — |
| Disturbance / resilience | 0 | — |

Dominant axis: Kin-structured local competition (4/10)
Underexplored axes: reproduction mechanics / founder gating, long-horizon relabel-null validation, environmental feedback / nutrient recycling, clade interaction inheritance, trophic dynamics / resource competition, communication / signaling, disturbance / resilience

## Project State
- The simulation already has cladogenesis, clade habitat and interaction coupling, trophic and defense traits, kin-aware harvest/dispersal/encounter controls, ecology-scored offspring settlement, disturbance, and decomposition recycling.
- Recent sessions pushed short-horizon relabel-null results upward by reducing kin self-crowding, but the canonical `4000`-step validation says the system still loses on persistent activity intensity after clades are founded.
- The important missing leverage point is that interaction traits do not yet create positive spatial opportunity before encounters happen, so established clades still lack a strong mechanism for durable trophic niche differentiation.

## External Context
- [ToLSim: a 3D Artificial Life Simulation as a General Platform for Open-Ended Evolution Research](https://arxiv.org/abs/2602.01407): reports partially open-ended cumulative complexity while still exposing bounded novelty channels, which matches the current need to improve durable post-founding activity rather than only increase clade births.
- [Adaptive Exploration in Lenia with Intrinsic Multi-Objective Ranking](https://arxiv.org/abs/2506.02990): sustained novelty improved when exploration preserved differentiated niches, which supports making trophic traits affect where agents go, not just what happens after collision.

## Research Gaps
- Does adding a positive prey-opportunity term to movement and offspring settlement increase short-horizon `persistentActivityMeanDeltaVsNullMean` at cladogenesis threshold `1` without breaking matched birth schedules?

## Current Anti-Evidence
- Even the best validated stack still underperforms the matched relabel-null at all four canonical `4000`-step cells, so the project cannot yet claim stronger-than-null persistent clade activity.
- Persistent-window coverage now matches the null, which means stricter founding alone is not enough; the remaining deficit is low activity intensity per persistent clade after establishment.

## Candidate Bets
- A: [feat] Add trophic-opportunity attraction to `localEcologyScore()` so predator-like agents and offspring prefer prey-rich cells, then run one off/on short relabel-null smoke on the current best stack.
  Why now: trophic traits currently impose costs earlier than they create opportunities, which is a direct candidate explanation for weak post-founding clade activity.
  Est. low-context human time: 45m
  Main risk: stronger predator aggregation could collapse prey locally and reduce total activity.
- B: [refactor] Extract a generic relabel-null smoke-study helper and collapse the seven near-identical smoke entrypoints into thin wrappers.
  Why now: the code-health triggers are active, and duplicated study scaffolding is becoming iteration drag.
  Est. low-context human time: 50m
  Main risk: the session improves infrastructure but does not test a new mechanism.
- C: [validate] Run one canonical `4000`-step panel for the ecology-gated cladogenesis variant to close the loop on the latest short-smoke regression.
  Why now: the newest founding-control feature already looks weak at `1000` steps, and a single long-horizon read would keep the search honest.
  Est. low-context human time: 35m
  Main risk: it likely confirms a dead end without opening a new axis.

## Selected Bet
Add one trophic/resource-competition mechanic: a positive prey-opportunity score for movement and offspring settlement. Extend the existing local ecology scoring path so high-trophic, aggressive agents can treat prey-rich neighborhoods as attractive rather than only risky or crowded, then verify the change with deterministic simulation tests and one threshold-`1` relabel-null smoke comparing attraction off vs on on top of the current best kin-aware ecology stack.

## Why This Fits The Horizon
- The code change is narrow: one new config knob, one helper parallel to encounter-risk scoring, small wiring in the existing movement/settlement context builders, one focused test addition, and one off/on smoke script.
- Success is autonomously verifiable with deterministic unit tests plus a single JSON artifact; no sweep or long-horizon rerun is required in the same session.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_trophic_opportunity_smoke_2026-03-12.json` reports attraction-off vs attraction-on summaries, matched birth schedules, and `persistentActivityMeanDeltaVsNullMean`.
- Specific verification command or output: `npm run build && npm test && tsx src/clade-activity-relabel-null-trophic-opportunity-smoke-study.ts`.

## Stop Conditions
- Stop after one off/on comparison at one attraction value; do not add weight sweeps, long-horizon panels, or refactors in the same session.
- If prey-opportunity scoring cannot be expressed as a narrow addition to the existing `localEcologyScore()` path, shrink scope to adult movement only and still produce deterministic tests plus one smoke artifact.

## Assumptions / Unknowns
- Assumption: the remaining long-horizon gap is mostly about weak ecological niche exploitation after founding, not about clade birth counts.
- Unknown: whether prey-opportunity attraction helps actual clades more than the matched null or merely accelerates predator-prey turnover for both.
