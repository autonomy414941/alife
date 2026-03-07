# Session Plan — 2026-03-07

## Compact Context
- Disturbance studies are deterministic and CI-driven (`pathDependenceGain` robust-positive only if `ci95Low > 0`).
- Horizon falsification showed the old boundary candidate turns robust-negative at longer runs (`steps>=320`).
- A new locality sweep at the same disturbance schedule found one robust-positive cell: `radius=1`, `refugia=0.35`.
- That positive result is narrow (`1/6` robust-positive, `5/6` ambiguous), so fragility is still plausible.
- Build/tests are currently green and the needed sweep tooling already exists.

## Project State
- The codebase now supports seed-block replication, CI95 uncertainty, and deterministic ranking for disturbance cells.
- Recent momentum shifted from phase/horizon tuning to mechanism-axis locality structure.
- The main gap is replication depth and neighborhood continuity around the single robust-positive locality cell.

## External Context
- Staps et al., *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (2025): spatial structure materially changes evolutionary signatures, implying locality effects can be real but regime-dependent. Source: https://arxiv.org/abs/2405.07245
- Huizinga et al., *JaxLife: A Framework for Scalable Evolutionary Simulations of Open-Endedness in Complex Lifeforms* (2024): emphasizes scalable, repeated experimental comparisons to evaluate open-ended dynamics. Source: https://arxiv.org/abs/2409.00853

## Research Gaps
- At fixed `interval=24`, `amplitude=0.2`, `phase=0.375`, `steps=320`, does `radius=1`, `refugia=0.35` stay robust-positive when replication depth increases?
- Is the signal locally stable in refugia space (`0.30`, `0.35`, `0.40`) or an isolated spike?

## Current Anti-Evidence
- Evidence for positive path dependence currently depends on one cell from a low-depth sweep; adjacent cells are still CI-ambiguous.
- The project still lacks long-run evidence of sustained novelty/diversification beyond disturbance-recovery proxies.

## Candidate Bets
- A: Re-run only `radius=1`, `refugia=0.35` with higher `seedBlocks` to test false-positive risk.
  Why now: Fastest falsification of the newest positive claim.
  Est. low-context human time: 30m
  Expected information gain: high
  Main risk: Confirms/rejects one point but leaves neighborhood stability unresolved.
- B: Run a 3-cell refugia neighborhood check at `radius=1` (`refugia in {0.30,0.35,0.40}`) with higher `seedBlocks`.
  Why now: Tests both replication robustness and local parameter continuity in one bounded sweep.
  Est. low-context human time: 50m
  Expected information gain: high
  Main risk: Runtime may be tight if block count is too high.
- C: Sweep amplitudes at fixed locality candidate to test transfer across shock strength.
  Why now: Would probe mechanism generalization beyond one disturbance strength.
  Est. low-context human time: 45m
  Expected information gain: medium
  Main risk: Premature before verifying the candidate is reproducible at baseline amplitude.

## Selected Bet
Execute B: run a bounded, higher-depth neighborhood sweep around the current best locality candidate (`radius=1`, `refugia={0.30,0.35,0.40}`) at fixed disturbance schedule. Use CI95 classifications to decide whether the positive claim is locally robust or likely a narrow/fragile artifact.

## Why This Fits The Horizon
- It uses existing experiment functions and export patterns; no code changes are required.
- Success is fully verifiable from deterministic JSON outputs (`mean`, `ci95Low`, `ci95High`, `classification`) for exactly three predefined cells.

## Success Evidence
- Artifact: `docs/locality_candidate_neighborhood_2026-03-07.json` containing the three cells with CI95 stats and classification.
- Specific verification command or output: `npm run build && node -e "const fs=require('fs'); const {runDisturbanceGridStudy}=require('./dist/experiment.js'); const refugia=[0.30,0.35,0.40]; const out=[]; for (const f of refugia){ const s=runDisturbanceGridStudy({runs:2,steps:320,analyticsWindow:24,seed:20260307,seedBlocks:8,blockSeedStride:80,intervals:[24],amplitudes:[0.2],phases:[0.375],localRadius:1,localRefugiaFraction:f}); const c=s.cells[0]; const u=c.reproducibility.pathDependenceGainBlockMeanUncertainty; out.push({radius:1,refugia:f,mean:u.mean,ci95Low:u.ci95Low,ci95High:u.ci95High,classification:(u.ci95Low>0?'robustPositive':(u.ci95High<0?'robustNegative':'ambiguous')),relapseEventReduction:c.pairedDeltas.relapseEventReduction.mean}); } fs.writeFileSync('docs/locality_candidate_neighborhood_2026-03-07.json', JSON.stringify(out,null,2)); console.log(JSON.stringify(out,null,2));"`

## Stop Conditions
- Stop after evaluating the three predefined refugia values; do not add amplitude/phase/radius expansions in this session.
- If runtime is too high, keep the same three cells and reduce `seedBlocks` from `8` to `6` rather than changing axes.

## Assumptions / Unknowns
- Assumption: `steps=320` is sufficient to expose delayed-memory degradation for this fixed disturbance regime.
- Unknown: whether CI95 behavior depends materially on the chosen `blockSeedStride` and warrants a later sensitivity check.
