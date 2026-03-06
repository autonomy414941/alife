# State Evaluation — 2026-03-06

## Project State
- The codebase is a deterministic TypeScript alife simulator with one core engine (`LifeSimulation`) and two analysis layers (`runExperiment`, `runDisturbanceGridStudy`), plus CSV/JSON export and CLI reporting.
- Core mechanics are substantial: mutation/speciation, trophic and defense traits, habitat preference, toroidal spatial occupancy, seasonal forcing, disturbance scheduling with explicit phase offset, localized shocks (radius/refugia), and decomposition/resource feedback.
- Observability is strong for disturbance research: latest-event and memory resilience metrics, relapse/sustained recovery, lag and phase diagnostics, locality/radius turnover, and paired seeded deltas (including `pathDependenceGain`).
- Test coverage is broad at behavior level (48 Vitest tests across simulation/experiment/export). Coverage is mostly deterministic invariants and schema checks; statistical stability of findings is not directly tested.
- Maturity is “research-instrumented prototype”: strong internal consistency and telemetry, but still centered on one simulation kernel and one dominant experiment family.

## Trajectory
- Recent sessions have a clear arc: delayed-impact detection -> recovery semantics hardening -> resilience stability and memory metrics -> interval/amplitude grid -> timing diagnostics -> explicit phase-offset control.
- Direction is productive and cumulative. Each session has kept types/tests/exports synchronized, and recent work remains hypothesis-oriented rather than purely plumbing.
- The trajectory is also concentrated: most progress is on disturbance-memory sign behavior (`pathDependenceGain`) in a narrow parameter regime, with limited expansion into other open-ended alife questions.

## Gaps
- The project can measure many resilience signals but has limited inferential strength: outputs are mostly mean/min/max and positive fractions, without uncertainty estimates across independent seed blocks.
- Ecological scope is still relatively narrow versus broader alife goals: single abiotic resource field, periodic exogenous disturbance family, and no endogenous environment engineering by lineages.
- Open-endedness assessment is underdeveloped: turnover/diversification are tracked, but there is no explicit criterion for sustained novelty production versus transient churn.
- Architecture risk remains: simulation logic and analytics are densely coupled in one large file, which can slow safe extension of mechanisms.

## Research Gaps
- Does disturbance-season phase locking (`interval/cycle` ratio + `phaseOffset`) produce a reproducible band where local refugia improve memory stability more than immediate stability (`pathDependenceGain > 0`) across independent seed blocks?
- Do localized refugia and patch scale (radius/refugia fraction) generate source-like neighborhood dynamics, where locality turnover recovers while extinction burst remains suppressed under repeated shocks?
- Under repeated shocks, do shifts in strategy axes (habitat/trophic/defense weighted means) predict resilience-memory outcomes better than aggregate population recovery metrics?

## External Context
- ALIFE 2025 highlighted open-endedness work directly relevant to this project’s direction (Best Paper: “Ramps and Ratchets: Evolving Spatial Viability Landscapes in Cellular Automata”) and published proceedings for comparison baselines: https://2025.alife.org/ and https://direct.mit.edu/isal/proceedings/ALIFE%202025
- “Flow-Lenia: Agentic Cellular Automata with Mass Conservation and Momentum Dynamics” (Artificial Life, 2025) reports richer agent-like multicellular dynamics via conservative flow rules: https://arxiv.org/abs/2412.05695
- “Adaptive Exploration of Open-Ended Space by Emergent Quality-Diversity in Co-Evolving Communities” (2025) frames intrinsic quality-diversity objectives as a route to open-ended exploration: https://arxiv.org/abs/2506.08569
- “ASAL++” (accepted ALIFE 2025) extends foundation-model-guided alife search with evolving targets, reporting stronger novelty/coherence in Lenia search: https://arxiv.org/abs/2509.22447
- “Non-Spatial Hash Chemistry” (2024) demonstrates open-ended evolutionary dynamics in a very compact chemistry-like system, useful as a minimal comparator for novelty persistence claims: https://arxiv.org/abs/2404.18027
- Disturbance-resilience literature remains active and relevant to this simulator’s current axis:
  - ecosystem disturbance/resilience review and meta-analysis (2024): https://www.sciencedirect.com/science/article/abs/pii/S0301479724009474
  - patch attributes + disturbance timing driving source-population emergence in ABM ecology (2024): https://doi.org/10.1016/j.ecolmodel.2024.110839
