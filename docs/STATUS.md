# Status - 2026-02-23
Current phase: radius-k patch structure analytics.
What exists now:
- Deterministic TS+Vitest alife simulation with resources, encounters, mutation/speciation,
  decomposition, biome fertility, dispersal pressure, turnover history, and locality analytics.
- Added configurable neighborhood analytics scale in `src/types.ts` + `src/simulation.ts`:
  - New config knob: `localityRadius` (default `2`).
  - New state metrics (`analytics.localityRadius`): neighborhood dominant-share mean/std,
    neighborhood richness, and center-to-neighborhood dominant alignment.
  - New rolling metrics (`analytics.localityRadiusTurnover`): neighborhood-dominant
    change fraction and per-cell turnover dispersion over the analytics window.
- Locality frame construction now computes both cell-level and neighborhood-level dominant
  species maps, using de-duplicated wrapped neighborhoods for small toroidal grids.
- Export/CLI integration:
  - `metricsToCsv` now includes locality-radius columns.
  - Single-run and experiment CLI reports now print patch metrics.
- Added deterministic tests in `test/simulation.test.ts` for neighborhood state and turnover;
  suite size increased to 23 tests.
Verification:
- `npm test` passes (23 tests).
- `npm run build` passes.
- `npm start -- --steps 20 --report-every 10 --window 10 --seed 20260223` passes.
- `npm start -- --steps 40 --window 15 --experiment-runs 4 --seed 20260223 --seed-step 3` passes.
Next focus:
- Add one ecological behavior mechanic (not just analytics), then use the new patch metrics
  to test whether it increases stable meso-scale niche partitioning.
