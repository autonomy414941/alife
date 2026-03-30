# Research Agenda

## Current Direction
Over the next month, the project should stop treating policy-payoff coupling as the main missing mechanism and instead determine whether the new couplings actually create sustained, explainable diversification. The priority is to validate post-coupling behavior under the adopted moderate-downweight distance regime, add policy-sensitive diversity and fitness summaries, and extend lineage-level mechanism tracing through reproduction and settlement so trait claims are tied to demographic outcomes.

## Why This Direction
March 29 materially changed the repo state. Harvest policy now modulates intake payoff, harvest and reserve spending are coupled, sampled causal traces exist, and moderate downweight was adopted as the `genomeV2` distance default after a follow-up that matched morphology-priority outcomes without its earlier mixed-divergence inflation failure.

However, the strongest anti-evidence has not been overturned. The 2026-03-28 bounded graded-policy panel still shows only weak richness and niche gains with a 53.8% lower speciation rate, and no post-coupling replacement study exists yet. In addition, `phenotypeDiversity` still bins only `NON_POLICY_TRAITS`, current causal traces miss reproduction and settlement, and the existing policy-fitness surface compares policy-positive cohorts rather than phenotype-conditioned fitness regions.

Recent literature supports this shift. Moreno, Rodriguez-Papa, and Dolson, "Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure" (Artificial Life 31(2), 2025, https://doi.org/10.1162/artl_a_00470) report that phylogenetic metrics can detect ecology and spatial structure, but further methods are needed to distinguish drivers and normalize signatures. De Pinho and Sinapayen, "A speciation simulation that partly passes open-endedness tests" (arXiv:2603.01701, 2026, https://arxiv.org/abs/2603.01701) show that conclusions about open-ended activity depend heavily on which components are measured. I infer from those results that this repo now needs better component-level attribution and phenotype-level fitness summaries more than another round of unvalidated operator additions.

## Structural Constraints
- `phenotypeDiversity` remains policy-blind because it bins `NON_POLICY_TRAITS`, so policy differentiation only appears when it spills into morphology-side phenotype
- The new policy-payoff operators currently touch harvest intake and reserve burn, but encounter transfer, settlement scoring, and metabolic burden are still mostly morphology-driven
- `runWithPolicyFitness` and causal trace event streams collect rich per-agent observations, but there is no phenotype-by-environment fitness landscape layer that aggregates them into reusable outcome maps
- Sampled causal traces still omit reproduction and settlement outcomes, which are exactly where diversification claims hinge
- Taxon history tracks births, deaths, and founder context, but not parent-child edge structure, phenotype deltas, or innovation reuse paths
- The study layer still cannot branch the same world into paired counterfactual runs or deterministic replay branches, so mechanism comparisons remain exposed to path dependence

## Revision History
- 2026-03-30: Pivoted from building policy-payoff coupling to validating and explaining its effects. March 29 landed direct harvest and reserve-spending coupling, sampled causal traces, and a moderate-downweight default, so the main gap became stale anti-evidence plus missing policy-sensitive and lineage-sensitive measurement.
- 2026-03-29: Pivoted from phenotype realization and ecological asymmetry to policy-payoff coupling plus causal validation. March 28 completed the decoder, asymmetric resource controls, phenotype-diversity metrics, and a bounded neutrality panel, but the panel still showed ambiguous policy effects and used a rejected distance-weight regime.
- 2026-03-28: Narrowed the monthly direction from generic trait expressivity and observability to phenotype realization plus ecological asymmetry. March 27 landed the harvest-expression repair, generic `genomeV2` step metrics, and a provisional distance-weight calibration, leaving live trait-to-ecology plumbing and symmetric substrate dynamics as the main ceilings.
