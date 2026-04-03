import { binPolicyFitnessValue } from './policy-fitness';
import { ExposureWithHorizons } from './policy-horizon-shared';

export type PolicyContextMatchingMode = 'coarse_bins' | 'rich_observation';

export interface HorizonArmComparison {
  matchedContexts: number;
  matchedExposureWeight: number;
  weightedHarvestAdvantage: number;
  weightedSurvivalAdvantage: number;
  weightedReproductionAdvantage: number;
}

interface HorizonMetrics {
  meanHarvestIntake: number;
  survivalRate: number;
  reproductionRate: number;
}

export function compareExposureArmsAtHorizon(
  coupledExposures: ReadonlyArray<ExposureWithHorizons>,
  decoupledExposures: ReadonlyArray<ExposureWithHorizons>,
  horizon: number,
  mode: PolicyContextMatchingMode = 'coarse_bins'
): HorizonArmComparison {
  const bins = new Map<
    string,
    {
      coupled: ExposureWithHorizons[];
      decoupled: ExposureWithHorizons[];
    }
  >();

  for (const exposure of coupledExposures) {
    const key = buildMatchingKey(exposure, mode);
    if (!bins.has(key)) {
      bins.set(key, { coupled: [], decoupled: [] });
    }
    bins.get(key)!.coupled.push(exposure);
  }

  for (const exposure of decoupledExposures) {
    const key = buildMatchingKey(exposure, mode);
    if (!bins.has(key)) {
      bins.set(key, { coupled: [], decoupled: [] });
    }
    bins.get(key)!.decoupled.push(exposure);
  }

  let matchedContexts = 0;
  let matchedExposureWeight = 0;
  let weightedHarvest = 0;
  let weightedSurvival = 0;
  let weightedReproduction = 0;

  for (const bin of bins.values()) {
    if (bin.coupled.length === 0 || bin.decoupled.length === 0) {
      continue;
    }

    matchedContexts += 1;
    const weight = Math.min(bin.coupled.length, bin.decoupled.length);
    const coupledMetrics = summarizeHorizonMetrics(bin.coupled, horizon);
    const decoupledMetrics = summarizeHorizonMetrics(bin.decoupled, horizon);

    matchedExposureWeight += weight;
    weightedHarvest += weight * (coupledMetrics.meanHarvestIntake - decoupledMetrics.meanHarvestIntake);
    weightedSurvival += weight * (coupledMetrics.survivalRate - decoupledMetrics.survivalRate);
    weightedReproduction += weight * (coupledMetrics.reproductionRate - decoupledMetrics.reproductionRate);
  }

  if (matchedExposureWeight === 0) {
    return {
      matchedContexts,
      matchedExposureWeight,
      weightedHarvestAdvantage: 0,
      weightedSurvivalAdvantage: 0,
      weightedReproductionAdvantage: 0
    };
  }

  return {
    matchedContexts,
    matchedExposureWeight,
    weightedHarvestAdvantage: weightedHarvest / matchedExposureWeight,
    weightedSurvivalAdvantage: weightedSurvival / matchedExposureWeight,
    weightedReproductionAdvantage: weightedReproduction / matchedExposureWeight
  };
}

function buildMatchingKey(exposure: ExposureWithHorizons, mode: PolicyContextMatchingMode): string {
  if (mode === 'rich_observation') {
    return buildRichObservationKey(exposure);
  }
  return buildCoarseKey(exposure);
}

function buildCoarseKey(exposure: ExposureWithHorizons): string {
  const { record } = exposure;
  return `${record.fertilityBin}:${record.crowdingBin}:${record.ageBin}:${record.disturbancePhase}`;
}

function buildRichObservationKey(exposure: ExposureWithHorizons): string {
  const { record } = exposure;
  const observation = record.observation;
  if (!observation) {
    return buildCoarseKey(exposure);
  }

  const fertilityFineBin = binPolicyFitnessValue(observation.localFertility, 0.1, 2, 6);
  const crowdingFineBin = binPolicyFitnessValue(observation.localCrowding, 0, 12, 6);
  const ageFineBin = binPolicyFitnessValue(observation.age, 0, 120, 6);
  const disturbanceRecencyBin = binPolicyFitnessValue(observation.ticksSinceDisturbance, 0, 120, 5);
  const disturbanceCountBin = binPolicyFitnessValue(observation.recentDisturbanceCount, 0, 6, 3);
  const resourceMixBin = binPolicyFitnessValue(observation.secondaryResourceFraction, 0, 1, 4);
  const lineageShareBin = binPolicyFitnessValue(observation.sameLineageShare, 0, 1, 4);

  return [
    fertilityFineBin,
    crowdingFineBin,
    ageFineBin,
    record.disturbancePhase,
    disturbanceRecencyBin,
    disturbanceCountBin,
    resourceMixBin,
    lineageShareBin
  ].join(':');
}

function summarizeHorizonMetrics(exposures: ReadonlyArray<ExposureWithHorizons>, horizon: number): HorizonMetrics {
  if (exposures.length === 0) {
    return {
      meanHarvestIntake: 0,
      survivalRate: 0,
      reproductionRate: 0
    };
  }

  let harvestTotal = 0;
  let survivalTotal = 0;
  let reproductionTotal = 0;

  for (const exposure of exposures) {
    harvestTotal += exposure.record.harvestIntake;
    const outcome = exposure.horizons.get(horizon);
    if (outcome) {
      survivalTotal += outcome.survived ? 1 : 0;
      reproductionTotal += outcome.reproduced ? 1 : 0;
    }
  }

  return {
    meanHarvestIntake: harvestTotal / exposures.length,
    survivalRate: survivalTotal / exposures.length,
    reproductionRate: reproductionTotal / exposures.length
  };
}
