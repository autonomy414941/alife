import { describe, expect, it } from 'vitest';
import { runPolicyCouplingReplayCounterfactual } from '../src/policy-coupling-replay-counterfactual';
import { createGenomeV2, setTrait } from '../src/genome-v2';
import { LifeSimulation } from '../src/simulation';

describe('simulation replay', () => {
  it('replays the same captured world state deterministically across identical branches', () => {
    const baseline = new LifeSimulation({
      seed: 4242,
      config: {
        width: 4,
        height: 4,
        maxResource: 6,
        resourceRegen: 0.5,
        disturbanceInterval: 3,
        disturbanceEnergyLoss: 0.2,
        disturbanceResourceLoss: 0.3,
        disturbanceRadius: 1,
        disturbanceRefugiaFraction: 0.25,
        causalTraceEnabled: true,
        causalTraceSamplingRate: 1,
        causalTraceMaxEventsPerTick: 100
      }
    });

    baseline.run(6);

    const left = baseline.fork();
    const right = baseline.fork();
    left.run(8);
    right.run(8);

    expect(left.captureReplayState()).toEqual(right.captureReplayState());
  });

  it('keeps branches identical at the fork and diverges only after the intervention changes policy coupling', () => {
    const reproductionPolicyGenome = createGenomeV2();
    setTrait(reproductionPolicyGenome, 'reproduction_harvest_threshold', 1);
    setTrait(reproductionPolicyGenome, 'reproduction_harvest_threshold_steepness', 10);

    const baseline = new LifeSimulation({
      seed: 77,
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
        policyMutationProbability: 0,
        policyMutationMagnitude: 0,
        speciationThreshold: 10,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          genomeV2: reproductionPolicyGenome
        }
      ]
    });

    baseline.run(2);
    const replayState = baseline.captureReplayState();
    const control = LifeSimulation.fromReplayState(replayState, { policyCouplingEnabled: true });
    const intervention = LifeSimulation.fromReplayState(replayState, { policyCouplingEnabled: false });

    expect(control.snapshot()).toEqual(intervention.snapshot());

    control.run(4);
    intervention.run(4);

    expect(control.snapshot().population).toBe(1);
    expect(intervention.snapshot().population).toBeGreaterThan(control.snapshot().population);
  });

  it('supports operator-level replay overrides without changing the shared baseline snapshot', () => {
    const reproductionPolicyGenome = createGenomeV2();
    setTrait(reproductionPolicyGenome, 'reproduction_harvest_threshold', 1);
    setTrait(reproductionPolicyGenome, 'reproduction_harvest_threshold_steepness', 10);

    const baseline = new LifeSimulation({
      seed: 88,
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
        policyMutationProbability: 0,
        policyMutationMagnitude: 0,
        speciationThreshold: 10,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          genomeV2: reproductionPolicyGenome
        }
      ]
    });

    baseline.run(2);
    const replayState = baseline.captureReplayState();
    const decoupled = LifeSimulation.fromReplayState(replayState, { policyCouplingEnabled: false });
    const reproductionOnly = LifeSimulation.fromReplayState(replayState, {
      policyCoupling: {
        reproductionGating: true
      }
    });

    expect(decoupled.snapshot()).toEqual(reproductionOnly.snapshot());

    decoupled.run(4);
    reproductionOnly.run(4);

    expect(reproductionOnly.snapshot().population).toBe(1);
    expect(decoupled.snapshot().population).toBeGreaterThan(reproductionOnly.snapshot().population);
  });

  it('runs a bounded replay counterfactual study from a shared baseline world state', () => {
    const artifact = runPolicyCouplingReplayCounterfactual({
      generatedAt: '2026-03-31T00:00:00.000Z'
    });

    expect(artifact.generatedAt).toBe('2026-03-31T00:00:00.000Z');
    expect(artifact.sharedBaseline.tick).toBeGreaterThan(0);
    expect(artifact.policyCoupled.policyCouplingEnabled).toBe(true);
    expect(artifact.policyDecoupled.policyCouplingEnabled).toBe(false);
    expect(artifact.policyCoupled.finalPopulation).toBe(1);
    expect(artifact.policyDecoupled.finalPopulation).toBeGreaterThan(artifact.policyCoupled.finalPopulation);
    expect(artifact.policyCoupled.reproductionDecisionGatedFraction).toBeGreaterThan(0);
    expect(artifact.policyDecoupled.reproductionDecisionGatedFraction).toBe(0);
    expect(artifact.delta.population).toBeGreaterThan(0);
  });
});
