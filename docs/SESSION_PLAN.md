# Session Plan — 2026-03-07

## Compact Context
- `LifeSimulation` already records per-species and per-clade timelines in `history()`.
- Disturbance/locality studies are deterministic, seed-blocked, and the repo is currently green under `npm test` and `npm run build`.
- The fixed-schedule disturbance candidate (`interval=24`, `amplitude=0.2`, `phase=0.375`) turned robust-negative by `steps>=320`.
- The threshold-aware `radius=1` re-sweep returned `affectedCells=[4,3,2,1]` and `0/4` robust-positive cells.
- Recent momentum has been strong on disturbance-memory falsifiers, not on direct novelty/open-endedness evaluation.
- Existing history/export surfaces are sufficient for a bounded species-level activity probe without changing core dynamics first.

## Project State
- The codebase is a deterministic TypeScript alife simulator with mutation/speciation, spatial ecology, disturbance sweeps, and export/test infrastructure.
- Recent sessions tightened disturbance claims from broad timing grids to locality falsification, and the latest artifact effectively retired the `radius=1` story.
- The main underdeveloped area is explicit evidence for sustained novelty generation after burn-in.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (arXiv, March 2, 2026): cumulative activity alone was insufficient because new activity collapsed. Source: https://arxiv.org/abs/2603.01701
- Plantec et al., *Flow-Lenia: Emergent evolutionary dynamics in mass conservative continuous cellular automata* (arXiv, June 10, 2025): evaluates open-ended-like dynamics with evolutionary activity signals rather than resilience-only metrics. Source: https://arxiv.org/abs/2506.08569

## Research Gaps
- If species are treated as provisional components, does this simulator show non-zero post-burn-in activity over a long deterministic run, or does novelty collapse after early transients?

## Current Anti-Evidence
- No current artifact tests sustained novelty generation directly; the project still argues from disturbance recovery and memory more than from ongoing innovation.
- The only recent locality-positive candidate disappeared under deeper replication, so there is no surviving robust spatial result to lean on.

## Candidate Bets
- A: Add a species-level evolutionary-activity summary from `history().species` and export it for one long baseline run.
  Why now: It addresses the main uncertainty blocking any open-endedness claim.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: Species-level activity may be noisy or definition-sensitive.
- B: Run a threshold-aware `radius=3` locality sweep using distinct affected-cell buckets at the already-studied schedule.
  Why now: `radius=1` is effectively falsified, so larger local footprints are the next plausible spatial mechanism.
  Est. low-context human time: 35m
  Expected information gain: medium
  Main risk: Another negative sweep still leaves open-endedness weakly instrumented.
- C: Add a compact phylogenetic persistence summary from existing taxon history exports.
  Why now: Recent spatial/ecology work suggests phylogenetic structure may reveal mechanism before aggregate resilience does.
  Est. low-context human time: 55m
  Expected information gain: medium
  Main risk: Good summary statistics may take longer to define than to implement well.

## Selected Bet
Add a minimal species-level activity probe and run it on one long deterministic baseline. Keep the operational definition provisional but explicit: report cumulative activity, normalized cumulative activity, and post-burn-in new activity so the result can falsify as well as support open-endedness claims.

## Why This Fits The Horizon
- The required inputs already exist in species history timelines, so the actor can add the metric without refactoring the simulator.
- Success is autonomously verifiable with deterministic tests plus one JSON artifact from a fixed run.

## Success Evidence
- Artifact: `docs/species_activity_probe_2026-03-07.json` with per-window `cumulativeActivity`, `normalizedCumulativeActivity`, and `newActivity`.
- Verification command or output: `npm test && npm run build`, then inspect whether late-window `newActivity` stays above `0` after burn-in or collapses to `0`.

## Stop Conditions
- Stop if a full literature-faithful activity framework starts expanding; ship a clearly named species-level approximation instead.
- If the long run is too slow or unstable, keep the metric implementation and verify it on a shorter fixed horizon rather than switching experiment families.

## Assumptions / Unknowns
- Assumption: species are an acceptable provisional component definition for this session.
- Unknown: whether existing history resolution is rich enough to make normalized and new activity interpretable without extra lineage bookkeeping.
