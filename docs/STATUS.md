# Status - 2026-02-23
Current phase: habitat-specialization mechanic integrated and validated.

What exists now:
- Deterministic TS+Vitest alife simulation with resources, encounters, mutation/speciation,
  decomposition, biome fertility, dispersal pressure, and locality/patch analytics.
- Added a new ecological mechanic in `src/simulation.ts`:
  - Species-level habitat preference (biome fertility target).
  - Habitat suitability now affects movement scoring and harvest efficiency.
  - Preference drifts on speciation using child-vs-parent genome mutation signal.
- Added config knobs in `src/types.ts` + defaults:
  - `habitatPreferenceStrength` (selection intensity; `0` disables).
  - `habitatPreferenceMutation` (preference drift amplitude on speciation).
- Added deterministic tests in `test/simulation.test.ts`:
  - Mismatched habitat foraging penalty check.
  - Radius-k patch stability comparison (`strength=0` vs `strength=4`).

Verification:
- `npm test` passes (25 tests).
- `npm run build` passes.
- `npm start -- --steps 30 --report-every 10 --window 15 --seed 20260223` passes.
- Seeded sweep (`npx tsx -e ...`, runs=8, steps=90):
  - patch turnover mean: `0.2866 -> 0.1652` (neutral -> specialist)
  - patch dominance mean: `0.7314 -> 0.9253`
  - patch center-alignment mean: `0.7552 -> 0.9688`

Next focus:
- Add an adaptive demographic tradeoff (e.g. specialization benefit vs reproduction/lifespan cost)
  and test whether it preserves diversity under long-horizon runs.
