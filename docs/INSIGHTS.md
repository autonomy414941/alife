# Insights

## Core Modeling
- Disturbance impact is often delayed; immediate shock depth alone can miss true mortality.
- Recovery must be treated as revocable state, not a one-time flag.
- Recovery stability needs two dimensions: relapse count and sustained recovered duration.
- Localized disturbance with refugia can preserve diversity and damp extinction bursts compared with global shocks.
- Seasonality and disturbance interact nonlinearly; coupling can shift net diversification from positive to negative.

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

## Useful Resilience Vector
- `lastEventPopulationShock`
- `populationTroughDepth`
- `populationTroughTicks`
- `delayedPopulationShockDepth`
- `recoveryTicks`
- `recoveryRelapses`
- `sustainedRecoveryTicks`
- `turnoverSpike`
- `extinctionBurstDepth`

## Open Questions
- Do refugia reduce relapse frequency or only delay collapse timing?
- Does seasonal phase at disturbance time predict relapse probability?
- Which strategy-axis states (habitat/trophic/defense) best predict sustained recovery duration?
