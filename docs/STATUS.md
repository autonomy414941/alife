# Status - 2026-02-25
Current phase: spatial disturbance + refugia integrated into resilience experiments.
What exists now:
- Deterministic TS+Vitest alife sim with eco-evolutionary dynamics, seasonality, and disturbance/resilience analytics.
- Disturbance model now supports spatial scope and refugia:
  - `disturbanceRadius` (`-1` = global, `>=0` = Manhattan local footprint).
  - `disturbanceRefugiaFraction` (fraction of targeted footprint spared each event).
- Disturbance shocks now apply energy/resource loss only on affected cells, not automatically map-wide.
- Disturbance event state now tracks footprint geometry:
  - targeted cells, affected cells, total cells.
- `LifeSimulation.analytics()` disturbance block now emits:
  - configured `radius` + `refugiaFraction`
  - `lastEventAffectedCellFraction` + `lastEventRefugiaCellFraction`
  - existing shock depth and event-window fields.
- CSV export includes stable new disturbance columns for spatial/refugia observability.
- CLI adds:
  - `--disturbance-radius`
  - `--disturbance-refugia`
  - disturbance reporting now includes affected/refugia fractions.
- Added deterministic tests for localized disturbance and refugia behavior.

Verification:
- `npm test` passes (38 tests).
- `npm run build` passes.
- Seasonal disturbance sweep (`runs=8`, `steps=120`, `window=30`, seeds `20260225..20260232`, `cycle=60`, `regenAmp=0.45`, `contrastAmp=0.7`, `interval=30`, `energyLoss=0.85`, `resourceLoss=0.35`):
  - global shocks (`radius=-1`, `refugia=0`): net diversification `-0.65`, resilience spike `11.25`, burst `11.25`.
  - local+refugia (`radius=2`, `refugia=0.35`): net diversification `-0.45`, resilience spike `2.58`, burst `1.63`.

Next focus:
- Extend resilience diagnostics with delayed-population shock metrics (post-event trough depth/timing) so energetic shocks that do not cause immediate deaths are captured directly.
