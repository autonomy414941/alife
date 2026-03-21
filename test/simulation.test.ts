import { describe, expect, it } from 'vitest';
import {
  INTERNAL_STATE_LAST_HARVEST,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST
} from '../src/behavioral-control';
import { EncounterOperator } from '../src/encounter';
import { shouldFoundNewClade } from '../src/settlement-cladogenesis';
import { LifeSimulation } from '../src/simulation';

type InternalTestAgent = {
  id: number;
  lineage: number;
  species: number;
  x: number;
  y: number;
  energy: number;
  genome: { metabolism: number; harvest: number; aggression: number };
};

describe('LifeSimulation', () => {
  it('is deterministic with the same seed', () => {
    const a = new LifeSimulation({ seed: 42 });
    const b = new LifeSimulation({ seed: 42 });

    a.run(40);
    b.run(40);

    expect(a.snapshot()).toEqual(b.snapshot());
  });

  it('creates mutated offspring when reproduction triggers', () => {
    const sim = new LifeSimulation({
      seed: 7,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0.3,
        speciationThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    const before = sim.snapshot().agents[0].genome;
    const summary = sim.step();
    const after = sim.snapshot().agents;

    expect(summary.births).toBe(1);
    expect(after).toHaveLength(2);

    const child = after.find((agent) => agent.age === 0);
    const parent = after.find((agent) => agent.age === 1);
    expect(child).toBeDefined();
    expect(parent).toBeDefined();
    expect(child!.lineage).toBe(parent!.lineage);
    expect(child!.species).not.toBe(parent!.species);
    expect(summary.activeSpecies).toBe(2);
    expect(summary.activeClades).toBe(1);

    const delta =
      Math.abs(child!.genome.metabolism - before.metabolism) +
      Math.abs(child!.genome.harvest - before.harvest) +
      Math.abs(child!.genome.aggression - before.aggression);

    expect(delta).toBeGreaterThan(0);
  });

  it('preserves default reproduction behavior when no behavioral policy is configured', () => {
    const sim = new LifeSimulation({
      seed: 17,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0,
        speciationThreshold: 10,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    const summary = sim.step();
    const agents = sim.snapshot().agents;

    expect(summary.births).toBe(1);
    expect(agents).toHaveLength(2);
    expect(agents.every((agent) => agent.internalState === undefined)).toBe(true);
  });

  it('can gate reproduction on per-agent last-harvest state', () => {
    const policyState = new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 1]]);
    const createSimulation = (resource: number) => {
      const sim = new LifeSimulation({
        seed: 19,
        config: {
          width: 1,
          height: 1,
          maxResource: 2,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 2,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0,
          speciationThreshold: 10,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 20,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
            internalState: policyState
          }
        ]
      });
      sim.setResource(0, 0, resource);
      return sim;
    };

    const blocked = createSimulation(0);
    const blockedSummary = blocked.step();
    const blockedParent = blocked.snapshot().agents[0];

    expect(blockedSummary.births).toBe(0);
    expect(blockedParent.internalState?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(0);

    const enabled = createSimulation(2);
    const enabledSummary = enabled.step();
    const enabledAgents = enabled.snapshot().agents;
    const enabledParent = enabledAgents.find((agent) => agent.age === 1);
    const child = enabledAgents.find((agent) => agent.age === 0);

    expect(enabledSummary.births).toBe(1);
    expect(enabledParent?.internalState?.get(INTERNAL_STATE_LAST_HARVEST) ?? 0).toBeGreaterThanOrEqual(1);
    const childPolicyThreshold = child?.internalState?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD);
    expect(childPolicyThreshold).toBeDefined();
    expect(childPolicyThreshold).toBeGreaterThan(0);
    expect(child?.internalState?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(0);
  });

  it('inherits and mutates policy parameters during reproduction', () => {
    const policyState = new Map([
      [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0.5],
      [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 10.0],
      [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, 0.5]
    ]);

    const sim = new LifeSimulation({
      seed: 123,
      config: {
        width: 1,
        height: 1,
        maxResource: 10,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 10,
        reproduceThreshold: 10,
        reproduceProbability: 1.0,
        offspringEnergyFraction: 0.4,
        policyMutationProbability: 1.0,
        policyMutationMagnitude: 0.5,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 20,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          internalState: policyState
        }
      ]
    });

    sim.setResource(0, 0, 10);
    sim.step();

    const agents = sim.snapshot().agents;
    const parent = agents.find((agent) => agent.age === 1);
    const child = agents.find((agent) => agent.age === 0);

    expect(agents).toHaveLength(2);
    expect(child).toBeDefined();

    const childRepThreshold = child?.internalState?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD);
    const childMoveReserve = child?.internalState?.get(INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD);
    const childMoveHarvest = child?.internalState?.get(INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST);

    expect(childRepThreshold).toBeDefined();
    expect(childMoveReserve).toBeDefined();
    expect(childMoveHarvest).toBeDefined();

    expect(childRepThreshold).not.toBe(0.5);
    expect(childMoveReserve).not.toBe(10.0);
    expect(childMoveHarvest).not.toBe(0.5);

    expect(childRepThreshold).toBeGreaterThan(0);
    expect(childMoveReserve).toBeGreaterThan(0);
    expect(childMoveHarvest).toBeGreaterThan(0);

    expect(child?.internalState?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(0);
  });

  it('skips policy mutation when probability is zero', () => {
    const policyState = new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0.5]]);

    const sim = new LifeSimulation({
      seed: 456,
      config: {
        width: 1,
        height: 1,
        maxResource: 10,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 10,
        reproduceThreshold: 10,
        reproduceProbability: 1.0,
        offspringEnergyFraction: 0.4,
        policyMutationProbability: 0,
        policyMutationMagnitude: 10.0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 20,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          internalState: policyState
        }
      ]
    });

    sim.setResource(0, 0, 10);
    sim.step();

    const child = sim.snapshot().agents.find((agent) => agent.age === 0);
    expect(child?.internalState?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(0.5);
  });

  it('preserves default movement behavior when no movement policy is configured', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 1,
        maxResource: 5,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 5,
        reproduceThreshold: 100,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    sim.setResource(2, 0, 5);
    sim.step();

    const agent = sim.snapshot().agents[0];
    expect(agent.x).toBeGreaterThan(0);
  });

  it('blocks movement when energy is below the energy reserve threshold', () => {
    const policyState = new Map([[INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 15]]);
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 1,
        maxResource: 5,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 5,
        reproduceThreshold: 100,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          internalState: policyState
        }
      ]
    });

    sim.setResource(2, 0, 5);
    sim.step();

    const agent = sim.snapshot().agents[0];
    expect(agent.x).toBe(0);
    expect(agent.energy).toBeLessThan(15);
  });

  it('allows movement when energy exceeds the energy reserve threshold', () => {
    const policyState = new Map([[INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 5]]);
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 1,
        maxResource: 5,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 5,
        reproduceThreshold: 100,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          internalState: policyState
        }
      ]
    });

    sim.setResource(2, 0, 5);
    sim.step();

    const agent = sim.snapshot().agents[0];
    expect(agent.x).toBeGreaterThan(0);
  });

  it('blocks movement when recent harvest is below the minimum threshold', () => {
    const policyState = new Map([[INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, 3]]);
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 1,
        maxResource: 1,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 5,
        reproduceThreshold: 100,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          internalState: policyState
        }
      ]
    });

    sim.setResource(0, 0, 1);
    sim.setResource(2, 0, 5);
    sim.step();

    const agent = sim.snapshot().agents[0];
    expect(agent.x).toBe(0);
    expect(agent.internalState?.get(INTERNAL_STATE_LAST_HARVEST) ?? 0).toBeLessThan(3);
  });

  it('allows movement when recent harvest exceeds the minimum threshold', () => {
    const policyState = new Map([
      [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, 2],
      [INTERNAL_STATE_LAST_HARVEST, 3]
    ]);
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 1,
        maxResource: 5,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 5,
        reproduceThreshold: 100,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          internalState: policyState
        }
      ]
    });

    sim.setResource(2, 0, 5);
    sim.step();

    const agent = sim.snapshot().agents[0];
    expect(agent.x).toBeGreaterThan(0);
  });

  it('summarizes policy prevalence, gate rates, and outcome correlations in step summaries', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 2,
        height: 1,
        maxResource: 5,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 5,
        reproduceThreshold: 1,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          internalState: new Map([
            [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2],
            [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 15],
            [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, 2]
          ])
        },
        {
          x: 1,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    sim.setResource(0, 0, 1);
    sim.setResource(1, 0, 5);

    const summary = sim.step();
    const policyObservability = summary.policyObservability;

    expect(policyObservability).toBeDefined();
    expect(policyObservability?.activation.anyPolicyAgentFraction).toBeCloseTo(0.5, 10);
    expect(policyObservability?.activation.movementPolicyAgentFraction).toBeCloseTo(0.5, 10);
    expect(policyObservability?.activation.reproductionPolicyAgentFraction).toBeCloseTo(0.5, 10);
    expect(policyObservability?.activation.decisionGatedFraction).toBeCloseTo(0.5, 10);
    expect(policyObservability?.activation.movementDecisionGatedFraction).toBeCloseTo(0.5, 10);
    expect(policyObservability?.activation.reproductionDecisionGatedFraction).toBeCloseTo(0.5, 10);

    const reproductionThreshold = policyObservability?.parameters.find(
      (parameter) => parameter.key === INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD
    );
    const movementReserveThreshold = policyObservability?.parameters.find(
      (parameter) => parameter.key === INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD
    );
    const movementHarvestThreshold = policyObservability?.parameters.find(
      (parameter) => parameter.key === INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST
    );

    expect(reproductionThreshold).toMatchObject({
      prevalence: 0.5,
      mean: 2,
      variance: 0
    });
    expect(movementReserveThreshold).toMatchObject({
      prevalence: 0.5,
      mean: 15,
      variance: 0
    });
    expect(movementHarvestThreshold).toMatchObject({
      prevalence: 0.5,
      mean: 2,
      variance: 0
    });
    expect(reproductionThreshold?.outcomeCorrelation.harvestIntake).toBeCloseTo(-1, 10);
    expect(reproductionThreshold?.outcomeCorrelation.survivalRate).toBe(0);
    expect(reproductionThreshold?.outcomeCorrelation.reproductionRate).toBe(0);
  });

  it('records founder habitat context for initial and newly founded taxa in history exports', () => {
    const sim = new LifeSimulation({
      seed: 7,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0.2,
        speciationThreshold: 0,
        cladogenesisThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    sim.step();
    const history = sim.history();

    expect(history.clades).toHaveLength(2);
    expect(history.species).toHaveLength(2);
    expect(history.clades.every((clade) => clade.founderContext !== undefined)).toBe(true);
    expect(history.species.every((species) => species.founderContext !== undefined)).toBe(true);
    expect(history.clades[0]?.founderContext).toMatchObject({
      habitatMean: 1,
      habitatBin: 1,
      localCrowdingMean: 1,
      localCrowdingBin: 1,
      founderCount: 1
    });
    expect(history.clades[1]?.firstSeenTick).toBe(1);
    expect(history.clades[1]?.founderContext).toMatchObject({
      habitatMean: 1,
      habitatBin: 1,
      localCrowdingMean: 2,
      localCrowdingBin: 2,
      founderCount: 1
    });
    expect(history.species[1]?.firstSeenTick).toBe(1);
    expect(history.species[1]?.founderContext).toMatchObject({
      habitatMean: 1,
      habitatBin: 1,
      localCrowdingMean: 2,
      localCrowdingBin: 2,
      founderCount: 1
    });
  });

  it('can found a new clade from a speciation event when cladogenesis is enabled', () => {
    const sim = new LifeSimulation({
      seed: 7,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0.3,
        speciationThreshold: 0,
        cladogenesisThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    const summary = sim.step();
    const agents = sim.snapshot().agents;
    const child = agents.find((agent) => agent.age === 0);
    const parent = agents.find((agent) => agent.age === 1);
    const clades = sim.history().clades;

    expect(summary.births).toBe(1);
    expect(child).toBeDefined();
    expect(parent).toBeDefined();
    expect(child!.species).not.toBe(parent!.species);
    expect(child!.lineage).not.toBe(parent!.lineage);
    expect(summary.activeSpecies).toBe(2);
    expect(summary.activeClades).toBe(2);
    expect(clades).toHaveLength(2);
    expect(clades[1]).toMatchObject({
      id: child!.lineage,
      firstSeenTick: 1,
      totalBirths: 1,
      totalDeaths: 0,
      peakPopulation: 1
    });
  });

  it('lets aggressive agents steal energy in shared cells', () => {
    const sim = new LifeSimulation({
      seed: 11,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 1 },
          lineage: 1
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0 },
          lineage: 2
        }
      ]
    });

    sim.step();
    const agents = sim.snapshot().agents;

    const dominant = agents.find((agent) => agent.lineage === 1)!;
    const passive = agents.find((agent) => agent.lineage === 2)!;

    expect(dominant.energy).toBeGreaterThan(10);
    expect(passive.energy).toBeLessThan(10);
  });

  it('reduces encounter transfer only for same-lineage targets when restraint is enabled', () => {
    const sharedConfig = {
      width: 1,
      height: 1,
      maxResource: 0,
      resourceRegen: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      maxAge: 100,
      predationPressure: 0,
      defenseMitigation: 0,
      trophicForagingPenalty: 0,
      defenseForagingPenalty: 0
    };

    const sameLineageNeutral = new LifeSimulation({
      seed: 24,
      config: {
        ...sharedConfig,
        lineageEncounterRestraint: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 1 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });
    const sameLineageRestrained = new LifeSimulation({
      seed: 24,
      config: {
        ...sharedConfig,
        lineageEncounterRestraint: 1
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 1 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });
    const splitLineagesRestrained = new LifeSimulation({
      seed: 24,
      config: {
        ...sharedConfig,
        lineageEncounterRestraint: 1
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 1 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 2,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sameLineageNeutral.step();
    sameLineageRestrained.step();
    splitLineagesRestrained.step();

    const neutralAggressor = sameLineageNeutral.snapshot().agents.find((agent) => agent.genome.aggression === 1);
    const neutralTarget = sameLineageNeutral.snapshot().agents.find((agent) => agent.genome.aggression === 0);
    const restrainedAggressor = sameLineageRestrained.snapshot().agents.find((agent) => agent.genome.aggression === 1);
    const restrainedTarget = sameLineageRestrained.snapshot().agents.find((agent) => agent.genome.aggression === 0);
    const splitAggressor = splitLineagesRestrained.snapshot().agents.find((agent) => agent.genome.aggression === 1);
    const splitTarget = splitLineagesRestrained.snapshot().agents.find((agent) => agent.genome.aggression === 0);

    expect(neutralAggressor).toBeDefined();
    expect(neutralTarget).toBeDefined();
    expect(restrainedAggressor).toBeDefined();
    expect(restrainedTarget).toBeDefined();
    expect(splitAggressor).toBeDefined();
    expect(splitTarget).toBeDefined();

    expect(neutralAggressor!.energy).toBeCloseTo(12.75, 10);
    expect(neutralTarget!.energy).toBeCloseTo(7.25, 10);
    expect(restrainedAggressor!.energy).toBeCloseTo(11.375, 10);
    expect(restrainedTarget!.energy).toBeCloseTo(8.625, 10);
    expect(splitAggressor!.energy).toBeCloseTo(12.75, 10);
    expect(splitTarget!.energy).toBeCloseTo(7.25, 10);
  });

  it('allows the encounter operator to be replaced without changing simulation config', () => {
    const sharedConfig = {
      width: 1,
      height: 1,
      maxResource: 0,
      resourceRegen: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      maxAge: 100,
      predationPressure: 0,
      defenseMitigation: 0,
      trophicForagingPenalty: 0,
      defenseForagingPenalty: 0
    };
    const initialAgents = [
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 1,
        species: 1,
        genome: { metabolism: 1, harvest: 1, aggression: 1 }
      },
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 2,
        species: 2,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      }
    ];
    const visitedCellSizes: number[] = [];
    const noOpEncounterOperator: EncounterOperator = (agentsInCell) => {
      visitedCellSizes.push(agentsInCell.length);
    };

    const defaultSim = new LifeSimulation({
      seed: 24,
      config: sharedConfig,
      initialAgents
    });
    const customSim = new LifeSimulation({
      seed: 24,
      config: sharedConfig,
      initialAgents,
      encounterOperator: noOpEncounterOperator
    });

    defaultSim.step();
    customSim.step();

    const defaultAggressor = defaultSim.snapshot().agents.find((agent) => agent.genome.aggression === 1);
    const defaultTarget = defaultSim.snapshot().agents.find((agent) => agent.genome.aggression === 0);
    const customAggressor = customSim.snapshot().agents.find((agent) => agent.genome.aggression === 1);
    const customTarget = customSim.snapshot().agents.find((agent) => agent.genome.aggression === 0);

    expect(visitedCellSizes).toEqual([2]);
    expect(defaultAggressor?.energy).toBeGreaterThan(10);
    expect(defaultTarget?.energy).toBeLessThan(10);
    expect(customAggressor?.energy).toBe(10);
    expect(customTarget?.energy).toBe(10);
  });

  it('reduces abiotic harvest for high-trophic species', () => {
    const sim = new LifeSimulation({
      seed: 14,
      config: {
        width: 4,
        height: 1,
        maxResource: 10,
        resourceRegen: 0,
        biomeBands: 1,
        biomeContrast: 0,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        dispersalPressure: 0,
        harvestCap: 2,
        reproduceProbability: 0,
        maxAge: 100,
        habitatPreferenceStrength: 0,
        trophicForagingPenalty: 0.8,
        defenseForagingPenalty: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 2,
          y: 0,
          energy: 10,
          lineage: 2,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 1 }
        }
      ]
    });

    for (let x = 0; x < 4; x += 1) {
      sim.setResource(x, 0, 0);
    }
    sim.setResource(0, 0, 2);
    sim.setResource(2, 0, 2);

    sim.step();
    const agents = sim.snapshot().agents;
    const lowTrophic = agents.find((agent) => agent.species === 1);
    const highTrophic = agents.find((agent) => agent.species === 2);

    expect(lowTrophic).toBeDefined();
    expect(highTrophic).toBeDefined();
    expect(lowTrophic!.energy).toBeCloseTo(11.64, 10);
    expect(highTrophic!.energy).toBeCloseTo(10.52, 10);
    expect(lowTrophic!.energy).toBeGreaterThan(highTrophic!.energy);
  });

  it('reduces abiotic harvest only when same-lineage neighbors are present', () => {
    const sharedConfig = {
      width: 1,
      height: 1,
      maxResource: 2,
      resourceRegen: 0,
      biomeBands: 1,
      biomeContrast: 0,
      decompositionBase: 0,
      decompositionEnergyFraction: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      dispersalPressure: 0,
      habitatPreferenceStrength: 0,
      trophicForagingPenalty: 0,
      defenseForagingPenalty: 0,
      harvestCap: 1,
      reproduceProbability: 0,
      maxAge: 100
    };

    const sameLineageNeutral = new LifeSimulation({
      seed: 21,
      config: {
        ...sharedConfig,
        lineageHarvestCrowdingPenalty: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });
    const sameLineageCrowded = new LifeSimulation({
      seed: 21,
      config: {
        ...sharedConfig,
        lineageHarvestCrowdingPenalty: 1
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });
    const splitLineagesCrowded = new LifeSimulation({
      seed: 21,
      config: {
        ...sharedConfig,
        lineageHarvestCrowdingPenalty: 1
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 2,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sameLineageNeutral.setResource(0, 0, 2);
    sameLineageCrowded.setResource(0, 0, 2);
    splitLineagesCrowded.setResource(0, 0, 2);

    sameLineageNeutral.step();
    sameLineageCrowded.step();
    splitLineagesCrowded.step();

    const neutralEnergies = sameLineageNeutral.snapshot().agents.map((agent) => agent.energy);
    const crowdedEnergies = sameLineageCrowded.snapshot().agents.map((agent) => agent.energy);
    const splitEnergies = splitLineagesCrowded.snapshot().agents.map((agent) => agent.energy);
    const neutralTotalEnergy = neutralEnergies.reduce((sum, energy) => sum + energy, 0);
    const crowdedTotalEnergy = crowdedEnergies.reduce((sum, energy) => sum + energy, 0);
    const splitTotalEnergy = splitEnergies.reduce((sum, energy) => sum + energy, 0);

    expect(neutralTotalEnergy).toBeCloseTo(22, 10);
    expect(crowdedTotalEnergy).toBeCloseTo(21, 10);
    expect(splitTotalEnergy).toBeCloseTo(22, 10);
  });

  it('temporarily boosts same-lineage encounter restraint for just-founded clades', () => {
    const buildSimulation = (newCladeEncounterRestraintGraceBoost: number, firstSeenTick: number) => {
      const sim = new LifeSimulation({
        seed: 212,
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceProbability: 0,
          newCladeSettlementCrowdingGraceTicks: 4,
          newCladeEncounterRestraintGraceBoost,
          lineageEncounterRestraint: 1,
          predationPressure: 0,
          defenseMitigation: 0,
          trophicForagingPenalty: 0,
          defenseForagingPenalty: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 10,
            lineage: 2,
            species: 2,
            genome: { metabolism: 1, harvest: 1, aggression: 1 }
          },
          {
            x: 0,
            y: 0,
            energy: 10,
            lineage: 2,
            species: 2,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          }
        ]
      });

      const internal = sim as unknown as {
        tickCount: number;
        cladeHistory: Map<
          number,
          {
            id: number;
            firstSeenTick: number;
            extinctTick: number | null;
            totalBirths: number;
            totalDeaths: number;
            peakPopulation: number;
            lastPopulation: number;
            timeline: Array<{ tick: number; population: number; births: number; deaths: number }>;
          }
        >;
      };

      internal.tickCount = 1;
      internal.cladeHistory.set(2, {
        id: 2,
        firstSeenTick,
        extinctTick: null,
        totalBirths: 2,
        totalDeaths: 0,
        peakPopulation: 2,
        lastPopulation: 2,
        timeline: [{ tick: Math.max(0, firstSeenTick), population: 2, births: 2, deaths: 0 }]
      });
      return sim;
    };

    const withoutRelief = buildSimulation(0, 1);
    const expiredRelief = buildSimulation(1, 0);
    const withRelief = buildSimulation(2, 1);

    withoutRelief.step();
    expiredRelief.step();
    withRelief.step();

    const withoutReliefDominant = withoutRelief.snapshot().agents.find((agent) => agent.genome.aggression === 1);
    const expiredReliefDominant = expiredRelief.snapshot().agents.find((agent) => agent.genome.aggression === 1);
    const withReliefDominant = withRelief.snapshot().agents.find((agent) => agent.genome.aggression === 1);
    const withReliefTarget = withRelief.snapshot().agents.find((agent) => agent.genome.aggression === 0);

    expect(withoutReliefDominant?.energy).toBeCloseTo(11.375, 10);
    expect(expiredReliefDominant?.energy).toBeCloseTo(11.375, 10);
    expect(withReliefDominant?.energy).toBeCloseTo(10.6875, 10);
    expect(withReliefTarget?.energy).toBeCloseTo(9.3125, 10);
  });

  it('steers dispersal away from same-lineage crowding when the penalty is enabled', () => {
    const sharedConfig = {
      width: 5,
      height: 3,
      maxResource: 2,
      resourceRegen: 0,
      biomeBands: 1,
      biomeContrast: 0,
      decompositionBase: 0,
      decompositionEnergyFraction: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      dispersalPressure: 0,
      dispersalRadius: 1,
      habitatPreferenceStrength: 0,
      trophicForagingPenalty: 0,
      defenseForagingPenalty: 0,
      lineageHarvestCrowdingPenalty: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      maxAge: 100
    };
    const initialAgents = [
      {
        x: 2,
        y: 1,
        energy: 10,
        lineage: 1,
        species: 1,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      },
      {
        x: 3,
        y: 1,
        energy: 10,
        lineage: 1,
        species: 1,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      }
    ];

    const withoutPenalty = new LifeSimulation({
      seed: 22,
      config: {
        ...sharedConfig,
        lineageDispersalCrowdingPenalty: 0
      },
      initialAgents
    });
    const withPenalty = new LifeSimulation({
      seed: 22,
      config: {
        ...sharedConfig,
        lineageDispersalCrowdingPenalty: 1
      },
      initialAgents
    });

    for (const sim of [withoutPenalty, withPenalty]) {
      for (let y = 0; y < sharedConfig.height; y += 1) {
        for (let x = 0; x < sharedConfig.width; x += 1) {
          sim.setResource(x, y, 0);
        }
      }
      sim.setResource(3, 1, 1.6);
      sim.setResource(1, 1, 1);
    }

    withoutPenalty.step();
    withPenalty.step();

    const withoutPenaltyFocal = withoutPenalty.snapshot().agents.find((agent) => agent.id === 1);
    const withPenaltyFocal = withPenalty.snapshot().agents.find((agent) => agent.id === 1);
    const withPenaltyAnchor = withPenalty.snapshot().agents.find((agent) => agent.id === 2);

    expect(withoutPenaltyFocal).toMatchObject({ x: 3, y: 1 });
    expect(withPenaltyFocal).toMatchObject({ x: 1, y: 1 });
    expect(withPenaltyAnchor).toMatchObject({ x: 3, y: 1 });
  });

  it('steers offspring settlement away from same-lineage crowding when the penalty is enabled', () => {
    const sim = new LifeSimulation({
      seed: 23,
      config: {
        width: 5,
        height: 1,
        maxResource: 6,
        resourceRegen: 0,
        biomeBands: 1,
        biomeContrast: 0,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        dispersalPressure: 0,
        dispersalRadius: 1,
        habitatPreferenceStrength: 0,
        trophicForagingPenalty: 0,
        defenseForagingPenalty: 0,
        lineageHarvestCrowdingPenalty: 0,
        lineageDispersalCrowdingPenalty: 0,
        lineageOffspringSettlementCrowdingPenalty: 1,
        harvestCap: 0,
        reproduceProbability: 0,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0,
        speciationThreshold: 1,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 2,
          y: 0,
          energy: 30,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 1,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 1,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const internal = sim as unknown as {
      agents: Array<{
        id: number;
        lineage: number;
        species: number;
        x: number;
        y: number;
        energy: number;
        genome: { metabolism: number; harvest: number; aggression: number };
      }>;
      buildOccupancyGrid: (agents?: Array<{ x: number; y: number }>) => number[][];
      buildLineageOccupancyGrid: (
        agents?: Array<{ lineage: number; x: number; y: number }>
      ) => Map<number, number[][]>;
      reproduce: (
        parent: {
          id: number;
          lineage: number;
          species: number;
          x: number;
          y: number;
          energy: number;
          genome: { metabolism: number; harvest: number; aggression: number };
        },
        occupancy: number[][],
        lineageOccupancy: Map<number, number[][]>
      ) => {
        lineage: number;
        species: number;
        x: number;
        y: number;
      };
    };

    const parent = internal.agents[0];
    const occupancy = internal.buildOccupancyGrid(internal.agents);
    const lineageOccupancy = internal.buildLineageOccupancyGrid(internal.agents);
    const child = internal.reproduce(parent, occupancy, lineageOccupancy);

    expect(child).toMatchObject({
      lineage: 1,
      species: 1,
      x: 3,
      y: 0
    });
  });

  it('can enable ecology-scored offspring settlement without lineage settlement crowding', () => {
    const buildSimulation = (offspringSettlementEcologyScoring: boolean) =>
      new LifeSimulation({
        seed: 2,
        config: {
          width: 5,
          height: 1,
          maxResource: 6,
          resourceRegen: 0,
          biomeBands: 1,
          biomeContrast: 0,
          decompositionBase: 0,
          decompositionEnergyFraction: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          dispersalPressure: 1,
          dispersalRadius: 1,
          habitatPreferenceStrength: 0,
          trophicForagingPenalty: 0,
          defenseForagingPenalty: 0,
          lineageHarvestCrowdingPenalty: 0,
          lineageDispersalCrowdingPenalty: 0,
          lineageOffspringSettlementCrowdingPenalty: 0,
          offspringSettlementEcologyScoring,
          harvestCap: 0,
          reproduceProbability: 0,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0,
          speciationThreshold: 1,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 2,
            y: 0,
            energy: 30,
            lineage: 1,
            species: 1,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          },
          {
            x: 1,
            y: 0,
            energy: 10,
            lineage: 2,
            species: 1,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          },
          {
            x: 1,
            y: 0,
            energy: 10,
            lineage: 3,
            species: 1,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          }
        ]
      });

    const reproduceChild = (sim: LifeSimulation) => {
      const internal = sim as unknown as {
        agents: Array<{
          id: number;
          lineage: number;
          species: number;
          x: number;
          y: number;
          energy: number;
          genome: { metabolism: number; harvest: number; aggression: number };
        }>;
        buildOccupancyGrid: (agents?: Array<{ x: number; y: number }>) => number[][];
        buildLineageOccupancyGrid: (
          agents?: Array<{ lineage: number; x: number; y: number }>
        ) => Map<number, number[][]>;
        reproduce: (
          parent: {
            id: number;
            lineage: number;
            species: number;
            x: number;
            y: number;
            energy: number;
            genome: { metabolism: number; harvest: number; aggression: number };
          },
          occupancy: number[][],
          lineageOccupancy: Map<number, number[][]>
        ) => {
          lineage: number;
          species: number;
          x: number;
          y: number;
        };
      };

      for (let x = 0; x < 5; x += 1) {
        sim.setResource(x, 0, x === 3 ? 5 : 0);
      }

      const parent = internal.agents[0];
      const occupancy = internal.buildOccupancyGrid(internal.agents);
      const lineageOccupancy = internal.buildLineageOccupancyGrid(internal.agents);
      return internal.reproduce(parent, occupancy, lineageOccupancy);
    };

    const withoutScoring = reproduceChild(buildSimulation(false));
    const withScoring = reproduceChild(buildSimulation(true));

    expect(withoutScoring).toMatchObject({
      lineage: 1,
      species: 1,
      x: 2,
      y: 0
    });
    expect(withScoring).toMatchObject({
      lineage: 1,
      species: 1,
      x: 3,
      y: 0
    });
  });

  it('only relaxes same-lineage settlement crowding for just-founded clades', () => {
    const reproduceChild = (newCladeSettlementCrowdingGraceTicks: number, firstSeenTick: number) => {
      const sim = new LifeSimulation({
        seed: 41,
        config: {
          width: 5,
          height: 1,
          maxResource: 6,
          resourceRegen: 0,
          biomeBands: 1,
          biomeContrast: 0,
          decompositionBase: 0,
          decompositionEnergyFraction: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          dispersalPressure: 2,
          dispersalRadius: 1,
          habitatPreferenceStrength: 0,
          trophicForagingPenalty: 0,
          defenseForagingPenalty: 0,
          lineageHarvestCrowdingPenalty: 0,
          lineageDispersalCrowdingPenalty: 0,
          lineageOffspringSettlementCrowdingPenalty: 0,
          newCladeSettlementCrowdingGraceTicks,
          offspringSettlementEcologyScoring: true,
          harvestCap: 0,
          reproduceProbability: 0,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0,
          speciationThreshold: 1,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 2,
            y: 0,
            energy: 30,
            lineage: 2,
            species: 2,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          },
          {
            x: 3,
            y: 0,
            energy: 10,
            lineage: 2,
            species: 2,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          }
        ]
      });

      const internal = sim as unknown as {
        agents: InternalTestAgent[];
        tickCount: number;
        cladeHistory: Map<
          number,
          {
            id: number;
            firstSeenTick: number;
            extinctTick: number | null;
            totalBirths: number;
            totalDeaths: number;
            peakPopulation: number;
            lastPopulation: number;
            timeline: Array<{ tick: number; population: number; births: number; deaths: number }>;
          }
        >;
        buildOccupancyGrid: (agents?: Array<Pick<InternalTestAgent, 'x' | 'y'>>) => number[][];
        buildLineageOccupancyGrid: (
          agents?: Array<Pick<InternalTestAgent, 'lineage' | 'x' | 'y'>>
        ) => Map<number, number[][]>;
        reproduce: (
          parent: InternalTestAgent,
          occupancy: number[][],
          lineageOccupancy: Map<number, number[][]>
        ) => {
          lineage: number;
          species: number;
          x: number;
          y: number;
        };
      };

      sim.setResource(1, 0, 1.4);
      sim.setResource(2, 0, 0);
      sim.setResource(3, 0, 1.8);
      internal.tickCount = 1;
      internal.cladeHistory.set(2, {
        id: 2,
        firstSeenTick,
        extinctTick: null,
        totalBirths: 2,
        totalDeaths: 0,
        peakPopulation: 2,
        lastPopulation: 2,
        timeline: [{ tick: Math.max(0, firstSeenTick), population: 2, births: 2, deaths: 0 }]
      });

      return internal.reproduce(
        internal.agents[0]!,
        internal.buildOccupancyGrid(internal.agents),
        internal.buildLineageOccupancyGrid(internal.agents)
      );
    };

    expect(reproduceChild(0, 1)).toMatchObject({ lineage: 2, species: 2, x: 1, y: 0 });
    expect(reproduceChild(3, 0)).toMatchObject({ lineage: 2, species: 2, x: 1, y: 0 });
    expect(reproduceChild(3, 1)).toMatchObject({ lineage: 2, species: 2, x: 3, y: 0 });
  });

  it('temporarily boosts offspring settlement into freshly disturbed cells', () => {
    const buildSimulation = () =>
      new LifeSimulation({
        seed: 31,
        config: {
          width: 5,
          height: 1,
          maxResource: 6,
          resourceRegen: 0,
          biomeBands: 1,
          biomeContrast: 0,
          decompositionBase: 0,
          decompositionEnergyFraction: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          dispersalPressure: 0,
          dispersalRadius: 1,
          habitatPreferenceStrength: 0,
          trophicForagingPenalty: 0,
          defenseForagingPenalty: 0,
          lineageHarvestCrowdingPenalty: 0,
          lineageDispersalCrowdingPenalty: 0,
          lineageOffspringSettlementCrowdingPenalty: 0,
          offspringSettlementEcologyScoring: true,
          disturbanceSettlementOpeningTicks: 2,
          disturbanceSettlementOpeningBonus: 1,
          harvestCap: 0,
          reproduceProbability: 0,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0,
          speciationThreshold: 1,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 2,
            y: 0,
            energy: 30,
            lineage: 1,
            species: 1,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          }
        ]
      });

    const reproduceChild = (tickCount: number, affectedCellIndices?: ReadonlySet<number>) => {
      const sim = buildSimulation();
      const internal = sim as unknown as {
        agents: InternalTestAgent[];
        tickCount: number;
        buildOccupancyGrid: (agents?: Array<Pick<InternalTestAgent, 'x' | 'y'>>) => number[][];
        markDisturbanceSettlementOpenings: (affectedCellIndices: ReadonlySet<number>, stepTick: number) => void;
        reproduce: (
          parent: InternalTestAgent,
          occupancy: number[][],
          lineageOccupancy: Map<number, number[][]> | undefined
        ) => {
          x: number;
          y: number;
        };
      };

      sim.setResource(0, 0, 0);
      sim.setResource(1, 0, 1.2);
      sim.setResource(2, 0, 0);
      sim.setResource(3, 0, 1.6);
      sim.setResource(4, 0, 0);
      internal.tickCount = tickCount;
      if (affectedCellIndices) {
        internal.markDisturbanceSettlementOpenings(affectedCellIndices, 1);
      }

      return internal.reproduce(internal.agents[0], internal.buildOccupancyGrid(internal.agents), undefined);
    };

    expect(reproduceChild(0)).toMatchObject({ x: 3, y: 0 });
    expect(reproduceChild(0, new Set([1]))).toMatchObject({ x: 1, y: 0 });
    expect(reproduceChild(2, new Set([1]))).toMatchObject({ x: 3, y: 0 });
  });

  it('limits disturbed settlement openings to lineages that are locally absent', () => {
    const buildSimulation = (initialAgents: Array<Omit<InternalTestAgent, 'id'>>) =>
      new LifeSimulation({
        seed: 32,
        config: {
          width: 5,
          height: 1,
          maxResource: 6,
          resourceRegen: 0,
          biomeBands: 1,
          biomeContrast: 0,
          decompositionBase: 0,
          decompositionEnergyFraction: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          dispersalPressure: 0,
          dispersalRadius: 1,
          habitatPreferenceStrength: 0,
          trophicForagingPenalty: 0,
          defenseForagingPenalty: 0,
          lineageHarvestCrowdingPenalty: 0,
          lineageDispersalCrowdingPenalty: 0,
          lineageOffspringSettlementCrowdingPenalty: 0,
          offspringSettlementEcologyScoring: true,
          disturbanceSettlementOpeningTicks: 2,
          disturbanceSettlementOpeningBonus: 1,
          disturbanceSettlementOpeningLineageAbsentOnly: true,
          harvestCap: 0,
          reproduceProbability: 0,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0,
          speciationThreshold: 1,
          maxAge: 100
        },
        initialAgents
      });

    const reproduceChild = (initialAgents: Array<Omit<InternalTestAgent, 'id'>>) => {
      const sim = buildSimulation(initialAgents);
      const internal = sim as unknown as {
        agents: InternalTestAgent[];
        tickCount: number;
        buildOccupancyGrid: (agents?: Array<Pick<InternalTestAgent, 'x' | 'y'>>) => number[][];
        buildLineageOccupancyGrid: (
          agents?: Array<Pick<InternalTestAgent, 'lineage' | 'x' | 'y'>>
        ) => Map<number, number[][]>;
        markDisturbanceSettlementOpenings: (affectedCellIndices: ReadonlySet<number>, stepTick: number) => void;
        reproduce: (
          parent: InternalTestAgent,
          occupancy: number[][],
          lineageOccupancy: Map<number, number[][]> | undefined
        ) => {
          x: number;
          y: number;
        };
      };

      sim.setResource(0, 0, 0);
      sim.setResource(1, 0, 1.2);
      sim.setResource(2, 0, 0);
      sim.setResource(3, 0, 1.6);
      sim.setResource(4, 0, 0);
      internal.tickCount = 0;
      internal.markDisturbanceSettlementOpenings(new Set([1]), 1);

      return internal.reproduce(
        internal.agents[0],
        internal.buildOccupancyGrid(internal.agents),
        internal.buildLineageOccupancyGrid(internal.agents)
      );
    };

    expect(
      reproduceChild([
        {
          x: 2,
          y: 0,
          energy: 30,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ])
    ).toMatchObject({ x: 1, y: 0 });

    expect(
      reproduceChild([
        {
          x: 2,
          y: 0,
          energy: 30,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 1,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ])
    ).toMatchObject({ x: 3, y: 0 });
  });

  it('preserves clade founding when the cladogenesis ecology gate is disabled', () => {
    const sim = new LifeSimulation({
      seed: 3,
      config: {
        width: 5,
        height: 1,
        maxResource: 6,
        resourceRegen: 0,
        biomeBands: 1,
        biomeContrast: 0,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        dispersalPressure: 0,
        dispersalRadius: 1,
        habitatPreferenceStrength: 0,
        trophicForagingPenalty: 0,
        defenseForagingPenalty: 0,
        lineageHarvestCrowdingPenalty: 0,
        lineageDispersalCrowdingPenalty: 0,
        lineageOffspringSettlementCrowdingPenalty: 0,
        offspringSettlementEcologyScoring: true,
        cladogenesisEcologyAdvantageThreshold: -1,
        harvestCap: 0,
        reproduceProbability: 0,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0,
        speciationThreshold: 0,
        cladogenesisThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 2,
          y: 0,
          energy: 30,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const internal = sim as unknown as {
      agents: Array<{
        id: number;
        lineage: number;
        species: number;
        x: number;
        y: number;
        energy: number;
        genome: { metabolism: number; harvest: number; aggression: number };
      }>;
      buildOccupancyGrid: (agents?: Array<{ x: number; y: number }>) => number[][];
      buildLineageOccupancyGrid: (
        agents?: Array<{ lineage: number; x: number; y: number }>
      ) => Map<number, number[][]>;
      reproduce: (
        parent: {
          id: number;
          lineage: number;
          species: number;
          x: number;
          y: number;
          energy: number;
          genome: { metabolism: number; harvest: number; aggression: number };
        },
        occupancy: number[][],
        lineageOccupancy: Map<number, number[][]>
      ) => {
        lineage: number;
        species: number;
        x: number;
        y: number;
      };
    };

    for (let x = 0; x < 5; x += 1) {
      sim.setResource(x, 0, 0);
    }
    sim.setResource(2, 0, 4);
    sim.setResource(3, 0, 5);

    const parent = internal.agents[0];
    const occupancy = internal.buildOccupancyGrid(internal.agents);
    const lineageOccupancy = internal.buildLineageOccupancyGrid(internal.agents);
    const child = internal.reproduce(parent, occupancy, lineageOccupancy);

    expect(child).toMatchObject({
      lineage: 2,
      species: 2,
      x: 3,
      y: 0
    });
  });

  it('requires the configured ecology advantage before a diverged offspring founds a new clade', () => {
    const buildSimulation = (cladogenesisEcologyAdvantageThreshold: number) =>
      new LifeSimulation({
        seed: 3,
        config: {
          width: 5,
          height: 1,
          maxResource: 6,
          resourceRegen: 0,
          biomeBands: 1,
          biomeContrast: 0,
          decompositionBase: 0,
          decompositionEnergyFraction: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          dispersalPressure: 0,
          dispersalRadius: 1,
          habitatPreferenceStrength: 0,
          trophicForagingPenalty: 0,
          defenseForagingPenalty: 0,
          lineageHarvestCrowdingPenalty: 0,
          lineageDispersalCrowdingPenalty: 0,
          lineageOffspringSettlementCrowdingPenalty: 0,
          offspringSettlementEcologyScoring: true,
          cladogenesisEcologyAdvantageThreshold,
          harvestCap: 0,
          reproduceProbability: 0,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0,
          speciationThreshold: 0,
          cladogenesisThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 2,
            y: 0,
            energy: 30,
            lineage: 1,
            species: 1,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          }
        ]
      });

    const reproduceChild = (sim: LifeSimulation) => {
      const internal = sim as unknown as {
        agents: Array<{
          id: number;
          lineage: number;
          species: number;
          x: number;
          y: number;
          energy: number;
          genome: { metabolism: number; harvest: number; aggression: number };
        }>;
        buildOccupancyGrid: (agents?: Array<{ x: number; y: number }>) => number[][];
        buildLineageOccupancyGrid: (
          agents?: Array<{ lineage: number; x: number; y: number }>
        ) => Map<number, number[][]>;
        reproduce: (
          parent: {
            id: number;
            lineage: number;
            species: number;
            x: number;
            y: number;
            energy: number;
            genome: { metabolism: number; harvest: number; aggression: number };
          },
          occupancy: number[][],
          lineageOccupancy: Map<number, number[][]>
        ) => {
          lineage: number;
          species: number;
          x: number;
          y: number;
        };
      };

      for (let x = 0; x < 5; x += 1) {
        sim.setResource(x, 0, 0);
      }
      sim.setResource(2, 0, 4);
      sim.setResource(3, 0, 5);

      const parent = internal.agents[0];
      const occupancy = internal.buildOccupancyGrid(internal.agents);
      const lineageOccupancy = internal.buildLineageOccupancyGrid(internal.agents);
      return internal.reproduce(parent, occupancy, lineageOccupancy);
    };

    const blocked = reproduceChild(buildSimulation(1.1));
    const allowed = reproduceChild(buildSimulation(0.5));

    expect(blocked).toMatchObject({
      lineage: 1,
      species: 2,
      x: 3,
      y: 0
    });
    expect(allowed).toMatchObject({
      lineage: 2,
      species: 2,
      x: 3,
      y: 0
    });
  });

  it('requires the configured trait novelty before a diverged offspring founds a new clade', () => {
    const buildSimulation = (cladogenesisTraitNoveltyThreshold: number) =>
      new LifeSimulation({
        seed: 3,
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceProbability: 0,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0,
          speciationThreshold: 0,
          cladogenesisThreshold: 0,
          cladogenesisTraitNoveltyThreshold,
          cladogenesisEcologyAdvantageThreshold: -1,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 30,
            lineage: 1,
            species: 1,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          }
        ]
      });

    const canFoundClade = (sim: LifeSimulation) => {
      const internal = sim as unknown as {
        config: {
          cladogenesisThreshold: number;
          cladogenesisTraitNoveltyThreshold: number;
          cladogenesisEcologyAdvantageThreshold: number;
        };
        cladeFounderGenome: Map<number, { metabolism: number; harvest: number; aggression: number }>;
        cladeHabitatPreference: Map<number, number>;
        speciesHabitatPreference: Map<number, number>;
        speciesTrophicLevel: Map<number, number>;
        speciesDefenseLevel: Map<number, number>;
        getCladeTrophicLevel: (lineage: number) => number;
        getCladeDefenseLevel: (lineage: number) => number;
      };

      const founderGenome = { metabolism: 0.3, harvest: 2.8, aggression: 1 };
      internal.cladeFounderGenome.set(1, founderGenome);
      internal.cladeHabitatPreference.set(1, 1);
      internal.speciesHabitatPreference.set(2, 1.57);
      internal.speciesTrophicLevel.set(2, 1);
      internal.speciesDefenseLevel.set(2, 0.3);

      return shouldFoundNewClade({
        config: internal.config,
        parentLineage: 1,
        diverged: true,
        childGenome: founderGenome,
        settlementAgent: {
          lineage: 1,
          species: 2,
          x: 0,
          y: 0,
          genome: founderGenome
        },
        childPos: { x: 0, y: 0 },
        settlementContext: undefined,
        genomeDistance: () => 1,
        getCladeFounderGenome: (lineage) => internal.cladeFounderGenome.get(lineage)!,
        getSpeciesHabitatPreference: (species) => internal.speciesHabitatPreference.get(species) ?? 1,
        getCladeHabitatPreference: (lineage) => internal.cladeHabitatPreference.get(lineage) ?? 1,
        getSpeciesTrophicLevel: (species) => internal.speciesTrophicLevel.get(species) ?? 0,
        getCladeTrophicLevel: (lineage) => internal.getCladeTrophicLevel(lineage),
        getSpeciesDefenseLevel: (species) => internal.speciesDefenseLevel.get(species) ?? 0,
        getCladeDefenseLevel: (lineage) => internal.getCladeDefenseLevel(lineage),
        resolveSettlementContext: () => undefined,
        localEcologyScore: () => 0
      });
    };

    expect(canFoundClade(buildSimulation(0.31))).toBe(false);
    expect(canFoundClade(buildSimulation(0.29))).toBe(true);
  });

  it('amplifies encounter transfer when predation pressure is enabled', () => {
    const baseConfig = {
      width: 1,
      height: 1,
      maxResource: 0,
      resourceRegen: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      maxAge: 100,
      trophicForagingPenalty: 0
    };
    const initialAgents = [
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 1,
        species: 1,
        genome: { metabolism: 1, harvest: 1, aggression: 1 }
      },
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 2,
        species: 2,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      }
    ];

    const noPressure = new LifeSimulation({
      seed: 15,
      config: {
        ...baseConfig,
        predationPressure: 0
      },
      initialAgents
    });
    const withPressure = new LifeSimulation({
      seed: 15,
      config: {
        ...baseConfig,
        predationPressure: 1.2
      },
      initialAgents
    });

    noPressure.step();
    withPressure.step();

    const noPressurePredator = noPressure.snapshot().agents.find((agent) => agent.species === 1)!;
    const noPressurePrey = noPressure.snapshot().agents.find((agent) => agent.species === 2)!;
    const withPressurePredator = withPressure.snapshot().agents.find((agent) => agent.species === 1)!;
    const withPressurePrey = withPressure.snapshot().agents.find((agent) => agent.species === 2)!;

    expect(withPressurePredator.energy).toBeGreaterThan(noPressurePredator.energy);
    expect(withPressurePrey.energy).toBeLessThan(noPressurePrey.energy);
  });

  it('reduces encounter transfer when prey defense mitigation is enabled', () => {
    const baseConfig = {
      width: 1,
      height: 1,
      maxResource: 0,
      resourceRegen: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      maxAge: 100,
      predationPressure: 1.2,
      trophicForagingPenalty: 0,
      defenseForagingPenalty: 0
    };
    const initialAgents = [
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 1,
        species: 1,
        genome: { metabolism: 1, harvest: 1, aggression: 1 }
      },
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 2,
        species: 2,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      }
    ];

    const noMitigation = new LifeSimulation({
      seed: 16,
      config: {
        ...baseConfig,
        defenseMitigation: 0
      },
      initialAgents
    });
    const withMitigation = new LifeSimulation({
      seed: 16,
      config: {
        ...baseConfig,
        defenseMitigation: 0.9
      },
      initialAgents
    });

    noMitigation.step();
    withMitigation.step();

    const noMitigationPredator = noMitigation.snapshot().agents.find((agent) => agent.species === 1)!;
    const noMitigationPrey = noMitigation.snapshot().agents.find((agent) => agent.species === 2)!;
    const withMitigationPredator = withMitigation.snapshot().agents.find((agent) => agent.species === 1)!;
    const withMitigationPrey = withMitigation.snapshot().agents.find((agent) => agent.species === 2)!;

    expect(withMitigationPredator.energy).toBeLessThan(noMitigationPredator.energy);
    expect(withMitigationPrey.energy).toBeGreaterThan(noMitigationPrey.energy);
  });

  it('lets clade interaction coupling change encounter outcomes for same-species agents in different lineages', () => {
    const baseConfig = {
      width: 1,
      height: 1,
      maxResource: 0,
      resourceRegen: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      maxAge: 100,
      predationPressure: 0,
      defenseMitigation: 0.9,
      trophicForagingPenalty: 0,
      defenseForagingPenalty: 0
    };
    const initialAgents = [
      {
        x: 0,
        y: 0,
        energy: 1,
        age: 100,
        lineage: 1,
        species: 1,
        genome: { metabolism: 2.2, harvest: 1, aggression: 0 }
      },
      {
        x: 0,
        y: 0,
        energy: 1,
        age: 100,
        lineage: 2,
        species: 1,
        genome: { metabolism: 0.3, harvest: 1, aggression: 1 }
      },
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 1,
        species: 1,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      },
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 2,
        species: 1,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      },
      {
        x: 0,
        y: 0,
        energy: 10,
        lineage: 3,
        species: 2,
        genome: { metabolism: 1, harvest: 1, aggression: 1 }
      }
    ];

    const neutral = new LifeSimulation({
      seed: 19,
      config: {
        ...baseConfig,
        cladeInteractionCoupling: 0
      },
      initialAgents
    });
    const coupled = new LifeSimulation({
      seed: 19,
      config: {
        ...baseConfig,
        cladeInteractionCoupling: 1
      },
      initialAgents
    });

    neutral.step();
    coupled.step();

    const neutralLineage1 = neutral.snapshot().agents.find((agent) => agent.lineage === 1)!;
    const neutralLineage2 = neutral.snapshot().agents.find((agent) => agent.lineage === 2)!;
    const coupledLineage1 = coupled.snapshot().agents.find((agent) => agent.lineage === 1)!;
    const coupledLineage2 = coupled.snapshot().agents.find((agent) => agent.lineage === 2)!;

    expect(neutralLineage1.energy).toBeCloseTo(neutralLineage2.energy, 10);
    expect(coupledLineage1.energy).toBeGreaterThan(neutralLineage1.energy);
    expect(coupledLineage2.energy).toBeLessThan(neutralLineage2.energy);
    expect(coupledLineage1.energy).toBeGreaterThan(coupledLineage2.energy);
  });

  it('applies foraging tradeoff pressure to high-defense species', () => {
    const sim = new LifeSimulation({
      seed: 18,
      config: {
        width: 4,
        height: 1,
        maxResource: 10,
        resourceRegen: 0,
        biomeBands: 1,
        biomeContrast: 0,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        dispersalPressure: 0,
        harvestCap: 2,
        reproduceProbability: 0,
        maxAge: 100,
        habitatPreferenceStrength: 0,
        trophicForagingPenalty: 0,
        defenseForagingPenalty: 0.8
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 2,
          y: 0,
          energy: 10,
          lineage: 2,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 1 }
        }
      ]
    });

    for (let x = 0; x < 4; x += 1) {
      sim.setResource(x, 0, 0);
    }
    sim.setResource(0, 0, 2);
    sim.setResource(2, 0, 2);

    sim.step();
    const agents = sim.snapshot().agents;
    const highDefense = agents.find((agent) => agent.species === 1);
    const lowDefense = agents.find((agent) => agent.species === 2);

    expect(highDefense).toBeDefined();
    expect(lowDefense).toBeDefined();
    expect(highDefense!.energy).toBeCloseTo(10.753684210526316, 10);
    expect(lowDefense!.energy).toBeCloseTo(11.793684210526316, 10);
    expect(highDefense!.energy).toBeLessThan(lowDefense!.energy);
  });

  it('applies dispersal pressure to spread agents out of crowded neighborhoods', () => {
    const initialAgents = Array.from({ length: 5 }, (_, index) => ({
      x: 2,
      y: 0,
      energy: 10,
      species: index + 1,
      genome: { metabolism: 1, harvest: 1, aggression: 0 }
    }));
    const sharedConfig = {
      width: 5,
      height: 1,
      maxResource: 2,
      resourceRegen: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      maxAge: 100,
      dispersalRadius: 1
    };

    const noPressure = new LifeSimulation({
      seed: 13,
      config: {
        ...sharedConfig,
        dispersalPressure: 0
      },
      initialAgents
    });
    const withPressure = new LifeSimulation({
      seed: 13,
      config: {
        ...sharedConfig,
        dispersalPressure: 2.5
      },
      initialAgents
    });

    for (let x = 0; x < 5; x += 1) {
      noPressure.setResource(x, 0, 0);
      withPressure.setResource(x, 0, 0);
    }
    noPressure.setResource(2, 0, 1);
    withPressure.setResource(2, 0, 1);

    noPressure.step();
    withPressure.step();

    const occupiedWithoutPressure = new Set(noPressure.snapshot().agents.map((agent) => agent.x)).size;
    const occupiedWithPressure = new Set(withPressure.snapshot().agents.map((agent) => agent.x)).size;

    expect(occupiedWithoutPressure).toBe(1);
    expect(occupiedWithPressure).toBeGreaterThan(1);
    expect(withPressure.analytics(1).locality.occupiedCellFraction).toBeGreaterThan(
      noPressure.analytics(1).locality.occupiedCellFraction
    );
  });

  it('recycles dead agents into local resources for survivors', () => {
    const sim = new LifeSimulation({
      seed: 17,
      config: {
        width: 1,
        height: 1,
        maxResource: 10,
        resourceRegen: 0,
        decompositionBase: 2,
        decompositionEnergyFraction: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 2,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 5,
          genome: { metabolism: 0.3, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 0.2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });
    sim.setResource(0, 0, 0);

    const tick1 = sim.step();
    const energyAfterTick1 = sim.snapshot().agents[0]!.energy;
    const tick2 = sim.step();
    const energyAfterTick2 = sim.snapshot().agents[0]!.energy;

    expect(tick1.deaths).toBe(1);
    expect(tick1.population).toBe(1);
    expect(energyAfterTick1).toBeCloseTo(4.7, 10);
    expect(tick2.population).toBe(1);
    expect(energyAfterTick2).toBeGreaterThan(energyAfterTick1 + 1);
  });

  it('spills recycled biomass into wrapped cardinal neighbors while conserving the deposited total before clamping', () => {
    const sim = new LifeSimulation({
      seed: 29,
      config: {
        width: 3,
        height: 3,
        maxResource: 100,
        resourceRegen: 0,
        biomeContrast: 0,
        decompositionBase: 8,
        decompositionEnergyFraction: 0,
        decompositionSpilloverFraction: 0.5,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 1,
          y: 1,
          energy: 0.5,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        sim.setResource(x, y, 0);
      }
    }

    const summary = sim.step();
    let totalResources = 0;
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        totalResources += sim.getResource(x, y);
      }
    }

    expect(summary.deaths).toBe(1);
    expect(summary.population).toBe(0);
    expect(sim.getResource(1, 1)).toBeCloseTo(4, 10);
    expect(sim.getResource(2, 1)).toBeCloseTo(1, 10);
    expect(sim.getResource(0, 1)).toBeCloseTo(1, 10);
    expect(sim.getResource(1, 2)).toBeCloseTo(1, 10);
    expect(sim.getResource(1, 0)).toBeCloseTo(1, 10);
    expect(sim.getResource(0, 0)).toBeCloseTo(0, 10);
    expect(sim.getResource(2, 0)).toBeCloseTo(0, 10);
    expect(sim.getResource(0, 2)).toBeCloseTo(0, 10);
    expect(sim.getResource(2, 2)).toBeCloseTo(0, 10);
    expect(totalResources).toBeCloseTo(8, 10);
  });

  it('keeps the second resource layer inert when its regeneration is zero', () => {
    const baseline = new LifeSimulation({
      seed: 84,
      config: {
        width: 4,
        height: 4,
        maxResource: 8,
        resourceRegen: 0.4,
        metabolismCostBase: 0.2,
        moveCost: 0.1,
        reproduceProbability: 0,
        maxAge: 20
      }
    });
    const zeroRegenSecondLayer = new LifeSimulation({
      seed: 84,
      config: {
        width: 4,
        height: 4,
        maxResource: 8,
        maxResource2: 8,
        resourceRegen: 0.4,
        resource2Regen: 0,
        metabolismCostBase: 0.2,
        moveCost: 0.1,
        reproduceProbability: 0,
        maxAge: 20
      }
    });

    baseline.run(10);
    zeroRegenSecondLayer.run(10);

    expect(zeroRegenSecondLayer.snapshot()).toEqual(baseline.snapshot());
  });

  it('lets harvestEfficiency2 increase payoff from the second resource layer', () => {
    const config = {
      width: 1,
      height: 1,
      maxResource: 0,
      maxResource2: 10,
      resourceRegen: 0,
      resource2Regen: 1,
      metabolismCostBase: 0,
      moveCost: 0,
      harvestCap: 1,
      reproduceProbability: 0,
      maxAge: 100
    };
    const lowEfficiency = new LifeSimulation({
      seed: 85,
      config,
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 0.1,
          genome: { metabolism: 1, harvest: 0.4, aggression: 0, harvestEfficiency2: 0.4 }
        }
      ]
    });
    const highEfficiency = new LifeSimulation({
      seed: 85,
      config,
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 0.1,
          genome: { metabolism: 1, harvest: 0.4, aggression: 0, harvestEfficiency2: 2.8 }
        }
      ]
    });

    lowEfficiency.setResource2(0, 0, 4);
    highEfficiency.setResource2(0, 0, 4);

    lowEfficiency.step();
    highEfficiency.step();

    expect(highEfficiency.snapshot().agents[0]?.energy ?? 0).toBeGreaterThan(lowEfficiency.snapshot().agents[0]?.energy ?? 0);
    expect(highEfficiency.getResource2(0, 0)).toBeLessThan(lowEfficiency.getResource2(0, 0));
  });

  it('applies disturbance loss to the second resource layer', () => {
    const sim = new LifeSimulation({
      seed: 86,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        maxResource2: 10,
        resourceRegen: 0,
        resource2Regen: 0,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        initialAgents: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 1,
        disturbanceResourceLoss: 0.25
      }
    });
    sim.setResource2(0, 0, 8);

    sim.step();

    expect(sim.getResource2(0, 0)).toBeCloseTo(6, 10);
  });

  it('applies biome fertility to per-cell resource regeneration', () => {
    const sim = new LifeSimulation({
      seed: 21,
      config: {
        width: 6,
        height: 6,
        maxResource: 100,
        resourceRegen: 1,
        biomeBands: 3,
        biomeContrast: 0.8,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        initialAgents: 0,
        reproduceProbability: 0,
        maxAge: 100
      }
    });

    const minCell = { x: 0, y: 0, fertility: Number.POSITIVE_INFINITY };
    const maxCell = { x: 0, y: 0, fertility: Number.NEGATIVE_INFINITY };

    for (let y = 0; y < 6; y += 1) {
      for (let x = 0; x < 6; x += 1) {
        sim.setResource(x, y, 0);
        const fertility = sim.getBiomeFertility(x, y);
        if (fertility < minCell.fertility) {
          minCell.x = x;
          minCell.y = y;
          minCell.fertility = fertility;
        }
        if (fertility > maxCell.fertility) {
          maxCell.x = x;
          maxCell.y = y;
          maxCell.fertility = fertility;
        }
      }
    }

    expect(maxCell.fertility).toBeGreaterThan(minCell.fertility);

    sim.step();

    expect(sim.getResource(maxCell.x, maxCell.y)).toBeCloseTo(maxCell.fertility, 10);
    expect(sim.getResource(minCell.x, minCell.y)).toBeCloseTo(minCell.fertility, 10);
  });

  it('applies seasonal regeneration forcing and exposes forcing analytics', () => {
    const sim = new LifeSimulation({
      seed: 60,
      config: {
        width: 1,
        height: 1,
        maxResource: 100,
        resourceRegen: 1,
        biomeBands: 1,
        biomeContrast: 0,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        initialAgents: 0,
        reproduceProbability: 0,
        maxAge: 100,
        seasonalCycleLength: 4,
        seasonalRegenAmplitude: 0.5,
        seasonalFertilityContrastAmplitude: 0
      }
    });
    sim.setResource(0, 0, 0);

    const resources: number[] = [];
    const regenMultipliers: number[] = [];
    const phases: number[] = [];

    for (let i = 0; i < 4; i += 1) {
      sim.step();
      resources.push(sim.getResource(0, 0));
      const forcing = sim.analytics(1).forcing;
      regenMultipliers.push(forcing.regenMultiplier);
      phases.push(forcing.phase);
    }

    expect(resources[0]).toBeCloseTo(1, 10);
    expect(resources[1]).toBeCloseTo(2.5, 10);
    expect(resources[2]).toBeCloseTo(3.5, 10);
    expect(resources[3]).toBeCloseTo(4, 10);
    expect(regenMultipliers[0]).toBeCloseTo(1, 10);
    expect(regenMultipliers[1]).toBeCloseTo(1.5, 10);
    expect(regenMultipliers[2]).toBeCloseTo(1, 10);
    expect(regenMultipliers[3]).toBeCloseTo(0.5, 10);
    expect(phases[0]).toBeCloseTo(0, 10);
    expect(phases[1]).toBeCloseTo(0.25, 10);
    expect(phases[2]).toBeCloseTo(0.5, 10);
    expect(phases[3]).toBeCloseTo(0.75, 10);
  });

  it('modulates fertility contrast across seasonal phases', () => {
    const sim = new LifeSimulation({
      seed: 61,
      config: {
        width: 6,
        height: 6,
        maxResource: 100,
        resourceRegen: 1,
        biomeBands: 3,
        biomeContrast: 0.8,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        initialAgents: 0,
        reproduceProbability: 0,
        maxAge: 100,
        seasonalCycleLength: 4,
        seasonalRegenAmplitude: 0,
        seasonalFertilityContrastAmplitude: 1
      }
    });

    const cellsByFertility = listCellsByFertility(sim, 6, 6);
    const lowCell = cellsByFertility[0]!;
    const highCell = cellsByFertility[cellsByFertility.length - 1]!;
    expect(highCell.fertility).toBeGreaterThan(lowCell.fertility);

    const spreads: number[] = [];
    const contrastMultipliers: number[] = [];
    for (let tick = 0; tick < 4; tick += 1) {
      for (let y = 0; y < 6; y += 1) {
        for (let x = 0; x < 6; x += 1) {
          sim.setResource(x, y, 0);
        }
      }
      sim.step();
      spreads.push(sim.getResource(highCell.x, highCell.y) - sim.getResource(lowCell.x, lowCell.y));
      contrastMultipliers.push(sim.analytics(1).forcing.fertilityContrastMultiplier);
    }

    expect(contrastMultipliers[0]).toBeCloseTo(1, 10);
    expect(contrastMultipliers[1]).toBeCloseTo(2, 10);
    expect(contrastMultipliers[2]).toBeCloseTo(1, 10);
    expect(contrastMultipliers[3]).toBeCloseTo(0, 10);
    expect(spreads[1]).toBeGreaterThan(spreads[0]);
    expect(spreads[2]).toBeCloseTo(spreads[0], 10);
    expect(spreads[3]).toBeCloseTo(0, 10);
  });

  it('applies periodic disturbance shocks and reports disturbance analytics', () => {
    const sim = new LifeSimulation({
      seed: 62,
      config: {
        width: 1,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        biomeBands: 1,
        biomeContrast: 0,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 2,
        disturbanceEnergyLoss: 0.5,
        disturbanceResourceLoss: 0.25
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });
    sim.setResource(0, 0, 8);

    sim.step();
    expect(sim.getResource(0, 0)).toBeCloseTo(8, 10);
    expect(sim.snapshot().agents[0]?.energy).toBeCloseTo(10, 10);

    sim.step();
    const analytics = sim.analytics(2);
    expect(sim.getResource(0, 0)).toBeCloseTo(6, 10);
    expect(sim.snapshot().agents[0]?.energy).toBeCloseTo(5, 10);
    expect(analytics.disturbance.interval).toBe(2);
    expect(analytics.disturbance.phaseOffset).toBeCloseTo(0, 10);
    expect(analytics.disturbance.energyLoss).toBeCloseTo(0.5, 10);
    expect(analytics.disturbance.resourceLoss).toBeCloseTo(0.25, 10);
    expect(analytics.disturbance.eventsInWindow).toBe(1);
    expect(analytics.disturbance.lastEventTick).toBe(2);
    expect(analytics.disturbance.lastEventPopulationShock).toBeCloseTo(0, 10);
    expect(analytics.disturbance.lastEventResourceShock).toBeCloseTo(0.25, 10);
    expect(analytics.resilience.recoveryTicks).toBe(0);
    expect(analytics.resilience.recoveryRelapses).toBe(0);
    expect(analytics.resilience.sustainedRecoveryTicks).toBe(0);
    expect(analytics.resilience.populationTroughDepth).toBeCloseTo(0, 10);
    expect(analytics.resilience.populationTroughTicks).toBe(0);
    expect(analytics.resilience.delayedPopulationShockDepth).toBeCloseTo(0, 10);
    expect(analytics.resilience.extinctionBurstDepth).toBe(0);
    expect(analytics.resilience.latestEventSeasonalPhase).toBeCloseTo(1 / 120, 10);
    expect(analytics.resilience.latestEventRecoveryLagTicks).toBe(0);
    expect(analytics.resilience.memoryRecoveredEventFraction).toBeCloseTo(1, 10);
    expect(analytics.resilience.memoryRecoveryLagTicksMean).toBeCloseTo(0, 10);
    expect(analytics.resilience.memoryEventPhaseMean).toBeCloseTo(1 / 120, 10);
    expect(analytics.resilience.memoryEventPhaseConcentration).toBeCloseTo(1, 10);
  });

  it('supports disturbance phase offset scheduling', () => {
    const sim = new LifeSimulation({
      seed: 72,
      config: {
        width: 1,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        biomeBands: 1,
        biomeContrast: 0,
        decompositionBase: 0,
        decompositionEnergyFraction: 0,
        initialAgents: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 4,
        disturbancePhaseOffset: 0.5,
        disturbanceEnergyLoss: 0,
        disturbanceResourceLoss: 0.5
      }
    });
    sim.setResource(0, 0, 8);

    sim.step();
    expect(sim.getResource(0, 0)).toBeCloseTo(8, 10);
    sim.step();
    expect(sim.getResource(0, 0)).toBeCloseTo(4, 10);
    sim.step();
    expect(sim.getResource(0, 0)).toBeCloseTo(4, 10);
    sim.step();
    expect(sim.getResource(0, 0)).toBeCloseTo(4, 10);

    const analytics = sim.analytics(4);
    expect(analytics.disturbance.interval).toBe(4);
    expect(analytics.disturbance.phaseOffset).toBeCloseTo(0.5, 10);
    expect(analytics.disturbance.eventsInWindow).toBe(1);
    expect(analytics.disturbance.lastEventTick).toBe(2);
  });

  it('tracks sustained recovery ticks when population remains recovered', () => {
    const sim = new LifeSimulation({
      seed: 67,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 2,
        disturbanceEnergyLoss: 0.5,
        disturbanceResourceLoss: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 2,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sim.step();
    sim.step();
    sim.step();
    const analytics = sim.analytics(2);

    expect(analytics.disturbance.lastEventTick).toBe(2);
    expect(analytics.resilience.recoveryTicks).toBe(0);
    expect(analytics.resilience.recoveryRelapses).toBe(0);
    expect(analytics.resilience.sustainedRecoveryTicks).toBe(1);
    expect(analytics.resilience.recoveryProgress).toBeCloseTo(1, 10);
  });

  it('reports full resilience memory stability when repeated disturbances recover without relapses', () => {
    const sim = new LifeSimulation({
      seed: 68,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 1,
        disturbanceEnergyLoss: 0.5,
        disturbanceResourceLoss: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 2,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sim.step();
    sim.step();
    sim.step();
    const analytics = sim.analytics(2);

    expect(analytics.resilience.memoryEventCount).toBe(3);
    expect(analytics.resilience.memoryRecoveredEventFraction).toBeCloseTo(1, 10);
    expect(analytics.resilience.memoryRelapseEventFraction).toBeCloseTo(0, 10);
    expect(analytics.resilience.memoryStabilityIndexMean).toBeCloseTo(1, 10);
    expect(analytics.resilience.memoryRecoveryLagTicksMean).toBeCloseTo(0, 10);
    expect(analytics.resilience.memoryEventPhaseConcentration).toBeGreaterThan(0.99);
    expect(analytics.resilience.memoryEventPhaseConcentration).toBeLessThanOrEqual(1);
  });

  it('tracks relapse history across disturbance events in resilience memory', () => {
    const sim = new LifeSimulation({
      seed: 5,
      config: {
        width: 2,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100,
        dispersalPressure: -5,
        dispersalRadius: 0,
        disturbanceInterval: 1,
        disturbanceEnergyLoss: 1,
        disturbanceResourceLoss: 0,
        disturbanceRadius: 0,
        disturbanceRefugiaFraction: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const tick1 = sim.step();
    const tick2 = sim.step();
    const analytics = sim.analytics(2);

    expect(tick1.population).toBe(1);
    expect(tick2.population).toBe(0);
    expect(analytics.resilience.memoryEventCount).toBe(2);
    expect(analytics.resilience.memoryRecoveredEventFraction).toBeCloseTo(0, 10);
    expect(analytics.resilience.memoryRelapseEventFraction).toBeCloseTo(0.5, 10);
    expect(analytics.resilience.memoryStabilityIndexMean).toBeCloseTo(0, 10);
  });

  it('reports disturbance-driven turnover spikes and extinction burst depth', () => {
    const sim = new LifeSimulation({
      seed: 63,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 1,
        disturbanceEnergyLoss: 1,
        disturbanceResourceLoss: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 1,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const summary = sim.step();
    const analytics = sim.analytics(1);

    expect(summary.population).toBe(0);
    expect(summary.speciesExtinctions).toBe(2);
    expect(analytics.disturbance.eventsInWindow).toBe(1);
    expect(analytics.disturbance.lastEventTick).toBe(1);
    expect(analytics.disturbance.lastEventPopulationShock).toBeCloseTo(1, 10);
    expect(analytics.resilience.recoveryTicks).toBe(-1);
    expect(analytics.resilience.recoveryProgress).toBeCloseTo(0, 10);
    expect(analytics.resilience.recoveryRelapses).toBe(0);
    expect(analytics.resilience.sustainedRecoveryTicks).toBe(0);
    expect(analytics.resilience.populationTroughDepth).toBeCloseTo(1, 10);
    expect(analytics.resilience.populationTroughTicks).toBe(0);
    expect(analytics.resilience.delayedPopulationShockDepth).toBeCloseTo(0, 10);
    expect(analytics.resilience.latestEventRecoveryLagTicks).toBe(-1);
    expect(analytics.resilience.memoryRecoveredEventFraction).toBeCloseTo(0, 10);
    expect(analytics.resilience.memoryRecoveryLagTicksMean).toBeCloseTo(0, 10);
    expect(analytics.resilience.preDisturbanceTurnoverRate).toBeCloseTo(0, 10);
    expect(analytics.resilience.postDisturbanceTurnoverRate).toBeCloseTo(2, 10);
    expect(analytics.resilience.turnoverSpike).toBeCloseTo(2, 10);
    expect(analytics.resilience.extinctionBurstDepth).toBe(2);
  });

  it('captures delayed population-shock trough timing and revokes immediate recovery after delayed collapse', () => {
    const sim = new LifeSimulation({
      seed: 66,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0.5,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 2,
        disturbanceEnergyLoss: 0.5,
        disturbanceResourceLoss: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 2,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sim.step();
    sim.step();
    const summary = sim.step();
    const analytics = sim.analytics(2);

    expect(summary.population).toBe(0);
    expect(analytics.disturbance.eventsInWindow).toBe(1);
    expect(analytics.disturbance.lastEventTick).toBe(2);
    expect(analytics.disturbance.lastEventPopulationShock).toBeCloseTo(0, 10);
    expect(analytics.resilience.recoveryTicks).toBe(-1);
    expect(analytics.resilience.recoveryProgress).toBeCloseTo(0, 10);
    expect(analytics.resilience.recoveryRelapses).toBe(1);
    expect(analytics.resilience.sustainedRecoveryTicks).toBe(0);
    expect(analytics.resilience.populationTroughDepth).toBeCloseTo(1, 10);
    expect(analytics.resilience.populationTroughTicks).toBe(1);
    expect(analytics.resilience.delayedPopulationShockDepth).toBeCloseTo(1, 10);
    expect(analytics.resilience.latestEventRecoveryLagTicks).toBe(-1);
    expect(analytics.resilience.memoryRecoveredEventFraction).toBeCloseTo(0, 10);
  });

  it('applies localized disturbance shocks to a footprint instead of the full map', () => {
    const initialAgents = Array.from({ length: 5 }, (_, x) => ({
      x,
      y: 0,
      energy: 1,
      species: x + 1,
      genome: { metabolism: 1, harvest: 1, aggression: 0 }
    }));
    const sim = new LifeSimulation({
      seed: 64,
      config: {
        width: 5,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 1,
        disturbanceEnergyLoss: 1,
        disturbanceResourceLoss: 0.5,
        disturbanceRadius: 0,
        disturbanceRefugiaFraction: 0
      },
      initialAgents
    });
    for (let x = 0; x < 5; x += 1) {
      sim.setResource(x, 0, 10);
    }

    const summary = sim.step();
    const analytics = sim.analytics(1);

    expect(summary.population).toBe(4);
    expect(analytics.disturbance.eventsInWindow).toBe(1);
    expect(analytics.disturbance.radius).toBe(0);
    expect(analytics.disturbance.refugiaFraction).toBe(0);
    expect(analytics.disturbance.lastEventPopulationShock).toBeCloseTo(0.2, 10);
    expect(analytics.disturbance.lastEventResourceShock).toBeCloseTo(0.1, 10);
    expect(analytics.disturbance.lastEventAffectedCellFraction).toBeCloseTo(0.2, 10);
    expect(analytics.disturbance.lastEventRefugiaCellFraction).toBeCloseTo(0, 10);
  });

  it('preserves disturbance refugia inside the targeted footprint', () => {
    const initialAgents = Array.from({ length: 5 }, (_, x) => ({
      x,
      y: 0,
      energy: 1,
      species: x + 1,
      genome: { metabolism: 1, harvest: 1, aggression: 0 }
    }));
    const sim = new LifeSimulation({
      seed: 65,
      config: {
        width: 5,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100,
        disturbanceInterval: 1,
        disturbanceEnergyLoss: 1,
        disturbanceResourceLoss: 0.5,
        disturbanceRadius: -1,
        disturbanceRefugiaFraction: 0.4
      },
      initialAgents
    });
    for (let x = 0; x < 5; x += 1) {
      sim.setResource(x, 0, 10);
    }

    const summary = sim.step();
    const analytics = sim.analytics(1);

    expect(summary.population).toBe(2);
    expect(analytics.disturbance.eventsInWindow).toBe(1);
    expect(analytics.disturbance.radius).toBe(-1);
    expect(analytics.disturbance.refugiaFraction).toBeCloseTo(0.4, 10);
    expect(analytics.disturbance.lastEventPopulationShock).toBeCloseTo(0.6, 10);
    expect(analytics.disturbance.lastEventResourceShock).toBeCloseTo(0.3, 10);
    expect(analytics.disturbance.lastEventAffectedCellFraction).toBeCloseTo(0.6, 10);
    expect(analytics.disturbance.lastEventRefugiaCellFraction).toBeCloseTo(0.4, 10);
  });

  it('scales decomposition by local biome fertility', () => {
    const sim = new LifeSimulation({
      seed: 22,
      config: {
        width: 5,
        height: 5,
        maxResource: 100,
        resourceRegen: 0,
        biomeBands: 3,
        biomeContrast: 0.8,
        decompositionBase: 2,
        decompositionEnergyFraction: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 0
      },
      initialAgents: [
        {
          x: 2,
          y: 2,
          energy: 5,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const fertility = sim.getBiomeFertility(2, 2);
    sim.setResource(2, 2, 0);

    const summary = sim.step();

    expect(summary.deaths).toBe(1);
    expect(summary.population).toBe(0);
    expect(sim.getResource(2, 2)).toBeCloseTo(2 * fertility, 10);
  });

  it('reduces harvest when a species forages far from its fertility preference', () => {
    const baseConfig = {
      width: 6,
      height: 6,
      maxResource: 10,
      resourceRegen: 0,
      biomeBands: 3,
      biomeContrast: 0.8,
      decompositionBase: 0,
      decompositionEnergyFraction: 0,
      metabolismCostBase: 1,
      moveCost: 0,
      dispersalPressure: 0,
      harvestCap: 2,
      reproduceProbability: 0,
      maxAge: 100,
      habitatPreferenceStrength: 4
    };
    const probe = new LifeSimulation({
      seed: 52,
      config: {
        ...baseConfig,
        initialAgents: 0
      }
    });
    const cellsByFertility = listCellsByFertility(probe, baseConfig.width, baseConfig.height);
    const lowCell = cellsByFertility[0]!;
    const highCell = cellsByFertility[cellsByFertility.length - 1]!;
    const genome = { metabolism: 0.3, harvest: 1, aggression: 0 };

    const sim = new LifeSimulation({
      seed: 52,
      config: baseConfig,
      initialAgents: [
        {
          x: lowCell.x,
          y: lowCell.y,
          energy: 0.1,
          lineage: 1,
          species: 1,
          genome: { metabolism: 2.2, harvest: 1, aggression: 0 }
        },
        {
          x: lowCell.x,
          y: lowCell.y,
          energy: 0.1,
          lineage: 1,
          species: 1,
          genome: { metabolism: 2.2, harvest: 1, aggression: 0 }
        },
        {
          x: lowCell.x,
          y: lowCell.y,
          energy: 10,
          lineage: 1,
          species: 1,
          genome
        },
        {
          x: highCell.x,
          y: highCell.y,
          energy: 10,
          lineage: 1,
          species: 1,
          genome
        }
      ]
    });

    for (let y = 0; y < baseConfig.height; y += 1) {
      for (let x = 0; x < baseConfig.width; x += 1) {
        sim.setResource(x, y, 0);
      }
    }
    sim.setResource(lowCell.x, lowCell.y, 2);
    sim.setResource(highCell.x, highCell.y, 2);

    sim.step();
    const agents = sim.snapshot().agents;
    const lowForager = agents.find((agent) => agent.species === 1 && agent.x === lowCell.x && agent.y === lowCell.y);
    const highForager = agents.find((agent) => agent.species === 1 && agent.x === highCell.x && agent.y === highCell.y);

    expect(lowForager).toBeDefined();
    expect(highForager).toBeDefined();
    expect(lowForager!.energy).toBeGreaterThan(highForager!.energy);
  });

  it('uses habitat preference to stabilize radius-k patch dominance under dispersal pressure', () => {
    const baseConfig = {
      width: 10,
      height: 10,
      maxResource: 8,
      resourceRegen: 0.8,
      biomeBands: 4,
      biomeContrast: 0.85,
      decompositionBase: 0,
      decompositionEnergyFraction: 0,
      metabolismCostBase: 0.2,
      moveCost: 0.05,
      dispersalPressure: 1.4,
      dispersalRadius: 1,
      localityRadius: 2,
      harvestCap: 2,
      reproduceProbability: 0,
      maxAge: 200,
      habitatPreferenceMutation: 0
    };
    const probe = new LifeSimulation({
      seed: 53,
      config: {
        ...baseConfig,
        initialAgents: 0,
        habitatPreferenceStrength: 0
      }
    });
    const cellsByFertility = listCellsByFertility(probe, baseConfig.width, baseConfig.height);
    const clusterSize = 12;
    const lowCells = cellsByFertility.slice(0, clusterSize);
    const highCells = cellsByFertility.slice(-clusterSize);
    const initialAgents = [
      ...lowCells.map((cell) => ({
        x: cell.x,
        y: cell.y,
        energy: 12,
        lineage: 1,
        species: 1,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      })),
      ...highCells.map((cell) => ({
        x: cell.x,
        y: cell.y,
        energy: 12,
        lineage: 2,
        species: 2,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      }))
    ];

    const neutral = new LifeSimulation({
      seed: 53,
      config: {
        ...baseConfig,
        habitatPreferenceStrength: 0
      },
      initialAgents
    });
    const specialist = new LifeSimulation({
      seed: 53,
      config: {
        ...baseConfig,
        habitatPreferenceStrength: 4
      },
      initialAgents
    });

    neutral.run(70);
    specialist.run(70);

    const neutralAnalytics = neutral.analytics(30);
    const specialistAnalytics = specialist.analytics(30);

    expect(specialistAnalytics.localityRadiusTurnover.changedDominantCellFractionMean).toBeLessThan(
      neutralAnalytics.localityRadiusTurnover.changedDominantCellFractionMean
    );
    expect(specialistAnalytics.localityRadius.meanDominantSpeciesShare).toBeGreaterThan(
      neutralAnalytics.localityRadius.meanDominantSpeciesShare
    );
  });

  it('lets clade habitat coupling change payoffs for same-species agents in different lineages', () => {
    const baseConfig = {
      width: 6,
      height: 6,
      maxResource: 20,
      resourceRegen: 0,
      biomeBands: 3,
      biomeContrast: 0.8,
      decompositionBase: 0,
      decompositionEnergyFraction: 0,
      metabolismCostBase: 1,
      moveCost: 0,
      dispersalPressure: 0,
      harvestCap: 4,
      reproduceProbability: 0,
      maxAge: 100,
      habitatPreferenceStrength: 4
    };
    const probe = new LifeSimulation({
      seed: 55,
      config: {
        ...baseConfig,
        initialAgents: 0
      }
    });
    const cellsByFertility = listCellsByFertility(probe, baseConfig.width, baseConfig.height);
    const lowCell = cellsByFertility[0]!;
    const highCell = cellsByFertility[cellsByFertility.length - 1]!;
    const pairedHighCell = cellsByFertility.find(
      (cell) =>
        cell.x === highCell.x &&
        cell.y !== highCell.y &&
        Math.abs(cell.fertility - highCell.fertility) < 1e-12
    )!;
    const initialAgents = [
      {
        x: lowCell.x,
        y: lowCell.y,
        energy: 0.1,
        lineage: 1,
        species: 1,
        genome: { metabolism: 2.2, harvest: 1, aggression: 0 }
      },
      {
        x: highCell.x,
        y: highCell.y,
        energy: 10,
        lineage: 1,
        species: 1,
        genome: { metabolism: 0.3, harvest: 1, aggression: 0 }
      },
      {
        x: highCell.x,
        y: highCell.y,
        energy: 0.1,
        lineage: 2,
        species: 1,
        genome: { metabolism: 2.2, harvest: 1, aggression: 0 }
      },
      {
        x: pairedHighCell.x,
        y: pairedHighCell.y,
        energy: 10,
        lineage: 2,
        species: 1,
        genome: { metabolism: 0.3, harvest: 1, aggression: 0 }
      }
    ];

    const neutral = new LifeSimulation({
      seed: 55,
      config: {
        ...baseConfig,
        cladeHabitatCoupling: 0
      },
      initialAgents
    });
    const coupled = new LifeSimulation({
      seed: 55,
      config: {
        ...baseConfig,
        cladeHabitatCoupling: 1
      },
      initialAgents
    });

    for (let y = 0; y < baseConfig.height; y += 1) {
      for (let x = 0; x < baseConfig.width; x += 1) {
        neutral.setResource(x, y, 0);
        coupled.setResource(x, y, 0);
      }
    }
    neutral.setResource(highCell.x, highCell.y, 20);
    coupled.setResource(highCell.x, highCell.y, 20);
    neutral.setResource(pairedHighCell.x, pairedHighCell.y, 20);
    coupled.setResource(pairedHighCell.x, pairedHighCell.y, 20);

    neutral.step();
    coupled.step();

    const neutralLineage1 = neutral.snapshot().agents.find((agent) => agent.lineage === 1)!;
    const neutralLineage2 = neutral.snapshot().agents.find((agent) => agent.lineage === 2)!;
    const coupledLineage1 = coupled.snapshot().agents.find((agent) => agent.lineage === 1)!;
    const coupledLineage2 = coupled.snapshot().agents.find((agent) => agent.lineage === 2)!;

    expect(neutralLineage1.energy).toBeCloseTo(neutralLineage2.energy, 10);
    expect(coupledLineage2.energy).toBeGreaterThan(coupledLineage1.energy);
    expect(coupledLineage1.energy).toBeLessThan(neutralLineage1.energy);
    expect(coupledLineage2.energy).toBeGreaterThan(neutralLineage2.energy);
  });

  it('updates clade habitat memory toward successful settlement habitats when adaptation is enabled', () => {
    const baseConfig = {
      width: 6,
      height: 6,
      maxResource: 6,
      resourceRegen: 0,
      biomeBands: 3,
      biomeContrast: 0.8,
      decompositionBase: 0,
      decompositionEnergyFraction: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      dispersalPressure: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      offspringEnergyFraction: 0.5,
      mutationAmount: 0,
      speciationThreshold: 0,
      cladogenesisThreshold: -1,
      habitatPreferenceStrength: 0,
      lineageHarvestCrowdingPenalty: 0,
      lineageDispersalCrowdingPenalty: 0,
      lineageOffspringSettlementCrowdingPenalty: 0,
      offspringSettlementEcologyScoring: true,
      maxAge: 100
    };
    const probe = new LifeSimulation({
      seed: 53,
      config: {
        ...baseConfig,
        initialAgents: 0
      }
    });
    const fertilityPair = findFertilityGradientNeighborPair(probe, baseConfig.width, baseConfig.height);

    const reproduceChild = (adaptiveCladeHabitatMemoryRate: number) => {
      const sim = new LifeSimulation({
        seed: 53,
        config: {
          ...baseConfig,
          adaptiveCladeHabitatMemoryRate
        },
        initialAgents: [
          {
            x: fertilityPair.parent.x,
            y: fertilityPair.parent.y,
            energy: 30,
            lineage: 1,
            species: 1,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          }
        ]
      });
      const internal = sim as unknown as {
        agents: Array<{
          id: number;
          lineage: number;
          species: number;
          x: number;
          y: number;
          energy: number;
          genome: { metabolism: number; harvest: number; aggression: number };
        }>;
        cladeHabitatPreference: Map<number, number>;
        buildOccupancyGrid: (agents?: Array<{ x: number; y: number }>) => number[][];
        buildLineageOccupancyGrid: (
          agents?: Array<{ lineage: number; x: number; y: number }>
        ) => Map<number, number[][]>;
        reproduce: (
          parent: {
            id: number;
            lineage: number;
            species: number;
            x: number;
            y: number;
            energy: number;
            genome: { metabolism: number; harvest: number; aggression: number };
          },
          occupancy: number[][],
          lineageOccupancy: Map<number, number[][]>
        ) => {
          lineage: number;
          species: number;
          x: number;
          y: number;
        };
      };

      for (let y = 0; y < baseConfig.height; y += 1) {
        for (let x = 0; x < baseConfig.width; x += 1) {
          sim.setResource(x, y, 0);
        }
      }
      sim.setResource(fertilityPair.child.x, fertilityPair.child.y, baseConfig.maxResource);

      const parent = internal.agents[0]!;
      const before = internal.cladeHabitatPreference.get(parent.lineage)!;
      const occupancy = internal.buildOccupancyGrid(internal.agents);
      const lineageOccupancy = internal.buildLineageOccupancyGrid(internal.agents);
      const child = internal.reproduce(parent, occupancy, lineageOccupancy);
      const after = internal.cladeHabitatPreference.get(parent.lineage)!;

      return { before, after, child };
    };

    const staticResult = reproduceChild(0);
    const adaptiveResult = reproduceChild(0.2);

    expect(staticResult.child).toMatchObject({
      lineage: 1,
      species: 2,
      x: fertilityPair.child.x,
      y: fertilityPair.child.y
    });
    expect(adaptiveResult.child).toMatchObject({
      lineage: 1,
      species: 2,
      x: fertilityPair.child.x,
      y: fertilityPair.child.y
    });
    expect(staticResult.before).toBeCloseTo(fertilityPair.parent.fertility, 10);
    expect(staticResult.after).toBeCloseTo(staticResult.before, 10);
    expect(adaptiveResult.after).toBeCloseTo(
      adaptiveResult.before + (fertilityPair.child.fertility - adaptiveResult.before) * 0.2,
      10
    );
    expect(adaptiveResult.after).toBeGreaterThan(adaptiveResult.before);
  });

  it('charges additional metabolic upkeep to species with extreme habitat preference', () => {
    const baseConfig = {
      width: 6,
      height: 6,
      maxResource: 0,
      resourceRegen: 0,
      biomeBands: 3,
      biomeContrast: 0.8,
      decompositionBase: 0,
      decompositionEnergyFraction: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      dispersalPressure: 0,
      harvestCap: 0,
      reproduceProbability: 0,
      maxAge: 100
    };
    const probe = new LifeSimulation({
      seed: 54,
      config: {
        ...baseConfig,
        initialAgents: 0
      }
    });
    const cellsByFertility = listCellsByFertility(probe, baseConfig.width, baseConfig.height);
    const highCell = cellsByFertility[cellsByFertility.length - 1]!;
    const metabolism = 2;
    const initialAgents = [
      {
        x: highCell.x,
        y: highCell.y,
        energy: 10,
        lineage: 1,
        species: 1,
        genome: { metabolism, harvest: 1, aggression: 0 }
      }
    ];

    const noCost = new LifeSimulation({
      seed: 54,
      config: {
        ...baseConfig,
        specializationMetabolicCost: 0
      },
      initialAgents
    });
    const withCost = new LifeSimulation({
      seed: 54,
      config: {
        ...baseConfig,
        specializationMetabolicCost: 0.8
      },
      initialAgents
    });

    noCost.step();
    withCost.step();

    const noCostEnergy = noCost.snapshot().agents[0]!.energy;
    const withCostEnergy = withCost.snapshot().agents[0]!.energy;
    const expectedPenalty = 0.8 * Math.abs(highCell.fertility - 1) * metabolism;

    expect(noCostEnergy).toBeCloseTo(10, 10);
    expect(withCostEnergy).toBeCloseTo(10 - expectedPenalty, 10);
    expect(withCostEnergy).toBeLessThan(noCostEnergy);
  });

  it('uses specialization upkeep to counter habitat-lock patch dominance', () => {
    const seeds = [20260223, 20260224, 20260225, 20260226];
    const steps = 90;
    const window = 30;
    const summarize = (specializationMetabolicCost: number): { patchDominance: number; patchTurnover: number } => {
      const patchDominance: number[] = [];
      const patchTurnover: number[] = [];

      for (const seed of seeds) {
        const sim = new LifeSimulation({
          seed,
          config: {
            habitatPreferenceStrength: 4,
            specializationMetabolicCost,
            predationPressure: 0,
            trophicForagingPenalty: 0,
            defenseMitigation: 0,
            defenseForagingPenalty: 0,
            defenseMutation: 0
          }
        });
        sim.run(steps);
        const analytics = sim.analytics(window);
        patchDominance.push(analytics.localityRadius.meanDominantSpeciesShare);
        patchTurnover.push(analytics.localityRadiusTurnover.changedDominantCellFractionMean);
      }

      return {
        patchDominance: patchDominance.reduce((sum, value) => sum + value, 0) / patchDominance.length,
        patchTurnover: patchTurnover.reduce((sum, value) => sum + value, 0) / patchTurnover.length
      };
    };

    const noCost = summarize(0);
    const withCost = summarize(0.08);

    expect(withCost.patchDominance).toBeLessThan(noCost.patchDominance);
    expect(withCost.patchTurnover).toBeGreaterThan(noCost.patchTurnover);
  }, 15_000);

  it('removes agents that run out of energy', () => {
    const sim = new LifeSimulation({
      seed: 3,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 0.2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const summary = sim.step();

    expect(summary.population).toBe(0);
    expect(summary.deaths).toBe(1);
  });

  it('tracks clade/species diversity and dominant species share', () => {
    const sim = new LifeSimulation({
      seed: 19,
      config: {
        width: 100,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.2 },
          lineage: 1,
          species: 1
        },
        {
          x: 50,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.2 },
          lineage: 2,
          species: 1
        },
        {
          x: 80,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.2 },
          lineage: 3,
          species: 2
        }
      ]
    });

    const summary = sim.step();

    expect(summary.activeClades).toBe(3);
    expect(summary.activeSpecies).toBe(2);
    expect(summary.dominantSpeciesShare).toBeCloseTo(2 / 3, 10);
  });

  it('reports energy-weighted trait selection differentials', () => {
    const sim = new LifeSimulation({
      seed: 23,
      config: {
        width: 100,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 9,
          genome: { metabolism: 2, harvest: 1, aggression: 0.9 }
        },
        {
          x: 50,
          y: 0,
          energy: 3,
          genome: { metabolism: 1, harvest: 2, aggression: 0.1 }
        }
      ]
    });

    const summary = sim.step();

    expect(summary.selectionDifferential.metabolism).toBeCloseTo(0.25, 10);
    expect(summary.selectionDifferential.harvest).toBeCloseTo(-0.25, 10);
    expect(summary.selectionDifferential.aggression).toBeCloseTo(0.2, 10);
  });

  it('tracks clade and species lifecycle history across ticks', () => {
    const sim = new LifeSimulation({
      seed: 31,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 },
          lineage: 1,
          species: 1
        },
        {
          x: 0,
          y: 0,
          energy: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 },
          lineage: 2,
          species: 2
        }
      ]
    });

    const step1 = sim.step();
    expect(step1.speciesExtinctions).toBe(1);
    expect(step1.cladeExtinctions).toBe(1);
    expect(step1.cumulativeExtinctSpecies).toBe(1);
    expect(step1.cumulativeExtinctClades).toBe(1);

    const step2 = sim.step();
    expect(step2.speciesExtinctions).toBe(1);
    expect(step2.cladeExtinctions).toBe(1);
    expect(step2.cumulativeExtinctSpecies).toBe(2);
    expect(step2.cumulativeExtinctClades).toBe(2);

    const history = sim.history();
    expect(history.extinctSpecies).toBe(2);
    expect(history.extinctClades).toBe(2);

    const species1 = history.species.find((entry) => entry.id === 1);
    const species2 = history.species.find((entry) => entry.id === 2);
    expect(species1).toBeDefined();
    expect(species2).toBeDefined();
    expect(species1!.extinctTick).toBe(2);
    expect(species2!.extinctTick).toBe(1);
    expect(species1!.totalBirths).toBe(1);
    expect(species1!.totalDeaths).toBe(1);
    expect(species2!.totalBirths).toBe(1);
    expect(species2!.totalDeaths).toBe(1);
    expect(species2!.timeline).toEqual([
      { tick: 0, population: 1, births: 1, deaths: 0 },
      { tick: 1, population: 0, births: 0, deaths: 1 }
    ]);
    expect(species1!.timeline).toEqual([
      { tick: 0, population: 1, births: 1, deaths: 0 },
      { tick: 1, population: 1, births: 0, deaths: 0 },
      { tick: 2, population: 0, births: 0, deaths: 1 }
    ]);
  });

  it('derives rolling extinction rates and lifespan summaries from history', () => {
    const sim = new LifeSimulation({
      seed: 32,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 },
          lineage: 1,
          species: 1
        },
        {
          x: 0,
          y: 0,
          energy: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 },
          lineage: 2,
          species: 2
        }
      ]
    });

    sim.step();
    sim.step();
    const analytics = sim.analytics(2);

    expect(analytics.tick).toBe(2);
    expect(analytics.window).toEqual({ startTick: 1, endTick: 2, size: 2 });
    expect(analytics.species.speciationsInWindow).toBe(0);
    expect(analytics.species.extinctionsInWindow).toBe(2);
    expect(analytics.species.speciationRate).toBe(0);
    expect(analytics.species.extinctionRate).toBe(1);
    expect(analytics.species.turnoverRate).toBe(1);
    expect(analytics.species.netDiversificationRate).toBe(-1);
    expect(analytics.species.extinctLifespan).toEqual({ count: 2, mean: 1.5, max: 2 });
    expect(analytics.species.activeAge).toEqual({ count: 0, mean: 0, max: 0 });
    expect(analytics.clades.originationsInWindow).toBe(0);
    expect(analytics.clades.extinctionsInWindow).toBe(2);
    expect(analytics.clades.extinctionRate).toBe(1);
  });

  it('reports species strategy-axis distributions in analytics', () => {
    const sim = new LifeSimulation({
      seed: 33,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        biomeBands: 1,
        biomeContrast: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 1 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const analytics = sim.analytics(5);

    const harvestNormalized = (1 - 0.4) / (2.8 - 0.4);
    const metabolismNormalized = (1 - 0.3) / (2.2 - 0.3);
    const trophicSpecies1 = 1 * 0.7 + (1 - harvestNormalized) * 0.3;
    const trophicSpecies2 = 0 * 0.7 + (1 - harvestNormalized) * 0.3;
    const defenseSpecies1 = (1 - 1) * 0.65 + metabolismNormalized * 0.35;
    const defenseSpecies2 = (1 - 0) * 0.65 + metabolismNormalized * 0.35;

    expect(analytics.strategy.activeSpecies).toBe(2);
    expect(analytics.strategy.habitatPreference).toEqual({
      mean: 1,
      stdDev: 0,
      min: 1,
      max: 1,
      weightedMean: 1
    });

    expect(analytics.strategy.trophicLevel.mean).toBeCloseTo((trophicSpecies1 + trophicSpecies2) / 2, 10);
    expect(analytics.strategy.trophicLevel.stdDev).toBeCloseTo(Math.abs(trophicSpecies1 - trophicSpecies2) / 2, 10);
    expect(analytics.strategy.trophicLevel.min).toBeCloseTo(Math.min(trophicSpecies1, trophicSpecies2), 10);
    expect(analytics.strategy.trophicLevel.max).toBeCloseTo(Math.max(trophicSpecies1, trophicSpecies2), 10);
    expect(analytics.strategy.trophicLevel.weightedMean).toBeCloseTo(
      (trophicSpecies1 + trophicSpecies2 * 2) / 3,
      10
    );

    expect(analytics.strategy.defenseLevel.mean).toBeCloseTo((defenseSpecies1 + defenseSpecies2) / 2, 10);
    expect(analytics.strategy.defenseLevel.stdDev).toBeCloseTo(Math.abs(defenseSpecies1 - defenseSpecies2) / 2, 10);
    expect(analytics.strategy.defenseLevel.min).toBeCloseTo(Math.min(defenseSpecies1, defenseSpecies2), 10);
    expect(analytics.strategy.defenseLevel.max).toBeCloseTo(Math.max(defenseSpecies1, defenseSpecies2), 10);
    expect(analytics.strategy.defenseLevel.weightedMean).toBeCloseTo(
      (defenseSpecies1 + defenseSpecies2 * 2) / 3,
      10
    );
  });

  it('reports per-cell locality dominance and richness metrics', () => {
    const sim = new LifeSimulation({
      seed: 34,
      config: {
        width: 2,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 1,
          y: 0,
          energy: 10,
          species: 3,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const analytics = sim.analytics(5);

    expect(analytics.locality.occupiedCells).toBe(2);
    expect(analytics.locality.occupiedCellFraction).toBe(1);
    expect(analytics.locality.meanDominantSpeciesShare).toBeCloseTo(5 / 6, 10);
    expect(analytics.locality.dominantSpeciesShareStdDev).toBeCloseTo(1 / 6, 10);
    expect(analytics.locality.meanSpeciesRichness).toBeCloseTo(1.5, 10);
    expect(analytics.localityRadius.radius).toBe(2);
    expect(analytics.localityRadius.meanDominantSpeciesShare).toBeCloseTo(0.5, 10);
    expect(analytics.localityRadius.dominantSpeciesShareStdDev).toBeCloseTo(0, 10);
    expect(analytics.localityRadius.meanSpeciesRichness).toBeCloseTo(3, 10);
    expect(analytics.localityRadius.centerDominantAlignment).toBeCloseTo(0.5, 10);
    expect(analytics.localityTurnover).toEqual({
      transitions: 0,
      changedDominantCellFractionMean: 0,
      changedDominantCellFractionStdDev: 0,
      perCellDominantTurnoverMean: 0,
      perCellDominantTurnoverStdDev: 0,
      perCellDominantTurnoverMax: 0
    });
    expect(analytics.localityRadiusTurnover).toEqual({
      radius: 2,
      transitions: 0,
      changedDominantCellFractionMean: 0,
      changedDominantCellFractionStdDev: 0,
      perCellDominantTurnoverMean: 0,
      perCellDominantTurnoverStdDev: 0,
      perCellDominantTurnoverMax: 0
    });
  });

  it('tracks dominant-species turnover dispersion over a rolling window', () => {
    const sim = new LifeSimulation({
      seed: 36,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 3,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 0,
          y: 0,
          energy: 1,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sim.run(3);
    const analytics = sim.analytics(2);

    expect(analytics.window).toEqual({ startTick: 2, endTick: 3, size: 2 });
    expect(analytics.locality.occupiedCells).toBe(0);
    expect(analytics.localityTurnover.transitions).toBe(2);
    expect(analytics.localityTurnover.changedDominantCellFractionMean).toBeCloseTo(0.5, 10);
    expect(analytics.localityTurnover.changedDominantCellFractionStdDev).toBeCloseTo(0.5, 10);
    expect(analytics.localityTurnover.perCellDominantTurnoverMean).toBeCloseTo(0.5, 10);
    expect(analytics.localityTurnover.perCellDominantTurnoverStdDev).toBeCloseTo(0, 10);
    expect(analytics.localityTurnover.perCellDominantTurnoverMax).toBeCloseTo(0.5, 10);
  });

  it('tracks radius-k neighborhood dominant turnover over rolling windows', () => {
    const sim = new LifeSimulation({
      seed: 37,
      config: {
        width: 3,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        dispersalPressure: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        localityRadius: 1,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 3,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        {
          x: 2,
          y: 0,
          energy: 1,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sim.run(3);
    const analytics = sim.analytics(3);

    expect(analytics.window).toEqual({ startTick: 1, endTick: 3, size: 3 });
    expect(analytics.localityRadiusTurnover.radius).toBe(1);
    expect(analytics.localityRadiusTurnover.transitions).toBe(3);
    expect(analytics.localityRadiusTurnover.changedDominantCellFractionMean).toBeCloseTo(1 / 3, 10);
    expect(analytics.localityRadiusTurnover.changedDominantCellFractionStdDev).toBeCloseTo(
      Math.sqrt(2) / 3,
      10
    );
    expect(analytics.localityRadiusTurnover.perCellDominantTurnoverMean).toBeCloseTo(1 / 3, 10);
    expect(analytics.localityRadiusTurnover.perCellDominantTurnoverStdDev).toBeCloseTo(0, 10);
    expect(analytics.localityRadiusTurnover.perCellDominantTurnoverMax).toBeCloseTo(1 / 3, 10);
  });

  it('returns per-tick analytics aligned with summaries and supports early stop', () => {
    const sim = new LifeSimulation({
      seed: 35,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 0.2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const runData = sim.runWithAnalytics(5, 2, true);

    expect(runData.summaries).toHaveLength(1);
    expect(runData.analytics).toHaveLength(1);
    expect(runData.summaries[0].tick).toBe(1);
    expect(runData.analytics[0].tick).toBe(1);
    expect(runData.summaries[0].population).toBe(0);
    expect(runData.analytics[0].window).toEqual({ startTick: 1, endTick: 1, size: 1 });
  });

  it('tracks rolling speciation rates from divergence events', () => {
    const sim = new LifeSimulation({
      seed: 41,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.05,
        mutationAmount: 0.2,
        speciationThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sim.run(4);
    const analytics = sim.analytics(3);

    expect(analytics.window).toEqual({ startTick: 2, endTick: 4, size: 3 });
    expect(analytics.species.speciationsInWindow).toBe(3);
    expect(analytics.species.extinctionsInWindow).toBe(0);
    expect(analytics.species.speciationRate).toBeCloseTo(1, 10);
    expect(analytics.species.extinctionRate).toBeCloseTo(0, 10);
    expect(analytics.species.turnoverRate).toBeCloseTo(1, 10);
    expect(analytics.species.netDiversificationRate).toBeCloseTo(1, 10);
    expect(analytics.clades.originationsInWindow).toBe(0);
    expect(analytics.clades.extinctionsInWindow).toBe(0);
  });
});

function listCellsByFertility(
  sim: LifeSimulation,
  width: number,
  height: number
): Array<{ x: number; y: number; fertility: number }> {
  const cells: Array<{ x: number; y: number; fertility: number }> = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      cells.push({ x, y, fertility: sim.getBiomeFertility(x, y) });
    }
  }
  cells.sort((a, b) => a.fertility - b.fertility);
  return cells;
}

function findFertilityGradientNeighborPair(
  sim: LifeSimulation,
  width: number,
  height: number
): {
  parent: { x: number; y: number; fertility: number };
  child: { x: number; y: number; fertility: number };
} {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const fertility = sim.getBiomeFertility(x, y);
      const neighbors = [
        { x: (x + 1) % width, y },
        { x: (x + width - 1) % width, y },
        { x, y: (y + 1) % height },
        { x, y: (y + height - 1) % height }
      ]
        .map((neighbor) => ({
          ...neighbor,
          fertility: sim.getBiomeFertility(neighbor.x, neighbor.y)
        }))
        .filter((neighbor) => neighbor.fertility > fertility + 1e-12)
        .sort((a, b) => b.fertility - a.fertility);

      if (neighbors.length > 0) {
        return {
          parent: { x, y, fertility },
          child: neighbors[0]!
        };
      }
    }
  }

  throw new Error('Expected to find a fertility gradient neighbor pair');
}
