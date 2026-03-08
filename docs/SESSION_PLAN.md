# Session Plan — 2026-03-08

## Compact Context
- `npm` is the package manager; the core verification loop is `npm test && npm run build`.
- `src/activity.ts` and `src/export.ts` already support species and clade activity/persistence exports with deterministic tests.
- `src/simulation.ts` lets mutation found new species via `speciationThreshold`, but `reproduce()` keeps `child.lineage = parent.lineage`.
- `docs/species_activity_seed_panel_2026-03-07.json` is strong species-side evidence: 4/4 seeds keep persistent post-burn-in novelty positive at thresholds `50` and `100`.
- `docs/clade_activity_seed_panel_2026-03-08.json` is strong anti-evidence at the higher level: all 4 seeds stay at `totalClades = 24` with `postBurnInNewClades = 0`.
- `docs/horizon_path_dependence_2026-03-06.json` is still robust-negative at `320` and `420` steps.

## Project State
- The repo now has deterministic simulation, taxon-history export, disturbance/locality studies, and landed species/clade novelty instrumentation.
- Recent sessions moved from disturbance/path-dependence falsifiers toward direct novelty measurement, then to cross-component comparison.
- The underdeveloped area is no longer just measurement sensitivity: higher-level novelty is structurally capped because clades never branch after initialization.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (arXiv, March 2, 2026): their open-endedness conclusion depends on the chosen activity component, which makes component-degenerate metrics especially dangerous here. Source: https://arxiv.org/abs/2603.01701
- Bonetti Franceschi, Dolson, and Volz, *Extending a Phylogeny-based Method for Detecting Signatures of Multi-level Selection for Applications in Artificial Life* (arXiv, August 20, 2025): clade-level inference matters for major evolutionary transitions, which requires nontrivial descendant clade structure rather than frozen initial lineages. Source: https://arxiv.org/abs/2508.14232

## Research Gaps
- If the simulation allows bounded, explicit cladogenesis, does clade activity become nonzero in a deterministic probe without collapsing existing species-level behavior?

## Current Anti-Evidence
- The current system cannot support open-ended clade-level evolution because `lineage` never changes after initialization; the clade panel's hard zero is structural, not just empirical.
- Independent anti-evidence remains: path-dependence gains are robust-negative by `320` and `420` steps.

## Candidate Bets
- A: Add opt-in cladogenesis so a sufficiently diverged speciation event can found a new clade, then prove it with a deterministic clade-activity probe artifact.
  Why now: The strongest blocker is a hard ceiling on higher-level novelty, and removing that ceiling directly increases open-endedness capacity.
  Est. low-context human time: 55m
  Expected information gain: high
  Main risk: Threshold semantics could sprawl into a larger taxonomy redesign if not kept narrow.
- B: Compare the lone robust-positive locality regime (`radius=1`, `refugia=0.35`) against baseline with the existing species persistence seed panel.
  Why now: It tests whether the only supported spatial intervention also improves the strongest current novelty metric.
  Est. low-context human time: 40m
  Expected information gain: medium
  Main risk: It still leaves clade-level novelty impossible by construction.
- C: Extend species persistence horizon evidence beyond `2000` steps on multiple seeds.
  Why now: The positive species result is still horizon-limited and sits beside negative path-dependence evidence.
  Est. low-context human time: 45m
  Expected information gain: medium
  Main risk: Runtime may rise without resolving the structural ceiling on higher-level novelty.

## Selected Bet
Add a narrow, opt-in cladogenesis rule in `src/simulation.ts`: when a new species is founded, compare its genome to the current clade founder and start a new clade only if a separate divergence threshold is crossed. Keep default behavior backward-compatible, add deterministic tests for split vs no-split behavior, and generate one small machine-readable clade-activity artifact from a controlled fixed-seed regime that shows post-burn-in clade novelty can become positive.

## Why This Fits The Horizon
- The change is bounded to one new simulation parameter, lineage-founder bookkeeping, deterministic tests, and one small probe artifact; it does not require a full taxonomy redesign or broad sweep.
- Success is autonomously verifiable because the actor can check both regression safety and the new capability with deterministic assertions and one fixed-seed export.

## Success Evidence
- Artifact: a new JSON probe or persistence export under `docs/` showing `totalClades > initialAgents` and `postBurnInWindowsWithNewActivity > 0` in a fixed cladogenesis-enabled run.
- Verification command or output: `npm test && npm run build`, with tests that prove clades stay frozen when the new threshold is disabled and branch when it is enabled.

## Stop Conditions
- Stop if the work starts expanding into multi-level taxonomies, CLI redesign, or broad baseline retuning; keep scope to one opt-in cladogenesis mechanism plus proof artifact.
- If baseline tuning thrashes, shrink to a deterministic micro-regime that only proves the new mechanism can create post-burn-in clade novelty without breaking existing tests.

## Assumptions / Unknowns
- Assumption: a clade-founder genome anchor is a sufficient first-pass rule for bounded cladogenesis without redefining every existing history/export type.
- Unknown: what divergence threshold yields meaningful new clades in the baseline regime; the session should not depend on solving that broader tuning problem.
