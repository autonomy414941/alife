# GenomeV2 Ecological Context Correlation Pilot — 2026-03-20

## Experiment Design

This pilot extends the GenomeV2 live discovery experiment to test whether high-prevalence extended traits correlate with specific ecological contexts or are uniformly distributed (indicating neutral drift). Per-agent ecological context (fertility bin, local crowding) was tracked at the final tick and trait prevalence was measured across context bins.

### Configuration
- **Seed:** 55555
- **Steps:** 1000
- **Initial population:** 40 agents with GenomeV2 (core traits only)
- **Add loci probability:** 0.02 (default)
- **Remove loci probability:** 0.01
- **Founder grace:** enabled (settlement crowding grace 80 ticks, encounter restraint boost 0.6)
- **Cladogenesis threshold:** 1.0
- **Biome bands:** 4 (biome contrast 0.45)
- **Fertility bins:** 4 (binned from habitat fertility)
- **Crowding bins:** 4 (binned from local neighbor count within radius 2)

## Results

### Core Finding: Extended Traits Show Apparent Context Specificity, But Measurement Has Critical Flaw

All five extended ecological loci appeared and persisted for 949 ticks. At the final tick, 20.6% of agents carried at least one extended trait. However, the ecological context measurement revealed a critical issue: **all 2571 agents ended up in crowding bin 3 (highest crowding)**, making crowding bin analysis uninformative.

| Trait | Overall Prevalence | Enrichment Score | Context-Specific? |
|-------|-------------------|------------------|-------------------|
| metabolic_efficiency_primary | 9.6% | 1.66 | Yes |
| habitat_preference | 7.9% | 1.65 | Yes |
| trophic_level | 4.3% | 1.59 | Yes |
| defense_level | 1.5% | 1.36 | Yes |
| metabolic_efficiency_secondary | 0.4% | 1.04 | Yes |

### Fertility Context Analysis

Agents were distributed across only **two of four fertility bins** (bins 1 and 2, corresponding to medium fertility biomes). All agents avoided the extreme high-fertility (bin 0) and low-fertility (bin 3) bands.

| Fertility Bin | Agent Count | Extended Trait Fraction | Habitat Preference | Trophic Level | Defense Level | Metabolic Efficiency (Primary) | Metabolic Efficiency (Secondary) |
|---------------|-------------|------------------------|-------------------|---------------|---------------|-------------------------------|----------------------------------|
| 0 (highest)   | 0           | —                      | —                 | —             | —             | —                             | —                                |
| 1 (medium-high) | 1279      | 18.3%                  | 7.4%              | 4.3%          | 1.5%          | 7.7%                          | 0.08%                            |
| 2 (medium-low) | 1292       | 22.9%                  | 8.3%              | 4.3%          | 1.5%          | 11.4%                         | 0.77%                            |
| 3 (lowest)    | 0           | —                      | —                 | —             | —             | —                             | —                                |

**Key observation:** Fertility bin 2 (medium-low fertility) had higher extended trait prevalence (22.9% vs 18.3%) and notably higher `metabolic_efficiency_primary` (11.4% vs 7.7%) compared to bin 1. This suggests a modest correlation between extended traits and lower-fertility contexts, but the effect is weak and may reflect neutral drift in a small population rather than genuine ecological advantage.

### Crowding Context Analysis — Critical Flaw

**All 2571 agents ended up in crowding bin 3**, meaning the local neighborhood crowding metric collapsed to a single value across the entire population. This makes crowding-based correlation analysis uninformative.

| Crowding Bin | Agent Count | Extended Trait Fraction |
|--------------|-------------|------------------------|
| 0 (lowest)   | 0           | —                      |
| 1            | 0           | —                      |
| 2            | 0           | —                      |
| 3 (highest)  | 2571        | 20.6%                  |

**Root cause:** The crowding binning formula used `Math.min(crowding / 20, 1)` and then binned `[0, 1)` into 4 bins. With radius 2, most agents have 10-20 neighbors, so `crowding / 20` is already close to 1, sending all agents into the highest bin.

## Interpretation

### What This Pilot Establishes

