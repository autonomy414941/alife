# Research Agenda

## Current Direction
Shift the next month from adding more graded policy surfaces to making heritable traits actually expressible, measurable, and calibratable. The immediate goal is to build a metadata-driven trait/phenotype layer plus generic observability so new `GenomeV2` loci can affect ecology without bespoke wiring, then use that machinery to test whether richer environmental asymmetry produces genuine ecological differentiation instead of taxonomic inflation.

## Why This Direction
March 26 added graded harvest and distance-weight hooks, but the bounded harvest pilot did not show a monotonic fitness advantage over the binary baseline. More importantly, the live implementation still contains an expression failure: `computeGradedHarvestSecondaryPreference()` returns the same output for `basePreference=0.1` and `basePreference=0.9` under the same threshold and steepness, so the core `harvest_secondary_preference` locus is effectively inert whenever graded harvest is active. That means the current neutrality result is not yet a clean test of whether heritable harvest policy matters.

The broader codebase evidence points to the same ceiling. `GenomeV2` can store arbitrary keys, but mutation, clamping, distance categories, and most ecology operators still depend on hard-coded trait lists and direct reads of a small set of known loci. Recent external context supports prioritizing sharper tests and richer search spaces over more local threshold tuning: Bedau's "Kuhnian Lessons for the Study of Open-Ended Evolution" (Artificial Life, 2024) argues that OEE progress depends on agreed exemplars and decisive tests, and Faldor and Cully's "Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity" (ALIFE 2024) shows current progress concentrating on broader expressive search spaces and diversity-maintaining exploration. I infer from those sources plus the repo's current evidence that the bottleneck is now expression and measurement fidelity, not the absence of one more sigmoid gate.

## Structural Constraints
- `GenomeV2` remains partly declarative only: new loci are still inert until a human threads them through mutation rules, distance categories, and one or more simulator operators
- `StepSummary` and exports include policy observability, but generic genome-wide trait means, spreads, and selection differentials are still missing; the feedback loop still privileges the legacy morphology triad
- `genomeV2DistanceWeights` exists, but there is no calibrated default, so unbounded policy thresholds can still dominate speciation and cladogenesis decisions
- Graded harvest currently bypasses the heritable `harvest_secondary_preference` value once thresholded mode is active, contaminating both policy-fitness and neutrality conclusions
- The environment still presents two largely symmetric resource layers on the same fertility and forcing structure, so even correctly expressed policies may be ecologically washed out by homogeneous payoffs

## Revision History
- 2026-03-27: Pivoted from graded-policy rollout to trait expressivity, observability, and calibration. The March 26 harvest pilot was neutral, and follow-up inspection showed graded harvest currently ignores the heritable base-preference locus under thresholded mode.
- 2026-03-26: Shifted direction from policy-genome unification to graded harvest policy rollout and policy-driven diversification validation. Movement grading landed March 26; harvest was treated as the last binary decision surface. The unbounded policy trait dominance issue and graded reproduction degradation were recognized as structural constraints requiring distance weighting or mutation tuning.
- 2026-03-25: Shifted monthly direction from behavioral-control mechanism rollout to policy-genome unification and policy-driven diversification. March 24 completed graded reproduction and spending policies; the architectural split between `policyState` and `genomeV2.traits` was identified as the highest-leverage ceiling preventing policy loci from driving taxonomic novelty.
