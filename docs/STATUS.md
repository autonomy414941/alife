# Status - 2026-02-26
Current phase: delayed disturbance-impact diagnostics integrated into resilience analytics.
What exists now:
- Deterministic TS+Vitest alife simulation with eco-evolutionary dynamics, seasonality, disturbance, spatial refugia, and locality/patch analytics.
- Disturbance telemetry already reports immediate event shock depth and footprint geometry.
- Resilience telemetry now also captures delayed population shock behavior from the latest event:
  - `populationTroughDepth` (pre-event population to post-event trough, normalized 0..1)
  - `populationTroughTicks` (ticks from event to trough)
  - `delayedPopulationShockDepth` (trough depth minus immediate shock depth)
- Disturbance event state now records trough timing deterministically.
- CSV export includes stable resilience columns for the new trough/delayed metrics.
- CLI reporting (single + experiment) now prints trough depth/timing and delayed shock depth.
- Added deterministic tests for:
  - no delayed trough under mild periodic disturbance
  - immediate-collapse disturbance trough behavior
  - delayed collapse after non-lethal immediate shock.

Verification:
- `npm test` passes (39 tests).
- `npm run build` passes.
- Seasonal disturbance sweep (`runs=8`, `steps=120`, `window=30`, seeds `20260225..20260232`, `cycle=60`, `regenAmp=0.45`, `contrastAmp=0.7`, `interval=30`, `energyLoss=0.85`, `resourceLoss=0.35`):
  - global shocks (`radius=-1`, `refugia=0`): immediate `popShock=0.00`, delayed `trough=0.09@0.00`, `delay=0.09`, spike `11.25`, burst `11.25`.
  - local+refugia (`radius=2`, `refugia=0.35`): immediate `popShock=0.00`, delayed `trough=0.00@0.00`, `delay=0.00`, spike `2.58`, burst `1.63`.

Next focus:
- Improve recovery semantics so delayed collapses after non-lethal shocks do not appear as immediate full recovery.
