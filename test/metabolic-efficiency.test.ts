import { describe, expect, it } from 'vitest';
import { spendAgentEnergy, assignAgentEnergy } from '../src/agent-energy';
import { createGenomeV2, setTrait } from '../src/genome-v2';
import { Agent } from '../src/types';

describe('metabolic efficiency loci', () => {
  it('applies substrate-specific cost modifiers when efficiency loci are present', () => {
    const specialistGenome = createGenomeV2();
    setTrait(specialistGenome, 'metabolic_efficiency_primary', 1.0);
    setTrait(specialistGenome, 'metabolic_efficiency_secondary', 0.2);

    const generalistGenome = createGenomeV2();

    const specialist: Agent = {
      id: 1,
      lineage: 1,
      species: 1,
      x: 0,
      y: 0,
      energy: 100,
      energyPrimary: 50,
      energySecondary: 50,
      age: 0,
      genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 },
      genomeV2: specialistGenome
    };

    const generalist: Agent = {
      id: 2,
      lineage: 2,
      species: 2,
      x: 0,
      y: 0,
      energy: 100,
      energyPrimary: 50,
      energySecondary: 50,
      age: 0,
      genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 },
      genomeV2: generalistGenome
    };

    const specialistSpent = spendAgentEnergy(specialist, 10);
    const generalistSpent = spendAgentEnergy(generalist, 10);

    expect(specialistSpent.primary).toBeCloseTo(0.0, 5);
    expect(specialistSpent.secondary).toBeCloseTo(8.0, 5);
    expect(specialistSpent.total).toBeCloseTo(8.0, 5);

    expect(generalistSpent.primary).toBeCloseTo(5.0, 5);
    expect(generalistSpent.secondary).toBeCloseTo(5.0, 5);
    expect(generalistSpent.total).toBeCloseTo(10.0, 5);

    expect(specialist.energyPrimary).toBeCloseTo(50.0, 5);
    expect(specialist.energySecondary).toBeCloseTo(42.0, 5);

    expect(generalist.energyPrimary).toBeCloseTo(45.0, 5);
    expect(generalist.energySecondary).toBeCloseTo(45.0, 5);
  });

  it('does not apply efficiency modifiers when loci are absent', () => {
    const genomeWithoutEfficiency = createGenomeV2();

    const agent: Agent = {
      id: 1,
      lineage: 1,
      species: 1,
      x: 0,
      y: 0,
      energy: 100,
      energyPrimary: 60,
      energySecondary: 40,
      age: 0,
      genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 },
      genomeV2: genomeWithoutEfficiency
    };

    const spent = spendAgentEnergy(agent, 10);

    expect(spent.primary).toBeCloseTo(6.0, 5);
    expect(spent.secondary).toBeCloseTo(4.0, 5);
    expect(spent.total).toBeCloseTo(10.0, 5);
  });

  it('allows high primary-efficiency specialist to reduce primary-pool drain', () => {
    const highPrimaryEfficiency = createGenomeV2();
    setTrait(highPrimaryEfficiency, 'metabolic_efficiency_primary', 0.9);

    const baseline = createGenomeV2();

    const specialist: Agent = {
      id: 1,
      lineage: 1,
      species: 1,
      x: 0,
      y: 0,
      energy: 100,
      energyPrimary: 100,
      energySecondary: 0,
      age: 0,
      genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 },
      genomeV2: highPrimaryEfficiency
    };

    const baselineAgent: Agent = {
      id: 2,
      lineage: 2,
      species: 2,
      x: 0,
      y: 0,
      energy: 100,
      energyPrimary: 100,
      energySecondary: 0,
      age: 0,
      genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 },
      genomeV2: baseline
    };

    const specialistSpent = spendAgentEnergy(specialist, 20);
    const baselineSpent = spendAgentEnergy(baselineAgent, 20);

    expect(specialistSpent.primary).toBeCloseTo(4.0, 5);
    expect(baselineSpent.primary).toBeCloseTo(20.0, 5);

    expect(specialist.energyPrimary).toBeCloseTo(96.0, 5);
    expect(baselineAgent.energyPrimary).toBeCloseTo(80.0, 5);
  });
});
