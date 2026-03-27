# Graded Harvest Base-Preference Revalidation

**Date**: 2026-03-27
**Bet**: Bet 1 - Graded Harvest Base-Preference Inertness

## Question

After fixing graded harvest so `harvest_secondary_preference` remains expressed when thresholded harvest is active, does the March 26 "graded harvest is ecologically neutral" conclusion still hold?

## Fix Check

The live graded-harvest transform now uses `basePreference` as the midpoint at the threshold and grades toward `0` or `1` instead of overwriting the inherited value.

Example with `threshold=5`, `steepness=2`:

| Base preference | Secondary share at primary=2 | Secondary share at primary=5 | Secondary share at primary=8 |
|-----------------|------------------------------|------------------------------|------------------------------|
| 0.1             | 0.583                        | 0.100                        | 0.046                        |
| 0.5             | 0.769                        | 0.500                        | 0.231                        |
| 0.9             | 0.954                        | 0.900                        | 0.417                        |

This restores the missing expression path: identical threshold/steepness settings now produce different harvest shares for different inherited base preferences.

## Bounded Revalidation

Matched panel using the existing fitness-pilot machinery with a shortened horizon:

- Seeds: `42`, `200`
- Steps: `60`
- Steepness: `0` (baseline), `1` (graded)
- Base preferences: `0.1`, `0.5`, `0.9`

| Base preference | Steepness | Avg final pop | Avg pop | Avg births | Avg deaths | Avg energy | Avg species | Avg clades | Avg repro success |
|-----------------|-----------|---------------|---------|------------|------------|------------|-------------|------------|-------------------|
| 0.1             | 0         | 5406.5        | 1822.6  | 5449.5     | 83.0       | 5.24       | 651.5       | 40.0       | 0.985             |
| 0.1             | 1         | 5997.5        | 1999.3  | 6061.0     | 103.5      | 5.01       | 685.0       | 40.0       | 0.983             |
| 0.5             | 0         | 6794.5        | 2294.7  | 6962.5     | 208.0      | 4.66       | 749.5       | 40.0       | 0.971             |
| 0.5             | 1         | 6367.0        | 2199.9  | 6579.5     | 252.5      | 4.82       | 731.5       | 40.0       | 0.963             |
| 0.9             | 0         | 6604.5        | 2199.7  | 6766.5     | 202.0      | 4.82       | 737.5       | 40.0       | 0.971             |
| 0.9             | 1         | 6334.0        | 2228.7  | 6533.5     | 239.5      | 4.71       | 703.0       | 40.0       | 0.965             |

## Interpretation

- The March 26 conclusion was contaminated as a claim about the heritable locus itself; before this fix, the graded path did not actually test `harvest_secondary_preference`.
- After the fix, the locus is mechanically expressed and measurably changes harvest shares.
- In this bounded 60-step revalidation, that restored expression still does **not** produce a clear monotonic fitness advantage across base-preference values.
- The best short-horizon graded result here is `basePreference=0.1`, not a smooth trend across `0.1 -> 0.5 -> 0.9`, so the current evidence still points toward weak or context-dependent ecological effect rather than a strong selective gradient.

## Decision

Revise the March 26 claim to:

> graded harvest remains provisionally near-neutral in the current symmetric ecology, but the original neutrality result was not a valid test of `harvest_secondary_preference` because the graded expression path was inert.

The fix removes the expression bug. A future full-horizon rerun can test whether the same qualitative result survives at the original 150-step scale.
