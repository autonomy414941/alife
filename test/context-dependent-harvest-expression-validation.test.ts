import { describe, expect, it } from 'vitest';
import {
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS,
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE
} from '../src/behavioral-control';
import { runContextDependentHarvestExpressionValidation } from '../src/context-dependent-harvest-expression-validation';
import { fromGenome, setTrait } from '../src/genome-v2';
import { LifeSimulation } from '../src/simulation';
import { AgentSeed } from '../src/types';

describe('context-dependent harvest expression', () => {
  it('changes live harvest intake when contextual expression is enabled', () => {
    const directEncoding = buildCrowdedHarvestSimulation(false);
    const contextual = buildCrowdedHarvestSimulation(true);

    directEncoding.setResource(0, 0, 100);
    directEncoding.setResource2(0, 0, 100);
    contextual.setResource(0, 0, 100);
    contextual.setResource2(0, 0, 100);

    const directSeries = directEncoding.runWithPolicyFitness(1);
    const contextualSeries = contextual.runWithPolicyFitness(1);

    const directMeanHarvest = mean(directSeries.records.map((record) => record.harvestIntake));
    const contextualMeanHarvest = mean(contextualSeries.records.map((record) => record.harvestIntake));
    const firstObservation = contextualSeries.records[0]?.observation;
    const observationSummary = contextualSeries.summaries[0]?.policyObservability?.observations;

    expect(contextualMeanHarvest).toBeLessThan(directMeanHarvest);
    expect(firstObservation?.age).toBe(1);
    expect(firstObservation?.recentDisturbanceCount).toBe(0);
    expect(firstObservation?.primaryResourceLevel).toBeGreaterThan(0);
    expect(firstObservation?.primaryResourceLevel).toBeLessThanOrEqual(100);
    expect(firstObservation?.secondaryResourceLevel).toBeGreaterThan(0);
    expect(firstObservation?.secondaryResourceLevel).toBeLessThanOrEqual(100);
    expect(firstObservation?.secondaryResourceFraction).toBeGreaterThan(0);
    expect(firstObservation?.secondaryResourceFraction).toBeLessThan(1);
    expect(observationSummary).toMatchObject({
      decisions: 8,
      meanAge: 1,
      meanRecentDisturbanceCount: 0
    });
    expect(observationSummary?.meanPrimaryResourceLevel).toBeGreaterThan(0);
    expect(observationSummary?.meanPrimaryResourceLevel).toBeLessThan(100);
    expect(observationSummary?.meanSecondaryResourceLevel).toBeGreaterThan(0);
    expect(observationSummary?.meanSecondaryResourceLevel).toBeLessThan(100);
    expect(observationSummary?.meanSecondaryResourceFraction).toBeGreaterThan(0.4);
    expect(observationSummary?.meanSecondaryResourceFraction).toBeLessThan(0.6);
    expect(observationSummary?.meanSameLineageShare).toBeGreaterThanOrEqual(0);
  });

  it('produces a paired artifact comparing contextual harvest expression against direct encoding', () => {
    const artifact = runContextDependentHarvestExpressionValidation({
      generatedAt: '2026-04-03T00:00:00.000Z',
      seeds: [4101, 4102],
      steps: 20
    });

    expect(artifact.generatedAt).toBe('2026-04-03T00:00:00.000Z');
    expect(artifact.checks).toHaveLength(2);
    expect(artifact.summary.seedsWithHarvestIntakeChange).toBeGreaterThan(0);
  });
});

function buildCrowdedHarvestSimulation(contextualHarvestExpression: boolean): LifeSimulation {
  return new LifeSimulation({
    seed: 7,
    config: {
      width: 1,
      height: 1,
      initialAgents: 8,
      initialEnergy: 10,
      maxResource: 100,
      maxResource2: 100,
      resourceRegen: 0,
      resource2Regen: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      dispersalRadius: 0,
      harvestCap: 1,
      contextualHarvestExpression,
      reproduceThreshold: 1000,
      reproduceProbability: 0,
      mutationAmount: 0,
      policyMutationProbability: 0,
      policyMutationMagnitude: 0,
      maxAge: 100
    },
    initialAgents: buildCrowdedHarvestAgents()
  });
}

function buildCrowdedHarvestAgents(): AgentSeed[] {
  return Array.from({ length: 8 }, () => {
    const genome = {
      metabolism: 0.5,
      harvest: 1,
      aggression: 0,
      harvestEfficiency2: 0.2
    };
    const genomeV2 = fromGenome(genome);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0.25);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD, 100);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS, 2);

    return {
      x: 0,
      y: 0,
      energy: 10,
      genome,
      genomeV2
    };
  });
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
