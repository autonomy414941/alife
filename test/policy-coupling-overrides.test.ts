import { describe, expect, it } from 'vitest';
import { LifeSimulation } from '../src/simulation';
import { INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE } from '../src/behavioral-control';

describe('policy coupling overrides', () => {
  it('can disable harvest guidance while leaving policy-bearing agents present', () => {
    const sim = new LifeSimulation({
      seed: 102,
      config: {
        width: 1,
        height: 1,
        maxResource: 10,
        maxResource2: 10,
        resourceRegen: 0,
        resource2Regen: 0,
        habitatPreferenceStrength: 0,
        trophicForagingPenalty: 0,
        defenseForagingPenalty: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 2,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5, harvestEfficiency2: 1 },
          policyState: new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 1]])
        }
      ],
      policyCoupling: {
        harvestGuidance: false
      }
    });

    sim.setResource(0, 0, 10);
    sim.setResource2(0, 0, 10);
    const summary = sim.step();

    const agent = sim.snapshot().agents[0];
    expect(agent.energyPrimary).toBeCloseTo(2, 10);
    expect(agent.energySecondary).toBeCloseTo(1, 10);
    expect(summary.policyObservability?.activation.harvestPolicyAgentFraction).toBeCloseTo(1, 10);
    expect(summary.policyObservability?.activation.harvestDecisionGuidedFraction).toBeCloseTo(0, 10);
  });
});
