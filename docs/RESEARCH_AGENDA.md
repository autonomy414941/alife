# Research Agenda

## Current Direction
Turn `GenomeV2` from a flexible storage and measurement layer into an expressed phenotype layer that actually changes ecology under selection. Over the next month, the goal is to route supported loci through shared phenotype realization, introduce asymmetric resource dynamics that create real substrate tradeoffs, and evaluate diversification with phenotype-aware metrics instead of raw taxon counts alone.

## Why This Direction
March 27 materially changed the state of the project. The graded-harvest base-preference bug was repaired and revalidated, `StepSummary` gained generic `genomeV2Metrics`, and a first `genomeV2DistanceWeights` calibration artifact produced only a provisional recommendation rather than a settled default. Those wins remove two stale planner targets, but they sharpen the remaining ceiling: most new heritable variation is still only mutated, measured, and distance-counted, not realized in the live ecology.

Repo inspection shows the same bottleneck from multiple angles. `src/genome-v2.ts` now centralizes trait metadata for mutation, clamping, activation, and distance categories, yet the simulator still relies on hard-coded trait reads in movement, harvest, encounters, habitat preference, and reproduction helpers. At the same time, `resource` and `resource2` still regenerate from the same fertility field and seasonal forcing, so substrate preference loci face weak ecological asymmetry even when they are expressed correctly.

Recent external context points in the same direction. Faldor and Cully's "Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity" (ALIFE 2024, https://arxiv.org/abs/2406.04235) argues for richer expressive spaces coupled to diversity-preserving search. "Eco-Evo-Devo in the Adaptive Evolution of Artificial Creatures Within a 3D Physical Environment" (Electronics 2025, https://www.mdpi.com/2079-9292/14/2/354) studies lifetime development, niche construction, and ecological inheritance together; I infer from that result that this repo should treat phenotype realization and ecological asymmetry as coupled mechanism work, not as separate polish passes.

## Structural Constraints
- Trait metadata is centralized for mutation and distance, but live ecological payoffs still depend on a hand-picked subset of direct trait reads and legacy helper functions
- `StepSummary.genomeV2Metrics` now exposes genome-wide trait distributions, but the main diversification claims still lean on raw species and clade counts plus relabel-null deltas instead of phenotype-weighted richness or niche occupancy
- `resource` and `resource2` still share the same fertility and seasonal forcing structure, so substrate specialization remains close to mirrored bookkeeping under many configurations
- `genomeV2DistanceWeights` has only a provisional calibration result and no adopted default tied to phenotype-aware validation
- The study layer still cannot branch matched live-world counterfactuals, so mechanism comparisons remain confounded by path dependence

## Revision History
- 2026-03-28: Narrowed the monthly direction from generic trait expressivity and observability to phenotype realization plus ecological asymmetry. March 27 landed the harvest-expression repair, generic `genomeV2` step metrics, and a provisional distance-weight calibration, leaving live trait-to-ecology plumbing and symmetric substrate dynamics as the main ceilings.
- 2026-03-27: Pivoted from graded-policy rollout to trait expressivity, observability, and calibration. The March 26 harvest pilot was neutral, and follow-up inspection showed graded harvest currently ignores the heritable base-preference locus under thresholded mode.
- 2026-03-26: Shifted direction from policy-genome unification to graded harvest policy rollout and policy-driven diversification validation. Movement grading landed March 26; harvest was treated as the last binary decision surface. The unbounded policy trait dominance issue and graded reproduction degradation were recognized as structural constraints requiring distance weighting or mutation tuning.
- 2026-03-25: Shifted monthly direction from behavioral-control mechanism rollout to policy-genome unification and policy-driven diversification. March 24 completed graded reproduction and spending policies; the architectural split between `policyState` and `genomeV2.traits` was identified as the highest-leverage ceiling preventing policy loci from driving taxonomic novelty.
