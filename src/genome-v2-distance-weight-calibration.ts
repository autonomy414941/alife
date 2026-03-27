import { LifeSimulation } from './simulation';
import { SimulationConfig, GenomeV2DistanceWeights, AgentSeed } from './types';
import { createGenomeV2, setTrait, toGenome } from './genome-v2';

export interface DistanceWeightCalibrationScenario {
  label: string;
  description: string;
  config: Partial<SimulationConfig>;
}

export interface DistanceWeightCalibrationRegime {
  label: string;
  description: string;
  weights?: GenomeV2DistanceWeights;
}

export interface DistanceWeightCalibrationRun {
  seed: number;
  finalPopulation: number;
  activeSpecies: number;
  activeClades: number;
  totalSpecies: number;
  totalClades: number;
  extinctSpecies: number;
  extinctClades: number;
}

export interface DistanceWeightCalibrationScenarioResult {
  scenario: string;
  regime: string;
  runs: DistanceWeightCalibrationRun[];
  aggregate: {
    meanFinalPopulation: number;
    meanActiveSpecies: number;
    meanActiveClades: number;
    meanTotalSpecies: number;
    meanTotalClades: number;
  };
}

export interface DistanceWeightCalibrationArtifact {
  generatedAt: string;
  question: string;
  hypothesis: string;
  scenarios: DistanceWeightCalibrationScenario[];
  regimes: DistanceWeightCalibrationRegime[];
  seeds: number[];
  steps: number;
  results: DistanceWeightCalibrationScenarioResult[];
  conclusion: {
    bestRegimeForPolicyInflationControl: string;
    reasoning: string;
    recommendedDefault?: GenomeV2DistanceWeights;
  };
}

export function runDistanceWeightCalibration(
  scenarios: DistanceWeightCalibrationScenario[],
  regimes: DistanceWeightCalibrationRegime[],
  seeds: number[],
  steps: number
): DistanceWeightCalibrationArtifact {
  const results: DistanceWeightCalibrationScenarioResult[] = [];

  for (const scenario of scenarios) {
    for (const regime of regimes) {
      const runs: DistanceWeightCalibrationRun[] = [];

      for (const seed of seeds) {
        const config: Partial<SimulationConfig> = {
          ...scenario.config,
          genomeV2DistanceWeights: regime.weights
        };

        const simulation = new LifeSimulation({
          seed,
          config: {
            width: 14,
            height: 14,
            initialAgents: 24,
            initialEnergy: 12,
            maxResource: 7,
            maxResource2: 7,
            resourceRegen: 0.75,
            resource2Regen: 0.75,
            metabolismCostBase: 0.24,
            moveCost: 0.12,
            harvestCap: 2.4,
            reproduceThreshold: 9,
            reproduceProbability: 0.7,
            offspringEnergyFraction: 0.5,
            maxAge: 180,
            ...config
          },
          initialAgents: buildInitialAgents(24)
        });

        simulation.run(steps);
        const snapshot = simulation.snapshot();
        const history = simulation.history();

        runs.push({
          seed,
          finalPopulation: snapshot.population,
          activeSpecies: snapshot.activeSpecies,
          activeClades: snapshot.activeClades,
          totalSpecies: history.species.length,
          totalClades: history.clades.length,
          extinctSpecies: history.extinctSpecies,
          extinctClades: history.extinctClades
        });
      }

      const aggregate = {
        meanFinalPopulation: runs.reduce((sum, r) => sum + r.finalPopulation, 0) / runs.length,
        meanActiveSpecies: runs.reduce((sum, r) => sum + r.activeSpecies, 0) / runs.length,
        meanActiveClades: runs.reduce((sum, r) => sum + r.activeClades, 0) / runs.length,
        meanTotalSpecies: runs.reduce((sum, r) => sum + r.totalSpecies, 0) / runs.length,
        meanTotalClades: runs.reduce((sum, r) => sum + r.totalClades, 0) / runs.length
      };

      results.push({
        scenario: scenario.label,
        regime: regime.label,
        runs,
        aggregate
      });
    }
  }

  const conclusion = analyzeCalibrationResults(results, scenarios, regimes);

  return {
    generatedAt: new Date().toISOString(),
    question: 'What distance weighting scheme prevents policy-only distance from inflating taxonomic outcomes while preserving ecologically meaningful diversification?',
    hypothesis: 'Down-weighting unbounded policy thresholds and bounded policy traits relative to morphology will reduce policy-only species inflation without eliminating diversification entirely.',
    scenarios,
    regimes,
    seeds,
    steps,
    results,
    conclusion
  };
}

