# Session Plan — 2026-03-07

## Compact Context
- `runSpeciesActivityProbe()` already exists and exports deterministic species-level activity windows from `history().species`.
- `docs/species_activity_probe_2026-03-07.json` shows `8/8` post-burn-in windows with non-zero `newActivity` in a `1000`-step baseline run.
- Disturbance/locality instrumentation is mature, but the current spatial story is weak: the fixed-schedule candidate turned robust-negative by `steps>=320`, and the threshold-aware `radius=1` re-sweep returned `0/4` robust-positive cells.
- `runPathDependenceHorizonSweep()` already provides a code pattern for bounded horizon comparisons.
- The repo is currently green under `npm test` and `npm run build`.

## Project State
- The codebase now has deterministic simulation, disturbance/locality studies, export helpers, and a landed species-activity probe with tests.
- Recent sessions moved from resilience/path-dependence falsifiers toward direct novelty instrumentation, and the first activity artifact is positive rather than collapsing inside `1000` steps.
- The key gap is that the activity claim is still one seed, one horizon, and one provisional component definition.

## External Context
- de Pinho and Sinapayen, *A speciation simulation that partly passes open-endedness tests* (arXiv, 2026-03-02): open-endedness conclusions changed materially when cumulative activity was separated from new activity. Source: https://arxiv.org/abs/2603.01701
- Plantec et al., *Flow-Lenia: Emergent evolutionary dynamics in mass conservative continuous cellular automata* (arXiv, 2025-06-10): recent alife work still treats activity-style signals as horizon-sensitive evidence, not as one-shot proof. Source: https://arxiv.org/abs/2506.08569

## Research Gaps
- Does the current positive species-level `newActivity` signal persist across longer deterministic horizons, or does it collapse after the current `1000`-step baseline?

## Current Anti-Evidence
- The only direct novelty evidence is a single `1000`-step species-level run, so the signal could still be an early transient rather than sustained open-endedness.
- `newActivity` currently counts origin-window species occupancy, which can stay positive even if the system is only producing short-lived turnover.

## Candidate Bets
- A: Add a deterministic species-activity horizon sweep over `1000`, `1500`, and `2000` steps using the existing probe output shape.
  Why now: The current positive artifact needs the fastest possible falsifier, and horizon persistence is the most direct one.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: A fixed-seed horizon sweep still leaves cross-seed robustness unresolved.
- B: Add a seed-blocked species-activity reproducibility summary for the current `1000`-step baseline.
  Why now: The project has strong seed-block machinery already, and a single-seed novelty result is weak evidence.
  Est. low-context human time: 55m
  Expected information gain: medium
  Main risk: Replicating a short horizon may still miss later collapse.
- C: Add a persistence-filtered activity metric that only counts new species surviving beyond a minimum age threshold.
  Why now: The current metric may over-credit ephemeral churn.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: The definition work can easily sprawl past the session horizon.

## Selected Bet
Add a bounded species-activity horizon sweep and run it for `1000`, `1500`, and `2000` steps on the existing baseline seed. Reuse `runSpeciesActivityProbe()` and the existing horizon-sweep pattern so the session stays focused on one question: whether post-burn-in novelty remains visibly non-zero as the observation window lengthens.

## Why This Fits The Horizon
- Most of the needed logic already exists; the actor mainly needs a small wrapper, tests, and one JSON export path.
- Success is autonomously verifiable with deterministic outputs plus one artifact that can clearly falsify the current positive story.

## Success Evidence
- Artifact: `docs/species_activity_horizon_sweep_2026-03-07.json` with one row per horizon including `finalNewActivity`, `postBurnInWindowsWithNewActivity`, and `finalNormalizedCumulativeActivity`.
- Verification command or output: `npm test && npm run build`, then inspect whether later horizons keep `finalNewActivity > 0` and non-zero post-burn-in windows instead of collapsing.

## Stop Conditions
- Stop if the sweep starts expanding into block uncertainty or alternative component definitions; ship the fixed-seed horizon comparison first.
- If runtime grows too much, keep exactly three horizons and drop any extra derived metrics before changing experiment families.

## Assumptions / Unknowns
- Assumption: a fixed-seed horizon falsifier is the highest-leverage next check before adding cross-seed uncertainty.
- Unknown: whether sustained positive `newActivity` would still reflect durable innovation rather than high speciation/extinction churn.
