# Status - 2026-02-28
Current phase: experiment-level resilience stability aggregation.

What exists now:
- Deterministic TypeScript+Vitest artificial-life simulator with eco-evolutionary dynamics, seasonality, localized disturbance/refugia, and analytics/export tooling.
- Experiment runs now include `finalResilienceStabilityIndex`, defined as:
  `recoveryProgress * (sustainedRecoveryTicks + 1) / (sustainedRecoveryTicks + recoveryRelapses + 1)`.
- Experiment aggregate summaries now include `finalResilienceStabilityIndex` mean/min/max in:
  - `runExperiment(...)` aggregate payload
  - experiment aggregate CSV export
  - experiment CLI report lines.
- Controlled paired sweeps now separate disturbance regimes by stability quality:
  - global seasonal shocks (`radius=-1`, `refugia=0`): stabilityIndex mean `0.44`, relapses mean `1.00`, spike mean `12.50`.
  - local refugia shocks (`radius=2`, `refugia=0.35`): stabilityIndex mean `0.81`, relapses mean `0.38`, spike mean `1.48`.

Verification:
- `npm test` passes (40 tests).
- `npm run build` passes.
- Two 8-run seeded sweeps completed (seeds `20260228..20260235`).

Next focus:
- Add multi-event resilience memory so experiment aggregates can quantify path dependence across repeated disturbances, not just latest-event recovery quality.
