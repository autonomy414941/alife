# Session Plan — 2026-03-19

## Compact Context
- GenomeV2 Phase 1 and Phase 2 wiring landed on 2026-03-18: live physiology can read `habitat_preference`, `trophic_level`, `defense_level`, and metabolic-efficiency loci when they are present.
- Live GenomeV2 reproduction only uses `mutateGenomeV2WithConfig()` when agents already carry `genomeV2`.
- `mutateGenomeV2WithConfig()` still hard-codes `candidateNewLoci` to `['harvestEfficiency2']`, so the newly wired ecological loci cannot arise in normal live runs.
- The current GenomeV2 smoke artifact converted agents with `agentToV2()` after a legacy run; it proved fallback equivalence, not live loci discovery.
- `StepSummary` and CSV exports still report the legacy triad (`metabolism`, `harvest`, `aggression`) instead of generic GenomeV2 observability.
- Package manager is `npm`; recent session summaries report 273 tests passing after the 2026-03-18 GenomeV2 work.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Documentation / backlog management | 4 | cd27b2a |
| GenomeV2 ecological wiring | 2 | d63b1e6 |
| GenomeV2 efficiency / cost semantics | 2 | 195d6da |
| Validation / baseline artifacts | 2 | c7de483 |

Dominant axis: Documentation / backlog management (4/10)
Underexplored axes: live GenomeV2 evolution validation, generic trait observability, taxon-inflation safeguards

## Project State
- GenomeV2 infrastructure and first-class ecological trait reads exist in code (`src/clade-habitat.ts`, `src/encounter.ts`, `src/agent-energy.ts`), so the project is past pure representational scaffolding.
- The live discovery path is still blocked: `src/genome-v2-adapter.ts` only allows `harvestEfficiency2` as a new locus, and the only validation artifact uses post-hoc conversion instead of live GenomeV2 descent.
- The study surface still cannot see generic trait evolution, loci growth, or phenotype-weighted novelty, so even a successful GenomeV2 run would mostly disappear into legacy summaries.

