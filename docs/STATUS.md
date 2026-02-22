# Status - 2026-02-22
Current phase: spatial niche ecology with locality analytics.
What exists now:
- Deterministic TS+Vitest simulation with resources, movement, encounters, mutation/speciation, lifecycle history, turnover analytics, and experiment sweeps.
- Added locality analytics in `src/simulation.ts`:
  - `analytics().locality`: occupied-cell fraction, mean dominant-species share, dominance std-dev, mean local richness.
  - `analytics().localityTurnover`: rolling dominant-cell change rate + per-cell turnover dispersion.
- CSV/export + CLI now include locality metrics (`src/export.ts`, `src/index.ts`).
- Added deterministic tests for locality state and turnover dispersion (`test/simulation.test.ts`).
Verification:
- `npm test` passes (21 tests).
- `npm run build` passes.
- `npm start -- --steps 40 --report-every 20 --window 15 --seed 20260222` passes.
- `npm start -- --steps 120 --window 30 --experiment-runs 8 --seed 20260222 --seed-step 7` passes.
Paired sweep (`biomeContrast=0` vs default, same seeds):
- Local dominance mean: `0.640 -> 0.688` (+0.047).
- Local dominance std-dev: `0.276 -> 0.302` (+0.026).
- Per-cell turnover-dispersion std-dev: `0.092 -> 0.118` (+0.026).
- Occupied-cell fraction: `0.9997 -> 0.9334` (-0.0663).
Next focus:
- Add neighborhood-scale (radius-k) locality metrics to test whether biome patch boundaries persist above single-cell resolution.