function buildInitialAgents(count: number): AgentSeed[] {
  return Array.from({ length: count }, (_, index) => {
    const genomeV2 = createGenomeV2();
    setTrait(genomeV2, 'metabolism', 0.5);
    setTrait(genomeV2, 'harvest', 0.5);
    setTrait(genomeV2, 'aggression', 0.5);
    setTrait(genomeV2, 'reproduction_harvest_threshold', 0);
    setTrait(genomeV2, 'reproduction_harvest_threshold_steepness', 1);
    setTrait(genomeV2, 'movement_energy_reserve_threshold', 0);
    setTrait(genomeV2, 'movement_min_recent_harvest', 0);
    setTrait(genomeV2, 'harvest_secondary_preference', 0.5);
    setTrait(genomeV2, 'spending_secondary_preference', 0.5);

    return {
      x: index % 14,
      y: Math.floor(index / 14),
      energy: 12,
      genome: toGenome(genomeV2),
      genomeV2
    };
  });
}

function analyzeCalibrationResults(
  results: DistanceWeightCalibrationScenarioResult[],
  scenarios: DistanceWeightCalibrationScenario[],
  regimes: DistanceWeightCalibrationRegime[]
): DistanceWeightCalibrationArtifact['conclusion'] {
  const policyHeavyScenario = scenarios.find((s) => s.label === 'policy-threshold-heavy');
  const mixedScenario = scenarios.find((s) => s.label === 'mixed-divergence');

  if (!policyHeavyScenario || !mixedScenario) {
    return {
      bestRegimeForPolicyInflationControl: 'unknown',
      reasoning: 'Missing required scenarios for analysis'
    };
  }

  const policyHeavyResults = results.filter((r) => r.scenario === policyHeavyScenario.label);
  const mixedResults = results.filter((r) => r.scenario === mixedScenario.label);

  const baselineRegime = regimes.find((r) => r.label === 'baseline');
  if (!baselineRegime) {
    return {
      bestRegimeForPolicyInflationControl: 'unknown',
      reasoning: 'Missing baseline regime'
    };
  }

  const policyHeavyBaseline = policyHeavyResults.find((r) => r.regime === baselineRegime.label);
  const mixedBaseline = mixedResults.find((r) => r.regime === baselineRegime.label);

  if (!policyHeavyBaseline || !mixedBaseline) {
    return {
      bestRegimeForPolicyInflationControl: 'unknown',
      reasoning: 'Missing baseline results'
    };
  }

  const regimeComparisons = regimes
    .filter((r) => r.label !== baselineRegime.label)
    .map((regime) => {
      const policyHeavyResult = policyHeavyResults.find((r) => r.regime === regime.label);
      const mixedResult = mixedResults.find((r) => r.regime === regime.label);

      if (!policyHeavyResult || !mixedResult) {
        return null;
      }

      const policyHeavySpeciesReduction =
        policyHeavyBaseline.aggregate.meanTotalSpecies - policyHeavyResult.aggregate.meanTotalSpecies;
      const mixedSpeciesReduction =
        mixedBaseline.aggregate.meanTotalSpecies - mixedResult.aggregate.meanTotalSpecies;

      const policyHeavyReductionPercent = (policyHeavySpeciesReduction / policyHeavyBaseline.aggregate.meanTotalSpecies) * 100;
      const mixedReductionPercent = (mixedSpeciesReduction / mixedBaseline.aggregate.meanTotalSpecies) * 100;

      const controlsInflationWell = policyHeavySpeciesReduction > 0;
      const preservesMixed = mixedReductionPercent < 50;

      return {
        regime: regime.label,
        policyHeavyReductionPercent,
        mixedReductionPercent,
        policyHeavySpeciesReduction,
        mixedSpeciesReduction,
        controlsInflationWell,
        preservesMixed,
        score: controlsInflationWell && preservesMixed ? policyHeavyReductionPercent - mixedReductionPercent : -1000
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  if (regimeComparisons.length === 0) {
    return {
      bestRegimeForPolicyInflationControl: 'baseline',
      reasoning: 'No alternative regimes to compare'
    };
  }

  const bestRegime = regimeComparisons.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  const bestRegimeDefinition = regimes.find((r) => r.label === bestRegime.regime);

  return {
    bestRegimeForPolicyInflationControl: bestRegime.regime,
    reasoning: `${bestRegime.regime} reduced policy-heavy species by ${bestRegime.policyHeavyReductionPercent.toFixed(1)}% (${bestRegime.policyHeavySpeciesReduction.toFixed(1)} species) while reducing mixed-divergence species by ${bestRegime.mixedReductionPercent.toFixed(1)}% (${bestRegime.mixedSpeciesReduction.toFixed(1)} species). This suggests it controls policy-only inflation while preserving morphology-linked diversification.`,
    recommendedDefault: bestRegimeDefinition?.weights
  };
}
