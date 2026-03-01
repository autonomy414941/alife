# Status - 2026-03-01
Current phase: disturbance timing diagnostics and cadence/phase hypothesis checking.

What exists now:
- Deterministic TypeScript+Vitest simulator with eco-evolutionary dynamics, seasonality, localized disturbance/refugia, and export tooling.
- New resilience timing metrics (`latestEventSeasonalPhase`, `latestEventRecoveryLagTicks`, `memoryRecoveredEventFraction`, `memoryRecoveryLagTicksMean`, `memoryEventPhaseMean`, `memoryEventPhaseConcentration`).
- Grid study now reports timing-aware paired deltas (`latestRecoveryLagReduction`, `memoryRecoveryLagReduction`) plus per-cell timing diagnostics.
- JSON/CSV exports and deterministic tests were extended for all new fields.

Latest sweeps:
- Sweep A: seeds `20260301..20260304`, `runs=4`, `steps=260`, intervals `{12,24,40}`, amplitudes `{0.2,0.35,0.5}`.
- Sweep A result: `supportFraction=1/9`; one positive cell (`interval=24`, `amplitude=0.2`, `pathDependenceGain=+0.040`), others negative (`-0.319..+0.040`).
- Sweep B: seeds `20260310..20260315`, `runs=6`, `steps=260`, intervals `{20,24,30}`, amplitude `{0.2}`.
- Sweep B result: `supportFraction=0/3`; all cells negative (`pathDependenceGain=-0.117..-0.031`).

Interpretation:
- Local refugia still reduce recovery lag strongly.
- Memory-lag reduction is usually smaller than latest-lag reduction, so acute buffering still dominates path-gain behavior.
- Positive path-gain is currently weak and not robust across seed blocks.

Verification:
- `npm test` passes (46 tests).
- `npm run build` passes.

Next focus:
- Add explicit disturbance phase-offset control and run paired interval×phase sweeps to test reproducible positive `pathDependenceGain` regimes.
