# Session Plan — 2026-03-18

## Compact Context
- GenomeV2 Phase 1 complete: extensible trait architecture with 33 passing tests (commits 2a6ee11, cc72116)
- Adapter layer exists: bidirectional conversion between `Genome` and `GenomeV2` with `agentToV2()` / `agentFromV2()`
- Live simulator still hard-coded to three-axis physiology: habitat/trophic/defense derived from metabolism/harvest/aggression
- Factorial confirmed composition-dependent reproduction causes extinction; decision memo recommends Representational Capacity expansion
- Package manager: npm. All tests passing (264 total).

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Documentation/synthesis | 4 | 77017d4, b23ff55, a2ba40e, 459a65c |
| GenomeV2 infrastructure | 3 | cc72116, 2a6ee11, b23ff55 |
| Validation/refresh | 2 | 354952d, 35341c1 |
| Critic/backlog | 1 | a5563cd |

Dominant axis: Documentation/synthesis (40%)
Underexplored axes: GenomeV2 implementation wiring (0 commits — Phase 2 not started), complexity-ratchet metrics (0 commits — Phase 3 not started)

## Project State
- **GenomeV2 exists but is not wired into live runs**: `src/genome-v2.ts` and `src/genome-v2-adapter.ts` provide extensible trait storage with add/remove mutation, but `src/simulation.ts`, `src/settlement-cladogenesis.ts`, and `src/encounter.ts` still compute habitat/trophic/defense from derived scalars (`metabolism * (1 - harvest)`, etc.)
- **Trait Decoder Bottleneck active**: backlog item 45 flags that "any newly added locus is selectively inert baggage until a human wires it into a specific operator"
- **Legacy Metric Surface active**: backlog item 49 flags that "strategy analytics remain restricted to habitat/trophic/defense summaries" — even if loci evolve, the feedback loop cannot see them
- **Zero Phase 2 progress**: decision memo sketched four-phase plan, but only Phase 1 (infrastructure) landed; Phase 2 (first-class ecological traits) has not started despite being the minimum viable expansion to test whether representational capacity unblocks cumulative innovation

