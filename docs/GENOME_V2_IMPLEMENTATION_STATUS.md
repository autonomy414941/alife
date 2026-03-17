# GenomeV2 Implementation Status

**Last updated**: 2026-03-18
**Status**: Phase 1 complete, Phase 2-4 pending

## Overview

Implementing extensible genome architecture to unblock cumulative innovation and complexity ratchet, as recommended in `docs/structural_expansion_decision_memo_2026-03-18.md`.

## Completed: Phase 1 - Extensible Genome Infrastructure

### Files Added
- `src/genome-v2.ts` - Core GenomeV2 type and operations
- `src/genome-v2-adapter.ts` - Adapter layer for simulation integration
- `test/genome-v2.test.ts` - 21 tests covering GenomeV2 core
- `test/genome-v2-adapter.test.ts` - 12 tests covering adapter layer

### Capabilities Delivered
✓ **GenomeV2 type**: `traits: Map<string, number>` replaces fixed schema
✓ **Trait access**: `getTrait()` with default fallbacks (0.6 for metabolism/harvest, 0.4 for aggression)
✓ **Trait mutation**: Standard gaussian mutation clamped to [0,1]
✓ **Add loci mutation**: `addLociProbability` (default 2%) adds new traits from candidate list
✓ **Remove loci mutation**: `removeLociProbability` (default 1%) removes optional traits
✓ **Core trait protection**: metabolism, harvest, aggression never removed
✓ **Trait count constraints**: `minTraits` (default 3), `maxTraits` (default 20)
✓ **Distance metric**: `genomeV2Distance()` sums absolute differences across all traits
✓ **Bidirectional conversion**: `fromGenome()`, `toGenome()` for gradual migration
✓ **Agent adapters**: `agentToV2()`, `agentFromV2()` preserve all agent fields
✓ **Config-based mutation**: `mutateGenomeV2WithConfig()` uses SimulationConfig
✓ **Threshold checks**: `shouldSpeciateV2()`, `shouldFoundCladeV2()`

### Test Coverage
- **Total tests**: 264 (33 GenomeV2-specific, 231 existing)
- **All passing**: ✓
- **Coverage areas**:
  - Creation and conversion (6 tests)
  - Trait access (5 tests)
  - Cloning (1 test)
  - Mutation (8 tests)
  - Distance calculation (3 tests)
  - Agent conversion (3 tests)
  - Config-based mutation (1 test)
  - Speciation/cladogenesis (3 tests)
  - Trait accessors (5 tests)

### Design Decisions

**Trait defaults**: Missing traits return sensible defaults rather than erroring, enabling genomes with different loci counts to interact safely.

**Core vs optional traits**: metabolism, harvest, aggression are core (never removed); harvestEfficiency2 is optional. Future traits will be optional by default.

**Mutation probabilities**: Low default rates (2% add, 1% remove) prevent runaway genome growth while enabling gradual complexity increase.

**Backward compatibility**: Adapter layer enables existing code to continue using `Genome` type while new experiments can use `GenomeV2`.

## Pending: Phase 2 - First-Class Ecological Traits

### Goal
Promote habitat, trophic, defense from derived scalars to mutable GenomeV2 loci.

### Tasks
1. **Remove derived computation**: Delete `habitatPreference()`, `trophicLevel()`, `defenseLevel()` functions that compute from metabolism/harvest/aggression
2. **Add trait loci**: Extend `EXTENDED_TRAITS` in `genome-v2.ts` with:
   - `habitat_preference` (replaces derived scalar)
   - `trophic_level` (replaces derived scalar)
   - `defense_level` (replaces derived scalar)
   - `sensor_range` (new capability)
   - `metabolic_efficiency_primary` (new capability)
   - `metabolic_efficiency_secondary` (new capability)
3. **Update physiology**:
   - `settlement-cladogenesis.ts`: read habitat preference from trait map
   - `encounter.ts`: read trophic/defense from trait map
   - `resource-harvest.ts`: read metabolic efficiency from trait map if present
   - `simulation.ts`: remove species-level cached maps (habitat/trophic/defense) and compute per-agent from GenomeV2
4. **Seed initial genomes**: When creating agents, initialize new traits with sensible values (habitat near 0, trophic/defense 0.5)
5. **Update cladogenesis gates**: Use GenomeV2 trait distances instead of derived scalars in `passesCladogenesisTraitNoveltyGate()`
6. **Tests**: Verify behavioral equivalence between Genome-derived and GenomeV2-mutable versions

### Estimated Effort
2-3 sessions. Touches 8-10 files, requires careful refactoring of speciesHabitatPreference/Trophic/Defense maps.

### Risk
MEDIUM. Removing derived computation changes ecological dynamics. Need validation baseline before/after.

