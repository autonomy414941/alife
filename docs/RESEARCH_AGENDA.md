# Research Agenda

## Current Direction
Over the next month, the project should determine whether the large March 30 policy-enabled diversification gain is a genuine ecology-mediated effect or a measurement and control artifact. The priority is to tighten counterfactual validation, isolate policy-active fitness regions, and add replay and trajectory tooling that can distinguish transient policy-locus spread from durable adaptive diversification.

If the effect survives stricter controls, the next step is to extend direct policy payoff reach into additional demographic operators. If it does not survive, the repo should treat the current signal as diagnostic noise and redesign the coupling or observability layer before adding more ecological complexity.

## Why This Direction
March 30 materially improved the observability stack. The repo now has a post-coupling diversification artifact, a policy-sensitive phenotype-diversity summary, phenotype-fitness landscape aggregation, reproduction and settlement causal traces, and lightweight descent edges that persist parent-child phenotype deltas.

Those additions changed the question but did not settle it. The 2026-03-30 revalidation artifact reports large gains for the policy-enabled arm, but its control disables policy mutation entirely and its strongest gains are in a metric that directly counts policy traits. Meanwhile, the 2026-03-30 phenotype-fitness landscape artifact collapses three 500-step runs into only seven bins with 0.0% policy-positive exposure, which is strong anti-evidence against claiming that the new policy surfaces are already producing robust, resolved adaptive regions.

Recent literature supports shifting from "did anything move?" to "what component moved, and is it really adaptive?" Moreno, Rodriguez-Papa, and Dolson, "Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure" (Artificial Life 31(2), 2025, https://doi.org/10.1162/artl_a_00470) show that phylogenetic signals can detect ecology and spatial structure but still require careful disambiguation of causal drivers. De Pinho and Sinapayen, "A speciation simulation that partly passes open-endedness tests" (arXiv:2603.01701, 2026, https://arxiv.org/abs/2603.01701) show that conclusions about open-ended evolutionary activity depend strongly on which system components are measured. I infer from those results that this repo's next risk is not missing one more metric, but trusting the wrong metric or control.

## Structural Constraints
- The main March 30 validation still compares `policyMutationProbability=0.65` against `0`, so it confounds policy execution effects with access to extra mutating loci
- `summarizePolicySensitivePhenotypeDiversity` adds `POLICY_TRAITS` to species-centroid trait space, which can reward neutral policy-locus drift and still compress within-species ecological structure
- The current phenotype-fitness landscape uses coarse phenotype and environment bins from passive exposure logs; the latest artifact shows only seven bins and no policy-positive share, so the surface is not yet resolving the policy activity it is meant to explain
- The study layer still lacks snapshot branching or deterministic replay, so mechanism claims remain vulnerable to path dependence
- Trajectory scoring is still weak: turnover windows exist, but there is no durable innovation-survival or active-diversity-area summary tying policy changes to persistence
- Direct policy-payoff coupling still reaches harvest intake and reserve allocation more clearly than encounter transfer, settlement utility, or metabolic burden, so genuine adaptive diversification may still hit a structural ceiling even if current signals survive validation

## Revision History
- 2026-03-31: Pivoted from basic post-coupling validation and observability build-out to falsifying whether the new diversification signal is genuine. March 30 landed revalidation, policy-sensitive diversity, phenotype-landscape aggregation, and descent observability, but the strongest remaining risk is now control and metric fidelity rather than missing instrumentation.
- 2026-03-30: Pivoted from building policy-payoff coupling to validating and explaining its effects. March 29 landed direct harvest and reserve-spending coupling, sampled causal traces, and a moderate-downweight default, so the main gap became stale anti-evidence plus missing policy-sensitive and lineage-sensitive measurement.
- 2026-03-29: Pivoted from phenotype realization and ecological asymmetry to policy-payoff coupling plus causal validation. March 28 completed the decoder, asymmetric resource controls, phenotype-diversity metrics, and a bounded neutrality panel, but the panel still showed ambiguous policy effects and used a rejected distance-weight regime.
