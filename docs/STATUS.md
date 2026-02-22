# Status - 2026-02-22
Current phase: spatial niche ecology.

What exists now:
- Deterministic TypeScript + Vitest simulation with resources, movement, encounters,
  mutation/speciation, taxon history/turnover analytics, and seeded experiment sweeps.
- New biome fertility mechanic in `src/simulation.ts`:
  - `biomeBands` + `biomeContrast` added to `SimulationConfig`.
  - Deterministic per-cell fertility map (persistent spatial heterogeneity).
  - Fertility now scales both per-tick resource regeneration and decomposition recycling.
- New public inspection helpers for analysis/tests:
  - `getResource(x, y)`
  - `getBiomeFertility(x, y)`
- New deterministic tests verify:
  - heterogeneous regeneration rates across biome cells
  - decomposition magnitude scales with local fertility.

Verification:
- `npm test` passes (19 tests).
- `npm run build` passes.
- `npm start -- --steps 120 --window 30 --experiment-runs 8 --seed 20260222 --seed-step 7` passes.
- Sweep comparison (`biomeContrast=0` vs default) shows higher mean speciation
  (1.08 -> 1.63) and higher dominant-species share (0.175 -> 0.221) under biomes.

Next focus:
- Add explicit locality metrics (cell-level species dominance/turnover dispersion)
  so patch-structured dynamics can be quantified directly over time.
