# Backlog

- [validate] Horizon-validate founder grace plus `cladogenesisEcologyAdvantageThreshold=0.1` on the static habitat baseline
- [split] Extract relabel-null diagnostics and aggregate builders from `src/activity.ts`
- [investigate] Add clade-age-bucket diagnostics to founder-grace relabel-null studies
- [refactor] Replace one-off relabel-null study wrapper files with a table-driven harness
- [split] Finish extracting offspring settlement / founding flow from `src/simulation.ts`

## Critic

- [critic] [Representational Capacity] Agents only have three mutable genome axes (`metabolism`, `harvest`, `aggression`), while habitat, trophic, and defense traits are derived scalars; no parameter tuning can produce evolvable body plans, sensors, effectors, or additional ecological roles. Intervention: replace the fixed `Genome` schema with extensible heritable loci or modules, and promote habitat/trophic/defense traits from derived summaries to first-class evolvable state.
- [critic] [Interaction Richness] The interaction alphabet is compile-time fixed to movement, harvest, same-cell energy theft, reproduction, and thresholded clade founding, so lineages cannot evolve new interaction types such as signaling, cooperation, public goods, or alternative predation/resource-conversion modes. Intervention: generalize encounters and foraging into evolvable action channels over multiple resource or field layers instead of a single hard-coded transfer equation.
- [critic] [Environmental Complexity] The world is a static fertility map plus one fungible resource pool with exogenous disturbance; agents can deplete and recycle resources but cannot persistently construct, poison, shelter, or otherwise rewrite habitat. Intervention: add persistent per-cell state layers that agents deposit, erode, and sense over many ticks, then feed those layers back into movement, harvest, and survival.
- [critic] [Evolutionary Mechanisms] Speciation and cladogenesis are single-offspring threshold events in a wrapped torus with no barriers, demes, mate choice, or lineage-specific breeding structure, so the system cannot express allopatric isolation, reproductive barriers, or adaptive radiation driven by sustained separation. Intervention: add patch barriers or a patch graph plus lineage-local colonization/breeding pools, and require sustained ecological or spatial separation before promoting a new clade.
- [critic] [Evaluation Blindspots] Current headline metrics focus on active-clade persistence, relabel-null deltas, turnover, and disturbance resilience, which can miss functional innovation, niche construction, and diversification of interaction structure even if they emerge. Intervention: add an open-endedness panel tracking cumulative novel phenotype bins, persistent environment-modification states, lineage interaction-network diversity, and ecological divergence between coexisting clades.
