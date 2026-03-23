import { BehavioralPolicyFlags } from './behavioral-control';
import { StepSummary } from './types';

export const DEFAULT_POLICY_FITNESS_FERTILITY_BINS = 4;
export const DEFAULT_POLICY_FITNESS_CROWDING_BINS = 4;
export const DEFAULT_POLICY_FITNESS_AGE_BINS = 3;
export const DISTURBANCE_PHASE_RECENT_WINDOW = 40;

export interface PolicyFitnessRecord extends BehavioralPolicyFlags {
  tick: number;
  agentId: number;
  fertilityBin: number;
  crowdingBin: number;
  ageBin: number;
  disturbancePhase: number;
  harvestIntake: number;
  survived: boolean;
  offspringProduced: number;
  movementPolicyGated: boolean;
  reproductionPolicyGated: boolean;
  harvestPolicyGuided: boolean;
  policyValues?: Record<string, number>;
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

export interface PolicyFitnessCohortMetrics extends PolicyFitnessGroupMetrics {
  movementPolicyGatedRate: number;
  reproductionPolicyGatedRate: number;
  harvestPolicyGuidedRate: number;
}

export interface PolicyFitnessDeltaMetrics {
  harvestIntake: number;
  survivalRate: number;
  reproductionRate: number;
}

export interface PolicyFitnessMatchedBinComparison {
  fertilityBin: number;
  crowdingBin: number;
  ageBin: number;
  disturbancePhase: number;
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

export function resolveDisturbancePhase(
  currentTick: number,
  lastDisturbanceTick: number | null
): number {
  if (lastDisturbanceTick === null) {
    return 1;
  }
  const ticksSinceDisturbance = currentTick - lastDisturbanceTick;
  return ticksSinceDisturbance <= DISTURBANCE_PHASE_RECENT_WINDOW ? 0 : 1;
}

export function analyzePolicyFitnessRecords(records: ReadonlyArray<PolicyFitnessRecord>): PolicyFitnessAnalysis {
  const policyPositiveRecords = records.filter((record) => record.hasAnyPolicy);
  const policyNegativeRecords = records.filter((record) => !record.hasAnyPolicy);
  const bins = new Map<string, PolicyFitnessRecord[]>();

  for (const record of records) {
    const key = `${record.fertilityBin}:${record.crowdingBin}:${record.ageBin}:${record.disturbancePhase}`;
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

    const [fertilityBinValue, crowdingBinValue, ageBinValue, disturbancePhaseValue] = key.split(':');
    const weight = Math.min(policyPositive.exposures, policyNegative.exposures);
    matchedBins.push({
      fertilityBin: Number(fertilityBinValue),
      crowdingBin: Number(crowdingBinValue),
      ageBin: Number(ageBinValue),
      disturbancePhase: Number(disturbancePhaseValue),
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

  matchedBins.sort((left, right) => {
    if (left.fertilityBin !== right.fertilityBin) return left.fertilityBin - right.fertilityBin;
    if (left.crowdingBin !== right.crowdingBin) return left.crowdingBin - right.crowdingBin;
    if (left.ageBin !== right.ageBin) return left.ageBin - right.ageBin;
    return left.disturbancePhase - right.disturbancePhase;
  });

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

export function summarizePolicyFitnessCohort(
  records: ReadonlyArray<PolicyFitnessRecord>
): PolicyFitnessCohortMetrics {
  const base = summarizePolicyFitnessGroup(records);
  if (records.length === 0) {
    return {
      ...base,
      movementPolicyGatedRate: 0,
      reproductionPolicyGatedRate: 0,
      harvestPolicyGuidedRate: 0
    };
  }

  let movementPolicyGated = 0;
  let reproductionPolicyGated = 0;
  let harvestPolicyGuided = 0;
  for (const record of records) {
    movementPolicyGated += Number(record.movementPolicyGated);
    reproductionPolicyGated += Number(record.reproductionPolicyGated);
    harvestPolicyGuided += Number(record.harvestPolicyGuided);
  }

  return {
    ...base,
    movementPolicyGatedRate: movementPolicyGated / records.length,
    reproductionPolicyGatedRate: reproductionPolicyGated / records.length,
    harvestPolicyGuidedRate: harvestPolicyGuided / records.length
  };
}

export function analyzePolicyFitnessComparison(
  records: ReadonlyArray<PolicyFitnessRecord>,
  isPolicyPositive: (record: PolicyFitnessRecord) => boolean,
  isPolicyNegative: (record: PolicyFitnessRecord) => boolean
): PolicyFitnessAnalysis {
  const selected: PolicyFitnessRecord[] = [];

  for (const record of records) {
    const positive = isPolicyPositive(record);
    const negative = isPolicyNegative(record);
    if (!positive && !negative) {
      continue;
    }

    selected.push({
      ...record,
      hasAnyPolicy: positive
    });
  }

  return analyzePolicyFitnessRecords(selected);
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
