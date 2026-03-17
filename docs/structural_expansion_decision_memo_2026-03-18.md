# Structural Expansion Decision Memo

**Date**: 2026-03-18
**Context**: Factorial nullity confirms expressiveness ceiling
**Decision scope**: Select highest-leverage structural expansion for complexity ratchet

## Executive Summary

The encounter-topology × composition-cost factorial at canonical 4000-step horizon confirmed null results across all four mechanism combinations: composition-dependent conditions went extinct, while composition-agnostic conditions survived but remained deeply negative versus null (-35 to -50.5 active clades). This confirms that the current three-axis genome coupled with composition-agnostic metabolism structurally caps partitioning tradeoffs regardless of constraint tuning.

**Recommendation**: Expand **Representational Capacity** by replacing the fixed three-axis `Genome` schema with an extensible, evolvable trait architecture. This unblocks cumulative innovation by enabling agents to evolve new ecological roles, sensors, and metabolic pathways rather than optimizing fixed axes.

## Factorial Results Summary

| Condition | Encounter | Composition | Active Clade Δ | Final Pop | Verdict |
|-----------|-----------|-------------|-----------------|-----------|---------|
| Baseline | Dominant | Agnostic | -35.0 | 2098 | Negative |
| Composition-only | Dominant | Dependent | 0.0 | 0 | **Extinct** |
| Topology-only | Non-transitive | Agnostic | -50.5 | 948 | Worse |
| Combined | Non-transitive | Dependent | 0.0 | 0 | **Extinct** |

**Key finding**: Composition-dependent reproduction (requiring 30% primary + 30% secondary energy fractions) is lethal because agents cannot maintain balanced pools under composition-agnostic metabolism. The 30/30 gate blocks reproduction while physiology offers no pathway to accumulate both pools selectively.

## Structural Ceiling Analysis

The backlog contains 14+ Critic-flagged structural ceiling items across six dimensions. Evaluating the top candidates against three criteria:

1. **Unblocks cumulative innovation** (not just parameter retuning)
2. **Aligns with ALife complexity-ratchet literature**
3. **Implementable within one-month horizon** without full redesign

### Top 5 Candidates

#### 1. Representational Capacity (RECOMMENDED)

**Current ceiling**: Three mutable genome axes (`metabolism`, `harvest`, `aggression`) + optional `harvestEfficiency2`. All other traits (habitat preference, trophic level, defense) are derived scalars computed from these axes.

**Intervention**: Replace fixed `Genome` schema with extensible heritable loci or modular trait system. Promote habitat, trophic, and defense from derived summaries to first-class evolvable state.

**Impact on complexity ratchet**:
- Enables **unbounded complexity increase**: new loci can be added, not just retuned
- Supports **cumulative innovation**: traits can specialize independently rather than conflate into three axes
- Directly addresses ASAL and Aevol findings: complexity ratchet requires systems where organisms can accumulate structural innovations, not just optimize within fixed dimensionality

**Literature alignment**:
- *Aevol complexity ratchet* (Artificial Life 2020): "organisms become complex although such organisms are less fit than simple ones" — requires genotype that can grow in complexity
- *ASAL* (arXiv 2024): "temporally open-ended novelty" requires discovering "previously unseen lifeforms" — impossible when genome schema fixes all possible phenotypes

**Implementation sketch**:
1. Replace `Genome` with `GenomeV2` containing `Map<string, number>` for scalar traits
2. Add mutation operator that can add/remove loci with low probability
3. Update physiology (metabolism, harvest, encounters) to read from trait map with defaults for unknown keys
4. Promote `habitat`, `trophic`, `defense` from derived summaries to mutable loci in trait map
5. Add evolvable `sensor_range`, `metabolic_efficiency_primary`, `metabolic_efficiency_secondary` as new loci

**One-month feasibility**: HIGH. Core change is swapping genome representation; physiology can read from map with fallbacks. Tests need updates but existing logic ports directly.

#### 2. Behavioral Control

