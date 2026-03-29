import { runExperiment } from '../src/experiment';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface WeightRegimeResult {
  regime: string;
  weights: {
    categories?: {
      morphology?: number;
      policyThreshold?: number;
      policyBounded?: number;
    };
  };
  runs: Array<{
    seed: number;
    finalPopulation: number;
    activeSpecies: number;
    activeClades: number;
    effectiveRichness: number;
    meanPairwiseDistance: number;
    occupiedNiches: number;
    speciationRate: number;
    netDiversificationRate: number;
  }>;
  aggregate: {
    meanActiveSpecies: number;
    meanActiveClades: number;
    meanEffectiveRichness: number;
    meanPairwiseDistance: number;
    meanOccupiedNiches: number;
    meanSpeciationRate: number;
    meanNetDiversificationRate: number;
  };
}

interface FollowupResult {
  generatedAt: string;
  question: string;
  context: string;
  regimes: WeightRegimeResult[];
  comparison: {
    moderateVsMorphologyPriority: {
      activeSpeciesRatio: number;
      effectiveRichnessRatio: number;
      occupiedNichesRatio: number;
      speciationRateRatio: number;
    };
  };
  conclusion: {
    adoptedDefault: 'moderate-downweight' | 'morphology-priority' | 'deferred';
    reasoning: string;
  };
}

const seeds = [8001, 8002, 8003];
const steps = 150;

const baseConfig = {
  width: 32,
  height: 32,
  mutationAmount: 0.16,
  policyMutationProbability: 0.65,
  policyMutationMagnitude: 0.5,
  speciationThreshold: 0.35,
  cladogenesisThreshold: 1.1,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1.0,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1,
  gradedMovementPolicy: true,
  gradedHarvestPolicy: true,
  gradedReproductionPolicy: true,
  gradedSpendingPolicy: true
};

const regimes = [
  {
    label: 'moderate-downweight',
    description: 'Policy thresholds 0.25, policy bounded 0.5, morphology implicit 1.0 (March 27 recommendation)',
    weights: {
      categories: {
        policyThreshold: 0.25,
        policyBounded: 0.5
      }
    }
  },
  {
    label: 'morphology-priority',
    description: 'Morphology 2.0, policy thresholds 0.2, policy bounded 0.4 (used in March 28 validation)',
    weights: {
      categories: {
        morphology: 2,
        policyThreshold: 0.2,
        policyBounded: 0.4
      }
    }
  }
];

