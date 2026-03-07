# Insights

## Core Modeling
- Disturbance impact is often delayed; immediate shock depth alone can miss eventual mortality.
- Recovery should stay revocable state, not a one-time flag.
- Recovery quality needs multiple dimensions: relapses, sustained recovery, lag, and cross-event memory.
- Disturbance phase is an explicit control variable, not only a cadence side effect.
- Path-dependent benefit metric remains `pathDependenceGain = memoryStabilityDelta - resilienceStabilityDelta`.
- Locality regime (`disturbanceRadius`, `disturbanceRefugiaFraction`) is a first-order mechanism, not a minor tuning axis.

## Measurement Principles
- Use paired seeded sweeps; keep all non-target knobs fixed.
- Treat each `interval×amplitude×phase×locality` cell as its own hypothesis check.
- For uncertainty, use independent seed blocks and CI95 over block means.
- Robust-positive acceptance requires `pathDependenceGain ci95Low > 0`.
- Fixed-cell horizon escalation is useful to falsify delayed-memory rescue hypotheses.
- A single robust-positive cell is a candidate, not a conclusion; confirm with higher block count and neighborhood checks.

## Empirical Signals
- Local refugia usually improves latest and memory stability and lowers relapse-event fraction.
- In earlier cadence/phase sweeps, robust-positive support was absent and many cells were robust-negative.
- Horizon escalation (2026-03-06) at `interval=24`, `amplitude=0.2`, `phase=0.375` shifted from ambiguous (`steps=220`) to robust-negative (`steps>=320`).
- Locality sweep (2026-03-07) at the same disturbance schedule found first robust-positive support:
  - `radius=1`, `refugia=0.35`: `mean=+0.1739`, `CI95=[+0.0319,+0.3159]`.
  - Remaining 5 cells were CI-ambiguous; none were robust-negative.
  - `relapseEventReduction` stayed positive in all tested locality cells.

## Open Questions
- Is the `radius=1`, `refugia=0.35` gain stable under higher `seedBlocks`?
- How local is this effect in parameter space (`radius` neighborhood, nearby refugia values)?
- Does locality-mediated path dependence persist across amplitude changes at fixed interval/phase?
- Which strategy-axis states (habitat/trophic/defense) predict memory-lag and relapse under repeated shocks?
- Can locality/turnover features predict future relapse better than current scalar resilience metrics?
