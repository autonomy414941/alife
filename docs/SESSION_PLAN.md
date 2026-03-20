# Session Plan — 2026-03-20

## Compact Context
- GenomeV2 live discovery, observability, pilot, and canonical validation all landed on 2026-03-19 (commits 449f5ab, 23f6718, 28bf60a, 9699b44).
- Canonical comparison shows strong evidence: all 4 seeds had 100% extended trait emergence and persistence, mean loci count grew from 3.0 to 3.38, and diversification advantage was +83.9% over fixed-genome baseline.
- On 2026-03-20, `genomeV2Distance()` was normalized with baseline-preserving scaling; the established 500-step, 2-seed comparison retained strong diversification advantage (+69.8% vs +78.1% pre-normalization on the same subset).
- Package manager is `npm`; all 285 tests pass as of 2026-03-19.
- Research agenda shifted from GenomeV2 wiring to end-to-end validation of evolvable ecological novelty on 2026-03-19.

## Exploration Axes (last 30 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Documentation / backlog management | 14 | e9c8a25 |
| Validation / baseline artifacts | 5 | 9699b44 |
| Other | 3 | 449f5ab |
| Ecological mechanisms | 3 | af31ee3 |
| Observability infrastructure | 2 | 23f6718 |
| Energetics / efficiency | 2 | 195d6da |
| Bug fixes / refactoring | 1 | - |

Dominant axis: Documentation / backlog management (14/30)
Underexplored axes: loci-count inflation safeguards, ecological-context correlation for traits, behavioral control, inheritance architecture

## Project State
- GenomeV2 representational capacity expansion is complete: extended traits can emerge, persist, and are observable in standard summaries.
- The distance metric no longer has a direct raw loci-count inflation path, and the normalized 500-step subset still shows strong diversification gains; the remaining uncertainty is whether that robustness holds at the full 4000-step horizon.
- The backlog contains 14 structural ceiling items identified by the critic agent, spanning behavioral control, inheritance architecture, interaction richness, environmental complexity, evolutionary mechanisms, and observability depth.
- Recent sessions heavily skewed toward documentation (14/30 commits), while code changes focused narrowly on GenomeV2 validation.

