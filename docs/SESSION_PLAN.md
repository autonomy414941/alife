# Session Plan — 2026-03-12

## Compact Context
- `npm`/TypeScript/vitest repo with reusable relabel-null smoke scripts and deterministic simulation tests.
- The latest short result is `docs/clade_activity_relabel_null_offspring_ecology_settlement_smoke_2026-03-12.json`: enabling `offspringSettlementEcologyScoring` lifts `persistentActivityMeanDeltaVsNullMean` from `+20.285714285714263` to `+29.25000000000003` while keeping matched birth schedules.
- The canonical anti-evidence is still `docs/clade_activity_relabel_null_2026-03-10.json`: at `4000` steps, actual clades remain far below the matched null on persistent activity at cladogenesis thresholds `1` and `1.2`.
- `localEcologyScore()` still scores candidate cells only by food and crowding, so adults and juveniles do not anticipate encounter danger before co-occupying a cell.
- The last five commits all stayed on lineage-aware spatial ecology, so the next selected bet must move to a different axis.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Lineage-aware spatial ecology | 5 | 2421461 |
| Clade interaction inheritance | 2 | 220dd20 |
| Clade habitat inheritance | 2 | 14e9fca |
| Relabel-null evaluation | 1 | 9db4c37 |
| Environmental feedback / disturbance | 0 | — |
| Trophic / predator-prey spatial response | 0 | — |
| Communication / signaling | 0 | — |

Dominant axis: Lineage-aware spatial ecology (5/10)
Underexplored axes: environmental feedback / disturbance, trophic / predator-prey spatial response, communication / signaling

## Project State
- The simulation already includes cladogenesis, habitat/trophic/defense traits, clade coupling, kin-aware harvest/dispersal/encounter/settlement, seasonality/disturbance, and relabel-null activity studies.
- Recent sessions turned a negative short relabel-null signal into a positive one by stacking kin-aware local-ecology mechanics, culminating in ecology-scored offspring settlement.
- The important gap is pre-encounter spatial choice: agents pay interaction costs only after landing together, but movement and settlement never score a cell by likely predator or prey pressure first.

## External Context
- Hamster et al., *Random evolutionary dynamics in predator-prey systems yields large, clustered ecosystems* (March 18, 2025): evolving predator-prey interactions in a spatial model sustained clustered coexistence, which supports treating trophic interaction structure as a diversity lever instead of only a payoff modifier. Source: https://pubmed.ncbi.nlm.nih.gov/40113162/
- Reynolds, *Camouflage From Coevolution of Predator and Prey* (Artificial Life, May 1, 2025): continued predator-prey antagonism generated ongoing adaptive change in a simple artificial-life system, which supports shifting from kin-only regulation toward interaction-aware spatial decisions. Source: https://direct.mit.edu/artl/article/31/2/153/130573/Camouflage-From-Coevolution-of-Predator-and-Prey

## Research Gaps
- If adult movement and juvenile settlement subtract a local encounter-risk estimate from `localEcologyScore()`, does the current short relabel-null win improve persistent window coverage instead of only raw activity volume?

## Current Anti-Evidence
- No artifact yet shows a positive actual-vs-null advantage on the canonical `4000`-step horizon; the long relabel-null panel is still strongly negative on persistent activity.
- Even the best `1000`-step result still has `persistentWindowFractionDeltaVsNullMean = 0`, so the system has not yet shown broader ongoing renewal rather than just denser short-horizon activity.

## Candidate Bets
- A: Add an opt-in encounter-risk aversion term to `localEcologyScore()` for adult movement and offspring settlement, then run a 2-point short relabel-null smoke on top of the current best kin-aware stack.
  Why now: the shared scoring hook already exists, and risk-blind spatial choice is the clearest missing mechanism on a different axis.
  Est. low-context human time: 45m
  Main risk: reducing encounters may also suppress births and collapse activity instead of improving persistence.
- B: Add a neighborhood decomposition spillover knob so deaths create small nutrient halos instead of only cell-local deposits, then run the same short smoke.
  Why now: decomposition already exists and is purely point-local, making environmental feedback the cheapest underused axis.
  Est. low-context human time: 45m
  Main risk: spreading nutrients may smooth patches and weaken ecological differentiation.
- C: Run the canonical `4000`-step relabel-null panel on the current best kin-aware plus offspring-ecology stack without changing mechanics.
  Why now: the latest short gain still needs a hard falsification pass.
  Est. low-context human time: 30m
  Main risk: it is measurement-only and spends the session without improving the dynamics.

## Selected Bet
Implement an opt-in encounter-risk aversion knob that feeds into `localEcologyScore()`, using nearby occupants' aggression plus trophic/defense asymmetry to make risky cells less attractive before encounters happen. Reuse that score for both adult movement and juvenile placement, add one deterministic test showing a vulnerable agent or offspring rejects a food-rich but dangerous cell when the knob is enabled, then run a 2-point `1000`-step relabel-null smoke comparing risk aversion off vs on atop the current best stack (`lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, `offspringSettlementEcologyScoring=true`, lineage-settlement crowding still `0`).

## Why This Fits The Horizon
- The code path is localized to the existing shared scoring function plus one small smoke-study script and a deterministic test.
- Success is autonomously checkable with `npm test`, `npm run build`, and a narrow off/on smoke artifact.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_encounter_risk_smoke_2026-03-12.json` shows whether `persistentWindowFractionDeltaVsNullMean` or `persistentActivityMeanDeltaVsNullMean` improves while `birthScheduleMatchedAllSeeds` stays `true`.
- Specific verification command or output: `npm test && npm run build && npm run study:clade-activity-relabel-null-encounter-risk-smoke`, plus a deterministic test where the risk-aware branch avoids a predator-occupied neighbor that the neutral branch takes.

## Stop Conditions
- Stop after one risk knob, one deterministic spatial-choice test, and one 2-point smoke result; do not also retune clade coupling, add nutrient spillover, or run the long-horizon panel in the same session.
- If computing local risk requires broad refactors outside movement/settlement scoring and lightweight occupancy plumbing, shrink scope to adult movement only or stop with the negative result.

## Assumptions / Unknowns
- Assumption: risk-blind co-occupancy is one reason the current gains raise activity volume without improving persistent-window coverage.
- Unknown: whether encounter-risk avoidance creates stable coexistence or just spatial freezing with fewer interactions and births.
