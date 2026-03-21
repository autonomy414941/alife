# Session Plan — 2026-03-21

## Compact Context
- GenomeV2 validation completed 2026-03-19–20: extended traits emerge (100% in canonical runs), persist, and show spatial/fertility enrichment (1.04–1.66)
- Structural ceiling prioritization (2026-03-20) ranked behavioral control #1: high innovation potential, strong literature support, one-month feasible
- Behavioral control feasibility spike (2026-03-20) confirmed low coupling risk: internal state + threshold policies work without breaking default behavior
- Package manager is npm; all tests pass as of 2026-03-20
- Research agenda shifted from GenomeV2 validation to behavioral control implementation on 2026-03-21

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Validation (ecological context, distance normalization, canonical comparison) | 4 | ac699f9 |
| Structural analysis (critic, synthesis) | 3 | 52d5541 |
| Feature implementation (behavioral control, observability, loci discovery) | 3 | 83a82f4 |

Dominant axis: Validation (4/10)
Underexplored axes: Movement/harvest policy expansion, policy inheritance, fitness decomposition

## Project State
- Behavioral control infrastructure exists: `Agent.internalState: Map<string, number>`, `last_harvest_total` signal, `reproduction_harvest_threshold` policy parameter, and reproduction gating in `src/behavioral-control.ts`
- Only reproduction reads policy state; movement, harvest, encounters, and settlement operators remain memoryless and hard-coded
- Extended traits show enrichment but simulation collapsed to 1 clade/1 species despite 20.6% trait prevalence, suggesting ecological advantage requires active behavioral adaptation beyond passive trait expression
- The backlog now focuses on behavioral control expansion as the monthly priority

## External Context
- [Towards open-ended dynamics in Artificial Life and Artificial Intelligence: an eco-evo-devo perspective](https://theses.hal.science/tel-05137835) (Université de Bordeaux, 2025): Continual environmental changes foster faster adaptation mechanisms; variable environments facilitate efficient exploratory behaviors within groups of agents. Environment-agent interplay is critical for open-ended dynamics.
- [Automated Search for Artificial Life with Foundation Models](https://arxiv.org/html/2412.17799v2) (May 2025): Open-ended evolution requires systems that never settle into stable equilibrium; decisions about how and where individuals interact should be made by individuals themselves.
- [The Future of AI is Open-Ended](https://richardcsuwandi.github.io/blog/2025/open-endedness/) (2025): Current AI approaches optimized for specific tasks won't reach superintelligence; open-ended systems require exploration over optimization and adaptive agents with learning-like dynamics.

## Research Gaps
- Can movement decisions conditioned on internal state (energy reserves, recent-harvest history) produce spatial patterns or niche separation that passive trait expression cannot?
- Does policy inheritance and mutation create heritable behavioral strategies that compete and diversify alongside morphological traits?
- Will fitness decomposition reveal whether extended traits actually provide harvest/survival/reproduction advantage in matched ecological contexts, or whether they remain neutral baggage?

## Current Anti-Evidence
- Extended traits persist and show enrichment (1.04–1.66) but simulation collapsed to 1 clade/1 species by tick 1000, suggesting spatial correlation does not prove ecological advantage
- Current `internalState: Map<string, number>` is stringly typed and mixes policy parameters with transient memory; brittleness risk increases as more decisions become stateful
- Movement, harvest, and encounter operators touch the main turn loop heavily; policy expansion requires careful boundary design to avoid breaking existing ecology
- No fitness decomposition exists yet to validate whether behavioral policies or extended traits actually improve harvest/survival/reproduction in matched contexts

## Bet Queue

### Bet 1: [feat] Extend behavioral control to movement decisions

Add heritable policy parameters for movement (e.g., `movement_energy_reserve_threshold`, `movement_min_recent_harvest`) and wire movement operators to read internal state. Agents can condition movement on energy reserves or recent-harvest history. Verify existing movement tests pass under default (no-policy) behavior and add focused tests for policy-gated movement.

#### Success Evidence
- Movement operators read policy parameters from `internalState`
- Agents with policy parameters condition movement on energy/harvest thresholds
- Existing movement tests pass under default behavior
- New focused tests confirm policy-gated movement works as expected
- Code in `src/simulation.ts` or new `src/movement-policy.ts`

#### Stop Conditions
- Stop after implementing movement policy for 1-2 threshold types (energy reserve, recent-harvest)
- Do not attempt full spatial pattern analysis or niche-separation validation in this bet
- If existing tests break or coupling risk is high, document and stop

### Bet 2: [feat] Add policy inheritance and mutation

Make behavioral policy parameters heritable and mutable like genome traits. When an agent reproduces, offspring inherit parent policy parameters with mutation probability. Add mutation operators for policy parameters (additive noise, threshold drift). Verify offspring inherit and mutate policy state correctly.

#### Success Evidence
- Policy parameters are heritable: offspring copy parent `internalState` policy keys
- Policy parameters mutate during reproduction with configurable probability/magnitude
- Tests confirm policy inheritance and mutation work correctly
- Code in `src/reproduction.ts` and/or `src/behavioral-control.ts`

#### Stop Conditions
- Stop after implementing inheritance + mutation for existing policy parameters
- Do not add new policy types in this bet; focus on making existing policies evolvable
- If mutation breaks reproduction or tests fail, document and stop

### Bet 3: [validate] Add fitness decomposition by behavioral policy

Track harvest intake, survival probability, and reproductive output conditional on policy state vs default behavior in matched ecological bins (fertility, crowding). Run a pilot with movement + reproduction policies enabled and measure whether policy-positive agents show measurable advantage over policy-negative agents under the same local conditions.

#### Success Evidence
- Pilot run tracks per-agent fitness components (harvest, survival, reproduction) by policy presence
- Analysis artifact under `docs/` compares fitness by policy state within matched ecological bins
- Clear result: either policies provide measurable advantage or they are neutral/detrimental

#### Stop Conditions
- Stop after one focused pilot with fitness decomposition
- Do not build full genealogy or long-term trajectory analysis here
- If fitness data shows no advantage, document outcome and move on

### Bet 4: [feat] Add policy observability to StepSummary and CSV exports

Add policy parameter distributions (mean, variance, prevalence), policy activation rates (fraction of agents with non-default policy, fraction of decisions gated by policy), and policy-outcome correlations to `StepSummary` and CSV exports. This makes behavioral control visible in standard experiment feedback loops.

#### Success Evidence
- `StepSummary` includes policy-related metrics (prevalence, activation rates)
- CSV exports include policy parameter distributions
- Tests confirm new metrics compute correctly
- Code in `src/export.ts`, `src/types.ts`, and simulation summary logic

#### Stop Conditions
- Stop after adding observability for existing policy parameters
- Do not add full policy-genealogy tracking or innovation graphs in this bet
- If observability couples too tightly to specific policy keys, use generic `internalState` iteration instead

## Assumptions / Unknowns
- Assumption: movement policy can be wired with low coupling risk similar to reproduction policy (feasibility spike confirmed for reproduction)
- Assumption: policy inheritance can reuse existing genome mutation patterns without major refactoring
- Unknown: whether movement policies will produce measurable fitness advantage or remain neutral in current ecological contexts
- Unknown: whether policy parameter mutation rates should differ from genome trait mutation rates
- Unknown: how to best separate heritable policy parameters from transient ephemeral state in the `internalState` map (deferred to later refactor if brittleness becomes a problem)
