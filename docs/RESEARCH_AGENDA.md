# Research Agenda

## Current Direction
Turn behavioral control from a validation bottleneck into a generative ratchet by unifying policy parameters into the genome, extending policies to richer decision surfaces, and making policy divergence count toward evolutionary novelty. The past week proved that graded policies and spending control both landed successfully; now the highest-leverage path is to close the policy-genome architectural split and test whether unified policies can drive speciation, cladogenesis, and measurable niche differentiation.

## Why This Direction
March 24, 2026 completed the four-bet sequence from the prior session plan: reproduction-only robustness stress-tested positively, harvest-only diagnosed as primarily ecological (secondary-biased niches are genuinely worse in the current ecology), graded reproduction policy surface landed with sigmoid gating, and substrate spending policy shipped with heritable `spending_secondary_preference`. All tests pass, the smoke studies confirm gradient behavior, and the spending policy demonstrably alters reserve burn order.

That means the last session's "brittle binary gates" and "no spending policy" structural constraints are now addressed at the mechanism level. But policy parameters still live in a separate `policyState` map outside `genomeV2.traits`, so policy divergence remains invisible to `genomeV2Distance()`, speciation, cladogenesis, and relabel-null baselines. Under this architecture, even if policies begin driving ecological differentiation, the taxonomic machinery and diversity metrics will systematically undercount it.

The backlog contains 50 items, many labeled with structural constraint tags from the critic agent. The most immediate ceiling is now **Policy-Genome Coupling** (line 37 in BACKLOG.md): "Behavioral policy parameters live in `agent.internalState`... while morphological traits live in `agent.genomeV2.traits`... This architectural split creates duplication... and prevents policies from being treated as loci in speciation or cladogenesis distance calculations." Unifying them removes technical debt, makes policy loci first-class evolutionary state, and opens the path to policy-mediated taxonomic splits.

## Structural Constraints
- Policy parameters live in `policyState`, morphological traits in `genomeV2.traits`; two systems for heritable scalar state with separate mutation, observability, and distance metrics.
- Policy divergence does not contribute to `genomeV2Distance()`, so behavioral differentiation cannot trigger speciation or cladogenesis even when it creates ecological separation.
- Relabel-null baselines do not preserve or match policy state, so policy-mediated clade advantages are washed out when scrambling clades.
- Observability remains thin: agents lack access to age, disturbance history, encounter outcomes, local taxonomic composition, or abiotic signals beyond fertility and resource totals.
- Binary movement and harvest policies still use hard thresholds; only reproduction has a graded sigmoid surface.

## Revision History
- 2026-03-25: Shifted monthly direction from behavioral-control mechanism rollout to policy-genome unification and policy-driven diversification. March 24 completed graded reproduction and spending policies; the architectural split between `policyState` and `genomeV2.traits` is now the highest-leverage technical-debt ceiling preventing policy loci from driving taxonomic novelty.
- 2026-03-24: (previous direction retained as written)
