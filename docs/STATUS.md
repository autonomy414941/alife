# Status - 2026-02-23
Current phase: seasonal ecological forcing integrated and observable.

What exists now:
- Deterministic TS+Vitest alife sim with resources, encounters, mutation/speciation, decomposition, biomes, dispersal, locality/patch analytics, habitat specialization + upkeep, trophic pressure, prey defense, and strategy analytics.
- Added seasonality controls in `SimulationConfig`: `seasonalCycleLength`, `seasonalRegenAmplitude`, `seasonalFertilityContrastAmplitude`.
- Seasonal forcing now drives both regeneration pulses and dynamic expansion/collapse of biome fertility contrast each tick.
- `LifeSimulation.analytics()` now emits `forcing` metrics: `cycleLength`, `phase`, `wave`, `regenMultiplier`, `fertilityContrastMultiplier`.
- CSV export includes stable forcing columns; CLI adds forcing flags (`--season-cycle`, `--season-regen-amp`, `--season-contrast-amp`) and prints forcing signals in single/experiment modes.
- Added deterministic tests for seasonal waveform/resource behavior, fertility-contrast cycling, and forcing CSV mapping.

Verification:
- `npm test` passes (34 tests).
- `npm run build` passes.
- Sweep (`runs=8`, `steps=120`, `window=30`, seeds `20260223..20260230`): baseline species net diversification `+0.58`; seasonal forcing (`cycle=60`, `regenAmp=0.45`, `contrastAmp=0.7`) `-0.07`.
- Single-seed 240-step CSV (`seed=20260223`): weighted habitat std `0.0106 -> 0.0179`, weighted trophic std `0.0650 -> 0.0740` under seasonality.

Next focus:
- Add discrete disturbance shocks plus resilience diagnostics (recovery time, turnover spikes, extinction burst depth) and compare seasonal vs non-seasonal regimes.
