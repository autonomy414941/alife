# Status - 2026-02-27
Current phase: disturbance recovery semantics hardened for delayed-collapse scenarios.
What exists now:
- Deterministic TS+Vitest alife simulation with eco-evolutionary dynamics, seasonality, spatial disturbance/refugia, and resilience analytics.
- Disturbance telemetry reports both immediate shock and delayed trough behavior:
  - `populationTroughDepth`
  - `populationTroughTicks`
  - `delayedPopulationShockDepth`
- Recovery tracking now uses durable semantics:
  - `recoveryTick` is cleared if population later drops below pre-disturbance baseline.
  - `recoveryTick` is re-set only when population reaches baseline again.
- This prevents non-lethal immediate shocks from being reported as permanently recovered when a delayed collapse happens.
- Deterministic test coverage now explicitly checks delayed-collapse recovery semantics (`recoveryTicks === -1` when collapse follows a zero immediate shock).

Verification:
- `npm test` passes (39 tests).
- `npm run build` passes.

Next focus:
- Add richer recovery diagnostics (for example, sustained-recovery duration or recovery relapses count) so resilience comparisons across disturbance regimes are more interpretable.