**Current ceiling**: Memoryless, hard-coded decisions. Movement greedily maximizes one-step ecology score; reproduction is energy threshold + probability.

**Intervention**: Add per-agent internal state and evolvable policy layer mapping observations to actions.

**Impact on complexity ratchet**:
- Enables **behavioral innovations**: dormancy, pursuit/escape, contingent strategies
- Supports **cumulative controller complexity**: policies can layer new responses without discarding old ones

**Literature alignment**: Strong. Open-ended evolution requires agents that can evolve novel behaviors, not just trait values.

**Implementation sketch**:
1. Add `internalState: Map<string, number>` to `Agent`
2. Create `Policy` interface with pluggable decision modules
3. Implement simple evolvable policy (e.g., threshold-based state machine)
4. Wire policy outputs into movement, harvest, reproduction decisions

**One-month feasibility**: MEDIUM. Requires redesigning decision flow and adding policy layer. Higher risk than representational expansion.

#### 3. Inheritance Architecture

**Current ceiling**: Clonal single-parent mutation only. No recombination, sexual selection, or horizontal transfer.

**Intervention**: Multi-parent inheritance with compatibility/partner-choice rules.

**Impact on complexity ratchet**:
- Enables **combinatorial innovation**: offspring mix parental traits
- Supports **lineage convergence**: distinct innovations can merge

**Literature alignment**: Moderate. Recombination accelerates search but isn't required for complexity ratchet per se.

**Implementation sketch**:
1. Add partner-finding logic to reproduction
2. Implement crossover operator for genome loci
3. Add mate-compatibility gates (e.g., distance threshold)
4. Track multi-parent lineage in birth events

**One-month feasibility**: MEDIUM-LOW. Touches reproduction, speciation, cladogenesis logic. High coupling risk.

#### 4. Interaction Richness

**Current ceiling**: Fixed interaction alphabet (movement, harvest, energy theft, reproduction, clade founding).

**Intervention**: Generalize encounters and foraging into evolvable action channels.

**Impact on complexity ratchet**:
- Enables **novel interaction types**: signaling, cooperation, alternative predation
- Requires solving how interactions become evolvable — high design risk

**Literature alignment**: Strong for open-endedness, but requires representational capacity first (need evolvable loci to control interaction modes).

**One-month feasibility**: LOW. Requires designing interaction-type representation and rewriting encounter/harvest logic.

#### 5. Environmental Complexity

**Current ceiling**: Static fertility map + fungible resource pool. Agents deplete but cannot persistently modify habitat.

**Intervention**: Add persistent per-cell state layers that agents deposit, erode, and sense.

**Impact on complexity ratchet**:
- Enables **niche construction**: agents modify environment for descendants
- Supports **ecosystem engineering** strategies

**Literature alignment**: Moderate. Niche construction accelerates diversification but isn't core to complexity ratchet.

**Implementation sketch**:
1. Add per-cell state layers (e.g., `deposits: Map<string, number>`)
2. Wire actions to modify cell state
3. Feed cell state into movement scoring, harvest, survival

**One-month feasibility**: MEDIUM. Additive change; doesn't break existing logic. But requires representational capacity to specify *what* agents deposit/sense.

### Why Representational Capacity Wins

**Criterion 1 (Cumulative innovation)**: All five candidates unblock cumulative innovation, but Representational Capacity is the **foundation** for the others:
- Behavioral control needs evolvable policy parameters → requires extensible genome
- Interaction richness needs evolvable interaction modes → requires extensible genome
- Environmental complexity needs evolvable deposition/sensing traits → requires extensible genome
- Only inheritance architecture is orthogonal, but it accelerates *existing* innovation space rather than expanding it

**Criterion 2 (Literature alignment)**: Directly addresses Aevol and ASAL findings:
- Aevol: "organisms become complex" requires genomes that can *become* more complex
- ASAL: "unseen lifeforms" requires phenotype space not predetermined by fixed schema
- Hamon thesis: "unbounded increase in complexity" structurally impossible when genome dimensionality is compile-time fixed at three axes

