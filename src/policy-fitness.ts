import { BehavioralPolicyFlags } from './behavioral-control';
import { StepSummary } from './types';

export const DEFAULT_POLICY_FITNESS_FERTILITY_BINS = 4;
export const DEFAULT_POLICY_FITNESS_CROWDING_BINS = 4;

export interface PolicyFitnessRecord extends BehavioralPolicyFlags {
  tick: number;
  agentId: number;
  fertilityBin: number;
  crowdingBin: number;
  harvestIntake: number;
  survived: boolean;
  offspringProduced: number;
}

export interface PolicyFitnessRunSeries {
  summaries: StepSummary[];
  records: PolicyFitnessRecord[];
}

export interface PolicyFitnessGroupMetrics {
  exposures: number;
  meanHarvestIntake: number;
  survivalRate: number;
  reproductionRate: number;
}

export interface PolicyFitnessDeltaMetrics {
  harvestIntake: number;
  survivalRate: number;
  reproductionRate: number;
}

export interface PolicyFitnessMatchedBinComparison {
  fertilityBin: number;
  crowdingBin: number;
  weight: number;
  policyPositive: PolicyFitnessGroupMetrics;
  policyNegative: PolicyFitnessGroupMetrics;
  delta: PolicyFitnessDeltaMetrics;
}

export interface PolicyFitnessAggregateComparison {
  matchedBins: number;
  policyPositiveExposures: number;
  policyNegativeExposures: number;
  weightedHarvestAdvantage: number;
  weightedSurvivalAdvantage: number;
  weightedReproductionAdvantage: number;
}

export interface PolicyFitnessAnalysis {
  records: number;
  overall: {
    policyPositive: PolicyFitnessGroupMetrics;
    policyNegative: PolicyFitnessGroupMetrics;
  };
  matchedBins: PolicyFitnessMatchedBinComparison[];
  aggregate: PolicyFitnessAggregateComparison;
}

export function binPolicyFitnessValue(value: number, min: number, max: number, bins: number): number {
  const normalizedBins = Math.max(1, Math.floor(bins));
  if (!Number.isFinite(value) || max <= min) {
    return 0;
  }

  const normalized = clamp((value - min) / (max - min), 0, 1);
  const scaled = Math.floor(normalized * normalizedBins);
  return Math.min(normalizedBins - 1, scaled);
}

export function analyzePolicyFitnessRecords(records: ReadonlyArray<PolicyFitnessRecord>): PolicyFitnessAnalysis {
  const policyPositiveRecords = records.filter((record) => record.hasAnyPolicy);
  const policyNegativeRecords = records.filter((record) => !record.hasAnyPolicy);
  const bins = new Map<string, PolicyFitnessRecord[]>();

  for (const record of records) {
    const key = `${record.fertilityBin}:${record.crowdingBin}`;
    const binRecords = bins.get(key);
    if (binRecords) {
      binRecords.push(record);
    } else {
      bins.set(key, [record]);
    }
  }

  const matchedBins: PolicyFitnessMatchedBinComparison[] = [];
  for (const [key, binRecords] of bins) {
    const policyPositive = summarizePolicyFitnessGroup(binRecords.filter((record) => record.hasAnyPolicy));
    const policyNegative = summarizePolicyFitnessGroup(binRecords.filter((record) => !record.hasAnyPolicy));
    if (policyPositive.exposures === 0 || policyNegative.exposures === 0) {
      continue;
    }

    const [fertilityBinValue, crowdingBinValue] = key.split(':');
    const weight = Math.min(policyPositive.exposures, policyNegative.exposures);
    matchedBins.push({
      fertilityBin: Number(fertilityBinValue),
      crowdingBin: Number(crowdingBinValue),
      weight,
      policyPositive,
      policyNegative,
      delta: {
        harvestIntake: policyPositive.meanHarvestIntake - policyNegative.meanHarvestIntake,
        survivalRate: policyPositive.survivalRate - policyNegative.survivalRate,
        reproductionRate: policyPositive.reproductionRate - policyNegative.reproductionRate
      }
    });
  }

  matchedBins.sort((left, right) =>
    left.fertilityBin === right.fertilityBin
      ? left.crowdingBin - right.crowdingBin
      : left.fertilityBin - right.fertilityBin
  );

  const totalWeight = matchedBins.reduce((sum, bin) => sum + bin.weight, 0);

  return {
    records: records.length,
    overall: {
      policyPositive: summarizePolicyFitnessGroup(policyPositiveRecords),
      policyNegative: summarizePolicyFitnessGroup(policyNegativeRecords)
    },
    matchedBins,
    aggregate: {
      matchedBins: matchedBins.length,
      policyPositiveExposures: policyPositiveRecords.length,
      policyNegativeExposures: policyNegativeRecords.length,
      weightedHarvestAdvantage:
        totalWeight === 0 ? 0 : weightedMean(matchedBins.map((bin) => [bin.delta.harvestIntake, bin.weight])),
      weightedSurvivalAdvantage:
        totalWeight === 0 ? 0 : weightedMean(matchedBins.map((bin) => [bin.delta.survivalRate, bin.weight])),
      weightedReproductionAdvantage:
        totalWeight === 0 ? 0 : weightedMean(matchedBins.map((bin) => [bin.delta.reproductionRate, bin.weight]))
    }
  };
}

export function summarizePolicyFitnessGroup(records: ReadonlyArray<PolicyFitnessRecord>): PolicyFitnessGroupMetrics {
  if (records.length === 0) {
    return {
      exposures: 0,
      meanHarvestIntake: 0,
      survivalRate: 0,
      reproductionRate: 0
    };
  }

  let harvestTotal = 0;
  let survivedTotal = 0;
  let offspringTotal = 0;
  for (const record of records) {
    harvestTotal += record.harvestIntake;
    survivedTotal += Number(record.survived);
    offspringTotal += record.offspringProduced;
  }

  return {
    exposures: records.length,
    meanHarvestIntake: harvestTotal / records.length,
    survivalRate: survivedTotal / records.length,
    reproductionRate: offspringTotal / records.length
  };
}

function weightedMean(values: ReadonlyArray<readonly [number, number]>): number {
  let totalWeight = 0;
  let weightedTotal = 0;
  for (const [value, weight] of values) {
    if (weight <= 0) {
      continue;
    }
    totalWeight += weight;
    weightedTotal += value * weight;
  }

  return totalWeight === 0 ? 0 : weightedTotal / totalWeight;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
