# Policy-Genome Unification Revalidation (2026-03-25)

Artifact: `docs/policy_genome_unification_revalidation_2026-03-25.json`

## Question
Did policy-genome unification preserve the March 24 bounded behavioral validation surfaces?

## Panel
- Graded reproduction smoke replay against `docs/graded_reproduction_policy_smoke_2026-03-24.txt`
- Substrate spending smoke replay against `docs/substrate_spending_policy_smoke_2026-03-24.json`
- Reduced reproduction-only robustness spot-check (`2` runs x `80` steps) compared to the March 24 stress-test conclusion in `docs/reproduction_policy_robustness_stress_test_2026-03-24.json`

## Result
- `substrate spending`: preserved exactly
- `reproduction-only robustness`: preserved on the reduced panel; signal remains `mixed`
- `graded reproduction`: degraded under the unified architecture

## Key Deltas
- Graded reproduction at steepness `1.0` dropped from `2049` total births to `1210`
- Graded reproduction at steepness `5.0` shifted from `203` total births with gated fraction `0.7225` to `7` total births with gated fraction `1.0000`
- Substrate spending arm outcomes were unchanged to exact numeric equality
- Reduced reproduction-only robustness remained qualitatively ambiguous rather than flipping to robust or reversed

## Interpretation
Policy-genome unification did not broadly break behavioral control, but it did materially change the graded reproduction surface. The most likely cause is not policy-value resolution itself: genome-backed policy flags and spending resolution both pass direct checks, and the spending study is unchanged. The remaining difference is that graded reproduction now runs through the unified `genomeV2` inheritance and mutation path instead of the legacy `policyState` path, so the refactor changed downstream evolutionary dynamics even though two prior mechanisms were preserved.