**Criterion 3 (One-month feasibility)**: Representational Capacity is the **lowest-risk** high-leverage expansion:
- Core change is data structure (fixed struct → trait map)
- Existing physiology reads from map with defaults — ports mechanically
- Tests need updates but logic is unchanged
- No redesign of control flow, no multi-component coupling

The other candidates require Representational Capacity as a prerequisite *or* have higher implementation risk *or* are less foundational.

## Implementation Plan (High-Level)

### Phase 1: Extensible Genome (Week 1)
1. Create `GenomeV2` with `traits: Map<string, number>`
2. Add mutation operator supporting add/remove loci
3. Update physiology to read from trait map with fallback defaults
4. Port existing `metabolism`, `harvest`, `aggression` to trait map keys
5. Run validation: confirm behavioral equivalence to fixed genome

### Phase 2: First-Class Ecological Traits (Week 2)
1. Promote `habitat`, `trophic`, `defense` from derived to mutable loci
2. Remove taxon-level scalar maps; compute from per-agent traits
3. Add `sensor_range`, `metabolic_efficiency_primary`, `metabolic_efficiency_secondary` as new loci
4. Wire efficiency loci into metabolism/harvest if present
5. Run canonical baseline: measure impact on coexistence vs fixed genome

### Phase 3: Complexity Ratchet Metrics (Week 3)
1. Add loci-count distribution to exports
2. Track genome size (number of active loci) per taxon over time
3. Add phenotype-distance-weighted richness metric
4. Run factorial: test whether extensible genome enables positive vs-null deltas

### Phase 4: Validation & Documentation (Week 4)
1. Refresh canonical artifacts with extensible genome
2. Document trait semantics and mutation model
3. Add tests for loci add/remove, trait lookup, fallback behavior
4. Commit with detailed rationale and evidence

## Expected Outcomes

**If successful**:
- Agents can accumulate new loci over evolutionary time
- Lineages differentiate on independent trait axes, not conflated three-axis cube
- Complexity (measured by loci count, phenotype diversity) increases without fitness advantage — aligning with Aevol ratchet
- Positive active-clade deltas vs null become achievable because ecological roles are no longer compile-time fixed

**If unsuccessful**:
- Extensible genome alone is insufficient; combination with behavioral control or environmental complexity required
- Evidence guides next expansion; no wasted time on wrong ceiling

**Falsification signal**: If canonical baseline with extensible genome shows same nullity as fixed genome, then representational capacity alone is insufficient and combination with behavioral/environmental expansion is needed.

## Connection to Open-Endedness Literature

**Complexity ratchet** (Aevol, 2020): "Using the Aevol platform, researchers found that organisms become complex although such organisms are less fit than simple ones." Current system cannot express this because genome complexity is fixed at compile time. Extensible genome unblocks ratchet by allowing complexity to *increase* independently of fitness.

**ASAL** (2024): "Automated Search for Artificial Life (ASAL) enables foundation models to identify interesting ALife simulations producing temporally open-ended novelty... discovered previously unseen lifeforms." Current system's phenotype space is predetermined by three axes; no amount of search can discover "unseen lifeforms" structurally distinct from metabolism/harvest/aggression tradeoffs. Extensible genome expands phenotype space itself.

**Hamon thesis** (2025): "Open-ended evolution describes systems where continual generation of novelty and unbounded increase in complexity characterize evolution on multiple scales." Three-axis genome with derived traits structurally caps complexity at three degrees of freedom. Extensible genome enables unbounded complexity increase by allowing new loci to arise.

## Conclusion

The factorial null result is decisive evidence that mechanism-combination tuning within the current three-axis genome ceiling cannot produce coexistence gains. The next month should target **Representational Capacity** as the highest-leverage structural expansion, enabling cumulative innovation, aligning with complexity-ratchet literature, and serving as the foundation for future behavioral, interaction, and environmental expansions.

**Recommended action**: Begin Phase 1 (Extensible Genome) in the next session.
