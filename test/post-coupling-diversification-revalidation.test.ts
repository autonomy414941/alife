import { describe, expect, it } from 'vitest';
import { createGenomeV2, setTrait } from '../src/genome-v2';
import {
  runPostCouplingDiversificationRevalidation
} from '../src/post-coupling-diversification-revalidation';
import {
  summarizePhenotypeDiversity,
  summarizePolicySensitivePhenotypeDiversity
} from '../src/phenotype-diversity';
import { resolveSimulationConfig } from '../src/simulation';
import { Agent } from '../src/types';

function buildAgent(input: {
  id: number;
  species: number;
  harvestSecondaryPreference?: number;
}): Agent {
  const genomeV2 = createGenomeV2();
  setTrait(genomeV2, 'metabolism', 0.5);
  setTrait(genomeV2, 'harvest', 0.5);
  setTrait(genomeV2, 'aggression', 0.5);
  if (input.harvestSecondaryPreference !== undefined) {
    setTrait(genomeV2, 'harvest_secondary_preference', input.harvestSecondaryPreference);
  }

  return {
    id: input.id,
    lineage: input.species,
    species: input.species,
    x: 0,
    y: 0,
    energy: 10,
    age: 0,
    genome: {
      metabolism: 0.5,
      harvest: 0.5,
      aggression: 0.5
    },
    genomeV2
  };
}

describe('post-coupling diversification revalidation', () => {
  it('keeps the default moderate-downweight genomeV2 distance regime active', () => {
    expect(resolveSimulationConfig().genomeV2DistanceWeights).toEqual({
      categories: {
        policyThreshold: 0.25,
        policyBounded: 0.5
      }
    });
  });

  it('detects policy-only differences in the policy-sensitive diversity summary', () => {
    const agents = [
      buildAgent({ id: 1, species: 1, harvestSecondaryPreference: 0 }),
      buildAgent({ id: 2, species: 2, harvestSecondaryPreference: 1 })
    ];

    const phenotypeOnly = summarizePhenotypeDiversity(agents);
    const policySensitive = summarizePolicySensitivePhenotypeDiversity(agents);

    expect(phenotypeOnly.occupiedNiches).toBe(1);
    expect(policySensitive.occupiedNiches).toBe(2);
    expect(policySensitive.effectiveRichness).toBeGreaterThan(phenotypeOnly.effectiveRichness);
  });

  it('produces bounded matched-arm output with policy-sensitive occupancy deltas', () => {
    const artifact = runPostCouplingDiversificationRevalidation({
      seeds: [1234],
      steps: 1,
      windowSize: 1,
      generatedAt: '2026-03-30T00:00:00.000Z'
    });

    expect(artifact.config.distanceWeights).toEqual({
      categories: {
        policyThreshold: 0.25,
        policyBounded: 0.5
      }
    });
    expect(artifact.policyEnabled.runs).toHaveLength(1);
    expect(artifact.policyNeutral.runs).toHaveLength(1);
    expect(artifact.policyEnabled.runs[0]?.seed).toBe(1234);
    expect(artifact.policyNeutral.runs[0]?.seed).toBe(1234);
    expect(artifact.policyEnabled.runs[0]?.policySensitivePhenotypeDiversity).toBeDefined();
    expect(artifact.policyNeutral.aggregate.meanPolicySensitivePhenotypeDiversity).toBeDefined();
    expect(typeof artifact.delta.policySensitiveEffectiveRichness).toBe('number');
    expect(typeof artifact.delta.policySensitiveOccupiedNiches).toBe('number');
    expect(artifact.percentDelta).toHaveProperty('policySensitiveEffectiveRichness');
  });
});
