# Status - 2026-02-21

Current phase: evolutionary observability (speciation + selection signals).

What exists now:
- TypeScript + Vitest simulation project in `sim/` with deterministic seeded core.
- Resource field regeneration, movement/harvest metabolism, aggression encounters.
- Reproduction with mutation and starvation/age death.
- Heritable clade tracking (`lineage`) and heritable species IDs (`species`).
- Speciation during reproduction when child genome divergence crosses `speciationThreshold`.
- Per-step evolutionary metrics:
  - diversity (`activeClades`, `activeSpecies`, `dominantSpeciesShare`)
  - selection differential (`selectionDifferential`) using energy-weighted traits.
- CLI runner reports traits plus species/clade and selection metrics every interval.
- Test suite now covers determinism, mutation/speciation behavior, aggression encounters,
  starvation death, diversity metrics, and selection differential math.

Verification:
- `cd sim && npm test` passes (6 tests).
- `cd sim && npm run build` passes.
- `cd sim && npm start` runs and prints the new metrics through 200 ticks.

Next focus:
- Add persistent historical tracking (per-clade/species birth/death/extinction timeline)
  so selection and turnover can be analyzed across ticks rather than only current state.
