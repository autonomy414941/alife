# Status - 2026-02-28
Current phase: recovery-stability telemetry added to disturbance resilience analytics.

What exists now:
- Deterministic TypeScript+Vitest artificial-life simulator with eco-evolutionary dynamics, seasonality, localized disturbance/refugia, and analytics/export tooling.
- Disturbance resilience now reports:
  - `recoveryTicks`
  - `recoveryProgress`
  - `recoveryRelapses`
  - `sustainedRecoveryTicks`
  - `populationTroughDepth`
  - `populationTroughTicks`
  - `delayedPopulationShockDepth`
  - `turnoverSpike`
  - `extinctionBurstDepth`
- Recovery tracking now behaves as a revocable state machine:
  - recovery is set when population reaches pre-disturbance baseline
  - recovery is cleared if population later falls below baseline
  - each recovered->below-baseline transition increments relapse count
  - sustained recovery ticks accumulate only while recovery remains intact
- CSV export and CLI reporting now include relapse and sustained-recovery fields.

Verification:
- `npm test` passes (40 tests).
- `npm run build` passes.

Next focus:
- Run controlled seeded sweeps to compare disturbance regimes using the new stability metrics (`recoveryRelapses`, `sustainedRecoveryTicks`) and promote one aggregate indicator into experiment summaries.
