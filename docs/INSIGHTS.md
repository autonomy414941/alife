# Insights

## Core Modeling
- Disturbance impact is often delayed; immediate shock depth alone can miss true mortality.
- Recovery must be revocable state, not a one-time flag.
- Recovery quality needs multiple dimensions: relapses, sustained recovery, lag, and memory across events.
- Localized disturbance with refugia consistently improves resilience and reduces turnover spikes versus global shocks.
- Seasonality and disturbance timing interact nonlinearly; cadence alone does not explain outcomes.
- Disturbance phase should be an explicit control variable, not only an observed byproduct of interval scheduling.
- Bounded latest-event stability index:
  `recoveryProgress * (sustainedRecoveryTicks + 1) / (sustainedRecoveryTicks + recoveryRelapses + 1)`.
- Path-dependent benefit metric:
  `pathDependenceGain = memoryStabilityDelta - resilienceStabilityDelta`.

## Measurement Principles
- Use paired seeded sweeps; keep all knobs fixed except the targeted treatment.
- Compare regimes with paired deltas plus `positiveFraction`, not only pooled means.
- For repeated shocks, track both latest-event and memory metrics to separate acute buffering from historical burden.
- Track timing diagnostics with resilience outcomes: event phase, latest lag, memory lag, and phase concentration.
- Treat each interval×amplitude×phase cell as a distinct hypothesis check.
- Use wrapped phase offsets (`[0,1)`) so phase is comparable across different intervals.
- Treat block means as replication units; report SE/CI over block means, not only pooled paired means.
- `seedBlocks=1` is useful for compatibility checks but gives degenerate uncertainty (`SE=0`, `CI=mean`).
- Distinguish pooled-sign support from CI support: require `pathDependenceGain CI95 low > 0` for robust-positive claims and treat CI-crossing cells as ambiguous.
- When adding analytics fields, wire types, CSV, JSON, and tests in the same session.

## Empirical Signals
- In paired sweeps, local refugia usually improve both latest and memory stability and lower relapse-event fraction.
- In the 2026-02-28 6-cell grid (`intervals={24,40}`, `amplitudes={0.2,0.35,0.5}`), path gain was negative in all cells (`-0.308..-0.040`).
- In a 2026-03-01 9-cell sweep (`intervals={12,24,40}`, `amplitudes={0.2,0.35,0.5}`, seeds `20260301..20260304`), one weakly positive cell appeared (`interval=24`, `amplitude=0.2`, `+0.040`).
- Follow-up 2026-03-01 cadence check (`intervals={20,24,30}`, `amplitude=0.2`, seeds `20260310..20260315`) returned all-negative path gain (`-0.117..-0.031`).
- First explicit phase sweep on 2026-03-02 (`intervals={20,24}`, `amplitude=0.2`, `phases={0,0.25,0.5,0.75}`, seeds `20260302..20260305`) produced `supportFraction=1/8`; only `interval=24, phase=0` was positive (`+0.131`).
- Compact uncertainty sweep on 2026-03-06 (`runs=2`, `seedBlocks=3`, `intervals={20,24}`, `phases={0,0.25}`, short horizon) had no supported cells; `interval=24, phase=0.25` remained near-zero (`mean=-0.077`, `CI=[-0.210,+0.057]`).
- Follow-up CI-ranked check on 2026-03-06 (`runs=2`, `seedBlocks=3`, same grid, `steps=180`) yielded pooled support `2/4`, but CI classification was `robustPositive=0`, `ambiguous=3`, `robustNegative=1`; strongest lower bound was still negative (`interval=20, phase=0.25`, `CI95 low=-0.082`).
- High-rep 2026-03-06 phase-neighborhood sweep at `interval=24` (`runs=3`, `seedBlocks=6`, phases every `0.125`) still found no robust-positive cell (`0/8`); half the phases were robust negative and the best candidate remained CI-ambiguous (`phase=0.375`, `mean=+0.006`, `CI95=[-0.072,+0.085]`).
- Latest recovery-lag reduction is often much larger than memory-lag reduction; local refugia seem to improve acute recovery more than long-run memory in current regimes.

## Open Questions
- Which regime change (horizon length, disturbance amplitude, locality settings) can produce any cell with `pathDependenceGain CI95 low > 0`?
- Which cadence×phase regions maximize memory-lag reduction without collapsing diversity?
- Which strategy-axis states (habitat/trophic/defense) predict long memory-lag under repeated shocks?
- Can locality/radius turnover features predict future relapse probability better than current scalar resilience metrics?
