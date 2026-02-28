# State Evaluation — 2026-02-28

## Project State
- `src/simulation.ts` is a deterministic, seeded ALife engine on a toroidal grid with explicit eco-evolutionary dynamics: resource regeneration, biome fertility structure, movement/crowding, mutation/speciation, predation/defense, decomposition, seasonality, and localized disturbance with refugia.
- The project now has a broad analytics surface: turnover (species/clade), strategy-axis distributions, locality and radius-k turnover, and disturbance resilience (`recoveryTicks`, `recoveryRelapses`, `sustainedRecoveryTicks`, trough depth/timing, delayed shock depth, turnover spike, extinction burst).
- Tooling is usable for experiments: CLI runner (`src/index.ts`), multi-run sweeps (`src/experiment.ts`), and stable JSON/CSV export (`src/export.ts`).
- Validation is strong for deterministic behavior and schema stability (40 Vitest tests across simulation/export/experiment), but testing is mostly unit-level and short-horizon.
- Maturity: good reproducibility and observability, medium simulation complexity, and rising maintainability risk from a single large engine file.

## Trajectory
- The last ~20 commits show a coherent sequence: strategy observability -> seasonality -> disturbance shocks -> spatialized disturbance/refugia -> delayed-collapse metrics -> revocable recovery semantics -> relapse/stability telemetry.
- Direction is productive and technically disciplined (small feature slices with tests), but currently instrumentation-first; experiment interpretation is lagging behind metric creation.
- Momentum is mostly positive despite a recent no-output session.

## Gaps
- Experiment aggregates still focus on final population/diversity rates; new resilience/locality dynamics are measurable per run but not summarized as first-class cross-run outcomes.
- Resilience is mostly “latest-event” oriented. Multi-event path dependence (how repeated shocks reshape recovery quality over time) remains weakly represented.
- Ecology is still dominated by one abiotic resource channel and one encounter mode; niche construction and multi-resource feedbacks are limited.
- Open-endedness is not yet operationalized with explicit long-horizon criteria, despite having enough telemetry to start testing it.

## Research Gaps
- Under equal disturbance intensity/frequency, does increasing refugia fraction reduce relapse probability (`recoveryRelapses > 0`) or mainly delay trough timing (`populationTroughTicks`) without improving sustained recovery?
- Is delayed collapse (`delayedPopulationShockDepth`) better predicted by pre-shock macrostate (seasonal phase + weighted strategy composition) than by immediate shock depth, as suggested by recent target-dynamics search work in ALife?
- Over long seeded sweeps, do locality-turnover dispersion and net diversification stay persistently non-zero (open-ended activity) or converge toward attractor-like regimes, in line with recent Flow-Lenia/Lenia open-endedness discussions?

## External Context
- ALIFE 2026 (Waterloo, Aug 17-21, 2026) is currently active with updated deadlines/scope, signaling strong field activity around adaptive and open-ended systems: https://2026.alife.org/
- ASAL is now peer-reviewed in *Artificial Life* (2025, DOI `10.1162/ARTL.a.8`), showing foundation-model-guided search as a concrete ALife discovery workflow: https://pubmed.ncbi.nlm.nih.gov/40911297/
- ASAL++ (accepted to ALIFE 2025 proceedings) extends that line with FM-generated evolving targets (`arXiv:2509.22447`): https://arxiv.org/abs/2509.22447
- Flow-Lenia and related work emphasize quantifying evolutionary activity/open-endedness in continuous cellular systems (`arXiv:2506.08569`, `arXiv:2505.15998`, `arXiv:2506.02990`): https://arxiv.org/abs/2506.08569, https://arxiv.org/abs/2505.15998, https://arxiv.org/abs/2506.02990
- ABM infrastructure is also advancing in scalability and standardization: ABMax for massively parallel ABM (`arXiv:2508.16508`) and Mesa ecosystem evolution (JOSS 2025 + ongoing migration guidance): https://arxiv.org/abs/2508.16508, https://doi.org/10.21105/joss.07668, https://mesa.readthedocs.io/latest/migration_guide.html
