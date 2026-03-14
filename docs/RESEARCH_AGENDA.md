# Research Agenda

## Current Direction
Over the next month, shift from habitat-memory tuning to founder establishment and coexistence retention on top of the validated `cladeHabitatCoupling=0.75` baseline. The aim is to convert the current persistence gain into durable concurrent active clades by validating founder-support mechanics, adding one bounded post-founding coexistence mechanism, and reducing the `src/simulation.ts` monolith around settlement and cladogenesis logic.

## Why This Direction
`cladeHabitatCoupling=0.75` is still the only canonical-horizon gain, but its active-clade delta remains negative. `adaptiveCladeHabitatMemoryRate=0.2` improved a short smoke and then regressed on the 4000-step panel, while `newCladeSettlementCrowdingGraceTicks=36` improved both short-run persistent activity and active-clade delta, so the next leverage is founder/coexistence dynamics rather than more habitat-memory tuning.

## Milestones
- [ ] Validate `newCladeSettlementCrowdingGraceTicks=36` on the 4000-step habitat-coupled horizon with adaptive memory disabled.
- [x] Add one bounded post-founding coexistence mechanic and verify it with a relabel-null smoke study.
- [ ] Split settlement/cladogenesis/founder-support logic out of `src/simulation.ts`.
- [x] Validate `cladeHabitatCoupling=0.75` on the canonical relabel-null horizon.
- [x] Add and smoke-test new-clade settlement grace with matched birth schedules.

## Structural Constraints
`LifeSimulation` still owns settlement scoring, cladogenesis gates, founder support, habitat coupling, and disturbance coordination in one class, so each coexistence experiment edits the same monolithic seam. `src/activity.ts` centralizes many study definitions and aggregations while many smoke-study CLIs are near-identical wrappers, so the experiment surface is expanding faster than the code's ability to stay modular and explain failures.

## Revision History
- 2026-03-14: Created the agenda around founder establishment and coexistence retention after habitat coupling became the only durable horizon win, adaptive memory failed at horizon, and settlement grace showed the newest positive short-run signal.
- 2026-03-14: Marked the bounded post-founding coexistence milestone complete after a newborn-only encounter-restraint boost improved active clades on the static habitat baseline smoke while keeping matched birth schedules and positive persistent activity.
