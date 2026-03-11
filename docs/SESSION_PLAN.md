# Session Plan — 2026-03-11

## Compact Context
- `npm` is the package manager; `npm test` and `npm run build` both pass on March 11, 2026.
- `src/simulation.ts` now has both `cladeHabitatCoupling` and `cladeInteractionCoupling`, and `test/simulation.test.ts` already proves each knob can change same-species payoffs across lineages.
- `test/activity.test.ts` only gives `cladeInteractionCoupling` a one-seed `400`-step relabel-null smoke, not a multi-seed study artifact.
- `src/activity.ts`, `src/export.ts`, and `src/clade-activity-relabel-null-clade-habitat-coupling-sweep-study.ts` already provide a near-copyable sweep pipeline.
- `docs/clade_activity_relabel_null_2026-03-10.json` keeps actual clades below the matched pseudo-clade null on the `4000`-step panel at cladogenesis thresholds `1` and `1.2`.
- `docs/clade_activity_relabel_null_clade_habitat_coupling_sweep_2026-03-11.json` stays negative across `cladeHabitatCoupling` values `0` through `1`.

## Project State
- The simulation now includes cladogenesis, species habitat/trophic/defense ecology, lineage-level habitat coupling, and lineage-level interaction coupling.
- Recent sessions moved from clade/null measurement into lineage-mediated ecology, with the latest commit adding interaction coupling plus deterministic and smoke-test coverage.
- The important gap is evidence: there is still no machine-readable multi-seed result showing whether interaction coupling helps, hurts, or merely perturbs actual-vs-null clade persistence.

## External Context
- Moreno, Rodriguez-Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (Artificial Life, 2025): stronger ecology should show up as stronger phylogenetic/clade structure if it is causally meaningful. Source: https://direct.mit.edu/artl/article/31/2/129/130570/Ecology-Spatial-Structure-and-Selection-Pressure
- Bertelsmeier et al., *Multiple interaction types can facilitate eco-evolutionary assembly of larger, more complex communities* (Nature Communications, 2026): inherited interaction structure can materially change community complexity, so the new interaction lever is worth testing before adding another mechanism. Source: https://www.nature.com/articles/s41467-026-56721-z

## Research Gaps
- On the same short multi-seed panel used for the March 11 habitat sweep, does `cladeInteractionCoupling` move `persistentActivityMeanDeltaVsNullMean` upward relative to `0`, or was the current smoke-test separation just short-horizon noise?
- If it helps, is the gain monotonic across coupling strengths or only visible at the endpoints?

## Current Anti-Evidence
- On the canonical `4000`-step relabel-null panel, actual clades still trail the matched pseudo-clade null at both tested cladogenesis thresholds.
- Habitat-only lineage ecology remained negative across the entire March 11 coupling sweep, so one inherited ecological axis has not yet rescued clade persistence.

## Candidate Bets
- A: Add a `cladeInteractionCoupling` relabel-null sweep/export/script matched to the existing habitat-coupling sweep and emit a new JSON artifact.
  Why now: the newest mechanism only has micro-test and one-seed smoke evidence, so the project still does not know whether broader lineage interaction ecology helps on a real panel.
  Est. low-context human time: 45m
  Main risk: the sweep may also be negative, leaving the mechanism direction unresolved.
- B: Add taxon-aware negative density dependence to harvest or movement using the existing crowding code, then cover it with a deterministic payoff test and short activity smoke.
  Why now: current crowding is identity-blind, so dominant species and lineages face no explicit rare-type disadvantage.
  Est. low-context human time: 45m
  Main risk: it may only depress population size without improving clade persistence.
- C: Add a minimal local facilitation mechanic for low-conflict co-located agents and smoke-test it.
  Why now: recent eco-evolutionary results suggest mixed positive and antagonistic interaction types can unlock more complex community assembly.
  Est. low-context human time: >60m
  Main risk: defining a bounded positive interaction without runaway feedback may sprawl.

## Selected Bet
Add the missing multi-seed interaction-coupling study, not another mechanic yet. The actor should clone the existing habitat-coupling sweep path for `cladeInteractionCoupling`, run it on the same short panel, and record a JSON artifact that says whether the newest lineage-ecology lever actually closes any of the actual-vs-null gap. This is the smallest falsifiable follow-up to yesterday's mechanism change and determines whether interaction ecology deserves further investment.

## Why This Fits The Horizon
- The codebase already contains almost all of the needed pieces: config injection helpers, sweep export types, JSON serialization, CLI study wiring, and nearby tests for the habitat sweep.
- Success is autonomously verifiable with one new artifact and deterministic test/build output; even a negative result still resolves an important uncertainty.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_clade_interaction_coupling_sweep_2026-03-11.json` exists and reports aggregate deltas across interaction-coupling values.
- Verification command or output: `npm test && npm run build && npm run study:clade-activity-relabel-null-clade-interaction-coupling-sweep > docs/...json`

## Stop Conditions
- Stop after parity with the habitat sweep surface: one helper, one export type/path, one CLI script, one targeted test, one JSON artifact.
- If the full sweep starts to sprawl, shrink to endpoint comparison with `cladeInteractionCoupling` in `[0, 1]` and record that narrower artifact instead of adding new mechanics.

## Assumptions / Unknowns
- Assumption: the existing `1000`-step habitat-sweep panel is a good enough first comparison point for interaction coupling.
- Unknown: whether interaction coupling improves actual-vs-null persistence, merely changes it, or makes the null gap worse.
