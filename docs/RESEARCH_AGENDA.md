# Research Agenda

## Current Direction
Extend graded policy activation from reproduction to harvest decisions, enabling smooth substrate-choice gradients instead of binary harvest gates. With movement policy grading complete (March 26), the remaining binary decision surface is harvest secondary preference, where agents currently select substrate allocations through a fixed ratio rather than adaptive intensity modulation. The next month tests whether graded harvest policies create measurable fitness differentiation, whether policy-driven speciation generates ecologically distinct lineages, and whether unbounded policy traits systematically dominate morphological distance in taxonomic splits.

## Why This Direction
March 25 completed the policy-genome unification: policy parameters now live in `genomeV2.traits`, policy divergence contributes to `genomeV2Distance()`, and speciation/cladogenesis can trigger from behavioral differentiation alone. Tests confirm that pure policy divergence crosses thresholds and that unbounded policy traits (reproduction_harvest_threshold, movement thresholds) can produce larger distances than maximum morphological divergence.

However, revalidation revealed that the graded reproduction surface degraded under unification (births dropped from 2049 to 1210 at steepness 1.0, and from 203 to 7 at steepness 5.0), while substrate spending remained exactly preserved. This suggests that graded reproduction now interacts differently with evolutionary dynamics, possibly due to changed mutation or inheritance patterns for genome-backed traits versus legacy `policyState`.

March 26 extended graded gates to movement, replacing binary energy-reserve and recent-harvest blocking with sigmoid probability. The last remaining binary surface is harvest: agents still use a fixed `harvest_secondary_preference` ratio rather than a graded intensity or effort-allocation surface.

External research (Frontiers in Robotics and AI, 2025; Nature Communications EIoT, 2025) emphasizes adaptive environment generation and closed-loop difficulty scaling for embodied agents, plus multi-modal perception and world modeling. Recent work on adaptive activation functions (IET Control Theory, 2026) shows that gradient-descent-tuned sigmoids improve safety and adaptability in continuous control, suggesting that graded policy surfaces may offer smoother fitness landscapes than binary gates.

## Structural Constraints
- Harvest policy uses a fixed substrate ratio (`harvest_secondary_preference`) rather than a graded intensity or effort-allocation surface; agents cannot smoothly modulate harvest effort across steepness gradients
- Unbounded policy traits (thresholds ranging [0, ∞)) can dominate distance calculations: a shift from reproduction_harvest_threshold=0 to 10 contributes 10 units, while maximum morphological divergence is 3 units
- Graded reproduction surface degraded after policy-genome unification, while spending policy remained unchanged; the refactor altered evolutionary dynamics despite preserving mechanism
- Relabel-null baselines do not preserve or match policy state, so policy-mediated clade advantages are washed out when clades are scrambled
- Observability remains thin: agents lack access to age, disturbance history, encounter outcomes, local taxonomic composition, or abiotic signals beyond fertility and resource totals

## Revision History
- 2026-03-26: Shifted direction from policy-genome unification to graded harvest policy rollout and policy-driven diversification validation. Movement grading landed March 26; harvest is the last binary decision surface. The unbounded policy trait dominance issue and graded reproduction degradation are now visible structural constraints that may require distance weighting or mutation tuning.
- 2026-03-25: Shifted monthly direction from behavioral-control mechanism rollout to policy-genome unification and policy-driven diversification. March 24 completed graded reproduction and spending policies; the architectural split between `policyState` and `genomeV2.traits` is now the highest-leverage technical-debt ceiling preventing policy loci from driving taxonomic novelty.
