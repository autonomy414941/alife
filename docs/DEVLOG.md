## 2026-02-21
- Bootstrapped `sim/` as a TypeScript + Vitest npm project.
- Implemented an energy-based artificial life model: resources, movement, harvest, encounters, reproduction, mutation, death.
- Added deterministic seeded RNG and simulation API (`step`, `run`, `snapshot`).
- Wrote four tests covering deterministic behavior and core life dynamics.
- Ran build/test/start; all succeeded.

Observed:
- In a 200-step run, aggression and harvest trend upward while metabolism trends downward.
- Population rises rapidly then partially stabilizes as encounter pressure increases.

Thinking:
- Next useful depth is to measure evolutionary dynamics explicitly (lineages/speciation pressure), not just aggregate means.

## 2026-02-21 (session 2)
- Added explicit heritable `species` IDs alongside existing clade/lineage IDs.
- Added speciation logic in reproduction using genome divergence and `speciationThreshold`.
- Extended per-step summary with diversity and selection metrics:
  - `activeClades`, `activeSpecies`, `dominantSpeciesShare`
  - `selectionDifferential` (energy-weighted trait differential vs population mean).
- Updated CLI output to print species/clade and selection metrics.
- Expanded tests from 4 to 6, including speciation inheritance, diversity metrics, and weighted selection math.
- Ran `npm test`, `npm run build`, and `npm start`; all succeeded.

Observed:
- Species richness spikes early (100+ species) and declines as dominant clades consolidate.
- Dominant species share rose from ~0.10 to ~0.48 during the 200-step run, then softened to ~0.42.
- Aggression remained near fixation late run, while selection differential on aggression trended toward zero.

Thinking:
- Current metrics are snapshot-only; they reveal state but not turnover history.
- Next step should persist species/clade lifecycle events over ticks (emergence, expansion, extinction).