1. ✅ **Extended traits can appear and persist**: All five ecological loci emerged within 150 ticks and persisted for 949 ticks.
2. ⚠️  **Fertility context shows weak correlation**: `metabolic_efficiency_primary` prevalence was 1.47× higher in medium-low fertility vs medium-high fertility (11.4% vs 7.7%), suggesting a modest ecological effect.
3. ❌ **Crowding context is uninformative**: The crowding metric collapsed to a single bin, so no correlation can be measured.

### What This Pilot Does NOT Establish

- **Ecological causality:** The observed fertility correlation could be neutral drift or founder effects rather than genuine selective advantage.
- **Crowding correlation:** The crowding binning scheme failed to distinguish agents by local density, so the question of whether extended traits concentrate in high-crowding or low-crowding contexts remains unanswered.
- **Encounter outcome correlation:** This pilot did not track per-agent encounter outcomes (energy gain/loss from interactions), so the question of whether extended traits correlate with encounter success is unanswered.

### Evidence Classification

**Result:** Inconclusive, but not null.

- **For ecological relevance:** Fertility bin 2 showed higher extended trait prevalence and notably higher `metabolic_efficiency_primary` than bin 1, consistent with extended traits providing advantage in lower-fertility contexts.
- **Against ecological relevance:** The observed correlation is weak (enrichment score 1.66), the population avoided extreme fertility bins entirely, and the effect may be confounded by spatial founder effects or neutral drift.
- **Measurement failure:** The crowding context metric collapsed to a single bin, providing no information on crowding-based correlation.

## Limitations and Follow-Up

### Critical Measurement Issues

1. **Crowding binning scheme is too coarse:** Using `crowding / 20` with 4 bins creates a ceiling effect where most agents end up in the highest bin. A better approach: normalize by actual observed crowding distribution (e.g., percentile-based binning) or use a finer-grained metric.
2. **No encounter outcome tracking:** This pilot only tracked static context (fertility, crowding) at the final tick. It did not track dynamic outcomes (energy gain from harvesting, energy loss from encounters). Encounter energetics are where `trophic_level` and `defense_level` traits should have the strongest effect.
3. **Final-tick snapshot only:** Measuring context at a single tick may miss temporal dynamics (e.g., extended-trait lineages may start in low-fertility contexts but migrate to high-fertility contexts over time).
4. **Small sample size:** With only 530 extended-trait agents (20.6% of 2571), statistical power to detect weak correlations is limited.
5. **Spatial confounding:** Agents were distributed unevenly across fertility bins (1279 vs 1292, but zero in bins 0 and 3), suggesting that spatial dynamics (dispersal, settlement, reproduction success) may dominate over trait-mediated ecological advantage.

### Recommended Follow-Up

If this bet is revisited:

1. **Fix crowding binning:** Use percentile-based bins or a dynamic range normalization so that agents are distributed across all bins.
2. **Add encounter outcome tracking:** Track per-agent energy gain from harvesting and energy transfer during encounters, then measure whether extended-trait agents (especially `trophic_level`, `defense_level`) have different encounter energetics than core-trait-only agents.
3. **Multi-tick time series:** Sample context and trait prevalence every 100 ticks to detect temporal shifts.
4. **Matched null comparison:** Run a fixed-genome baseline with the same spatial and demographic dynamics, then compare extended-trait prevalence across contexts in GenomeV2 vs fixed-genome populations.

## Next Steps

This pilot **partially addresses Bet 2** but does not fully answer the question:

- **Evidence for ecological relevance:** Modest fertility correlation for `metabolic_efficiency_primary` (11.4% in bin 2 vs 7.7% in bin 1).
- **Evidence against ecological relevance:** Weak effect size, spatial confounding, and measurement failure for crowding context.
- **Remaining uncertainty:** Crowding and encounter outcome correlations are unmeasured.

The current evidence weakly supports ecological relevance but is far from conclusive. Given the session scope constraint ("one focused pilot"), this pilot should be considered complete, and the interpretation should be: **extended traits show weak fertility-context correlation, but stronger evidence (encounter energetics, fixed crowding measurement, matched null) is needed to confirm genuine ecological advantage over neutral drift.**

## Artifact Location

`docs/genome_v2_ecological_context_pilot_2026-03-20.json`
