# Session Plan — 2026-04-02

## Compact Context
- The April 1 operator ablation panel isolated reproduction gating as the most harmful coupled operator (net diversification -1.15, effective richness -1.59, occupied niches -3.00) while reserve spending was near-neutral
- The April 1 signature validation identified one signature (`open|strict|balanced`) with consistent positive harvest advantage (+0.0477 weighted) under matched controls, though reproduction and survival remained near-neutral
- Multi-tick harvest memory features (rolling window and decay-weighted) now exist and diverge measurably from single-tick state
- Canonical genomeV2 initialization helper exists and at least one study uses it, removing a known infrastructure mismatch
- Replay branching, causal traces, descent observability, and trajectory persistence metrics all exist

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique and backlog expansion | 3 | 9ab834e |
| Policy validation and mechanism attribution | 3 | d8ced60 |
| Memory and observability expansion | 2 | 7a385f5 |
| Initialization and infrastructure repair | 1 | be41147 |
| Replay and counterfactual infrastructure | 1 | db0398e |
| Action model expansion | 0 | none |
| Multi-horizon credit assignment | 0 | none |
| Context-dependent phenotype realization | 0 | none |
| Perception and sensory limitation | 0 | none |

Dominant axis: Structural critique and backlog expansion (3/10), Policy validation and mechanism attribution (3/10)
Underexplored axes: Action model expansion, Multi-horizon credit assignment, Context-dependent phenotype realization, Perception and sensory limitation, Initialization and infrastructure repair, Replay and counterfactual infrastructure

## Project State
- The repo now has operator-level ablation showing reproduction gating is harmful, signature-level validation showing one policy profile with small harvest gains, multi-tick memory features, and unified genomeV2 initialization
- Recent sessions shifted from building new coupling surfaces to isolating which operators and signatures drive the matched-control failure
- The important gap is now structural expressiveness: the action model remains fixed-repertoire single-turn, credit assignment remains one-tick, and phenotype realization remains direct-encoding without context dependency

## External Context
- Latorre, Brun-Usan, and Fernández-Lázaro, ["Simulating macroevolutionary trends and open-ended evolution with a novel mechanistic multi-level approach"](https://doi.org/10.1371/journal.pone.0335033), PLOS ONE 20(1), 2025: multi-scale process-based frameworks can bridge microevolution and macroevolution by integrating genotype-to-phenotype mapping with biotic interactions and lower-level mechanisms
- Bedau et al., ["The MODES Toolbox: Measurements of Open-Ended Dynamics in Evolving Systems"](https://doi.org/10.1162/artl_a_00280), Artificial Life 25(1), 2019: open-endedness measurement should target change potential, novelty potential, complexity potential, and ecological potential, not just coarse diversity counts

## Research Gaps
- Can multi-horizon credit assignment (e.g., +5/+20/+50 tick survival or descendant windows) recover positive policy effects that remain invisible under one-tick harvest scoring?
- Can discrete action selection with evolvable priority rules express conditional multi-step strategies that graded trait modulation cannot?

## Current Anti-Evidence
- The April 1 operator ablation panel shows reproduction gating reduces net diversification by -1.15, effective richness by -1.59, and occupied niches by -3.00 relative to the decoupled baseline, so policy-controlled reproduction thresholds currently harm rather than help
- The April 1 signature validation shows that even the best-performing policy signature (`open|strict|balanced`) gains only +0.0477 on harvest with near-neutral survival and reproduction effects, which argues against policy presence being sufficient for adaptive advantage under the current one-tick credit window

## Bet Queue

### Bet 1: [validate] Multi-Horizon Policy Credit Assignment
Run a bounded matched-control check where policy-fitness exposures are scored not only by same-tick harvest, survival, and reproduction but also by +5, +20, and +50 tick survival and descendant counts. The goal is to test whether the current one-tick credit window hides delayed policy payoffs that would appear under longer horizons.

#### Success Evidence
- New artifact with per-signature matched comparisons showing harvest, survival, and reproduction deltas at 1-tick, +5-tick, +20-tick, and +50-tick horizons
- Direct answer on whether any policy signature shows positive multi-horizon effects that remain invisible under same-tick scoring

#### Stop Conditions
- Stop after one bounded multi-horizon panel exists with at least two seeds and two policy signatures
- Do not build a generic multi-horizon attribution framework

### Bet 2: [expand] Discrete Action Selection Prototype
Replace the current single-turn action model with a bounded action selection layer where agents choose from a small discrete action alphabet (e.g., "harvest primary", "harvest secondary", "move toward fertility", "reproduce cautiously", "rest") and policy loci determine action priorities or thresholds. The goal is to test whether evolvable action sequencing can express conditional strategies that graded trait modulation cannot.

#### Success Evidence
- Code implementing a small action alphabet with policy-controlled priority or threshold logic
- Small matched-control check showing whether action-selection agents differ from graded-modulation agents on harvest, survival, or diversification metrics

#### Stop Conditions
- Stop after one bounded action-alphabet prototype exists with at least 3 distinct actions
- Do not generalize to a full evolvable action language in this bet

### Bet 3: [expand] Context-Dependent Phenotype Realization Spike
Add an intermediate phenotype layer where a subset of traits (e.g., harvest efficiency, movement bias, reproduction threshold) are expressed as `f(genomeV2, local fertility, crowding, disturbance state)` instead of directly reading genotype scalars. The goal is to test whether context-conditioned trait expression allows policy loci to become ecologically adaptive when direct coupling does not.

#### Success Evidence
- Code implementing context-dependent trait realization for at least one decision surface (harvest, movement, or reproduction)
- Small matched-control check showing whether context-conditioned phenotypes differ from direct-encoding phenotypes on policy-signature fitness or diversification

#### Stop Conditions
- Stop after one bounded context-dependent realization path exists
- Do not redesign the full phenotype construction pipeline in this bet

### Bet 4: [validate] Signature-Specific Reproduction Gate Analysis
The April 1 ablation panel showed reproduction gating is harmful on average, but it did not stratify by policy signature. Run a bounded matched-control check where reproduction gating is tested separately for signatures with strict, guarded, and open reproduction thresholds. The goal is to test whether the harm is uniform or concentrated in specific threshold regimes.

#### Success Evidence
- New artifact showing per-signature reproduction gating deltas under matched controls
- Direct answer on whether strict-gate, guarded-gate, or open-gate signatures each show negative effects or whether the harm is concentrated in one regime

#### Stop Conditions
- Stop after one bounded signature-stratified ablation panel exists
- Do not add new policy operators in this bet

## Assumptions / Unknowns
- Assumption: the one-tick credit window is narrow enough that multi-horizon survival or descendant windows will reveal delayed policy payoffs
- Assumption: discrete action selection can be prototyped without redesigning the full tick loop or breaking legacy non-policy studies
- Unknown: whether context-dependent phenotype realization is enough to rescue policy-bearing cohorts or whether the ceiling is deeper in the genetics or inheritance architecture
- Unknown: whether reproduction gating harm is uniform across signatures or concentrated in specific threshold regimes
