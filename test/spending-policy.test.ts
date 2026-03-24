import { describe, expect, it } from 'vitest';
import { spendAgentEnergy } from '../src/agent-energy';
import { INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE } from '../src/behavioral-control';
import { Agent } from '../src/types';

describe('substrate spending policy', () => {
  it('can preserve secondary reserves by burning primary first', () => {
    const agent = createAgent(10, 10, 0);

    const spent = spendAgentEnergy(agent, 6);

    expect(spent.primary).toBeCloseTo(6, 10);
    expect(spent.secondary).toBeCloseTo(0, 10);
    expect(agent.energyPrimary).toBeCloseTo(4, 10);
    expect(agent.energySecondary).toBeCloseTo(10, 10);
  });

  it('can burn secondary reserves first when configured', () => {
    const agent = createAgent(10, 10, 1);

    const spent = spendAgentEnergy(agent, 6);

    expect(spent.primary).toBeCloseTo(0, 10);
    expect(spent.secondary).toBeCloseTo(6, 10);
    expect(agent.energyPrimary).toBeCloseTo(10, 10);
    expect(agent.energySecondary).toBeCloseTo(4, 10);
  });

  it('falls back to the other reserve when the preferred pool is insufficient', () => {
    const agent = createAgent(2, 8, 0);

    const spent = spendAgentEnergy(agent, 6);

    expect(spent.primary).toBeCloseTo(2, 10);
    expect(spent.secondary).toBeCloseTo(4, 10);
    expect(agent.energyPrimary).toBeCloseTo(0, 10);
    expect(agent.energySecondary).toBeCloseTo(4, 10);
  });
});

function createAgent(
  energyPrimary: number,
  energySecondary: number,
  spendingSecondaryPreference?: number
): Agent {
  return {
    id: 1,
    lineage: 1,
    species: 1,
    x: 0,
    y: 0,
    energy: energyPrimary + energySecondary,
    energyPrimary,
    energySecondary,
    age: 0,
    genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 },
    policyState:
      spendingSecondaryPreference === undefined
        ? undefined
        : new Map([[INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, spendingSecondaryPreference]])
  };
}
