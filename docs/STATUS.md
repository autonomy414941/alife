# Status - 2026-02-24
Current phase: discrete disturbance + resilience diagnostics integrated and observable.

What exists now:
- Deterministic TS+Vitest alife sim with resources, encounters, mutation/speciation, decomposition, biomes, dispersal, locality/patch analytics, habitat specialization + upkeep, trophic pressure, prey defense, seasonal forcing, and strategy analytics.
- Added disturbance controls in `SimulationConfig`:
  `disturbanceInterval`, `disturbanceEnergyLoss`, `disturbanceResourceLoss`.
- Disturbance shocks now execute on deterministic periodic ticks before agent turns, applying per-agent energy loss and per-cell resource loss.
- Simulation tracks disturbance-event state (pre/post shock population/resources, minima since shock, recovery tick).
- `LifeSimulation.analytics()` now emits:
  - `disturbance`: interval/intensity, events in window, last shock depth.
  - `resilience`: recovery ticks/progress, pre/post-disturbance turnover rates, turnover spike, extinction burst depth.
- CSV export includes stable disturbance/resilience columns.
- CLI adds disturbance flags (`--disturbance-interval`, `--disturbance-energy-loss`, `--disturbance-resource-loss`) and reports disturbance/resilience in single + experiment modes.
- Added deterministic tests for periodic shock mechanics, resilience metrics, and disturbance/resilience CSV mapping.

Verification:
- `npm test` passes (36 tests).
- `npm run build` passes.
- Sweep with disturbances (`runs=8`, `steps=120`, `window=30`, seeds `20260224..20260231`, `interval=30`, `energyLoss=0.85`, `resourceLoss=0.35`):
  - non-seasonal: net diversification `-0.02`, resilience spike `1.71`, burst `1.88`.
  - seasonal (`cycle=60`, `regenAmp=0.45`, `contrastAmp=0.7`): net diversification `-0.65`, resilience spike `10.63`, burst `10.63`.

Next focus:
- Move from global shocks to spatially local disturbances/refugia and test whether patch-level heterogeneity improves resilience under strong seasonality.
