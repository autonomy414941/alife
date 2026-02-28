# State Evaluation — 2026-02-28

## Project State
- Core simulator is a deterministic TypeScript engine (`src/simulation.ts`) with seeded RNG, toroidal spatial grid, mutation/speciation, trophic and defense tradeoffs, habitat preference, seasonality, and global/local disturbance with refugia.
- Observability is strong: per-tick analytics cover turnover (species/clades), strategy axes, locality/radius-k dominance dynamics, forcing, disturbance geometry, and resilience (recovery, relapses, sustained recovery, delayed troughs, memory across events).
- Experiment tooling is integrated (`src/experiment.ts`, `src/export.ts`, `src/index.ts`): seeded multi-run sweeps, run/aggregate JSON+CSV export, and resilience summary metrics including memory-based indices.
- Reliability is good at the implementation layer: `npm test` and `npm run build` both pass today (43 tests). Maturity is medium overall because most logic is concentrated in one large engine file and validation is mostly deterministic unit/integration checks, not long-horizon statistical validation.

## Trajectory
- Recent trajectory is coherent and cumulative: seasonality -> disturbances -> spatial disturbance/refugia -> delayed-collapse recovery semantics -> relapse/stability metrics -> multi-event resilience memory.
- Direction is productive, but still instrumentation-heavy: metric surface area is expanding faster than hypothesis-driven analysis depth.

## Gaps
- End-state aggregates dominate evaluation; trajectory-level persistence/open-endedness signals are still thin.
- Current ecology is still relatively minimal (single resource substrate, one agent archetype), so many macroecological patterns remain out of reach.
- Scientific workflow lacks uncertainty treatment (CIs/effect sizes/power across parameter regions), so robustness claims remain narrow.
- Architecture risk: model complexity growth is concentrated in `src/simulation.ts`, which increases coupling and semantic regression risk as mechanics accumulate.

## Research Gaps
- Under matched shock intensity, does increasing disturbance cadence cause divergence between latest-event resilience and memory resilience (`memoryStabilityIndexMean`), indicating path dependence rather than acute response?
- Do localized refugia produce scale-dependent persistence signatures (locality turnover + radius-k alignment) consistent with patch-dynamics expectations, or only reduce immediate extinction bursts?
- Are high turnover spikes in this simulator associated with sustained evolutionary activity (as in Flow-Lenia evolutionary-activity framing), or mostly transient boom-bust dynamics with low long-run novelty?

## External Context
- ALIFE 2026 is scheduled for **August 17-21, 2026** (Waterloo), with deadlines currently active: https://2026.alife.org/
- ALIFE 2025 (Kyoto, Oct 6-10, 2025) published proceedings and companion proceedings links on the program page: https://2025.alife.org/program
- ASAL moved from preprint to peer-reviewed *Artificial Life* article (2025, DOI `10.1162/ARTL.a.8`): https://pubmed.ncbi.nlm.nih.gov/40911297/ and preprint https://arxiv.org/abs/2412.17799
- Follow-on FM-guided ALife search (ASAL++) was submitted Sep 2025 and notes ALIFE 2025 proceedings acceptance: https://arxiv.org/abs/2509.22447
- Flow-Lenia line (mass-conservative CA + evolutionary activity framing) is now in *Artificial Life* 31(2):228-248, with ongoing exploration methods in 2025 preprints: https://arxiv.org/abs/2506.08569, https://arxiv.org/abs/2506.02990, https://arxiv.org/abs/2509.03863, https://arxiv.org/abs/2505.15998
- ABM tooling context is shifting toward scalable/modern infrastructure (ABMax preprint; Mesa 3 JOSS + active migration path): https://arxiv.org/abs/2508.16508, https://joss.theoj.org/papers/10.21105/joss.07668, https://mesa.readthedocs.io/latest/migration_guide.html