## External Context
- [Editorial Introduction to the 2024 Special Issue on Open-Ended Evolution](https://direct.mit.edu/artl/article/30/3/300/123431/) (Artificial Life, MIT Press, 2024): Open-endedness metrics include novelty, diversity, and complexity. Systems must continuously produce novel organisms, not just optimize within fixed architectures.
- [Open-Endedness in Genelife](https://direct.mit.edu/artl/article/30/3/356/119274/) (Artificial Life, MIT Press, 2024): Evolutionary activity statistics measure change, novelty, and diversity by tracking all new structures. Innovation is quantified using activity statistics that distinguish cumulative from normalized growth.
- [The Future of AI is Open-Ended](https://richardcsuwandi.github.io/blog/2025/open-endedness/) (2025): Current AI approaches optimized for specific tasks and efficiency won't reach superintelligence; open-ended systems require exploration over optimization.

## Research Gaps
- Does the normalized distance result from the 500-step subset persist at the full 4000-step horizon, or does longer-run diversification depend more strongly on the old raw-sum metric than the short-horizon rerun suggests?
- Do high-prevalence extended traits (e.g., `metabolic_efficiency_secondary` at 11.1% in pilot) actually correlate with distinct ecological contexts (fertility, crowding, encounter outcomes), or are they selectively neutral baggage?
- Which structural ceiling from the backlog (behavioral control, inheritance architecture, interaction richness, environmental complexity, evolutionary mechanisms, descent observability, temporal credit assignment) would unblock the next ratchet in complexity after GenomeV2 validation is complete?

## Current Anti-Evidence
- The normalized rerun completed only on the established 500-step, 2-seed subset (`docs/genome_v2_canonical_comparison_2026-03-20_normalized_500step.json`), because a full 4000-step rerun exceeded the session budget.
- Diversification advantage on the 500-step subset declined from +78.1% to +69.8% after normalization, so loci-count inflation mattered somewhat even though it did not collapse the effect.
- The 2026-03-19 pilot artifact shows `metabolic_efficiency_secondary` reached 11.1% prevalence, but the artifact does not track per-agent ecological context (fertility, crowding, encounter outcomes), so the correlation between trait presence and ecological success remains unmeasured.
- The backlog contains 14 structural ceiling items spanning 6 dimensions, but no systematic comparison or prioritization has been done to identify which ceiling is the next highest-leverage break after GenomeV2.

## Bet Queue

### Bet 1: [validate] Normalize GenomeV2 Taxonomic Distance to Prevent Loci-Count Inflation

Modify `genomeV2Distance()` to normalize by the number of expressed loci (or use a weighted scheme) so that taxonomic thresholds measure genuine phenotypic divergence rather than raw trait-count growth. Then re-run a subset of the 2026-03-19 canonical comparison to verify whether diversification gains persist under normalized distance.

#### Success Evidence
- `genomeV2Distance()` normalizes by loci count or uses effect-weighted distance
- Tests cover the normalization logic
- A re-run of 2-4 seeds from the canonical comparison confirms whether diversification advantage persists under normalized distance
- Artifact under `docs/` documents the comparison result

#### Stop Conditions
- Stop after implementing normalization and running a focused re-validation
- Do not redesign the entire taxonomic distance scheme; keep the change scoped to preventing mechanical inflation
- If normalized distance collapses diversification gains to near-zero, document that outcome clearly and stop

### Bet 2: [validate] Correlate Extended Trait Prevalence With Ecological Context

Add per-agent ecological context tracking (fertility bin, local crowding, recent encounter outcomes) to a GenomeV2 pilot run, then measure whether high-prevalence extended traits (e.g., `metabolic_efficiency_secondary`, `defense_level`) actually concentrate in distinct contexts or are uniformly distributed (indicating neutral drift).

#### Success Evidence
- Pilot run tracks per-agent fertility, crowding, and/or encounter outcomes
- Analysis artifact under `docs/` compares trait prevalence across ecological context bins
- Clear result: either extended traits correlate with specific contexts (evidence of ecological relevance) or they are context-agnostic (evidence of neutral baggage)

#### Stop Conditions
- Stop after one focused pilot with context tracking and analysis
- Do not build a full genealogy or innovation graph here; limit scope to trait-context correlation
- If context data shows no correlation, document that outcome and move on

### Bet 3: [synthesize] Prioritize Structural Ceiling Items for Next Ratchet

Review the 14 structural ceiling items in the backlog (behavioral control, inheritance architecture, interaction richness, environmental complexity, evolutionary mechanisms, descent observability, temporal credit assignment, trait granularity, dispersal kinematics, taxonomic proxy leakage, matched-null fidelity, mechanistic causality, trait decoder bottleneck, finite locus catalog, shared scalar geometry, taxon inflation, legacy metric surface, one-dimensional habitat axis, diet-choice compression, energy-as-fitness proxy, life-history compression, single-offspring reproduction, space without exclusion, globally synchronous forcing). Compare them systematically against three criteria: (1) unblocks cumulative innovation, (2) aligns with ALife complexity-ratchet literature, (3) implementable within one-month horizon. Produce a ranked shortlist of the top 3-5 candidates for the next monthly research direction.

#### Success Evidence
- Analysis artifact under `docs/` comparing ceiling items against the three criteria
- Ranked shortlist of top 3-5 candidates with clear rationale for each
- Recommendation states which ceiling to tackle next and why

#### Stop Conditions
- Stop after producing a clear, decision-ready ranking
- Do not implement any structural changes in this bet; this is pure synthesis and prioritization
- If the ranking is ambiguous or multiple ceilings tie, state that clearly and recommend further falsification tests

### Bet 4: [investigate] Run Behavioral-Control Feasibility Spike

If Bet 3 ranks behavioral control as a top-3 candidate, run a minimal feasibility spike: add per-agent `internalState: Map<string, number>` to `Agent`, implement a simple threshold-based policy for one decision (e.g., movement or reproduction), and measure whether the change preserves existing test behavior while enabling new contingent strategies. This spike tests implementation risk and API surface before committing to a month-long expansion.

#### Success Evidence
- Spike branch with minimal behavioral-control prototype
- Tests confirm existing behavior is preserved under default policy
- Analysis note under `docs/` documents feasibility, API surface, and coupling risks

#### Stop Conditions
- Only execute if Bet 3 recommends behavioral control as a top candidate
- Stop after a minimal spike; do not attempt full policy evolution or multi-decision wiring
- If the spike reveals high coupling risk or breaking changes, document that and stop

## Assumptions / Unknowns
- Assumption: the 500-step normalized rerun is directionally informative for the full 4000-step horizon, even though the longer rerun was not completed in this session.
- Assumption: per-agent context tracking can be added to a pilot run without requiring major refactoring of the simulation loop.
- Unknown: whether the current diversification advantage remains as robust at 4000 steps under normalized distance as it does on the 500-step subset.
- Unknown: which structural ceiling will yield the highest-leverage complexity ratchet after GenomeV2 validation is complete.
- Unknown: whether behavioral control is implementable within a one-month horizon without breaking existing ecology.
