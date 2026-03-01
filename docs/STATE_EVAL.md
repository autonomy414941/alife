# State Evaluation — 2026-03-01

## Project State
- The core is a deterministic TypeScript simulator (`src/simulation.ts`) with seeded RNG, toroidal spatial dynamics, mutation/speciation, biome heterogeneity, seasonality, predation/defense tradeoffs, and localized disturbance with configurable radius/refugia.
- Observability is broad: per-tick analytics include species/clade turnover, strategy axes, forcing phase, disturbance footprint, locality and radius-k turnover, and resilience signals (delayed troughs, relapse count, sustained recovery, memory-event aggregates).
- Experiment tooling is now first-class: `runExperiment(...)` plus `runDisturbanceGridStudy(...)` (`src/experiment.ts`) with paired-seed deltas and `pathDependenceGain`/`hypothesisSupport`; JSON/CSV export is wired in `src/export.ts`.
- Interface maturity is practical: CLI supports single runs and seeded sweeps with export paths (`src/index.ts`).
- Verification is solid for deterministic behavior but narrow scientifically: `npm test` passes at 46 tests and `npm run build` passes today; tests are concentrated in deterministic unit/integration checks across 3 files, with little uncertainty or long-horizon statistical validation.

## Trajectory
- Recent sessions are coherent and cumulative: disturbance mechanics -> delayed impact tracking -> recovery semantics -> relapse/memory metrics -> paired grid-study API.
- Direction is productive and recently became hypothesis-driven (explicit paired global-vs-local tests), not just instrumentation.
- The trajectory is still tightly centered on disturbance resilience; exploration breadth (other ecological mechanisms and hypotheses) remains limited.

## Gaps
- Ecological expressivity is still constrained (single abiotic resource field and simplified interaction channels), which limits macroecological pattern realism.
- Current evaluation focuses on endpoint aggregates; open-ended dynamics/novelty metrics are still thin compared with recent ALife practice.
- Statistical confidence is underdeveloped: paired deltas are present, but uncertainty estimates and robustness across larger parameter volumes are minimal.
- Complexity concentration in `src/simulation.ts` continues to raise coupling/regression risk as mechanics accumulate.

## Research Gaps
- Does disturbance timing relative to seasonal phase (already observable via `forcing.phase`) determine when `pathDependenceGain` flips from negative to positive under fixed amplitude and locality settings?
- Across biome heterogeneity and disturbance locality, can this simulator sustain both high memory resilience and ongoing evolutionary turnover (speciation/extinction activity), or are those outcomes mutually constraining?
- When searching for resilient regimes, do manual interval×amplitude grids miss qualitatively different regions that automated exploration methods (curiosity/FMs) tend to reveal in related ALife systems?

## External Context
- **ALIFE 2026** is active now (Waterloo, Aug 17-21, 2026), with full-paper submission listed for **March 30, 2026**: https://2026.alife.org/
- **ASAL** is now peer-reviewed in *Artificial Life* (2025 Sep 4;31(3):368-396, DOI `10.1162/ARTL.a.8`), moving FM-guided ALife search from preprint to journal status: https://pubmed.ncbi.nlm.nih.gov/40911297/
- **ASAL++** extends that line with evolving FM-generated targets and reports ALife 2025 proceedings acceptance: https://arxiv.org/abs/2509.22447
- **Flow-Lenia** is now in *Artificial Life* 31(2):228-248 (DOI `10.1162/artl_a_00471`) and explicitly uses evolutionary-activity framing for open-ended dynamics: https://arxiv.org/abs/2506.08569
- A follow-on **curiosity-driven AI scientist** workflow for Flow-Lenia (revised Jan 29, 2026; ALife 2025 proceedings DOI `10.1162/ISAL.a.896`) emphasizes automated discovery using evolutionary activity, compression, and entropy metrics: https://arxiv.org/abs/2505.15998
- ABM tooling is shifting toward scalable/differentiable workflows: Mesa 3 in JOSS (2025) plus active migration guidance, ABMax (JAX ABM), and AD-enabled ABM calibration papers: https://joss.theoj.org/papers/10.21105/joss.07668 , https://mesa.readthedocs.io/latest/migration_guide.html , https://arxiv.org/abs/2508.16508 , https://arxiv.org/abs/2509.03303
