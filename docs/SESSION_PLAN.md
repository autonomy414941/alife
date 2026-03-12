# Session Plan — 2026-03-12

## Compact Context
- `src/simulation.ts` and `src/activity.ts` are both over `2500` lines, and seven relabel-null smoke-study entrypoints in `src/` now share near-identical structure.
- The current best short stack is `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, `offspringSettlementEcologyScoring=true`, `encounterRiskAversion=0`, `decompositionSpilloverFraction=0`.
- `docs/clade_activity_relabel_null_offspring_ecology_settlement_smoke_2026-03-12.json` improved the short threshold-`1` delta to `+29.25`, but `persistentWindowFractionDeltaVsNullMean` stayed `0`.
- The two follow-up tweaks both underperformed that stack: `docs/clade_activity_relabel_null_encounter_risk_smoke_2026-03-12.json` fell to `-60.79`, and `docs/clade_activity_relabel_null_decomposition_spillover_smoke_2026-03-12.json` fell to `+14.86`.
- The canonical anti-evidence still comes from `docs/clade_activity_relabel_null_2026-03-10.json`: at `4000` steps, actual clades remain below the matched relabel-null at cladogenesis thresholds `1` and `1.2`.
- `runCladeActivityRelabelNullStudy()` already accepts injected simulation config, so a dedicated long-horizon validation entrypoint is low-overhead.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Kin-aware spatial ecology | 6 | e5243bf |
| Clade interaction inheritance | 2 | 220dd20 |
| Environmental feedback / nutrient recycling | 1 | 6631bd9 |
| Clade habitat inheritance | 1 | 14e9fca |
| Reproduction mechanics | 0 | — |
| Communication / signaling | 0 | — |

Dominant axis: Kin-aware spatial ecology (6/10)
Underexplored axes: environmental feedback / nutrient recycling, clade habitat inheritance, reproduction mechanics, communication / signaling

## Project State
- The simulation already has cladogenesis, clade habitat and interaction coupling, kin-aware harvest/dispersal/encounter/settlement knobs, disturbance, and decomposition spillover with deterministic tests for recent mechanics.
- Recent sessions have been optimizing a short `1000`-step clade-activity delta at threshold `1`; only ecology-scored juvenile placement improved that short metric, and the next two tweaks did not.
- The important gap is long-horizon falsification of the current best stack, while study-entrypoint duplication is also starting to tax iteration speed.

## External Context
- [Characterizing Open-Ended Evolution Through Undecidability Mechanisms in Random Boolean Networks](https://arxiv.org/abs/2512.15534) (arXiv, 2025): argues OEE diagnostics should separate enduring innovation from transient noise, which directly supports rerunning the long-horizon panel before treating a short win as meaningful.
- [Adaptive Exploration in Lenia with Intrinsic Multi-Objective Ranking](https://arxiv.org/abs/2506.02990) (arXiv, 2025): sustained exploration pressure improved long-run novelty in Lenia, which suggests local short-horizon gains here need horizon checks before more tuning.

## Research Gaps
- Does the current best short stack still underperform the matched relabel-null at `4000` steps, or has the `+29.25` short-horizon gain actually shifted the canonical anti-evidence at thresholds `1` and `1.2`?

## Current Anti-Evidence
- No current artifact shows positive `4000`-step actual-vs-null persistent activity on the canonical relabel-null panel; the 2026-03-10 baseline is still strongly negative.
- Every short smoke artifact on 2026-03-12 still has `persistentWindowFractionDeltaVsNullMean = 0`, so even the best configuration has not broadened persistent-window coverage.

## Candidate Bets
- A: [validate] Run the canonical `4000`-step relabel-null panel on the current best short stack and emit a dedicated artifact for direct comparison with `docs/clade_activity_relabel_null_2026-03-10.json`.
  Why now: six feat sessions have passed since the last hard validation, and the strongest claim in the repo is still unsupported at the long horizon.
  Est. low-context human time: 35m
  Main risk: the result may still be negative, leaving no new mechanism added.
- B: [feat] Add a small post-disturbance regrowth pulse or refugia-edge fertility bonus, then run a 2-point short relabel-null smoke.
  Why now: it targets an underexplored environmental-feedback axis that is structurally different from the kin-aware tuning streak.
  Est. low-context human time: 45m
  Main risk: synchronized regrowth may create another global rhythm without improving persistence.
- C: [refactor] Extract a generic paired-setting relabel-null smoke helper and migrate the repeated smoke-study entrypoints to it.
  Why now: seven nearly identical scripts plus `>2500`-line core files are now a real code-health drag on the next few sessions.
  Est. low-context human time: 50m
  Main risk: the refactor can consume the session without changing or validating simulation behavior.

## Selected Bet
Run the canonical `4000`-step relabel-null panel on the current best short stack, not another new knob. Implement one dedicated study entrypoint that reuses `runCladeActivityRelabelNullStudy()` with `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, `offspringSettlementEcologyScoring=true`, `encounterRiskAversion=0`, and `decompositionSpilloverFraction=0`, then compare its threshold `1` and `1.2` aggregates against the 2026-03-10 baseline artifact.

## Why This Fits The Horizon
- The code change is narrow: one study script, one script entry if needed, and one artifact; the simulation core stays untouched.
- Success is autonomously verifiable from deterministic JSON output plus `npm run build` and the study command; no human interpretation is needed to decide whether the long-horizon anti-evidence moved.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json` reports threshold `1` and `1.2` aggregates for `minSurvivalTicks` `50` and `100`.
- Specific verification command or output: `npm run build && npm run study:clade-activity-relabel-null-best-short-stack`, followed by a direct comparison showing whether `persistentActivityMeanDeltaVsNullMean` improved over `-317.63` and `-247.32` at `minSurvivalTicks=50`.

## Stop Conditions
- Stop after producing one dedicated long-horizon artifact for the best short stack; do not add another mechanic in the same session.
- If the new script starts turning into a generalized study framework or requires refactoring `activity.ts`, shrink scope to a single-purpose entrypoint and document the negative result.

## Assumptions / Unknowns
- Assumption: the `1000`-step `+29.25` improvement is large enough to justify one long-horizon falsification pass before more feature work.
- Unknown: whether the current best stack helps at `4000` steps or only shifts early transient activity without changing long-run persistent renewal.
