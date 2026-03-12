# Session Plan — 2026-03-12

## Compact Context
- `src/simulation.ts` is `2745` lines and `src/activity.ts` is `2695`, so the next bet must stay narrow.
- The current best short stack is `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, and `offspringSettlementEcologyScoring=true`.
- The `1000`-step short study at cladogenesis threshold `1` is still `+29.25` `persistentActivityMeanDeltaVsNullMean`, but the new diagnostics show `actualActiveCladesMean=47` vs `matchedNullActiveCladesMean=83.75` with dominant loss mode `activeCladeDeficit`.
- The canonical `4000`-step best-stack panel improved versus `2026-03-10` but remains negative in all four cells: `-34.63`, `-111.78`, `-18.24`, `-93.65`.
- Disturbance, localized radius, and refugia mechanics already exist with tests, but no current relabel-null study combines them with the best short stack.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Founder gating / recruitment ecology | 3 | 8e477ff |
| Occupant-aware ecology scoring | 2 | 5003c4f |
| Relabel-null diagnostics / study harness | 2 | 5cbd5f7 |
| Long-horizon validation | 1 | a843a91 |
| Recycling feedback | 1 | 6631bd9 |
| Kin encounter restraint | 1 | 37a91c7 |
| Disturbance / resilience | 0 | — |
| Communication / signaling | 0 | — |

Dominant axis: Founder gating / recruitment ecology (3/10)
Underexplored axes: long-horizon validation, recycling feedback, kin encounter restraint, disturbance / resilience, communication / signaling

## Project State
- The relabel-null smoke harness is now shared and emits aggregate diagnostics with loss-mode classification.
- Recent sessions kept stacking founder filters and occupant-aware scoring on top of the short-stack baseline; every March 12 feature after `offspringSettlementEcologyScoring=true` made the short metric worse.
- The main missing mechanism is coexistence support: current gains come from stronger surviving clades, not from maintaining enough active clades at once.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701): post-founding ecological performance matters more than raw founding counts, which matches the current `activeCladeDeficit` diagnosis.
- Botta & Mitarai, `Patch disturbances accelerate nature-based solutions in vegetation ecosystems`: localized shocks can create persistent patch heterogeneity when recolonization is local, making disturbance a plausible coexistence lever rather than pure damage.

## Research Gaps
- Can localized disturbance create temporary colonization windows that raise actual active clade counts toward the matched null without erasing the short-stack `+29.25` gain?
- Does the current deficit come from dominant clades immediately refilling vacancies, implying that patch turnover is more important than stricter founder filters?

## Current Anti-Evidence
- The best validated `4000`-step stack is still below matched-null persistent activity in every canonical cell, so durable above-null clade persistence is still unproven.
- Even the short-stack winner finishes with far fewer active clades than the matched null, so the system still lacks a reliable coexistence-generating mechanism.

## Candidate Bets
- A: [feat] Add disturbance-conditioned offspring settlement so recently shocked cells act as temporary colonization openings in the best short stack, then run a short relabel-null smoke study with localized disturbance and refugia.
  Why now: it directly targets the diagnosed `activeCladeDeficit` on a different axis than the recent founder-filter streak while reusing existing disturbance machinery.
  Est. low-context human time: 55m
  Main risk: disturbance damage may reduce population faster than the settlement bonus creates extra coexistence.
- B: [investigate] Regenerate the `4000`-step best-stack comparison and one failed March 12 variant with the current diagnostic schema to confirm whether `activeCladeDeficit` is still the dominant long-horizon loss mode.
  Why now: the code path exists but the checked-in long-horizon artifact predates the new diagnostic snapshot, so part of the current evidence is stale.
  Est. low-context human time: 35m
  Main risk: it may only confirm what the short-horizon diagnostics already strongly suggest.
- C: [revert] Remove the clearly negative default-off knobs from the active exploration surface: encounter risk, trophic opportunity, decomposition spillover, trait/ecology cladogenesis gates, and lineage offspring settlement crowding.
  Why now: there are already more than five default `0`/`-1` knobs with only worsening relabel-null evidence, and they are expanding search noise faster than insight.
  Est. low-context human time: 45m
  Main risk: a later multi-knob interaction could make one reverted axis useful again.

## Selected Bet
Choose A. The last investigate session already answered the immediate failure question: the short-stack gain is persistence inside too few surviving clades, not a durable coexistence win. The next bounded move should therefore change spatial recruitment dynamics on an underused axis by letting disturbances create temporary settlement openings, then test whether active clade counts and short relabel-null deltas move in the right direction.

## Why This Fits The Horizon
- It reuses the existing disturbance pipeline, short smoke harness, and best-stack preset; the actor only needs one narrow simulation change plus one focused study path.
- Success is autonomously verifiable with deterministic tests and a smoke artifact that compares disturbance-off against one localized disturbance setting.

## Success Evidence
- A new short smoke artifact shows localized disturbance/refugia improving either `activeCladeDeltaVsNullMean` or `persistentActivityMeanDeltaVsNullMean` relative to the disturbance-off baseline while keeping matched birth schedules.
- Specific verification command or output: `npm test && npx tsx src/clade-activity-relabel-null-disturbance-colonization-smoke-study.ts --generated-at 2026-03-12T00:00:00.000Z`.

## Stop Conditions
- Stop after disturbance history affects offspring settlement only; do not extend the same session to adult movement, harvest, or long-horizon sweeps.
- If a deterministic test cannot show a freshly disturbed cell changes settlement choice, shrink scope to a pure short disturbance smoke study using existing knobs and record the negative result.

## Assumptions / Unknowns
- Assumption: the current `activeCladeDeficit` is partly a spatial vacancy problem, not only a clade-birth-volume problem.
- Unknown: whether useful disturbance must be very local and refugia-heavy to avoid collapsing population and masking any coexistence gain.
