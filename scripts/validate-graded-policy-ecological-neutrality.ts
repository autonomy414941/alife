import { runExperiment } from '../src/experiment';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  seeds: { gradedPolicy: number[]; baseline: number[] };
  steps: number;
  gradedPolicyResults: Array<{
    seed: number;
    finalPopulation: number;
    activeSpecies: number;
    activeClades: number;
    totalSpecies: number;
    totalClades: number;
    effectiveRichness: number;
    meanPairwiseDistance: number;
    occupiedNiches: number;
    speciesPerOccupiedNiche: number;
    speciationRate: number;
    extinctionRate: number;
    netDiversificationRate: number;
  }>;
  baselineResults: Array<{
    seed: number;
    finalPopulation: number;
    activeSpecies: number;
    activeClades: number;
    totalSpecies: number;
    totalClades: number;
    effectiveRichness: number;
    meanPairwiseDistance: number;
    occupiedNiches: number;
    speciesPerOccupiedNiche: number;
    speciationRate: number;
    extinctionRate: number;
    netDiversificationRate: number;
  }>;
  aggregate: {
    gradedPolicy: {
      meanActiveSpecies: number;
      meanActiveClades: number;
      meanEffectiveRichness: number;
      meanPairwiseDistance: number;
      meanOccupiedNiches: number;
      meanSpeciationRate: number;
      meanNetDiversificationRate: number;
    };
    baseline: {
      meanActiveSpecies: number;
      meanActiveClades: number;
      meanEffectiveRichness: number;
      meanPairwiseDistance: number;
      meanOccupiedNiches: number;
      meanSpeciationRate: number;
      meanNetDiversificationRate: number;
    };
    delta: {
      activeSpecies: number;
      activeClades: number;
      effectiveRichness: number;
      pairwiseDistance: number;
      occupiedNiches: number;
      speciationRate: number;
      netDiversificationRate: number;
    };
  };
  conclusion: {
    neutralityStatus: 'persists' | 'weakens' | 'reverses';
    summary: string;
  };
}

const gradedPolicySeeds = [6001, 6002, 6003, 6004];
const baselineSeeds = [7001, 7002, 7003, 7004];
const steps = 200;

