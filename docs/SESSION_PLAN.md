# Session Plan — 2026-03-07

## Compact Context
- The simulator/experiment stack is deterministic and currently green (`npm test`, `npm run build`).
- `runDisturbanceGridStudy` already supports paired global/local runs with seed blocks and CI95 over block means.
- The acceptance rule is CI-based: `pathDependenceGain` is robust-positive only when `ci95Low > 0`.
- The prior best boundary cell (`interval=24`, `amplitude=0.2`, `phase=0.375`) became robust-negative at longer horizons (`steps=320,420`).
- `relapseEventReduction` is consistently positive, while robust-positive path dependence has not appeared.
- Further phase/horizon retesting of the same cell is now low-yield.

## Project State
- The project has strong experiment instrumentation for falsification, uncertainty, and ranking.
- Recent sessions have converged on rejecting phase-only and horizon-only rescue hypotheses.
- The underdeveloped area is mechanism-axis exploration of spatial disturbance structure (`localRadius`, `localRefugiaFraction`) under CI criteria.

## External Context
- Sayama, *Structural Cellular Hash Chemistry* (arXiv:2412.12790, 2024): reports that non-spatial variants showed complexity growth but lacked spatial ecological interactions, while improved spatial structure recovered both interaction and growth. Source: https://arxiv.org/abs/2412.12790
- Aki et al., *LLM-POET* (arXiv:2406.04663, 2024): richer environment generation improved co-evolution performance by 34% vs. CPPN baselines, supporting mechanism shifts in environment structure. Source: https://arxiv.org/abs/2406.04663

## Research Gaps
- At fixed disturbance schedule (`interval=24`, `amplitude=0.2`, `phase=0.375`, `steps=320`), can any locality regime (`radius`, `refugia`) produce `pathDependenceGain ci95Low > 0`?
- If none does, which locality regime maximizes `ci95Low` while keeping `relapseEventReduction` positive?

## Current Anti-Evidence
- After denser phase sampling and horizon escalation, robust-positive support remains zero and the former boundary candidate turns robust-negative at longer horizons.
- Current evidence still reflects bounded disturbance-response metrics, not sustained long-run innovation dynamics.

## Candidate Bets
- A: Run a bounded locality-regime matrix sweep (`radius in {1,3}`, `refugia in {0.2,0.35,0.5}`) at the fixed disturbance cell and rank by `pathDependenceGain ci95Low`.
  Why now: It tests the highest-leverage untried mechanism axis without adding new code paths.
  Est. low-context human time: 40m
  Expected information gain: high
  Main risk: No robust-positive cell appears, yielding only a best-negative ranking.
- B: Run an amplitude-regime sweep at the same fixed interval/phase/locality to probe shock-strength dependence.
  Why now: Amplitude is another plausible mechanism after phase/horizon falsification.
  Est. low-context human time: 35m
  Expected information gain: medium
  Main risk: Stronger shocks may mostly increase collapse noise rather than memory benefits.
- C: Implement a dedicated locality-axis sweep helper with typed export/tests before running experiments.
  Why now: Improves repeatability for future sessions.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: Session time consumed by tooling before producing new empirical evidence.

## Selected Bet
Execute A: run one deterministic locality-regime sweep on the previously best disturbance cell, then make a CI-based go/no-go decision on whether spatial locality/refugia can rescue path dependence in this regime. Treat the output as either (1) first robust-positive evidence, or (2) ranked anti-evidence that justifies switching to amplitude or new mechanisms next.

## Why This Fits The Horizon
- Uses existing APIs only; no schema or implementation changes are required.
- Success is autonomously verifiable from deterministic JSON/console outputs with explicit CI classifications.

## Success Evidence
- Artifact: a machine-readable sweep result (e.g., `docs/locality_regime_sweep_2026-03-07.json`) containing `radius`, `refugia`, `mean`, `ci95Low`, `ci95High`, `classification`.
- Specific verification command or output: `npm run build && node -e "const fs=require('fs'); const {runDisturbanceGridStudy}=require('./dist/experiment.js'); const radii=[1,3]; const refugia=[0.2,0.35,0.5]; const out=[]; for (const r of radii) for (const f of refugia){ const s=runDisturbanceGridStudy({runs:2,steps:320,analyticsWindow:24,seed:20260307,seedBlocks:4,blockSeedStride:80,intervals:[24],amplitudes:[0.2],phases:[0.375],localRadius:r,localRefugiaFraction:f}); const u=s.cells[0].reproducibility.pathDependenceGainBlockMeanUncertainty; out.push({radius:r,refugia:f,mean:u.mean,ci95Low:u.ci95Low,ci95High:u.ci95High,classification:(u.ci95Low>0?'robustPositive':(u.ci95High<0?'robustNegative':'ambiguous')),relapseReduction:s.cells[0].pairedDeltas.relapseEventReduction.mean}); } out.sort((a,b)=>b.ci95Low-a.ci95Low); fs.writeFileSync('docs/locality_regime_sweep_2026-03-07.json', JSON.stringify(out,null,2)); console.log(JSON.stringify(out,null,2));"`

## Stop Conditions
- Stop after the 6 predefined locality cells; do not add amplitude/phase expansions in the same session.
- If runtime is too high, keep the same 6 cells and reduce to `seedBlocks=3` before changing any other parameter.

## Assumptions / Unknowns
- Assumption: the fixed disturbance cell (`24,0.2,0.375`) is still the right probe point for testing locality-mediated rescue.
- Unknown: whether locality gains, if found, generalize beyond this fixed cell or are narrowly regime-dependent.
