# Session Plan — 2026-03-12

## Compact Context
- `npm`/TypeScript/vitest repo with working `build`, `test`, and relabel-null study scripts.
- The canonical anti-evidence is still `docs/clade_activity_relabel_null_2026-03-10.json`: at `4000` steps, actual clades remain below the matched null on persistent activity at cladogenesis thresholds `1` and `1.2`.
- The current best short result is `docs/clade_activity_relabel_null_lineage_encounter_restraint_smoke_2026-03-11.json`, where harvest crowding `1`, dispersal crowding `1`, encounter restraint `1`, and offspring-settlement crowding `0` reach `persistentActivityMeanDeltaVsNullMean = +20.285714285714263`.
- That short win is narrow: its `persistentWindowFractionDeltaVsNullMean` is still `0`, and turning `lineageOffspringSettlementCrowdingPenalty` to `1` drops the short delta to `+7.357142857142833`.
- In `src/simulation.ts`, adult movement already uses `localEcologyScore()`, but `pickOffspringSettlement()` is still random unless `lineageOffspringSettlementCrowdingPenalty > 0`.
- `test/simulation.test.ts` already has deterministic settlement tests that call `reproduce()` directly, so one more localized juvenile-placement test is cheap.

## Project State
- The simulation already includes cladogenesis, habitat/trophic/defense traits, clade coupling, kin-aware harvest/dispersal/encounters, seasonality/disturbance, and relabel-null studies.
- Recent sessions have been pushing one mechanism family: lineage-aware local ecology. Harvest crowding created the first short positive signal, dispersal crowding strengthened it, encounter restraint improved it slightly, and lineage-settlement crowding weakened it.
- The main underdeveloped area is juvenile spatial inheritance: births still ignore habitat and generic crowding unless the same-lineage settlement penalty knob is enabled.

## External Context
- Tardanico and Hovestadt, *Effects of Landscape Heterogeneity and Spatial Autocorrelation on Environmental Niche and Dispersal in Simulated Organisms* (Artificial Life, 2025): in a spatially explicit simulated-organism model, dispersal frequency and distance respond differently to spatial structure, reinforcing dispersal/settlement as a high-leverage evolutionary mechanism. Source: https://pubmed.ncbi.nlm.nih.gov/40661912/
- Moreno, Rodriguez-Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (Artificial Life, 2025): ecology and spatial structure are central levers for phylogenetic structure in artificial systems, which supports strengthening ecological inheritance at birth rather than only measuring current outcomes. Source: https://pubmed.ncbi.nlm.nih.gov/40298478/

## Research Gaps
- If offspring settlement reuses local ecology scoring even when lineage settlement penalty stays at `0`, does the current short positive relabel-null delta improve without collapsing birth-schedule matching or cladogenesis?

## Current Anti-Evidence
- No artifact yet shows a positive actual-vs-null advantage on the canonical `4000`-step horizon; the long relabel-null panel is still strongly negative on persistent activity.
- Even the current best short result only raises persistent activity volume, not persistent window coverage, so the system still lacks evidence of robust ongoing clade renewal beyond the matched null.

## Candidate Bets
- A: Add an opt-in ecology-scored offspring settlement rule independent of lineage settlement penalty, then run a short relabel-null smoke on top of the current best kin-aware stack.
  Why now: adult movement is already ecology-aware, but births are still mostly random, making juvenile placement the clearest remaining spatial-feedback gap.
  Est. low-context human time: 45m
  Main risk: it may over-concentrate offspring in fertile patches and reduce turnover instead of improving persistence.
- B: Add same-lineage surplus-energy sharing inside shared cells, then run the same short smoke on top of the current best kin-aware stack.
  Why now: same-lineage interactions can currently reduce harm, but they still cannot positively stabilize low-energy kin.
  Est. low-context human time: 45m
  Main risk: it may mostly inflate population size with little clade-level benefit.
- C: Run the canonical `4000`-step relabel-null panel on the current best kin-aware stack without changing mechanics.
  Why now: the short positive signal still needs falsification on the main horizon.
  Est. low-context human time: 30m
  Main risk: it is measurement-only and may consume the session without improving the dynamics.

## Selected Bet
Implement an opt-in offspring-settlement ecology knob so `pickOffspringSettlement()` can reuse `localEcologyScore()` even when `lineageOffspringSettlementCrowdingPenalty` remains `0`. Add one deterministic test proving enabled juveniles choose a richer or less crowded neighbor than the random baseline, then run a 2-point short relabel-null smoke comparing disabled versus enabled on top of the current best kin-aware stack (`lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, `lineageEncounterRestraint=1`, lineage-settlement crowding still `0`). This is the smallest mechanism change that strengthens ecological inheritance at birth without stacking another kin-only penalty.

## Why This Fits The Horizon
- The code change is localized to offspring settlement plus config/export/study plumbing, and the repo already has reusable settlement tests and smoke-study templates.
- Success is autonomously checkable with one deterministic test, `npm test`, `npm run build`, and a narrow smoke artifact.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_offspring_ecology_settlement_smoke_2026-03-12.json` compares settlement ecology disabled versus enabled while keeping the current best kin-aware stack fixed.
- Specific verification command or output: `npm test && npm run build && npm run study:clade-activity-relabel-null-offspring-ecology-settlement-smoke`, plus a deterministic test showing the new knob changes child placement while `lineageOffspringSettlementCrowdingPenalty=0`.

## Stop Conditions
- Stop after one settlement knob, one deterministic test, and one 2-point smoke result; do not also add kin sharing, retune the existing kin-aware penalties, or rerun the long-horizon panel in the same session.
- If the change starts requiring refactors outside settlement/config/study plumbing, or the smoke clearly produces worse clade signal with no interpretable juvenile-placement effect, record the artifact and stop instead of stacking more mechanics.

## Assumptions / Unknowns
- Assumption: random juvenile placement is currently diluting spatial and ecological inheritance enough that ecology-aware settlement can matter.
- Unknown: whether any improvement would come mainly from habitat matching, generic crowding avoidance, or their interaction, and whether a short-horizon gain would survive the `4000`-step horizon.
