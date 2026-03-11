# Session Plan — 2026-03-11

## Compact Context
- `npm` is the package manager; the baseline verification path is `npm test && npm run build`.
- `src/simulation.ts` already has species-level habitat, trophic, and defense ecology, but lineage-level ecology only enters through `cladeHabitatCoupling`.
- `test/simulation.test.ts` already proves that same-species agents in different lineages can receive different payoffs when habitat coupling is enabled.
- `src/activity.ts` and `test/activity.test.ts` already provide matched relabel-null clade activity studies, so a new mechanic can be checked without inventing new metrics first.
- `docs/clade_activity_relabel_null_2026-03-10.json` shows actual clades lose to the matched pseudo-clade null on the canonical `4000`-step panel at cladogenesis thresholds `1` and `1.2`.
- `docs/clade_activity_relabel_null_clade_habitat_coupling_sweep_2026-03-11.json` is negative across `cladeHabitatCoupling` values `0` through `1`, so habitat-only lineage ecology did not rescue clade persistence.

## Project State
- The repo now has deterministic clade/species activity analyzers, matched-null controls, and a March 11 sweep around the new habitat-coupling mechanism.
- Recent sessions mostly extended measurement around cladogenesis and null controls, then added one lineage-mediated ecological term for habitat matching.
- The underdeveloped area is interaction ecology: lineages still do not affect trophic or defense roles, so clade identity remains ecologically narrow.

## External Context
- Moreno, Rodriguez Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (2025): stronger ecology produced clearer phylogenetic signal, which argues for strengthening ecological differentiation instead of adding another null-only analysis. Source: https://direct.mit.edu/artl/article/31/2/129/130570/Ecology-Spatial-Structure-and-Selection-Pressure
- Araujo and Lurgi, *Mutualism provides a basis for biodiversity in eco-evolutionary community assembly* (2025): eco-evolutionary assembly with multiple interaction types and speciation produced higher complexity and stability, pointing toward richer interaction ecology as a plausible lever. Source: https://pubmed.ncbi.nlm.nih.gov/40892908/

## Research Gaps
- If lineage identity also shapes trophic and defense interaction roles, does the existing short relabel-null panel show larger actual-vs-null clade separation than habitat coupling alone?

## Current Anti-Evidence
- On the canonical `4000`-step relabel-null panel, actual clades still underperform the matched pseudo-clade null in persistent activity at both tested cladogenesis thresholds.
- On the March 11 habitat-coupling sweep, every tested `cladeHabitatCoupling` value kept `persistentActivityMeanDeltaVsNullMean` negative and left persistent-window separation at `0` or worse.

## Candidate Bets
- A: Add a lineage-mediated interaction mechanic by blending clade-level trophic and defense traits into harvest and encounter resolution, then cover it with one deterministic simulation test and one short relabel-null smoke test.
  Why now: it is the smallest mechanism change that expands lineage ecology beyond habitat while reusing existing tests and null-study infrastructure.
  Est. low-context human time: 45m
  Main risk: the extra coupling may still make lineages different without improving actual-vs-null clade persistence.
- B: Promote the March 11 habitat-coupling sweep from the `1000`-step short panel to the full `4000`-step canonical panel.
  Why now: it would confirm whether the current negative result persists at the production horizon.
  Est. low-context human time: 30m
  Main risk: it is still measurement-only and does not address the narrow ecological role of clade identity.
- C: Add a positive interaction mechanic such as local cross-feeding or mutualistic resource sharing and attach a smoke study.
  Why now: recent eco-evolutionary work suggests mixed interaction types can support richer community assembly.
  Est. low-context human time: >60m
  Main risk: defining and testing a new mutualism surface cleanly may sprawl past one session.

## Selected Bet
Add clade-level interaction coupling, not more habitat measurement. The bounded slice is to introduce one new config knob that blends lineage-level trophic and defense values into the existing species-level foraging and encounter calculations, then prove it matters in a deterministic micro-regime and in a short relabel-null smoke test. This keeps the session on one mechanism surface while answering whether broader lineage ecology is a better lever than habitat-only coupling.

## Why This Fits The Horizon
- The actor can reuse existing species trophic/defense code paths, the clade founder bookkeeping in `src/simulation.ts`, and the existing relabel-null smoke-test pattern in `test/activity.test.ts`.
- Success is autonomously verifiable with deterministic tests only; no broad sweep or new analysis framework is required.

## Success Evidence
- `test/simulation.test.ts` gains a deterministic case where same-species agents in different lineages diverge in encounter or foraging payoffs only when the new clade interaction coupling is enabled.
- `test/activity.test.ts` gains a short relabel-null smoke asserting a non-zero `persistentActivityMeanDeltaVsNull` under the new coupling, verified with `npm test && npm run build`.

## Stop Conditions
- Stop after one coupling knob and one short smoke configuration; do not turn this into a sweep across multiple new interaction parameters.
- If adding both trophic and defense lineage blending becomes awkward, shrink to trophic-only coupling plus the deterministic test and record defense coupling as deferred.

## Assumptions / Unknowns
- Assumption: the existing species-level trophic and defense terms are strong enough that lineage-level blending will materially change ecological outcomes.
- Unknown: whether broader lineage ecology improves actual-vs-null clade persistence or only creates another causally real but still open-endedness-negative distinction.
