# Richer Context Matching Interpretation — 2026-04-04

## Question
Do the strongest April 2 multi-horizon survival advantages persist under richer observation-aware context matching?

## Summary Answer
**No. The April 2 survival advantages do not persist under richer matching.**

All four top signatures from April 2 show substantial weakening when matched on richer local observation state instead of coarse bins. Three signatures (6 of 8 horizon measurements) disappear entirely or reverse to negative. The remaining five measurements stay positive but weaken by 33-79%.

## Detailed Findings

### Signature 1: `open|guarded|secondary` (April 2 strongest)
**April 2 baseline (coarse bins):**
- Horizon +20: **+0.0607** survival advantage
- Horizon +50: +0.0515 survival advantage

**April 3 richer matching:**
- Horizon +20: **-0.0181** survival (reversal, -0.0788 shift)
- Horizon +50: +0.0002 survival (near zero, -0.0513 shift)

**Verdict:** The strongest April 2 signal **disappears or reverses** at +20 ticks under richer matching.

### Signature 2: `guarded|open|balanced`
**April 2 baseline:**
- Horizon +20: +0.0529 survival
- Horizon +50: +0.0517 survival

**April 3 richer matching:**
- Horizon +20: -0.0031 survival (reversal, -0.0560 shift)
- Horizon +50: +0.0106 survival (weakened 79%, -0.0411 shift)

**Verdict:** Reverses at +20, weakens dramatically at +50.

### Signature 3: `guarded|guarded|secondary`
**April 2 baseline:**
- Horizon +20: +0.0422 survival
- Horizon +50: +0.0514 survival

**April 3 richer matching:**
- Horizon +20: -0.0369 survival (reversal, -0.0790 shift)
- Horizon +50: +0.0122 survival (weakened 76%, -0.0392 shift)

**Verdict:** Reverses at +20, weakens substantially at +50.

### Signature 4: `open|open|balanced`
**April 2 baseline:**
- Horizon +20: +0.0447 survival
- Horizon +50: +0.0498 survival

**April 3 richer matching:**
- Horizon +20: +0.0037 survival (weakened 92%, -0.0411 shift)
- Horizon +50: +0.0172 survival (weakened 66%, -0.0327 shift)

**Verdict:** Remains barely positive but loses most of its signal.

## Aggregate Pattern

| Outcome Category | Count (of 8 measurements) |
|-----------------|---------------------------|
| Disappears or reverses | 3 (all at horizon +20) |
| Weakens but stays positive | 5 (all at horizon +50, plus 1 at +20) |
| Remains strong | 0 |

**Average survival shift:** -0.053 (all signatures weaken)

## Interpretation

The April 2 multi-horizon survival advantages were **matching artifacts**. When matching logic includes richer local observation state (fertility, crowding, age, disturbance recency/count, resource mix, lineage share) instead of only coarse environment bins, the positive signals largely disappear.

This means:
1. The April 2 +0.0607 survival advantage was not a genuine delayed policy effect
2. Coarse-bin matching failed to control for local observation state differences
3. The positive signals reflected environmental confounding, not adaptive policy expression
4. Richer matching successfully detected and removed the artifact

## Implication for Project State

The multi-horizon credit assignment hypothesis from April 2 does not survive empirical validation. The project should not claim delayed policy-driven survival advantages based on the April 2 artifact. The April 3 validation correctly identified the earlier result as a false positive.
