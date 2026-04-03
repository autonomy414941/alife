import { describe, it, expect } from 'vitest';
import { LifeSimulation } from '../src/simulation';
import { createGenomeV2, setTrait, genomeV2Distance } from '../src/genome-v2';
import {
  ACTION_PRIORITY_HARVEST_PRIMARY,
  ACTION_PRIORITY_HARVEST_SECONDARY,
  ACTION_THRESHOLD_HARVEST_PRIMARY
} from '../src/action-selection';

describe('action loci quarantine', () => {
  it('does not contribute action loci to distance with default config', () => {
    const sim = new LifeSimulation({ seed: 1 });
    const config = sim.config;

    const a = createGenomeV2();
    setTrait(a, 'metabolism', 0.5);
    setTrait(a, 'harvest', 0.5);
    setTrait(a, 'aggression', 0.5);

    const b = createGenomeV2();
    setTrait(b, 'metabolism', 0.5);
    setTrait(b, 'harvest', 0.5);
    setTrait(b, 'aggression', 0.5);
    setTrait(b, ACTION_PRIORITY_HARVEST_PRIMARY, 0.9);
    setTrait(b, ACTION_PRIORITY_HARVEST_SECONDARY, 0.2);
    setTrait(b, ACTION_THRESHOLD_HARVEST_PRIMARY, 15);

    const distance = genomeV2Distance(a, b, config.genomeV2DistanceWeights);

    expect(distance).toBe(0);
  });

  it('confirms action loci would contribute without quarantine weights', () => {
    const a = createGenomeV2();
    setTrait(a, 'metabolism', 0.5);
    setTrait(a, 'harvest', 0.5);
    setTrait(a, 'aggression', 0.5);

    const b = createGenomeV2();
    setTrait(b, 'metabolism', 0.5);
    setTrait(b, 'harvest', 0.5);
    setTrait(b, 'aggression', 0.5);
    setTrait(b, ACTION_PRIORITY_HARVEST_PRIMARY, 0.9);

    const distanceWithoutQuarantine = genomeV2Distance(a, b, {
      categories: {
        policyBounded: 0.5
      }
    });

    expect(distanceWithoutQuarantine).toBeGreaterThan(0);
  });

  it('does not prevent distance from other policy loci', () => {
    const sim = new LifeSimulation({ seed: 1 });
    const config = sim.config;

    const a = createGenomeV2();
    setTrait(a, 'metabolism', 0.5);
    setTrait(a, 'harvest', 0.5);
    setTrait(a, 'aggression', 0.5);

    const b = createGenomeV2();
    setTrait(b, 'metabolism', 0.5);
    setTrait(b, 'harvest', 0.5);
    setTrait(b, 'aggression', 0.5);
    setTrait(b, 'movement_energy_reserve_threshold', 10);

    const distance = genomeV2Distance(a, b, config.genomeV2DistanceWeights);

    expect(distance).toBeGreaterThan(0);
  });
});
