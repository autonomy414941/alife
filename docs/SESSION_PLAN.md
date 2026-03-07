# Session Plan — 2026-03-07

## Compact Context
- Disturbance evaluation is deterministic: paired seeded runs, seed-block CI95, and horizon/locality sweep tooling already exist.
- The long-horizon falsifier made the old fixed-schedule candidate robust-negative at `steps>=320`.
- A coarse locality sweep at the same schedule found one low-depth robust-positive cell: `radius=1`, `refugia=0.35`.
- The higher-depth neighborhood re-check overturned that claim: `radius=1`, `refugia in {0.30,0.35,0.40}` was `3/3` ambiguous with identical values.
- Disturbance footprints are discrete: affected cells are `floor(targetedCells * (1 - refugiaFraction))`; at `radius=1` there are only 5 targeted cells.
- `npm run build` and `npm test` are currently green (`51` tests).

## Project State
- The codebase already supports deterministic disturbance grids, CI95 classification, and JSON artifact export without new research plumbing.
- Recent sessions have been moving from broad disturbance sweeps toward falsifying fragile positive claims with deeper replication.
- The main underdeveloped area is locality experiment design: nominal refugia sweeps can collapse onto the same effective disturbance regime.

## External Context
- Staps et al., *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (2025). Source: https://arxiv.org/abs/2405.07245
- 2024 Ecological Modelling study on patch attributes and disturbance timing driving source-population emergence in ABM ecology. Source: https://doi.org/10.1016/j.ecolmodel.2024.110839

## Research Gaps
- At fixed `interval=24`, `amplitude=0.2`, `phase=0.375`, `steps=320`, does `radius=1` show any CI-robust-positive path-dependence gain when refugia values are chosen to produce distinct affected-cell counts (`4,3,2,1`) rather than plateau-equivalent fractions?
- If not, should `radius=1` be treated as effectively falsified so follow-up work shifts to larger local footprints?

## Current Anti-Evidence
- No locality result survives both longer-horizon falsification and higher-depth replication yet; the only robust-positive cell so far disappeared when replication depth increased.
- The project still measures disturbance recovery better than sustained novelty generation, so even a positive locality cell would remain weak evidence for open-endedness.

## Candidate Bets
- A: Add effective-footprint metadata (`targetedCells`, `affectedCells`) to disturbance-study exports and tests.
  Why now: Prevents more plateau-equivalent locality sweeps.
  Est. low-context human time: 35m
  Expected information gain: medium
  Main risk: Improves instrumentation but may not resolve the biological question this session.
- B: Run a threshold-aware `radius=1` locality sweep at fixed schedule using one refugia value per affected-cell-count bucket.
  Why now: Directly tests whether the remaining `radius=1` story is real once equivalent cells are removed.
  Est. low-context human time: 40m
  Expected information gain: high
  Main risk: All cells may remain ambiguous, yielding only a narrowing result.
- C: Move to `radius=3` and sweep distinct affected-cell counts around the best remaining ambiguous locality regime.
  Why now: Larger footprints may express genuine spatial structure more clearly than a 5-cell diamond.
  Est. low-context human time: 55m
  Expected information gain: medium
  Main risk: Changes two things at once and weakens comparability to the failed `radius=1` candidate.

## Selected Bet
Run B: a threshold-aware `radius=1` locality re-sweep at the already-studied disturbance schedule, using refugia midpoints that realize distinct effective footprints (`refugia={0.10,0.30,0.50,0.70}` -> affected cells `4,3,2,1`). Export a compact JSON artifact that records both nominal refugia and effective affected-cell count so the result can cleanly falsify or salvage the `radius=1` story.

## Why This Fits The Horizon
- It uses existing experiment functions and only needs a bounded 4-cell sweep plus a small export script.
- Success is autonomous: the actor can verify footprint counts and CI95 classifications directly from one JSON artifact.

## Success Evidence
- Artifact: `docs/locality_threshold_sweep_2026-03-07.json` with four rows including `refugia`, `affectedCells`, `mean`, `ci95Low`, `ci95High`, and `classification`.
- Verification output: `affectedCells` should be exactly `[4,3,2,1]`; any `classification === "robustPositive"` is a surviving `radius=1` candidate, while `0/4` robust-positive should retire `radius=1` from near-term follow-up.

## Stop Conditions
- Stop after the four predefined `radius=1` buckets; do not add amplitude, phase, or larger-radius sweeps in the same session.
- If runtime becomes an issue, reduce `seedBlocks` from `8` to `6` before changing the cell set; if the export script becomes messy, write the minimal JSON from printed results and stop.

## Assumptions / Unknowns
- Assumption: the fixed schedule (`24`, `0.2`, `0.375`, `320`) remains the right falsification target because it already produced both positive and negative claims.
- Unknown: whether `radius=1` is simply too discrete a locality mechanism to support stable path-dependent gain even if larger radii later do.
