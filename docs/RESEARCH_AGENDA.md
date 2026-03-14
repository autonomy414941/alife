# Research Agenda

## Current Direction
Over the next month, finish tightening founder-establishment evaluation at the birth-context level, then use that cleaner surface to unblock the next mechanism cycle. Prioritize one more matched-null founder-context control beyond habitat bins, and split the relabel-null / history machinery out of `src/activity.ts` and `src/simulation.ts` so future sessions can change establishment logic without reopening the same monoliths.

## Why This Direction
The March 14 habitat-matched validation is now in code and tests, and founder grace still improves the static-habitat baseline under that stricter null, so the project is no longer blocked on "does habitat-bin matching exist?" The remaining blocker is that the best 4000-step variants still trail the matched null on active clades (`-23.75` for founder grace, `-17` for the ecology gate), while `TaxonFounderContext` still omits local crowding and disturbance state at birth; at the same time, the encounter-restraint axis has already been archived and representative CLI-output coverage now exists, so the highest leverage has shifted from more wrapper cleanup to richer birth-context controls plus structural decomposition.

## Structural Constraints
`src/activity.ts` (2226 lines) still mixes relabel-null study definitions, matched-null construction, seed-result assembly, and comparison logic, while `src/simulation.ts` (2436 lines) still combines the runtime loop with taxon-history capture and founder-context export. `TaxonFounderContext` only stores `habitatMean`, `habitatBin`, and `founderCount`, so the relabel-null baseline still cannot preserve local crowding, abundance class, or disturbance phase at birth. The simulator also still accumulates full `TaxonHistory.timeline` histories and `localityFrames`, so both horizon cost and refactor scope grow with run length.

## Revision History
- 2026-03-14: Set the month on founder-establishment evaluation after habitat coupling and founder grace became the only durable horizon wins.
- 2026-03-14: Shifted from more scalar founder-protection sweeps toward stricter matched-null controls and dead-axis pruning after ecology gating improved active clades but sharply regressed persistent activity.
- 2026-03-14: Added study-surface cleanup and structural decomposition after duplicated wrappers and brittle artifact emission started slowing iteration.
- 2026-03-14: Revised again toward richer founder birth-context controls plus monolith splits because habitat-bin matching and encounter-restraint archiving are now done, but the system still trails the matched null and the core analysis/runtime files remain oversized.
