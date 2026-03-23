import { describe, expect, it } from 'vitest';
import {
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD
} from '../src/behavioral-control';
import { runBehavioralPolicyFitnessPilot } from '../src/behavioral-policy-fitness-pilot';
import { LifeSimulation } from '../src/simulation';
import {
  analyzePolicyFitnessComparison,
  analyzePolicyFitnessRecords,
  PolicyFitnessRecord,
  summarizePolicyFitnessCohort
} from '../src/policy-fitness';

describe('policy fitness', () => {
  it('records per-step harvest, survival, and reproduction for policy-bearing agents', () => {
    const sim = new LifeSimulation({
      seed: 11,
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
        offspringEnergyFraction: 0.4,
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
          policyState: new Map([
            [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0.5],
            [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 8],
            [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, 0.5]
          ])
        }
      ]
    });

    sim.setResource(0, 0, 2);
    const series = sim.runWithPolicyFitness(1);

    expect(series.summaries).toHaveLength(1);
    expect(series.records).toHaveLength(1);
    expect(series.records[0]).toMatchObject({
      tick: 1,
      agentId: 1,
      hasAnyPolicy: true,
      hasHarvestPolicy: false,
      hasMovementPolicy: true,
      hasReproductionPolicy: true,
      movementPolicyGated: true,
      reproductionPolicyGated: false,
      harvestPolicyGuided: false,
      survived: true,
      offspringProduced: 1
    });
    expect(series.records[0].harvestIntake).toBeGreaterThan(0.5);
    expect(series.records[0].fertilityBin).toBeGreaterThanOrEqual(0);
    expect(series.records[0].crowdingBin).toBeGreaterThanOrEqual(0);
  });

  it('compares policy-positive and policy-negative records within matched bins', () => {
    const records: PolicyFitnessRecord[] = [
      {
        tick: 1,
        agentId: 1,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 1,
        harvestIntake: 1.4,
        survived: true,
        offspringProduced: 1,
        movementPolicyGated: true,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: true,
        hasReproductionPolicy: true
      },
      {
        tick: 1,
        agentId: 2,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 1,
        harvestIntake: 0.9,
        survived: false,
        offspringProduced: 0,
        movementPolicyGated: false,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: false,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: false
      },
      {
        tick: 2,
        agentId: 3,
        fertilityBin: 1,
        crowdingBin: 2,
        ageBin: 1,
        disturbancePhase: 0,
        harvestIntake: 1.1,
        survived: true,
        offspringProduced: 0,
        movementPolicyGated: false,
        reproductionPolicyGated: true,
        harvestPolicyGuided: false,
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: true,
        hasReproductionPolicy: false
      },
      {
        tick: 2,
        agentId: 4,
        fertilityBin: 1,
        crowdingBin: 2,
        ageBin: 1,
        disturbancePhase: 0,
        harvestIntake: 0.7,
        survived: true,
        offspringProduced: 0,
        movementPolicyGated: false,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: false,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: false
      }
    ];

    const analysis = analyzePolicyFitnessRecords(records);

    expect(analysis.aggregate.matchedBins).toBe(2);
    expect(analysis.aggregate.policyPositiveExposures).toBe(2);
    expect(analysis.aggregate.policyNegativeExposures).toBe(2);
    expect(analysis.aggregate.weightedHarvestAdvantage).toBeCloseTo(0.45, 10);
    expect(analysis.aggregate.weightedSurvivalAdvantage).toBeCloseTo(0.5, 10);
    expect(analysis.aggregate.weightedReproductionAdvantage).toBeCloseTo(0.5, 10);
  });

  it('summarizes cohort-specific gate and guidance rates', () => {
    const records: PolicyFitnessRecord[] = [
      {
        tick: 1,
        agentId: 1,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 1,
        harvestIntake: 1.2,
        survived: true,
        offspringProduced: 1,
        movementPolicyGated: true,
        reproductionPolicyGated: false,
        harvestPolicyGuided: true,
        hasAnyPolicy: true,
        hasHarvestPolicy: true,
        hasMovementPolicy: true,
        hasReproductionPolicy: false
      },
      {
        tick: 1,
        agentId: 2,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 1,
        harvestIntake: 0.8,
        survived: false,
        offspringProduced: 0,
        movementPolicyGated: false,
        reproductionPolicyGated: true,
        harvestPolicyGuided: false,
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: true
      }
    ];

    const summary = summarizePolicyFitnessCohort(records);

    expect(summary.exposures).toBe(2);
    expect(summary.movementPolicyGatedRate).toBeCloseTo(0.5, 10);
    expect(summary.reproductionPolicyGatedRate).toBeCloseTo(0.5, 10);
    expect(summary.harvestPolicyGuidedRate).toBeCloseTo(0.5, 10);
  });

  it('can compare a selected policy cohort against controls', () => {
    const records: PolicyFitnessRecord[] = [
      {
        tick: 1,
        agentId: 1,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 1,
        harvestIntake: 1.2,
        survived: true,
        offspringProduced: 0,
        movementPolicyGated: true,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: true,
        hasReproductionPolicy: false
      },
      {
        tick: 1,
        agentId: 2,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 1,
        harvestIntake: 1.1,
        survived: true,
        offspringProduced: 1,
        movementPolicyGated: false,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: true
      },
      {
        tick: 1,
        agentId: 3,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 1,
        harvestIntake: 0.7,
        survived: false,
        offspringProduced: 0,
        movementPolicyGated: false,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: false,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: false
      }
    ];

    const analysis = analyzePolicyFitnessComparison(
      records,
      (record) => record.hasMovementPolicy && !record.hasReproductionPolicy,
      (record) => !record.hasAnyPolicy
    );

    expect(analysis.aggregate.policyPositiveExposures).toBe(1);
    expect(analysis.aggregate.policyNegativeExposures).toBe(1);
    expect(analysis.aggregate.weightedHarvestAdvantage).toBeCloseTo(0.5, 10);
  });

  it('builds a compact pilot artifact with matched-bin comparisons', () => {
    const artifact = runBehavioralPolicyFitnessPilot({
      generatedAt: '2026-03-21T00:00:00.000Z',
      runs: 1,
      steps: 5,
      seed: 123,
      seedStep: 1
    });

    expect(artifact.generatedAt).toBe('2026-03-21T00:00:00.000Z');
    expect(artifact.runs).toHaveLength(1);
    expect(artifact.overall.records).toBeGreaterThan(0);
    expect(artifact.overall.aggregate.matchedBins).toBeGreaterThanOrEqual(0);
    expect(artifact.support.harvestAdvantagePositiveRunFraction).toBeGreaterThanOrEqual(0);
    expect(artifact.support.harvestAdvantagePositiveRunFraction).toBeLessThanOrEqual(1);
    expect(['advantage', 'mixed', 'detrimental']).toContain(artifact.interpretation.outcome);
    expect(artifact.interpretation.summary.length).toBeGreaterThan(0);
  });
});
