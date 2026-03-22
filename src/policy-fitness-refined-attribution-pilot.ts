import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import {
  BEHAVIORAL_POLICY_FITNESS_PILOT_ARTIFACT,
  BehavioralPolicyFitnessPilotArtifact,
  runBehavioralPolicyFitnessPilot
} from './behavioral-policy-fitness-pilot';
import fs from 'node:fs';

export const POLICY_FITNESS_REFINED_ATTRIBUTION_PILOT_ARTIFACT =
  'docs/policy_fitness_refined_attribution_pilot_2026-03-22.json';

export interface PolicyFitnessRefinedAttributionComparison {
  generatedAt: string;
  question: string;
  prediction: string;
  refinedRun: BehavioralPolicyFitnessPilotArtifact;
  oldRun: BehavioralPolicyFitnessPilotArtifact;
  comparison: {
    matchedBinsDelta: number;
    harvestAdvantageDelta: number;
    survivalAdvantageDelta: number;
    reproductionAdvantageDelta: number;
    outcomeChanged: boolean;
    oldOutcome: string;
    newOutcome: string;
  };
  interpretation: {
    outcome: 'unchanged' | 'improved_attribution' | 'reversed_signal';
    summary: string;
  };
}

export function runPolicyFitnessRefinedAttributionPilot(
  generatedAt?: string
): PolicyFitnessRefinedAttributionComparison {
  const refinedRun = runBehavioralPolicyFitnessPilot({ generatedAt });

  let oldRun: BehavioralPolicyFitnessPilotArtifact;
  try {
    const oldArtifactContent = fs.readFileSync(BEHAVIORAL_POLICY_FITNESS_PILOT_ARTIFACT, 'utf8');
    oldRun = JSON.parse(oldArtifactContent);
  } catch (error) {
    throw new Error(
      `Failed to load previous policy fitness pilot artifact at ${BEHAVIORAL_POLICY_FITNESS_PILOT_ARTIFACT}: ${error}`
    );
  }

  const matchedBinsDelta = refinedRun.overall.aggregate.matchedBins - oldRun.overall.aggregate.matchedBins;
  const harvestAdvantageDelta =
    refinedRun.overall.aggregate.weightedHarvestAdvantage - oldRun.overall.aggregate.weightedHarvestAdvantage;
  const survivalAdvantageDelta =
    refinedRun.overall.aggregate.weightedSurvivalAdvantage - oldRun.overall.aggregate.weightedSurvivalAdvantage;
  const reproductionAdvantageDelta =
    refinedRun.overall.aggregate.weightedReproductionAdvantage -
    oldRun.overall.aggregate.weightedReproductionAdvantage;

  const outcomeChanged = refinedRun.interpretation.outcome !== oldRun.interpretation.outcome;
  const interpretation = interpretComparison(
    oldRun,
    refinedRun,
    matchedBinsDelta,
    harvestAdvantageDelta,
    survivalAdvantageDelta,
    reproductionAdvantageDelta,
    outcomeChanged
  );

  return {
    generatedAt: generatedAt ?? new Date().toISOString(),
    question:
      'Does refined policy fitness attribution (decision-time ecology, age bins, disturbance phase) change the detrimental signal observed in the 2026-03-21 pilot?',
    prediction:
      'If the negative signal was caused by poor ecological matching, adding age bins and disturbance phase plus recording ecology at decision time should increase matched bins and could reduce or reverse the detrimental harvest and survival deltas.',
    refinedRun,
    oldRun,
    comparison: {
      matchedBinsDelta,
      harvestAdvantageDelta,
      survivalAdvantageDelta,
      reproductionAdvantageDelta,
      outcomeChanged,
      oldOutcome: oldRun.interpretation.outcome,
      newOutcome: refinedRun.interpretation.outcome
    },
    interpretation
  };
}

function interpretComparison(
  oldRun: BehavioralPolicyFitnessPilotArtifact,
  refinedRun: BehavioralPolicyFitnessPilotArtifact,
  matchedBinsDelta: number,
  harvestAdvantageDelta: number,
  survivalAdvantageDelta: number,
  reproductionAdvantageDelta: number,
  outcomeChanged: boolean
): PolicyFitnessRefinedAttributionComparison['interpretation'] {
  const refinedMatchedBins = refinedRun.overall.aggregate.matchedBins;
  const oldMatchedBins = oldRun.overall.aggregate.matchedBins;
  const refinedHarvest = refinedRun.overall.aggregate.weightedHarvestAdvantage;
  const refinedSurvival = refinedRun.overall.aggregate.weightedSurvivalAdvantage;
  const refinedReproduction = refinedRun.overall.aggregate.weightedReproductionAdvantage;

  const oldOutcome = oldRun.interpretation.outcome;
  const newOutcome = refinedRun.interpretation.outcome;

  if (outcomeChanged && oldOutcome === 'detrimental' && newOutcome !== 'detrimental') {
    return {
      outcome: 'reversed_signal',
      summary: `Refined attribution reversed the detrimental signal. Matched bins increased from ${oldMatchedBins} to ${refinedMatchedBins} (${formatSigned(matchedBinsDelta)}). New deltas: harvest ${formatSigned(refinedHarvest)}, survival ${formatSigned(refinedSurvival)}, reproduction ${formatSigned(refinedReproduction)}. The original negative result appears to have been a measurement artifact.`
    };
  }

  if (matchedBinsDelta > 0 && Math.abs(harvestAdvantageDelta) > 0.01) {
    return {
      outcome: 'improved_attribution',
      summary: `Refined attribution improved matching fidelity from ${oldMatchedBins} to ${refinedMatchedBins} bins (${formatSigned(matchedBinsDelta)}), and shifted harvest advantage by ${formatSigned(harvestAdvantageDelta)}, survival by ${formatSigned(survivalAdvantageDelta)}, and reproduction by ${formatSigned(reproductionAdvantageDelta)}. Detrimental signal persists but is now measured at finer granularity.`
    };
  }

  return {
    outcome: 'unchanged',
    summary: `Refined attribution changed matched bins from ${oldMatchedBins} to ${refinedMatchedBins} (${formatSigned(matchedBinsDelta)}) but produced similar fitness deltas: harvest ${formatSigned(refinedHarvest)} (was ${formatSigned(oldRun.overall.aggregate.weightedHarvestAdvantage)}), survival ${formatSigned(refinedSurvival)} (was ${formatSigned(oldRun.overall.aggregate.weightedSurvivalAdvantage)}). The detrimental signal is robust to improved measurement.`
  };
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

export function runPolicyFitnessRefinedAttributionPilotCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runPolicyFitnessRefinedAttributionPilot(generatedAt));
}

if (process.argv[1]?.endsWith('policy-fitness-refined-attribution-pilot.ts')) {
  runPolicyFitnessRefinedAttributionPilotCli(process.argv.slice(2));
}
