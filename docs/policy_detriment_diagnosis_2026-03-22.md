# Policy Detriment Diagnosis — 2026-03-22

## Question

Why did the 2026-03-21 behavioral policy fitness pilot show detrimental results? Is the failure caused by threshold calibration, one harmful decision surface (movement vs reproduction), or activation imbalance?

## Method

Re-ran the exact 2026-03-21 pilot configuration (6 runs × 300 steps, seed 90210, policyShare 0.5) and collected all 2,045,152 per-agent PolicyFitnessRecords to analyze policy activation patterns, threshold distributions, and per-policy-type fitness outcomes.

## Key Findings

### 1. No Policy Isolation — All Policy Agents Have Both Policies Active

**Critical discovery:** The pilot seeded all policy-positive agents with all three threshold parameters simultaneously:
- `reproduction_harvest_threshold = 0.6`
- `movement_energy_reserve_threshold = 8.0`
- `movement_min_recent_harvest = 0.5`

**Result:**
- Movement-only agents: **0** exposures
- Reproduction-only agents: **0** exposures
- Both-policies agents: **639,731** exposures (100% of policy-positive)

**Implication:** The original pilot **cannot distinguish** whether movement gating, reproduction gating, or their interaction is harmful. The aggregate detriment could come from either policy, both policies conflicting, or threshold miscalibration in one dimension.

### 2. Minimal Threshold Evolution — Mutation Had Little Effect

Initial thresholds vs. observed distributions after 300 steps:

| Threshold | Initial | Mean Observed | Std Dev |
|-----------|---------|---------------|---------|
| Reproduction harvest | 0.6 | 0.580 | 0.069 |
| Movement energy reserve | 8.0 | 8.000 | 0.055 |
| Movement min harvest | 0.5 | 0.490 | 0.062 |

**Implication:** With `policyMutationProbability = 0.12` and `policyMutationMagnitude = 0.15`, thresholds barely drifted from their starting values over 300 steps. The negative fitness signal is testing **one fixed threshold configuration**, not a diversity of policy strategies.

### 3. Direct Fitness Comparison Confirms Detriment

Unmatched aggregate fitness (all records, no binning):

| Metric | Both Policies | No Policies | Delta |
|--------|---------------|-------------|-------|
| Harvest intake | 0.232 | 0.274 | **-0.042** |
| Survival rate | 0.990 | 0.992 | **-0.002** |
| Reproduction rate | 0.0137 | 0.0124 | **+0.0013** |

**Interpretation:**
- Policy agents harvest **15% less** than control agents
- Policy agents survive **0.2% less often**
- Policy agents reproduce **10% more** (but this is offset by lower harvest and survival)

The aggregate harm is driven primarily by **reduced harvest**, which is surprising because neither policy directly affects harvest allocation (harvest is still hard-coded and memoryless).

### 4. Possible Mechanisms for Reduced Harvest

Since policies don't control harvest directly, the harvest deficit must be **indirect**:

#### Movement Gating
- Movement policy vetoes movement when `energy < 8.0` OR `last_harvest < 0.5`
- Initial energy is 12, so the energy threshold (8) may **trap agents in depleted cells** by preventing them from moving to richer areas when their energy dips below 8
- If agents stay in low-fertility cells longer, they harvest less over time

#### Reproduction Gating
- Reproduction policy vetoes reproduction when `last_harvest < 0.6`
- This threshold is **higher than movement's harvest threshold (0.5)**, so reproduction is blocked more often than movement
- Blocked reproduction keeps energy in the parent instead of producing offspring, but the parent may still be in a poor location due to movement gating

#### Interaction Effect
- An agent with both policies enabled may get stuck: movement blocked by energy threshold, harvest stays low, reproduction blocked by harvest threshold
- This creates a **negative feedback loop** where low harvest prevents movement to better cells, which perpetuates low harvest

## Diagnosis

The 2026-03-21 pilot detriment is **not attributable to a single policy surface** because:

1. All policy agents had both movement and reproduction gating active, so the pilot tested their **joint effect**, not their individual contributions
2. Thresholds barely mutated, so the result reflects **one narrow threshold configuration** (movement energy 8.0, movement harvest 0.5, reproduction harvest 0.6)
3. The harm manifests as **reduced harvest**, which is an indirect consequence of movement and/or reproduction gating, not a direct policy failure

## Dominant Failure Mode

**Hypothesis:** Movement energy reserve threshold of 8.0 is **too high** relative to initial energy (12) and metabolic costs, causing agents to stop moving when energy drops moderately, trapping them in low-fertility cells and reducing long-term harvest.

**Supporting evidence:**
- Harvest is the largest negative delta (-0.042, or -15%)
- Policies don't control harvest directly, so reduced harvest must come from **location choice**
- Movement gating is the only policy that affects location

**Alternative hypothesis:** The combination of movement and reproduction gating creates a **lock-in effect** where agents can neither move to better cells nor reproduce out of bad situations, leading to persistent low harvest.

## Recommendations for Next Session

To isolate the failure mode:

1. **Run movement-only and reproduction-only pilots separately** by seeding agents with only one policy active at a time
2. **Test a range of threshold values** instead of one fixed configuration, especially:
   - Movement energy reserve: try 4, 6, 8, 10
   - Movement harvest minimum: try 0.3, 0.5, 0.7
   - Reproduction harvest threshold: try 0.4, 0.6, 0.8
3. **Measure activation rates** (how often policies actually gate decisions) to confirm whether thresholds are blocking actions frequently or rarely
4. **Compare matched bins with decision-time ecology** instead of tick-start fertility/crowding to tighten causal attribution

## Artifacts

- **Diagnosis script:** `src/diagnose-policy-detriment.ts`
- **Raw diagnosis data:** `docs/policy_detriment_diagnosis_2026-03-22.json`
- **Original pilot artifact:** `docs/behavioral_policy_fitness_pilot_2026-03-21.json`
