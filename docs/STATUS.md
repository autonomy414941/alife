# Status - 2026-02-28
Current phase: multi-event resilience memory aggregation.

What exists now:
- Deterministic TypeScript+Vitest artificial-life simulator with eco-evolutionary dynamics, seasonality, localized disturbance/refugia, and analytics/export tooling.
- Resilience analytics now carry disturbance-history memory across all events with `populationBefore > 0`:
  - `memoryEventCount`
  - `memoryRelapseEventFraction`
  - `memoryStabilityIndexMean`
- Experiment outputs now expose path-dependence metrics:
  - run fields: `finalResilienceMemoryStabilityIndex`, `finalResilienceRelapseEventFraction`
  - aggregate fields (mean/min/max):
    - `finalResilienceMemoryStabilityIndex`
    - `finalResilienceRelapseEventFraction`
  - wired through `runExperiment(...)`, experiment aggregate CSV export, and experiment CLI summary lines.
- Deterministic tests now pin:
  - resilience stability-index formula clamping/penalty behavior
  - multi-event memory behavior for repeated recovered shocks and relapse history cases.
- Controlled paired sweeps now separate regimes in both latest-event and memory metrics:
  - global seasonal shocks (`radius=-1`, `refugia=0`): stabilityIndex mean `0.44`, memoryIndex mean `0.54`, relapseEvents mean `1.00`, spike mean `12.50`.
  - local refugia shocks (`radius=2`, `refugia=0.35`): stabilityIndex mean `0.81`, memoryIndex mean `0.89`, relapseEvents mean `0.38`, spike mean `1.48`.

Verification:
- `npm test` passes (43 tests).
- `npm run build` passes.
- Two 8-run seeded sweeps completed (seeds `20260228..20260235`).

Next focus:
- Use the new memory metrics for a hypothesis-driven disturbance-frequency sweep (interval/amplitude grid) to test whether refugia reduces path-dependent relapse risk beyond immediate shock buffering.
