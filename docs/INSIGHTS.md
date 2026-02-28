# Insights

## Core Modeling
- Disturbance impact is often delayed; immediate shock depth alone can miss true mortality.
- Recovery must be treated as revocable state, not a one-time flag.
- Recovery stability needs two dimensions: relapse count and sustained recovered duration.
- Latest-event resilience can miss path dependence; multi-event memory aggregates are needed under repeated shocks.
- Localized disturbance with refugia can preserve diversity and damp extinction bursts compared with global shocks.
- Seasonality and disturbance interact nonlinearly; coupling can shift net diversification from positive to negative.
- A bounded resilience stability index summarizes latest-event recovery quality:
  `recoveryProgress * (sustainedRecoveryTicks + 1) / (sustainedRecoveryTicks + recoveryRelapses + 1)`.
- Path-dependent benefit can be measured as:
  `pathDependenceGain = memoryStabilityDelta - resilienceStabilityDelta`.

## Mechanistic Tradeoffs
- Habitat preference improves patch coherence but can over-lock dominance without explicit costs.
- Specialization upkeep cost reduces lock-in while preserving richness.
- Trophic pressure without prey counterplay reduces diversity; defense mitigation restores some balance.
- Multiple ecological axes are useful only when each has both benefit and cost channels.

## Measurement Principles
- Use paired seeded sweeps when comparing regimes; keep seeds/config fixed except target knobs.
- Track both weighted and unweighted strategy means to separate species composition from abundance effects.
- Keep deterministic unit tests for every new metric to avoid silent semantic drift.
- Export schema changes should be mirrored immediately in tests to keep downstream analysis stable.
- If a metric is promoted to aggregate status, wire it through types, CLI, and CSV in one change.
- For repeated disturbances, track both latest-event and memory aggregates to separate acute response from historical burden.
- For regime comparisons, compute paired-run deltas and sign consistency (`positiveFraction`), not only aggregate means.
- Treat each interval×amplitude cell as a separate hypothesis check to avoid overclaiming from pooled summaries.

## Empirical Signals
- In a paired 8-run seasonal disturbance sweep (seeds `20260228..20260235`), local refugia (`radius=2`, `refugia=0.35`) improved stability index mean (`0.81`) over global shocks (`0.44`) while lowering turnover spike (`1.48` vs `12.50`).
- Under the same sweep, relapses were lower with local refugia (`0.38`) than global shocks (`1.00`), and memory stability index mean was higher (`0.89` vs `0.54`).
- In a paired 6-cell interval×amplitude grid sweep (seeds `20260228..20260231`, intervals `{24,40}`, amplitudes `{0.2,0.35,0.5}`), local refugia improved latest-event stability (`+0.096..+0.488`) and memory stability (`+0.049..+0.263`) in every cell while reducing relapse-event fraction (`+0.250..+0.500`).
- In that same grid, `pathDependenceGain` was negative in every cell (`-0.308..-0.040`), so immediate-buffer gains exceeded memory gains in this parameter region.

## Open Questions
- Which disturbance cadence and seasonal phase combinations can flip `pathDependenceGain` positive?
- Does positive path-dependent gain require a narrower disturbance intensity band than the current grid sampled?
- Which strategy-axis states (habitat/trophic/defense) best predict sustained recovery duration under repeated shocks?
- Do locality/radius turnover signals predict future relapse probability better than current resilience scalars?
