# Session Plan — 2026-03-10

## Compact Context
- `npm` is the package manager; the baseline verification path is `npm test && npm run build`.
- `src/simulation.ts` gives ecological consequences to species-level traits (`habitatPreference`, `trophicLevel`, `defenseLevel`), while `lineage` still only controls clade founding, grouping, and history/export.
- `docs/clade_activity_cladogenesis_horizon_2026-03-09.json` keeps threshold `1.0` clade persistence high through `4000` steps (`meanPersistentWindowFraction` `0.98` / `0.94` at `50` / `100` survival ticks), with threshold `1.2` weaker.
- `docs/clade_activity_relabel_null_2026-03-10.json` shows those clade-positive regimes do not beat a matched pseudo-clade null: threshold `1.0` has window-fraction delta `0.00` / `-0.04` and activity delta `-318` / `-737` vs null at `50` / `100`.
- `docs/horizon_path_dependence_2026-03-06.json` remains `robustNegative` at `320` and `420` steps.

## Project State
- The repo now has deterministic species/clade activity probes, cladogenesis horizon studies, species-vs-clade coupling studies, and a matched relabel-null study with machine-readable JSON artifacts.
- Recent sessions moved from finding clade-positive thresholds to checking horizon robustness and then falsifying the strongest bookkeeping explanation with a matched pseudo-clade control.
- The underdeveloped area is causal lineage mechanics: higher-level structure is still observational because clade identity does not change movement, harvest, predation, or survival.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (2026): the open-endedness verdict changed with the component being measured, so component-level claims need direct controls. Source: https://arxiv.org/abs/2603.01701
- Moreno, Rodriguez Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (2025): ecological dynamics can leave detectable signatures in phylogeny, which is exactly the causal gap the current model lacks at the clade level. Source: https://direct.mit.edu/artl/article/31/2/129/130570/Ecology-Spatial-Structure-and-Selection-Pressure

## Research Gaps
- Can one opt-in clade-mediated ecological term make lineage identity change payoffs, rather than only changing how histories are grouped after the fact?
- Under that mechanism, does actual clade persistence begin to separate at all from the existing matched relabel-null on a short threshold-`1.0` seed panel?

## Current Anti-Evidence
- The new relabel-null result is negative: actual clade persistence is matched or beaten by pseudo-clades built from the same species histories, so the current higher-level signal is not stronger than coarse-graining.
- Path dependence is still robust-negative, and lineages still have no direct ecological leverage, so the project cannot yet claim open-endedness above species bookkeeping.

## Candidate Bets
- A: Add an opt-in clade-mediated habitat coupling, prove it changes ecological outcomes in deterministic tests, and run one short relabel-null smoke study.
  Why now: it directly attacks the strongest post-null failure mode with the smallest mechanism that can make clades causal.
  Est. low-context human time: 55m
  Expected information gain: high
  Main risk: one coupling may be too weak or too disruptive to create measurable actual-vs-null separation.
- B: Extend species activity horizons to `6000` and `8000` steps and classify whether persistent species novelty is flattening or still renewing.
  Why now: species are currently the only level with strong persistent novelty, so they are the next-best place to reduce uncertainty without changing mechanics.
  Est. low-context human time: 40m
  Expected information gain: medium
  Main risk: longer horizons may confirm persistence without addressing the causal gap behind the clade result.
- C: Add a stricter clade null that also preserves coarse clade-size structure, not just birth timing.
  Why now: it would test whether the March 10 negative control is still too permissive.
  Est. low-context human time: 45m
  Expected information gain: low
  Main risk: another null could consume the session while still leaving the basic “clades are non-causal” verdict unchanged.

## Selected Bet
Execute A. Add one opt-in lineage-to-ecology hook instead of another observational metric. The tight version is a clade-mediated habitat term: assign each clade a habitat preference at founding, blend it into habitat efficiency or destination scoring under a small config knob, add one deterministic test proving otherwise-similar agents in different clades can receive different ecological payoffs, and then reuse the relabel-null machinery on a short threshold-`1.0` smoke study to see whether the new mechanism produces any actual-vs-null separation.

## Why This Fits The Horizon
- It touches one ecological axis and can reuse the existing clade founding state plus the already-built relabel-null analysis, instead of opening another large metric surface.
- Success is autonomously verifiable with deterministic tests and one fixed-output JSON artifact; no broad retuning sweep is required in the same session.

## Success Evidence
- A new deterministic test shows that enabling the clade-habitat coupling changes harvest or movement outcomes for agents that would otherwise be ecologically equivalent at the species level.
- `npm test && npm run build`, plus one fixed-`generatedAt` smoke-study artifact whose JSON keeps `birthScheduleMatched` true for every seed and shows a non-zero actual-vs-null delta field at threshold `1.0` / `minSurvivalTicks` `50`.

## Stop Conditions
- Stop after one clade-mediated habitat mechanism and one smoke-study readout; do not add multiple lineage mechanics, larger seed panels, or longer horizons in the same session.
- If the mechanism cannot be made testable cleanly, or the smoke study still shows zero separation, shrink to landing the mechanism plus deterministic proof and record the negative evaluation instead of stacking more changes.

## Assumptions / Unknowns
- Assumption: one simple habitat-coupling term is enough to make lineage identity causally observable without breaking determinism or basic population viability.
- Unknown: whether any measurable separation will favor actual clades over the matched null, or whether the model will still collapse to species-level novelty only.
