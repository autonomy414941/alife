# Session Plan — 2026-03-12

## Compact Context
- `src/simulation.ts` is `2717` lines and `src/activity.ts` is `2550` lines; seven recent relabel-null smoke entrypoints in `src/` still repeat nearly identical CLI and JSON scaffolding.
- The current best validated stack is `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, `lineageOffspringSettlementCrowdingPenalty=0`, `offspringSettlementEcologyScoring=true`, `encounterRiskAversion=0`, `decompositionSpilloverFraction=0`, `trophicOpportunityAttraction=0`, `cladogenesisEcologyAdvantageThreshold=-1`.
- `docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json` improved the canonical `4000`-step panel versus `2026-03-10`, but `persistentActivityMeanDeltaVsNullMean` is still negative in all four canonical cells: `-34.63`, `-111.78`, `-18.24`, `-93.65`.
- `docs/clade_activity_relabel_null_trophic_opportunity_smoke_2026-03-12.json` regressed the short threshold-`1` delta from `+29.25` to `-17.25`; `encounterRiskAversion=1`, `decompositionSpilloverFraction=0.5`, and `cladogenesisEcologyAdvantageThreshold=0.1` also failed to beat the current short best.
- `shouldFoundNewClade()` currently gates only on genome distance and optional local ecology advantage; it does not require ecological trait novelty relative to the parent clade.
- `test/simulation.test.ts` already covers ecology-scored settlement and cladogenesis ecology gating, so one more founder-gating rule is narrowly testable.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Kin-structured local competition | 3 | 37a91c7 |
| Offspring placement / recruitment | 2 | 2421461 |
| Trophic dynamics / resource competition | 1 | 5003c4f |
| Reproduction mechanics / founder gating | 1 | e512298 |
| Long-horizon relabel-null validation | 1 | a843a91 |
| Environmental feedback / nutrient recycling | 1 | 6631bd9 |
| Spatial interaction fields / risk-aware movement | 1 | e5243bf |
| Communication / signaling | 0 | — |
| Disturbance / resilience | 0 | — |

Dominant axis: Kin-structured local competition (3/10)
Underexplored axes: trophic dynamics / resource competition, reproduction mechanics / founder gating, long-horizon relabel-null validation, environmental feedback / nutrient recycling, spatial interaction fields / risk-aware movement, communication / signaling, disturbance / resilience

## Project State
- The simulation already has cladogenesis, clade habitat and interaction coupling, trophic and defense traits, kin-aware harvest/dispersal/encounter controls, ecology-scored offspring settlement, disturbance, and decomposition recycling.
- Recent sessions improved short-horizon relabel-null deltas mainly by reducing kin self-crowding and improving offspring placement, but the canonical `4000`-step panel still loses on persistent clade activity intensity after clades are founded.
- The key gap is that new clades can still be founded by ecologically redundant offspring because founding checks location advantage, not niche divergence in habitat, trophic, or defense strategy.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): ToLSim reports unbounded total cumulative activity while normalized novelty channels remain bounded, which matches the current need to improve what happens after speciation rather than merely increase founding events.
- [Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity](https://arxiv.org/abs/2406.04235): sustained diversity improves when search preserves differentiated niches, which supports gating cladogenesis on ecological strategy divergence instead of location-only advantage.

## Research Gaps
- Does requiring a minimum ecological trait divergence before cladogenesis improve short threshold-`1` `persistentActivityMeanDeltaVsNullMean` by filtering weak redundant founders while keeping birth schedules matched?

## Current Anti-Evidence
- Even the best validated stack still underperforms the matched relabel-null at all four canonical `4000`-step cells, so the system still cannot claim stronger-than-null persistent clade activity.
- Recent positive short-run changes mostly reduce intra-lineage interference; they still do not force founders into durable ecological differentiation once a new clade appears.

## Candidate Bets
- A: [feat] Add a cladogenesis trait-novelty gate that requires a diverged offspring to exceed a habitat/trophic/defense niche-distance threshold relative to its parent clade before founding a new clade.
  Why now: the current anti-evidence points to too many weak post-founding clades, and the existing code already exposes the trait signals needed for a bounded founder-gating change.
  Est. low-context human time: 45m
  Main risk: a strict gate could simply reduce clade count without improving persistent activity.
- B: [refactor] Extract a shared relabel-null smoke-study harness and collapse the seven near-identical March 11-12 smoke entrypoints into thin wrappers.
  Why now: the code-health triggers are active, and duplicated study scaffolding is starting to slow iteration on each new mechanism.
  Est. low-context human time: 50m
  Main risk: it improves infrastructure but does not change simulation behavior this session.
- C: [validate] Run one canonical `4000`-step relabel-null panel for the ecology-gated cladogenesis variant to decide whether local-advantage founder gating is already a dead end.
  Why now: the short smoke fell from `+29.25` to `+5.29`, so one long-horizon check would retire or confirm that branch quickly.
  Est. low-context human time: 35m
  Main risk: it is likely to produce negative evidence only.

## Selected Bet
Add one reproduction-mechanics change: a clade-founding ecological novelty gate. Extend `shouldFoundNewClade()` so a diverged offspring must clear a configurable composite niche-difference threshold, using the existing habitat, trophic, and defense signals, before founding a new clade. Then verify it with one deterministic cladogenesis test and one short threshold-`1` relabel-null smoke comparing the gate off vs on on top of the current best kin-aware ecology stack.

## Why This Fits The Horizon
- The change is narrow: one new config knob, one helper that compares child-vs-parent ecological traits, one small branch in existing cladogenesis logic, one focused test, and one off/on smoke entrypoint.
- Success is autonomously verifiable with deterministic unit tests plus a single JSON artifact; no sweep or `4000`-step rerun is required in the same session.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_cladogenesis_trait_novelty_smoke_2026-03-12.json` reports gate-off vs gate-on summaries, matched birth schedules, and `persistentActivityMeanDeltaVsNullMean`.
- Specific verification command or output: `npm run build && npm test && npx tsx src/clade-activity-relabel-null-cladogenesis-trait-novelty-smoke-study.ts`.

## Stop Conditions
- Stop after one off/on comparison at threshold `1`; do not tune multiple weights, add sweeps, or run the canonical `4000`-step panel in the same session.
- If the composite niche-distance gate is not cleanly expressible from the existing habitat/trophic/defense signals, shrink scope to a two-axis gate (`habitat` + `trophic`) and still deliver deterministic tests plus one smoke artifact.

## Assumptions / Unknowns
- Assumption: part of the remaining long-horizon gap comes from ecologically redundant founders diluting activity rather than from founder scarcity alone.
- Unknown: whether fewer but more distinct founders improve persistent activity relative to the relabel-null, or merely lower clade birth counts for both.
