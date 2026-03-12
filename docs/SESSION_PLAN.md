# Session Plan — 2026-03-12

## Compact Context
- `src/simulation.ts` and `src/activity.ts` are both over `2500` lines, and the relabel-null study entrypoints in `src/` now repeat a lot of CLI and JSON scaffolding.
- The current validated best stack is `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, `lineageOffspringSettlementCrowdingPenalty=0`, `offspringSettlementEcologyScoring=true`, `encounterRiskAversion=0`, `decompositionSpilloverFraction=0`.
- `docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json` improved the canonical `4000`-step persistent-activity gap versus the 2026-03-10 baseline, but all four canonical cells are still negative against the matched relabel-null.
- In that same artifact, persistent-window coverage now matches the null in every canonical cell, so the remaining deficit is persistent activity intensity after founding, not missing persistent windows.
- `shouldFoundNewClade()` in `src/simulation.ts` currently gates new clades only on genome divergence versus the parent lineage founder genome; no ecology or establishment check participates.
- `test/simulation.test.ts` already covers reproduction, settlement scoring, encounter risk, spillover, and cladogenesis, so a small reproduction mechanic can be verified deterministically.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Kin-structured local competition | 4 | e5243bf |
| Offspring placement / recruitment | 2 | 2421461 |
| Clade interaction inheritance | 2 | 220dd20 |
| Long-horizon relabel-null validation | 1 | a843a91 |
| Environmental feedback / nutrient recycling | 1 | 6631bd9 |
| Trophic dynamics / resource competition | 0 | — |
| Communication / signaling | 0 | — |
| Disturbance / resilience | 0 | — |

Dominant axis: Kin-structured local competition (4/10)
Underexplored axes: long-horizon relabel-null validation, environmental feedback / nutrient recycling, trophic dynamics / resource competition, communication / signaling, disturbance / resilience

## Project State
- The simulation already has cladogenesis, clade habitat and interaction coupling, trophic/defense strategy signals, kin-aware harvest/dispersal/encounter controls, ecology-scored offspring settlement, and decomposition spillover with strong deterministic test coverage.
- Recent sessions pushed the short-horizon relabel-null delta upward, and the latest validation confirmed that those gains carry into the canonical `4000`-step panel much more than the 2026-03-10 baseline did.
- The important gap is now narrower and more specific: actual clades persist across windows about as often as the matched null, but they still accumulate less persistent activity once they exist.

## External Context
- [Characterizing Open-Ended Evolution Through Undecidability Mechanisms in Random Boolean Networks](https://arxiv.org/abs/2512.15534): argues that open-endedness claims should distinguish durable generative structure from transient novelty bursts, which fits the need to improve persistent activity rather than just early wins.
- [Adaptive Exploration in Lenia with Intrinsic Multi-Objective Ranking](https://arxiv.org/abs/2506.02990): sustained novelty improved when exploration pressure was made selective, which suggests making clade founding more discriminating may be more useful than simply increasing raw reproduction.

## Research Gaps
- Does ecology-gated cladogenesis improve `persistentActivityMeanDeltaVsNullMean` on a short threshold-`1` relabel-null smoke while preserving the current best stack's matched persistent-window coverage?

## Current Anti-Evidence
- Even the best validated stack still loses to the matched relabel-null at all four canonical `4000`-step cells: `-34.63`, `-111.78`, `-18.24`, and `-93.65` on `persistentActivityMeanDeltaVsNullMean`.
- The 2026-03-12 validation artifact suggests the remaining failure mode is low activity intensity per persistent clade, not absence of persistent clade windows.

## Candidate Bets
- A: [feat] Add an ecology-gated cladogenesis threshold so diverged offspring found a new clade only when their chosen settlement site is sufficiently better than the parent site on local ecology score, then run a 2-point short relabel-null smoke on top of the current best stack.
  Why now: the latest validation narrowed the gap enough to point at founder quality as the next bottleneck, and this targets reproduction mechanics rather than another kin-crowding tweak.
  Est. low-context human time: 45m
  Main risk: it may just suppress clade births and novelty without improving actual-vs-null persistent activity.
- B: [refactor] Extract a shared relabel-null smoke-study helper and migrate the repeated smoke entrypoints before adding another mechanism.
  Why now: study-script duplication is now real iteration drag, and the code-health triggers are already active.
  Est. low-context human time: 50m
  Main risk: the session ends with cleaner code but no new simulation behavior or evidence about open-endedness.
- C: [validate] Run a minimal short panel on one existing reproduction-control parameter such as `offspringEnergyFraction` atop the best stack to see whether juvenile viability, not founding logic, is the active bottleneck.
  Why now: it probes the reproduction hypothesis without touching the large study framework first.
  Est. low-context human time: 30m
  Main risk: global reproduction-rate changes may confound crowding and birth schedules, producing an ambiguous read.

## Selected Bet
Add one new reproduction mechanic: ecology-gated cladogenesis. After a diverged offspring picks its settlement site, compare that site's local ecology score to the parent site's score and require a positive configurable improvement before founding a new clade; otherwise keep the offspring in the parent lineage. Verify it with deterministic simulation tests and one short threshold-`1` relabel-null smoke comparing gate off vs on atop the current best stack.

## Why This Fits The Horizon
- The code change is narrow: one new config knob, one branch in the existing reproduction/cladogenesis path, one focused test addition, and one off/on smoke script.
- Success is autonomously verifiable with deterministic unit tests plus a single JSON artifact comparing the gated and ungated settings.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_cladogenesis_ecology_gate_smoke_2026-03-12.json` reports gate-off vs gate-on summaries and shows whether `persistentActivityMeanDeltaVsNullMean` improves over the current short best baseline.
- Specific verification command or output: `npm run build && npm test && tsx src/clade-activity-relabel-null-cladogenesis-ecology-gate-smoke-study.ts`, with matched birth schedules preserved and the gated summary reported explicitly.

## Stop Conditions
- Stop after one off/on gate comparison; do not add a broader parameter sweep or refactor study infrastructure in the same session.
- If the gate worsens the short relabel-null delta or requires deeper surgery in `activity.ts` or the study harness, shrink scope to the deterministic tests plus one negative-result artifact.

## Assumptions / Unknowns
- Assumption: the latest long-horizon anti-evidence is now mostly about weak or over-fragmented clade founding, not adult movement or harvest behavior.
- Unknown: whether stricter founding improves durable clade coherence or simply reduces novelty by creating fewer clades.