function runFollowup() {
  console.log('Distance Weight Follow-up Validation');
  console.log('Comparing moderate downweight vs morphology priority under post-decoder, asymmetric ecology stack');
  console.log(`Seeds: ${seeds.join(', ')}, Steps: ${steps}\n`);

  const results: WeightRegimeResult[] = [];

  for (let r = 0; r < regimes.length; r++) {
    const regime = regimes[r];
    console.log(`\nRegime: ${regime.label}`);
    console.log(`  ${regime.description}`);

    const runs = [];
    for (let s = 0; s < seeds.length; s++) {
      const seed = seeds[s];
      console.log(`  Seed ${seed}...`);
      const config = {
        ...baseConfig,
        genomeV2DistanceWeights: regime.weights
      };

      const result = runExperiment({
        runs: 1,
        steps: steps,
        analyticsWindow: 40,
        seed: seed,
        simulation: { config: config }
      });

      const run = result.runs[0];
      runs.push({
        seed,
        finalPopulation: run.finalSummary.population,
        activeSpecies: run.finalSummary.activeSpecies,
        activeClades: run.finalSummary.activeClades,
        effectiveRichness: run.finalSummary.phenotypeDiversity?.effectiveRichness ?? 0,
        meanPairwiseDistance: run.finalSummary.phenotypeDiversity?.meanPairwiseDistance ?? 0,
        occupiedNiches: run.finalSummary.phenotypeDiversity?.occupiedNiches ?? 0,
        speciationRate: run.finalAnalytics.species.speciationRate,
        netDiversificationRate: run.finalAnalytics.species.netDiversificationRate
      });
    }

    const aggregate = {
      meanActiveSpecies: runs.reduce((s, r) => s + r.activeSpecies, 0) / runs.length,
      meanActiveClades: runs.reduce((s, r) => s + r.activeClades, 0) / runs.length,
      meanEffectiveRichness: runs.reduce((s, r) => s + r.effectiveRichness, 0) / runs.length,
      meanPairwiseDistance: runs.reduce((s, r) => s + r.meanPairwiseDistance, 0) / runs.length,
      meanOccupiedNiches: runs.reduce((s, r) => s + r.occupiedNiches, 0) / runs.length,
      meanSpeciationRate: runs.reduce((s, r) => s + r.speciationRate, 0) / runs.length,
      meanNetDiversificationRate: runs.reduce((s, r) => s + r.netDiversificationRate, 0) / runs.length
    };

    console.log(`  Mean active species: ${aggregate.meanActiveSpecies.toFixed(1)}`);
    console.log(`  Mean effective richness: ${aggregate.meanEffectiveRichness.toFixed(2)}`);
    console.log(`  Mean occupied niches: ${aggregate.meanOccupiedNiches.toFixed(1)}`);
    console.log(`  Mean speciation rate: ${aggregate.meanSpeciationRate.toFixed(4)}`);

    results.push({
      regime: regime.label,
      weights: regime.weights,
      runs,
      aggregate
    });
  }

  const moderate = results.find(r => r.regime === 'moderate-downweight')!;
  const morphPriority = results.find(r => r.regime === 'morphology-priority')!;

  const comparison = {
    moderateVsMorphologyPriority: {
      activeSpeciesRatio: moderate.aggregate.meanActiveSpecies / morphPriority.aggregate.meanActiveSpecies,
      effectiveRichnessRatio: moderate.aggregate.meanEffectiveRichness / morphPriority.aggregate.meanEffectiveRichness,
      occupiedNichesRatio: moderate.aggregate.meanOccupiedNiches / morphPriority.aggregate.meanOccupiedNiches,
      speciationRateRatio: moderate.aggregate.meanSpeciationRate / morphPriority.aggregate.meanSpeciationRate
    }
  };

  console.log('\n=== Comparison ===');
  console.log(`Active species ratio (moderate/morphology-priority): ${comparison.moderateVsMorphologyPriority.activeSpeciesRatio.toFixed(3)}`);
  console.log(`Effective richness ratio: ${comparison.moderateVsMorphologyPriority.effectiveRichnessRatio.toFixed(3)}`);
  console.log(`Occupied niches ratio: ${comparison.moderateVsMorphologyPriority.occupiedNichesRatio.toFixed(3)}`);
  console.log(`Speciation rate ratio: ${comparison.moderateVsMorphologyPriority.speciationRateRatio.toFixed(3)}`);

  const activeSpeciesPercent = ((comparison.moderateVsMorphologyPriority.activeSpeciesRatio - 1) * 100).toFixed(1);
  const richnessPercent = ((comparison.moderateVsMorphologyPriority.effectiveRichnessRatio - 1) * 100).toFixed(1);
  const nichesPercent = ((comparison.moderateVsMorphologyPriority.occupiedNichesRatio - 1) * 100).toFixed(1);

  let adoptedDefault: 'moderate-downweight' | 'morphology-priority' | 'deferred';
  let reasoning: string;

  if (comparison.moderateVsMorphologyPriority.effectiveRichnessRatio > 0.8 && comparison.moderateVsMorphologyPriority.effectiveRichnessRatio < 1.2) {
    adoptedDefault = 'moderate-downweight';
    reasoning = `Moderate downweight produces comparable phenotype-aware outcomes (${activeSpeciesPercent}% active species, ${richnessPercent}% effective richness, ${nichesPercent}% occupied niches) to morphology-priority while avoiding the March 27 rejection criterion (95.9% mixed-divergence inflation under previous calibration). Adopted as default per March 27 recommendation.`;
  } else if (comparison.moderateVsMorphologyPriority.effectiveRichnessRatio < 0.7) {
    adoptedDefault = 'deferred';
    reasoning = `Moderate downweight reduces effective richness by ${Math.abs(parseFloat(richnessPercent))}% relative to morphology-priority. This is a larger reduction than expected from the March 27 calibration. Default adoption deferred pending investigation of whether this reduction preserves ecologically meaningful diversification.`;
  } else {
    adoptedDefault = 'deferred';
    reasoning = `Moderate downweight increases effective richness by ${richnessPercent}% relative to morphology-priority, suggesting the March 27 calibration may not generalize to the current post-decoder, asymmetric-ecology stack. Default adoption deferred pending further investigation.`;
  }

  const output: FollowupResult = {
    generatedAt: new Date().toISOString(),
    question: 'Does the March 27 moderate downweight recommendation remain valid under the post-decoder, asymmetric-ecology stack?',
    context: 'March 27 calibration rejected morphology-priority (95.9% mixed inflation) and recommended moderate downweight (policyThreshold: 0.25, policyBounded: 0.5). However, the March 28 validation used morphology-priority weights. This follow-up tests whether the recommendation holds under current phenotype-aware metrics.',
    regimes: results,
    comparison,
    conclusion: {
      adoptedDefault,
      reasoning
    }
  };

  const outputPath = join(__dirname, '..', '..', 'docs', 'genome_v2_distance_weight_followup_2026-03-29.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nResults written to ${outputPath}`);
  console.log(`\nConclusion: ${adoptedDefault}`);
  console.log(reasoning);
}

runFollowup();