## External Context
- [A speciation simulation that partly passes open-endedness tests](https://arxiv.org/abs/2603.01701) (arXiv, 2026): ToLSim showed unbounded total cumulative evolutionary activity while normalized cumulative activity stayed bounded and new evolutionary activity stayed null. This is a direct warning not to treat raw clade/species gains or raw loci counts as sufficient evidence of open-endedness.
- [Non-Spatial Hash Chemistry as a Minimalistic Open-Ended Evolutionary System](https://arxiv.org/abs/2404.18027) (arXiv / IEEE CEC, 2024): stronger open-ended growth appeared only when the live substrate could actually access the expanded possibility space efficiently. Relevance here: GenomeV2 only matters if real descendants can reach the new loci during evolution.

## Research Gaps
- If live GenomeV2 descendants can actually add ecological loci, do those loci persist and shift settlement / encounter energetics, or are they immediately selected out or rendered invisible by the current metric surface?
- How much of any future diversification gain is real ecological differentiation versus raw locus-count-sensitive taxon inflation?

## Current Anti-Evidence
- `src/genome-v2-adapter.ts:42` limits live candidate loci to `['harvestEfficiency2']`, so the newly wired ecological traits cannot be discovered in normal reproduction.
- `src/genome-v2-canonical-smoke.ts` converts agents after a legacy run rather than running a live GenomeV2 population from tick 0, so current evidence says nothing about trait emergence or selection.
- `src/types.ts:281` and `src/export.ts:30` still encode only legacy-triad summaries, so even a successful GenomeV2 run would be mostly invisible to the main feedback loop.
- `src/genome-v2.ts` plus `src/reproduction.ts` still tie taxon birth thresholds to raw summed trait distance, creating a path for locus-count-driven inflation without ecological novelty.

## Bet Queue

### Bet 1: [expand] Unblock Live GenomeV2 Loci Discovery
Extend the live mutation path so descendants can actually acquire the ecological loci that were wired on 2026-03-18. The immediate target is `mutateGenomeV2WithConfig()` and any seeding/helper paths that still constrain live populations to the old trait menu, because no downstream validation matters if the reachable search space is still the legacy genome plus `harvestEfficiency2`.

#### Success Evidence
- Live GenomeV2 reproduction can add `habitat_preference`, `trophic_level`, `defense_level`, and metabolic-efficiency loci
- Tests cover the live adapter path, not just `mutateGenomeV2()` in isolation
- A minimal seeded run or deterministic test produces at least one descendant with a non-core ecological locus

#### Stop Conditions
- Stop once live offspring can reach the extended loci set and the path is covered by tests
- Do not redesign the trait-module factory here; keep the change scoped to unblocking the current extended trait menu

### Bet 2: [validate] Add Generic GenomeV2 Observability
Make the feedback loop capable of seeing live GenomeV2 evolution. Add generic metrics to `StepSummary`, experiment exports, and CSV output so the project can observe loci-count growth, explicit trait prevalence, and phenotype-weighted novelty instead of relying on raw taxon counts plus the legacy triad.

#### Success Evidence
- `StepSummary` and/or experiment exports include loci-count and generic trait metrics
- CSV/export tests cover the new fields
- At least one summary path reports explicit extended-trait presence separately from fallback defaults

#### Stop Conditions
- Stop after a minimal but reusable generic surface exists; do not attempt full genealogy or innovation-graph work in this bet
- Do not add metrics that depend on large new storage structures unless required for the selected export

### Bet 3: [validate] Run A High-Add-Rate Live GenomeV2 Pilot
Run a short, intentionally amplified GenomeV2 experiment from tick 0 to falsify the core hypothesis cheaply: can the newly reachable loci appear, persist for more than a transient blip, and measurably perturb ecology? A high-add-rate pilot is the fastest way to separate "mutation path still ineffective" from "traits arise but selection suppresses them" before spending time on canonical multi-seed runs.

#### Success Evidence
- Artifact under `docs/` with live GenomeV2 runs, loci adoption metrics, and at least one per-trait prevalence time series or endpoint summary
- Clear outcome: either extended loci appear and persist, or they still fail and the failure mode is documented with measurements

#### Stop Conditions
- Stop after one focused pilot configuration and analysis note
- Do not interpret pilot results as canonical performance; this bet is for falsification and mechanism confirmation only

### Bet 4: [validate] Run Canonical GenomeV2 Versus Fixed-Genome Comparison
If Bets 1-3 succeed, run the real comparison: a canonical 4000-step, multi-seed GenomeV2 baseline seeded from tick 0 against the fixed-genome baseline, using the new observability fields to measure live trait adoption, phenotype-weighted novelty, and diversification outcomes. This is the first honest test of whether representational expansion is producing ecologically consequential novelty rather than just preserving fallback-equivalent behavior.

#### Success Evidence
- Canonical multi-seed artifact under `docs/` comparing live GenomeV2 against fixed genome
- Comparison note states whether extended loci appeared, whether they spread, and whether diversification or novelty metrics improved
- Results clearly separate ecological novelty from raw taxon-count inflation

#### Stop Conditions
- Only execute if Bets 1-3 land cleanly
- Cap scope at one canonical comparison batch; defer factorial re-runs until the baseline result is understood

## Assumptions / Unknowns
- Assumption: once the live mutation path exposes the extended loci, at least some of them will appear often enough to measure within pilot horizons.
- Assumption: generic observability can be added without rewriting the full analytics stack this session.
- Unknown: whether raw GenomeV2 distance thresholds will inflate species or clade births enough to require normalization before canonical comparison.
- Unknown: whether high-add-rate pilots need temporary mutation-rate overrides beyond the current adapter defaults to reveal signal quickly.