const baseConfig = {
  width: 32,
  height: 32,
  mutationAmount: 0.16,
  policyMutationProbability: 0.65,
  policyMutationMagnitude: 0.5,
  speciationThreshold: 0.35,
  cladogenesisThreshold: 1.1,
  genomeV2DistanceWeights: {
    categories: {
      morphology: 2,
      policyThreshold: 0.2,
      policyBounded: 0.4
    }
  },
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1.0,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

const gradedPolicyConfig = {
  ...baseConfig
};

const baselineConfig = {
  ...baseConfig,
  policyMutationProbability: 0
};

console.log('Running graded-policy ecological neutrality validation...');
console.log('Graded policy seeds:', gradedPolicySeeds);
console.log('Baseline seeds:', baselineSeeds);
console.log('Steps:', steps);

const gradedPolicyRuns = gradedPolicySeeds.map((seed) => {
  console.log(`Running graded-policy seed ${seed}...`);
  const result = runExperiment({
    runs: 1,
    steps,
    analyticsWindow: 40,
    seed,
    simulation: { config: gradedPolicyConfig }
  });
  const run = result.runs[0];
  return {
    seed,
    finalPopulation: run.finalSummary.population,
    activeSpecies: run.finalSummary.activeSpecies,
    activeClades: run.finalSummary.activeClades,
    totalSpecies: run.finalSummary.totalSpecies,
    totalClades: run.finalSummary.totalClades,
    effectiveRichness: run.finalSummary.phenotypeDiversity?.effectiveRichness ?? 0,
    meanPairwiseDistance: run.finalSummary.phenotypeDiversity?.meanPairwiseDistance ?? 0,
    occupiedNiches: run.finalSummary.phenotypeDiversity?.occupiedNiches ?? 0,
    speciesPerOccupiedNiche: run.finalSummary.phenotypeDiversity?.speciesPerOccupiedNiche ?? 0,
    speciationRate: run.finalAnalytics.species.speciationRate,
    extinctionRate: run.finalAnalytics.species.extinctionRate,
    netDiversificationRate: run.finalAnalytics.species.netDiversificationRate
  };
});

const baselineRuns = baselineSeeds.map((seed) => {
  console.log(`Running baseline seed ${seed}...`);
  const result = runExperiment({
    runs: 1,
    steps,
    analyticsWindow: 40,
    seed,
    simulation: { config: baselineConfig }
  });
  const run = result.runs[0];
  return {
    seed,
    finalPopulation: run.finalSummary.population,
    activeSpecies: run.finalSummary.activeSpecies,
    activeClades: run.finalSummary.activeClades,
    totalSpecies: run.finalSummary.totalSpecies,
    totalClades: run.finalSummary.totalClades,
    effectiveRichness: run.finalSummary.phenotypeDiversity?.effectiveRichness ?? 0,
    meanPairwiseDistance: run.finalSummary.phenotypeDiversity?.meanPairwiseDistance ?? 0,
    occupiedNiches: run.finalSummary.phenotypeDiversity?.occupiedNiches ?? 0,
    speciesPerOccupiedNiche: run.finalSummary.phenotypeDiversity?.speciesPerOccupiedNiche ?? 0,
    speciationRate: run.finalAnalytics.species.speciationRate,
    extinctionRate: run.finalAnalytics.species.extinctionRate,
    netDiversificationRate: run.finalAnalytics.species.netDiversificationRate
  };
});

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

const gradedPolicyAggregate = {
  meanActiveSpecies: mean(gradedPolicyRuns.map((r) => r.activeSpecies)),
  meanActiveClades: mean(gradedPolicyRuns.map((r) => r.activeClades)),
  meanEffectiveRichness: mean(gradedPolicyRuns.map((r) => r.effectiveRichness)),
  meanPairwiseDistance: mean(gradedPolicyRuns.map((r) => r.meanPairwiseDistance)),
  meanOccupiedNiches: mean(gradedPolicyRuns.map((r) => r.occupiedNiches)),
  meanSpeciationRate: mean(gradedPolicyRuns.map((r) => r.speciationRate)),
  meanNetDiversificationRate: mean(gradedPolicyRuns.map((r) => r.netDiversificationRate))
};

const baselineAggregate = {
  meanActiveSpecies: mean(baselineRuns.map((r) => r.activeSpecies)),
  meanActiveClades: mean(baselineRuns.map((r) => r.activeClades)),
  meanEffectiveRichness: mean(baselineRuns.map((r) => r.effectiveRichness)),
  meanPairwiseDistance: mean(baselineRuns.map((r) => r.meanPairwiseDistance)),
  meanOccupiedNiches: mean(baselineRuns.map((r) => r.occupiedNiches)),
  meanSpeciationRate: mean(baselineRuns.map((r) => r.speciationRate)),
  meanNetDiversificationRate: mean(baselineRuns.map((r) => r.netDiversificationRate))
};

const delta = {
  activeSpecies: gradedPolicyAggregate.meanActiveSpecies - baselineAggregate.meanActiveSpecies,
  activeClades: gradedPolicyAggregate.meanActiveClades - baselineAggregate.meanActiveClades,
  effectiveRichness:
    gradedPolicyAggregate.meanEffectiveRichness - baselineAggregate.meanEffectiveRichness,
  pairwiseDistance:
    gradedPolicyAggregate.meanPairwiseDistance - baselineAggregate.meanPairwiseDistance,
  occupiedNiches: gradedPolicyAggregate.meanOccupiedNiches - baselineAggregate.meanOccupiedNiches,
  speciationRate: gradedPolicyAggregate.meanSpeciationRate - baselineAggregate.meanSpeciationRate,
  netDiversificationRate:
    gradedPolicyAggregate.meanNetDiversificationRate - baselineAggregate.meanNetDiversificationRate
};

let neutralityStatus: 'persists' | 'weakens' | 'reverses';
let summary: string;

const relativeEffectiveRichnessDelta =
  baselineAggregate.meanEffectiveRichness > 0
    ? delta.effectiveRichness / baselineAggregate.meanEffectiveRichness
    : 0;

const relativeOccupiedNichesDelta =
  baselineAggregate.meanOccupiedNiches > 0
    ? delta.occupiedNiches / baselineAggregate.meanOccupiedNiches
    : 0;

const relativeSpeciationDelta =
  baselineAggregate.meanSpeciationRate > 0
    ? delta.speciationRate / baselineAggregate.meanSpeciationRate
    : 0;

if (
  Math.abs(relativeEffectiveRichnessDelta) < 0.1 &&
  Math.abs(relativeOccupiedNichesDelta) < 0.1 &&
  Math.abs(relativeSpeciationDelta) < 0.1
) {
  neutralityStatus = 'persists';
  summary = `Graded policy traits remain near-neutral under asymmetric ecology. Effective richness delta ${delta.effectiveRichness.toFixed(2)} (${(relativeEffectiveRichnessDelta * 100).toFixed(1)}%), occupied niches delta ${delta.occupiedNiches.toFixed(2)} (${(relativeOccupiedNichesDelta * 100).toFixed(1)}%), speciation rate delta ${delta.speciationRate.toFixed(4)} (${(relativeSpeciationDelta * 100).toFixed(1)}%). The phenotype decoder and asymmetric resource dynamics did not make graded policies ecologically causal.`;
} else if (
  relativeEffectiveRichnessDelta > 0.15 ||
  relativeOccupiedNichesDelta > 0.15 ||
  relativeSpeciationDelta > 0.15
) {
  neutralityStatus = 'reverses';
  summary = `Graded policy traits now show positive ecological differentiation. Effective richness +${delta.effectiveRichness.toFixed(2)} (+${(relativeEffectiveRichnessDelta * 100).toFixed(1)}%), occupied niches +${delta.occupiedNiches.toFixed(2)} (+${(relativeOccupiedNichesDelta * 100).toFixed(1)}%), speciation rate +${delta.speciationRate.toFixed(4)} (+${(relativeSpeciationDelta * 100).toFixed(1)}%). The combined changes to phenotype realization and ecological asymmetry enabled graded policy loci to drive ecologically distinct diversification.`;
} else {
  neutralityStatus = 'weakens';
  summary = `Graded policy traits show weakly positive or ambiguous effects. Effective richness delta ${delta.effectiveRichness.toFixed(2)} (${(relativeEffectiveRichnessDelta * 100).toFixed(1)}%), occupied niches delta ${delta.occupiedNiches.toFixed(2)} (${(relativeOccupiedNichesDelta * 100).toFixed(1)}%), speciation rate delta ${delta.speciationRate.toFixed(4)} (${(relativeSpeciationDelta * 100).toFixed(1)}%). Some ecological coupling exists but the signal is modest.`;
}

const result: ValidationResult = {
  generatedAt: new Date().toISOString(),
  question:
    'Do graded movement, harvest, and reproduction policies remain near-neutral once loci are expressed through a shared phenotype decoder and resource layers are asymmetric?',
  prediction:
    'If the previous neutrality was caused by expression gaps and environmental symmetry, we should now see positive ecological differentiation. If neutrality persists, the issue is deeper policy-ecology coupling.',
  methodology:
    'Run matched 200-step panels with 4 seeds each. Graded-policy arm allows policy trait mutation (policyMutationProbability=0.65). Baseline arm prevents policy mutation (policyMutationProbability=0). Both use asymmetric resource layer configuration (secondary layer has different seasonal amplitude, phase offset, and spatial shift). Both use morphology-priority distance weighting. Compare using phenotype-aware diversity metrics (effective richness, occupied niches) alongside raw species counts.',
  seeds: { gradedPolicy: gradedPolicySeeds, baseline: baselineSeeds },
  steps,
  gradedPolicyResults: gradedPolicyRuns,
  baselineResults: baselineRuns,
  aggregate: {
    gradedPolicy: gradedPolicyAggregate,
    baseline: baselineAggregate,
    delta
  },
  conclusion: {
    neutralityStatus,
    summary
  }
};

const outputPath = join(
  __dirname,
  '..',
  'docs',
  `graded_policy_ecological_neutrality_generalization_${new Date().toISOString().split('T')[0]}.json`
);

writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log('\nValidation complete.');
console.log('Status:', neutralityStatus);
console.log('Summary:', summary);
console.log('Output:', outputPath);
