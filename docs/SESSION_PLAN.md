# Session Plan — 2026-03-12

## Compact Context
- `npm`/TypeScript/vitest repo with deterministic simulation tests and several short relabel-null smoke-study scripts already wired through `package.json`.
- The best recent short result is still `docs/clade_activity_relabel_null_offspring_ecology_settlement_smoke_2026-03-12.json`: enabling `offspringSettlementEcologyScoring` raises `persistentActivityMeanDeltaVsNullMean` from `+20.285714285714263` to `+29.25000000000003` while keeping matched birth schedules.
- `docs/clade_activity_relabel_null_encounter_risk_smoke_2026-03-12.json` shows the next spatial tweak failed hard: `encounterRiskAversion=1` flips the same short metric to `-60.78571428571427`, with `persistentWindowFractionDeltaVsNullMean` still `0`.
- The canonical anti-evidence remains `docs/clade_activity_relabel_null_2026-03-10.json`: at `4000` steps, actual clades are still strongly below the relabel-null on persistent activity at cladogenesis thresholds `1` and `1.2`.
- The simulation already has seasonality, localized disturbance, and fertility-scaled decomposition, but `recycleDeadAgents()` returns biomass only to the death cell.
- The last five commits stayed on kin-aware spatial ecology, so the next bet must move to a different axis.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Kin-aware spatial ecology | 6 | e5243bf |
| Clade interaction inheritance | 2 | 220dd20 |
| Clade habitat inheritance | 2 | 14e9fca |
| Environmental feedback / disturbance | 0 | — |
| Reproduction mechanics | 0 | — |
| Communication / signaling | 0 | — |

Dominant axis: Kin-aware spatial ecology (6/10)
Underexplored axes: environmental feedback / disturbance, reproduction mechanics, communication / signaling

## Project State
- The simulation already includes cladogenesis, clade habitat/interaction coupling, trophic and defense traits, seasonality, localized disturbance, and decomposition analytics.
- Recent sessions moved from clade-level inheritance sweeps into a run of kin-aware harvest/dispersal/settlement/encounter mechanics after the long relabel-null panel came back negative.
- The important gap is endogenous environmental memory: resources mostly regenerate exogenously, while deaths and disturbances do not yet create reusable spatial nutrient structure beyond the single impacted cell.

## External Context
- `Spatial Pattern Formation in Eco-Evolutionary Games with Environment-Driven Motion` (arXiv, 2025): changing local environmental quality and movement coupling can produce qualitatively different spatial structure, which supports testing resource-field feedbacks instead of another agent-only avoidance term. Source: arXiv.
- `Predicting ecosystem changes by a new model of ecosystem evolution` (Scientific Reports, 2023): explicit nutrient-cycle and decomposition dynamics changed long-run ecosystem structure, which supports making biomass recycling spatially consequential instead of point-local. Source: Scientific Reports.

## Research Gaps
- If some recycled biomass spills into neighboring cells instead of only the corpse cell, does the current best kin-aware stack gain persistent-window coverage or at least preserve its short activity advantage without breaking matched birth schedules?

## Current Anti-Evidence
- No artifact yet shows a positive actual-vs-null advantage on the canonical `4000`-step horizon; persistent clade activity remains strongly negative versus the relabel-null baseline.
- Even the short wins still leave `persistentWindowFractionDeltaVsNullMean = 0`, so the system has not yet shown broader ongoing renewal instead of denser transient activity.

## Candidate Bets
- A: Add an opt-in decomposition spillover fraction so deaths fertilize the four wrapped neighboring cells as well as the death cell, then run a 2-point short relabel-null smoke on top of the current best stack.
  Why now: it is a localized mechanism change on a completely different axis that can reuse the existing decomposition test surface and relabel-null study path.
  Est. low-context human time: 45m
  Main risk: spillover may smooth the landscape too much and reduce ecological differentiation instead of increasing it.
- B: Add a short-lived post-disturbance regrowth pulse on shocked cells or refugia edges, then run a narrow disturbance smoke.
  Why now: disturbance scheduling and analytics already exist, so a small regenerative response can be verified without inventing new measurement infrastructure.
  Est. low-context human time: 45m
  Main risk: synchronized regrowth pulses may wash out turnover and create one global rhythm.
- C: Run the canonical `4000`-step relabel-null panel on the current best offspring-ecology stack with no new mechanics.
  Why now: the short gain still needs a hard falsification pass before more local tuning accumulates.
  Est. low-context human time: 30m
  Main risk: it spends the session on measurement only and leaves the environmental-feedback gap untouched.

## Selected Bet
Implement an opt-in `decompositionSpilloverFraction` with fixed radius-1 cardinal spillover so a configurable share of recycled biomass leaves the corpse cell and fertilizes neighboring cells instead. Add one deterministic test proving neighbor cells gain resources while total recycled biomass is conserved before clamping, then add a 2-point `study:clade-activity-relabel-null-decomposition-spillover-smoke` off/on comparison atop the current best short stack (`lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, `offspringSettlementEcologyScoring=true`, `encounterRiskAversion=0`).

## Why This Fits The Horizon
- The code path is narrow: one config field, `recycleDeadAgents()` resource placement, one deterministic test, and one small smoke-study script plus `package.json` entry.
- Success is autonomously checkable with `npm test`, `npm run build`, and a single off/on study artifact.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_decomposition_spillover_smoke_2026-03-12.json` reports off/on `persistentWindowFractionDeltaVsNullMean`, `persistentActivityMeanDeltaVsNullMean`, and `birthScheduleMatchedAllSeeds`.
- Specific verification command or output: `npm test && npm run build && npm run study:clade-activity-relabel-null-decomposition-spillover-smoke`, plus a deterministic test where one death at `(x,y)` increases adjacent resources when spillover is enabled.

## Stop Conditions
- Stop after one spillover knob, one deterministic recycling test, and one 2-point smoke result; do not also add disturbance memory, delayed nutrient decay, or more kin-aware movement tuning.
- If conserving recycled biomass across wrapped neighbors requires refactors beyond config plumbing and `recycleDeadAgents()`, shrink scope to fixed equal sharing over the four cardinal neighbors or stop with the negative result.

## Assumptions / Unknowns
- Assumption: point-local decomposition is currently trapping mortality feedback inside the same patch instead of creating exploitable nutrient gradients.
- Unknown: whether spillover creates richer successional mosaics or simply homogenizes food and leaves persistent-window coverage unchanged.
