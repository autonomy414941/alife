# Status - 2026-02-22
Current phase: neighborhood-aware dispersal dynamics.
What exists now:
- Deterministic TS+Vitest simulation with resources, aggression encounters, mutation/speciation, decomposition, biome fertility, turnover history, and locality analytics.
- Added movement-level dispersal pressure in `src/simulation.ts`:
  - New config knobs: `dispersalPressure`, `dispersalRadius`.
  - Destination scoring now balances resource reward against weighted neighborhood crowding.
  - Per-step occupancy grid is updated as agents move/die so turn-order decisions share live local context.
- Added deterministic test coverage in `test/simulation.test.ts` showing crowding pressure increases short-horizon spatial spread from identical seeds.
Verification:
- `npm test` passes (22 tests).
- `npm run build` passes.
- `npm start -- --steps 40 --report-every 20 --window 15 --seed 20260222` passes.
- `npm start -- --steps 120 --window 30 --experiment-runs 8 --seed 20260222 --seed-step 7` passes.
Paired sweep (`dispersalPressure=0` vs default `0.8`, same seeds):
- Occupied-cell fraction: `0.9334 -> 0.9094` (-0.0241).
- Local dominance mean: `0.6875 -> 0.6317` (-0.0558).
- Dominant-cell turnover mean: `0.7839 -> 0.7099` (-0.0740).
Next focus:
- Add radius-k locality analytics to measure patch structure at neighborhood scale and test how dispersal pressure reshapes meso-scale niches.
