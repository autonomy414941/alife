# Research Agenda

## Current Direction
Over the next month, the project should determine whether policy loci can be made genuinely adaptive under matched controls or whether the current policy architecture has already hit a structural ceiling. The priority is to isolate which coupled operators help or harm, stratify policy-bearing cohorts by signature instead of treating all policy-positive agents as one group, and remove infrastructure mismatches that silently disable policy evolution in baseline runs.

If no policy signature produces durable positive demographic effects after those fixes, the repo should stop treating the current policy layer as the main path to open-ended diversification and pivot toward richer action selection and context-dependent phenotype realization.

## Why This Direction
March 31 materially changed the evidence base. The matched-control validation artifact (`docs/post_coupling_matched_control_validation_2026-03-31.json`) refuted the March 30 headline result once both arms shared the same mutating policy loci: the policy-coupled arm lost on effective richness (-27.5%), policy-sensitive effective richness (-8.6%), occupied niches (-18.6%), speciation rate (-18.8%), and net diversification (-27.6%) relative to the decoupled arm. That is the strongest current anti-evidence against claiming that policy payoff coupling is already driving adaptive diversification.

At the same time, the zero-coverage explanation changed. The genomeV2-seeded phenotype-landscape artifact (`docs/phenotype_landscape_genomev2_2026-03-31.md`) showed that policy-active cohorts do exist once initialization allows policy loci to evolve: 392,560 policy-positive records across 7,894,150 total records (5.0%), spanning 145 of 206 phenotype-environment bins (70.4%). This means the failure is no longer "policy never activates"; it is that activated policies do not yet show a convincing aggregate advantage.

Recent literature supports prioritizing driver disambiguation over adding more coarse metrics. Moreno, Rodriguez-Papa, and Dolson, "Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure" (Artificial Life 31(2), May 1, 2025, https://doi.org/10.1162/artl_a_00470) show that ecology, spatial structure, and selection pressure can all leave overlapping phylogenetic signatures, so methods must separate drivers instead of reading one summary as sufficient evidence. De Pinho and Sinapayen, "A speciation simulation that partly passes open-endedness tests" (arXiv, submitted March 2, 2026, https://arxiv.org/abs/2603.01701) show that open-endedness conclusions can change materially depending on whether genes, individuals, or species are treated as the measured unit. I infer from those results that this repo's next risk is not missing one more aggregate score, but aggregating across the wrong operators and the wrong policy cohorts.

## Structural Constraints
- Default initial agents still start without `genomeV2`, so policy evolution is absent unless a study script explicitly mirrors the legacy genome into `genomeV2`
- Policy analytics still collapse treatment to `hasAnyPolicy` in key paths, pooling distinct loci and parameterizations into one cohort and hiding locus-specific gains or harms
- Direct policy payoff coupling still reaches harvest allocation, reserve spending, and reproduction gating more clearly than broader spatial, encounter, or metabolic decisions, limiting how much demographic leverage policy state can express
- Policy inputs remain narrow relative to the decisions being modulated, with little memory and no richer action sequencing, so even active policies may lack enough state to become adaptively useful

## Revision History
- 2026-04-01: Pivoted from validating the March 30 policy-enabled diversification claim to explaining and repairing the matched-control failure. March 31 resolved the policy-coverage mystery, added replay and persistence tooling, and showed that the headline gain does not survive a shared-locus control.
- 2026-03-31: Pivoted from basic post-coupling validation and observability build-out to falsifying whether the new diversification signal is genuine. March 30 landed revalidation, policy-sensitive diversity, phenotype-landscape aggregation, and descent observability, but the strongest remaining risk became control and metric fidelity rather than missing instrumentation.
- 2026-03-30: Pivoted from building policy-payoff coupling to validating and explaining its effects. March 29 landed direct harvest and reserve-spending coupling, sampled causal traces, and a moderate-downweight default, so the main gap became stale anti-evidence plus missing policy-sensitive and lineage-sensitive measurement.
