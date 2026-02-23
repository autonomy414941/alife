# Status - 2026-02-23
Current phase: specialization tradeoff integrated and validated.

What exists now:
- Deterministic TS+Vitest alife simulation with resources, encounters, mutation/speciation,
  decomposition, biome fertility, dispersal pressure, locality/patch analytics, and habitat preference.
- Added an adaptive demographic downside in `src/simulation.ts`:
  - Species farther from neutral fertility preference (`1.0`) now pay extra metabolic upkeep.
  - Upkeep scales with metabolism trait and species-level specialization load.
- Added config in `src/types.ts` + defaults:
  - `specializationMetabolicCost` (default `0.08`; `0` disables tradeoff).
- Added deterministic tests in `test/simulation.test.ts`:
  - Direct energy-budget check for specialization upkeep penalty.
  - Multi-seed comparison showing upkeep reduces patch lock-in under strong habitat preference.

Verification:
- `npm test` passes (27 tests).
- `npm run build` passes.
- Seeded sweep (`npx tsx -e ...`, runs=8, steps=120, seeds `20260223..20260230`):
  - active species mean: `190.50 -> 190.63` (no cost -> tradeoff `0.08`)
  - patch dominance mean: `0.2408 -> 0.2340`
  - patch turnover mean: `0.2376 -> 0.2502`
  - patch center-alignment mean: `0.3721 -> 0.3322`

Next focus:
- Add a second ecological axis (e.g. trophic differentiation/predation pressure) so
  diversity is maintained by more than habitat-only niche structure.