## Pending: Phase 3 - Complexity Ratchet Metrics

### Goal
Track genome size and phenotype diversity to measure complexity increase over time.

### Tasks
1. **Loci count export**: Add `genomeLociCount: NumericAggregate` to step summaries
2. **Per-taxon loci distribution**: Track mean/stddev loci count per clade/species
3. **Phenotype distance metric**: Measure trait-space diversity (not just scalar energy)
4. **Trajectory exports**: Include loci count in `CladeActivityRelabelNullSeedResult`
5. **Visualization helpers**: Add `genomeLociCountOverTime` chart data

### Estimated Effort
1 session. Additive changes to export types and summary computation.

### Risk
LOW. Pure observability, no behavioral changes.

## Pending: Phase 4 - Validation & Documentation

### Goal
Confirm extensible genome enables positive vs-null deltas and produces expected complexity ratchet signal.

### Tasks
1. **Canonical baseline refresh**: Run founder-grace baseline with GenomeV2, compare to fixed-genome baseline
2. **Factorial re-run**: Execute encounter-topology × composition-cost factorial with GenomeV2
3. **Complexity ratchet validation**: Confirm loci count increases over time without fitness advantage
4. **Null comparison**: Test whether GenomeV2 shows positive active-clade deltas vs null (falsification point)
5. **Documentation**: Write `GENOME_V2_VALIDATION.md` with before/after comparison
6. **Commit research agenda update**: Revise `RESEARCH_AGENDA.md` based on validation results

### Estimated Effort
2 sessions. One for experiments, one for analysis and documentation.

### Risk
HIGH. If GenomeV2 shows same nullity as fixed genome, then representational capacity alone is insufficient → need combination with behavioral/environmental expansion.

## Migration Strategy

### Gradual Transition (Recommended)
1. **Phase 1 (done)**: GenomeV2 core infrastructure exists alongside Genome
2. **Phase 2**: New experiments can opt-in to GenomeV2 via adapter
3. **Phase 3**: Existing experiments continue using Genome until validation complete
4. **Phase 4**: If validation succeeds, migrate remaining experiments to GenomeV2
5. **Phase 5**: Deprecate Genome type, remove adapter layer

### Coexistence Period
During Phases 2-3, both `Genome` and `GenomeV2` will coexist:
- `simulation.ts` uses Genome (unchanged)
- New experimental scripts can use `agentToV2()` to convert agents
- Distance/mutation/speciation work with either format via adapter

### Full Migration Trigger
Only migrate if Phase 4 validation shows:
- GenomeV2 enables positive vs-null deltas, OR
- Complexity ratchet signal is present (loci count increases), OR
- Phenotype diversity increases without fitness advantage

If validation fails, GenomeV2 remains experimental and decision memo analysis continues to next expansion candidate.

## Open Questions

1. **Trait semantics**: Should new traits (sensor_range, metabolic_efficiency_*) be multiplicative modifiers or additive? Decision deferred to Phase 2.
2. **Initialization**: When adding new loci via mutation, should initial value be default (0.5) or near-parent (parent ± small noise)? Current: default.
3. **Interaction effects**: Do trait-specific metabolic efficiencies require substrate-aware cost functions, or can they work with existing total-energy physiology? Decision deferred to Phase 2.
4. **Recombination**: Should Phase 2 include sexual reproduction (multi-parent crossover), or defer to inheritance architecture expansion? Decision: defer to separate expansion.

## Next Session Priorities

**If continuing representational capacity expansion**:
1. Start Phase 2: Add habitat_preference, trophic_level, defense_level as mutable loci
2. Remove derived computation from `settlement-cladogenesis.ts` and `encounter.ts`
3. Update species-level maps to per-agent GenomeV2 trait access
4. Run smoke test confirming behavioral equivalence

**If pivoting to validation**:
1. Skip Phase 2, jump to Phase 3: add complexity metrics
2. Run canonical baseline with GenomeV2 (using adapter layer)
3. Compare to fixed-genome baseline (check for emergent differentiation)
4. Document findings in validation memo

**If blocked or uncertain**:
1. Review factorial artifact (`docs/clade_activity_relabel_null_encounter_topology_composition_cost_factorial_horizon_2026-03-18.json`)
2. Re-read decision memo to confirm next highest-leverage action
3. Consider whether GenomeV2 should combine with behavioral or environmental expansion before continuing

## References

- Decision memo: `docs/structural_expansion_decision_memo_2026-03-18.md`
- Research agenda: `docs/RESEARCH_AGENDA.md`
- Factorial artifact: `docs/clade_activity_relabel_null_encounter_topology_composition_cost_factorial_horizon_2026-03-18.json`
- Backlog: `docs/BACKLOG.md` (14 structural ceiling items)