## External Context
- [The Complexity Ratchet: Stronger than Selection, Stronger than Evolvability, Weaker than Robustness](https://direct.mit.edu/artl/article/26/1/38/93265/The-Complexity-Ratchet-Stronger-than-Selection) (Artificial Life, 2020): "organisms become complex although such organisms are less fit than simple ones" — requires genomes that can *become* more complex, not just optimize within fixed dimensionality
- [Automating the Search for Artificial Life with Foundation Models](https://arxiv.org/html/2412.17799v2) (arXiv, 2024): ASAL "discovered previously unseen lifeforms" — impossible when genome schema fixes all possible phenotypes at compile time
- [Towards open-ended dynamics in Artificial Life](https://theses.hal.science/tel-05137835v1/file/HAMON_GAUTIER_2025.pdf) (PhD thesis, 2025): "unbounded increase in complexity" structurally impossible when genome dimensionality is compile-time fixed

## Research Gaps
- Does GenomeV2 with first-class ecological traits (habitat/trophic/defense as mutable loci instead of derived scalars) enable agents to specialize on independent ecological axes, or does the current physiology still collapse to three-axis optimization?
- Can substrate-aware metabolic efficiency loci (primary vs secondary) unblock resource partitioning when wired into metabolism/harvest cost functions?

## Current Anti-Evidence
- GenomeV2 infrastructure exists but no live simulation has run with it; the adapter layer was tested but the main simulator still uses fixed `Genome` type
- `settlement-cladogenesis.ts` line ~85: `habitatPreference(genome)` computes `metabolism * (1 - harvest)`, treating habitat as a derived summary not mutable state
- `encounter.ts` lines ~120-140: `trophicLevel()` and `defenseLevel()` compute from `harvest * aggression` and `(1 - harvest) * (1 - aggression)`
- Even if `mutateGenomeV2()` adds `habitat_preference` locus, physiology will ignore it and continue using derived scalar

## Bet Queue

### Bet 1: [expand] Wire GenomeV2 Into Settlement and Cladogenesis
Replace derived habitat-preference computation with direct GenomeV2 trait reads. Update `settlement-cladogenesis.ts` to read `habitat_preference` locus from trait map instead of computing from `metabolism * (1 - harvest)`. Update `shouldFoundClade()` and related gates to use GenomeV2 distance when agent uses GenomeV2. This unblocks habitat from being conflated with metabolic strategy, enabling agents to independently evolve resource-use versus habitat-preference axes.

#### Success Evidence
- `settlement-cladogenesis.ts` reads `genome.getTrait('habitat_preference')` with default fallback
- Tests confirm agents with GenomeV2 can have habitat preference decoupled from metabolism
- Smoke test shows genomes with custom `habitat_preference` locus settle in expected biomes

#### Stop Conditions
- Stop after settlement/cladogenesis physiology reads from trait map
- Stop if test failures require > 2 hours debugging; document and defer
- Do not add new loci to `EXTENDED_TRAITS` yet — that's Bet 2

### Bet 2: [expand] Promote Trophic and Defense to GenomeV2 Loci
Remove derived `trophicLevel()` and `defenseLevel()` functions from `encounter.ts`. Add `trophic_level` and `defense_level` to `EXTENDED_TRAITS` candidate list in `genome-v2.ts`. Update encounter physiology to read from trait map with defaults matching current derived semantics (trophic default 0.5, defense default 0.5). Update species-level caches to compute from per-agent GenomeV2 traits instead of founder-genome derived scalars. This enables agents to evolve interaction strategies independently from harvest/aggression axes.

#### Success Evidence
- `encounter.ts` reads `genome.getTrait('trophic_level')` and `genome.getTrait('defense_level')`
- `EXTENDED_TRAITS` in `genome-v2.ts` includes both trait keys
- Agents with GenomeV2 can have trophic/defense values independent of harvest/aggression
- Species-level maps (`speciesTrophicLevel`, `speciesDefenseLevel`) populated from living agents, not derived scalars

#### Stop Conditions
- Stop after encounter physiology reads from trait map
- Stop if species-level cache refactoring exceeds 1 hour; document simplification path
- Do not run validation experiments yet — that's Bet 4

### Bet 3: [expand] Add Metabolic Efficiency Loci for Substrate Awareness
Add `metabolic_efficiency_primary` and `metabolic_efficiency_secondary` to `EXTENDED_TRAITS`. Update `spendAgentEnergy()` in `agent-energy.ts` to apply per-substrate efficiency multipliers when loci are present: if genome has `metabolic_efficiency_primary`, multiply primary-pool debit by `(2.0 - efficiency)` to allow specialists to reduce substrate-specific costs. Wire into movement, metabolism, and encounter costs. This enables resource partitioning by allowing agents to evolve differential efficiency on primary vs secondary substrates.

#### Success Evidence
- `EXTENDED_TRAITS` includes `metabolic_efficiency_primary` and `metabolic_efficiency_secondary`
- `spendAgentEnergy()` checks for efficiency loci and applies substrate-specific cost modifiers
- Smoke test confirms specialist with high primary-efficiency has lower primary-pool drain than generalist

#### Stop Conditions
- Stop after cost modifier wired into `agent-energy.ts`
- Stop if efficiency semantics unclear; document open question for next session
- Do not optimize multiplier formula beyond basic `(2.0 - efficiency)` linear scaling

### Bet 4: [validate] Run GenomeV2 Canonical Baseline Smoke Test
Create minimal study script that runs 500-step simulation with GenomeV2-converted agents (using `agentToV2()` adapter) and founder-grace configuration. Export loci-count distribution, habitat/trophic/defense trait summaries, and final active-clade count. Compare to fixed-genome baseline to detect emergent differentiation or confirm behavioral equivalence. This is the first falsifiable test of whether GenomeV2 wiring changes ecological dynamics.

#### Success Evidence
- Study script at `src/genome-v2-canonical-smoke.ts` runs without errors
- Artifact at `docs/genome_v2_canonical_smoke_2026-03-18.json` includes loci-count stats
- Comparison note documents whether GenomeV2 run differs from fixed-genome baseline

#### Stop Conditions
- Only execute if Bets 1-3 complete
- Stop after one 500-step smoke run; full canonical 4000-step deferred to Phase 4
- Stop if adapter conversion causes runtime errors; document blocker

## Assumptions / Unknowns
- Assumption: Phase 2 wiring (first-class ecological traits) is the minimum viable expansion to test representational capacity hypothesis; skipping to Phase 3 (metrics) or Phase 4 (validation) without wiring would leave GenomeV2 as unused infrastructure
- Assumption: Defaults (habitat 0.0, trophic 0.5, defense 0.5, efficiency 0.6) match current derived-scalar semantics closely enough to avoid catastrophic behavior changes in baseline runs
- Unknown: Whether metabolic efficiency should be multiplicative `(2.0 - efficiency)` or additive `baselineCost - efficiency`; decision deferred to Bet 3 based on value range
- Unknown: Whether substrate-aware efficiency alone is sufficient for partitioning, or whether composition-dependent reproduction gate (30/30 threshold) needs relaxation when efficiency loci present
- Observation: 70% of last 10 commits were docs/infrastructure; this session shifts to implementation wiring to convert GenomeV2 from infrastructure into falsifiable mechanism
