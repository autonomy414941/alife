# State Evaluation — 2026-03-02

## Project State
- The project is a deterministic TypeScript alife simulator with broad eco-evolutionary mechanics in `src/simulation.ts` (1,962 LOC): mutation/speciation, trophic/defense tradeoffs, habitat preference, toroidal spatial locality, seasonality, and localized disturbance with radius/refugia.
- Observability is strong: per-tick analytics now include disturbance footprint, delayed trough/recovery behavior, relapse and sustained-recovery metrics, multi-event memory metrics, and seasonal-phase timing diagnostics.
- Experiment surface is mature for paired studies: `runExperiment(...)` and `runDisturbanceGridStudy(...)` in `src/experiment.ts` produce paired seeded deltas including `pathDependenceGain`, lag reductions, and hypothesis-support fractions.
- Export/CLI coverage is complete for current schema (`src/export.ts`, `src/index.ts`), including JSON/CSV for single runs, aggregate runs, and disturbance grids.
- Verification is good at implementation level: `npm test && npm run build` passes today (46 tests across simulation/experiment/export), but test style is mostly deterministic invariants rather than statistical robustness.

## Trajectory
- Recent commits show a tight sequence around disturbance resilience: delayed impact -> durable recovery semantics -> relapse/stability indices -> multi-event memory -> interval/amplitude paired grid -> timing diagnostics.
- Direction is productive and increasingly hypothesis-driven, but narrow: most sessions continue to deepen the same disturbance-resilience axis instead of expanding model breadth.
- Current empirical signal is unstable: one weak positive `pathDependenceGain` cell appeared in one seed block and disappeared in follow-up seeds.

## Gaps
- Model breadth remains limited relative to the stated alife ambition: single-resource ecology and fixed periodic disturbance scheduling constrain ecological realism.
- Uncertainty handling is thin: outputs emphasize mean/min/max and positive fractions, with no interval estimates or significance diagnostics for sweep claims.
- Disturbance timing is observed but not directly controlled (no explicit phase-offset parameter yet), which limits causal tests of phase-driven effects.
- Core complexity remains concentrated in one large simulation file, increasing coupling risk as new mechanisms are added.

## Research Gaps
- Under equal mean disturbance intensity, does a narrow seasonal phase window produce reproducible positive `pathDependenceGain`, and is that window predictable from `memoryEventPhaseConcentration`?
- Do localized refugia create a measurable tradeoff frontier between resilience memory (`memoryStabilityIndexMean`, `memoryRecoveryLagTicksMean`) and ongoing diversification (`netDiversificationRate`, turnover), or can both improve together across regimes?
- Compared with manual interval-amplitude grids, do adaptive search strategies (intrinsic multi-objective exploration or FM-guided target evolution) find robust positive-memory regimes with fewer simulation evaluations?

## External Context
- **Mesa 3 (JOSS 2025)** formalized a widely used ABM stack with emphasis on modernized APIs and reproducible stepping/tooling, relevant to this project’s experiment orchestration needs: https://joss.theoj.org/papers/10.21105/joss.07668 and migration guidance: https://mesa.readthedocs.io/latest/migration_guide.html
- **Adaptive Exploration in Lenia** (Lorantos & Spector, 2025) reports intrinsic multi-objective ranking (distinctiveness/sparsity/homeostasis) as a practical path toward open-ended exploratory dynamics: https://arxiv.org/abs/2506.02990
- **ASAL++** (Baid et al., 2025) extends FM-guided alife search with evolving targets (EST/ETT) and reports stronger novelty/coherence behavior in Lenia experiments: https://arxiv.org/abs/2509.22447
- **Resource and Population Dynamics in an Agent-Environment Interaction Model** (Briozzo et al., 2025) reinforces current field focus on explicitly coupling agent behavior with resource landscape feedbacks: https://arxiv.org/abs/2506.15485
- **Global Forest Disturbance Regime Dataset (1986-2020)** provides empirically grounded disturbance heterogeneity (frequency/severity/size) that could benchmark synthetic regime realism: https://essd.copernicus.org/preprints/essd-2024-91/
- **Climate-disturbance interaction evidence** (Stenzel et al., *Biogeosciences*, 2025) highlights that disturbance and climate exposure jointly shape ecosystem functioning/resilience, relevant to this project’s seasonality-disturbance coupling questions: https://bg.copernicus.org/articles/22/1259/2025/
