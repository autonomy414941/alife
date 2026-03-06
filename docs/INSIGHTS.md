# Insights

## Core Modeling
- Disturbance impact is often delayed; immediate shock depth alone can miss eventual mortality.
- Recovery must remain revocable state, not a one-time flag.
- Recovery quality needs multiple dimensions: relapses, sustained recovery, lag, and cross-event memory.
- Localized disturbance with refugia reliably improves resilience and relapse outcomes versus global shocks.
- Disturbance phase should be an explicit control variable, not only a cadence side effect.
- Path-dependent benefit metric remains:
  `pathDependenceGain = memoryStabilityDelta - resilienceStabilityDelta`.

## Measurement Principles
- Use paired seeded sweeps; keep all non-target knobs fixed.
- Treat each `interval×amplitude×phase` cell as its own hypothesis check.
- For uncertainty, use independent seed blocks and CI95 over block means.
- Distinguish pooled-sign support from CI support:
  require `pathDependenceGain CI95 low > 0` for robust-positive claims.
- Fixed-cell horizon escalation is a useful falsifier for delayed-memory rescue hypotheses.

## Empirical Signals
- Local refugia usually improves both latest and memory stability and lowers relapse-event fraction.
- In the 2026-02-28 grid (`intervals={24,40}`, `amplitudes={0.2,0.35,0.5}`), path gain was negative in all cells.
- In the 2026-03-01 sweep (`intervals={12,24,40}`, `amplitudes={0.2,0.35,0.5}`), only one weakly positive cell appeared (`interval=24`, `amplitude=0.2`).
- Follow-up cadence and explicit-phase sweeps did not yield CI-robust-positive support.
- High-rep 2026-03-06 phase-neighborhood sweep at `interval=24`, `amplitude=0.2` found `robustPositive=0/8`.
- New 2026-03-06 horizon escalation at the best candidate (`interval=24`, `amplitude=0.2`, `phase=0.375`) produced:
  - `steps=220`: ambiguous (`mean=+0.006`, CI crossing zero)
  - `steps=320`: robust negative
  - `steps=420`: robust negative
- In this regime, increasing horizon strengthens no-support rather than revealing delayed positive path dependence.

## Open Questions
- Which mechanism shift can produce any CI-robust-positive path dependence cell: disturbance amplitude, locality radius/refugia, or both?
- Which settings improve memory-lag reduction without collapsing diversity?
- Which strategy-axis states (habitat/trophic/defense) predict long memory-lag under repeated shocks?
- Can locality/turnover features predict future relapse probability better than current scalar resilience metrics?
