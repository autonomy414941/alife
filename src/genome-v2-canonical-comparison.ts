import { writeFileSync } from 'node:fs';
import { fromGenome, hasTrait, traitCount, EXTENDED_TRAITS } from './genome-v2';
import { LifeSimulation } from './simulation';
import { AgentSeed } from './types';

interface CanonicalComparisonArtifact {
  generatedAt: string;
  config: {
    steps: number;
    seeds: number[];
    founderGrace: boolean;
    newCladeSettlementCrowdingGraceTicks: number;
    newCladeEncounterRestraintGraceBoost: number;
    cladogenesisThreshold: number;
  };
  genomeV2Runs: RunSummary[];
  fixedGenomeRuns: RunSummary[];
  comparison: {
    genomeV2Aggregate: AggregateMetrics;
    fixedGenomeAggregate: AggregateMetrics;
    interpretation: {
      extendedLociEmergenceRate: number;
      extendedLociPersistenceRate: number;
      diversificationAdvantage: number;
      noveltyAdvantage: number;
      ecologicalNoveltyEvidence: string;
    };
  };
}

interface RunSummary {
  seed: number;
  finalTick: number;
  finalPopulation: number;
  finalActiveClades: number;
  finalActiveSpecies: number;
  finalCumulativeExtinctClades: number;
  finalCumulativeExtinctSpecies: number;
  meanLociCount?: number;
  extendedTraitAgentFraction?: number;
  extendedTraitsPresent?: string[];
  lociCountGrowth?: number;
}

interface AggregateMetrics {
  runs: number;
  meanFinalPopulation: number;
  meanActiveClades: number;
  meanActiveSpecies: number;
  meanCumulativeExtinctClades: number;
  meanCumulativeExtinctSpecies: number;
  meanCladogenesisEvents: number;
  meanSpeciationEvents: number;
  meanLociCount?: number;
  meanExtendedTraitAgentFraction?: number;
  extendedTraitEmergenceRate?: number;
  extendedTraitPersistenceRate?: number;
}

function seedGenomeV2Agents(count: number, rng: () => number): AgentSeed[] {
  const seeds: AgentSeed[] = [];
  for (let i = 0; i < count; i++) {
    const baseGenome = {
      metabolism: 0.5 + (rng() - 0.5) * 0.2,
      harvest: 0.5 + (rng() - 0.5) * 0.2,
      aggression: 0.3 + (rng() - 0.5) * 0.2
    };
    const genomeV2 = fromGenome(baseGenome);

    seeds.push({
      x: Math.floor(rng() * 20),
      y: Math.floor(rng() * 20),
      energy: 50,
      genome: baseGenome,
      genomeV2
    });
  }
  return seeds;
}

function runGenomeV2Simulation(seed: number, steps: number, config: any): RunSummary {
  let seedRng = seed;
  const rng = () => {
    seedRng = (seedRng * 9301 + 49297) % 233280;
    return seedRng / 233280;
  };

  const initialAgents = seedGenomeV2Agents(40, rng);

  const sim = new LifeSimulation({
    seed,
    config: {
      ...config,
      mutationAmount: 0.05
    },
    initialAgents
  });

  let initialMeanLoci = 0;
  let finalMeanLoci = 0;

  for (let i = 0; i < steps; i++) {
    sim.step();

    if (i === 0) {
      const snapshot = sim.snapshot();
      const agentsWithV2 = snapshot.agents.filter((a) => a.genomeV2 !== undefined);
      if (agentsWithV2.length > 0) {
        const lociCounts = agentsWithV2.map((a) => traitCount(a.genomeV2!));
        initialMeanLoci = lociCounts.reduce((sum, n) => sum + n, 0) / lociCounts.length;
      }
    }
  }

  const finalSnapshot = sim.snapshot();
  const history = sim.history();
  const activeClades = history.clades.filter((c) => c.extinctTick === null);
  const activeSpecies = history.species.filter((s) => s.extinctTick === null);
  const extinctClades = history.clades.filter((c) => c.extinctTick !== null);
  const extinctSpecies = history.species.filter((s) => s.extinctTick !== null);

  const agentsWithV2 = finalSnapshot.agents.filter((a) => a.genomeV2 !== undefined);
  const lociCounts = agentsWithV2.map((a) => traitCount(a.genomeV2!));
  finalMeanLoci = agentsWithV2.length > 0
    ? lociCounts.reduce((sum, n) => sum + n, 0) / lociCounts.length
    : 0;

  const extendedTraitsPresent = new Set<string>();
  let agentsWithExtendedTraits = 0;
  for (const agent of agentsWithV2) {
    let hasExtended = false;
    for (const trait of EXTENDED_TRAITS) {
      if (hasTrait(agent.genomeV2!, trait)) {
        extendedTraitsPresent.add(trait);
        hasExtended = true;
      }
    }
    if (hasExtended) {
      agentsWithExtendedTraits++;
    }
  }

  const extendedTraitAgentFraction = agentsWithV2.length > 0
    ? agentsWithExtendedTraits / agentsWithV2.length
    : 0;

  return {
    seed,
    finalTick: finalSnapshot.tick,
    finalPopulation: finalSnapshot.population,
    finalActiveClades: activeClades.length,
    finalActiveSpecies: activeSpecies.length,
    finalCumulativeExtinctClades: extinctClades.length,
    finalCumulativeExtinctSpecies: extinctSpecies.length,
    meanLociCount: finalMeanLoci,
    extendedTraitAgentFraction,
    extendedTraitsPresent: Array.from(extendedTraitsPresent).sort(),
    lociCountGrowth: finalMeanLoci - initialMeanLoci
  };
}

function runFixedGenomeSimulation(seed: number, steps: number, config: any): RunSummary {
  const sim = new LifeSimulation({
    seed,
    config: {
      ...config,
      mutationAmount: 0.05
    }
  });

  for (let i = 0; i < steps; i++) {
    sim.step();
  }

  const finalSnapshot = sim.snapshot();
  const history = sim.history();
  const activeClades = history.clades.filter((c) => c.extinctTick === null);
  const activeSpecies = history.species.filter((s) => s.extinctTick === null);
  const extinctClades = history.clades.filter((c) => c.extinctTick !== null);
  const extinctSpecies = history.species.filter((s) => s.extinctTick !== null);

  return {
    seed,
    finalTick: finalSnapshot.tick,
    finalPopulation: finalSnapshot.population,
    finalActiveClades: activeClades.length,
    finalActiveSpecies: activeSpecies.length,
    finalCumulativeExtinctClades: extinctClades.length,
    finalCumulativeExtinctSpecies: extinctSpecies.length
  };
}

function aggregateRuns(runs: RunSummary[]): AggregateMetrics {
  if (runs.length === 0) {
    return {
      runs: 0,
      meanFinalPopulation: 0,
      meanActiveClades: 0,
      meanActiveSpecies: 0,
      meanCumulativeExtinctClades: 0,
      meanCumulativeExtinctSpecies: 0,
      meanCladogenesisEvents: 0,
      meanSpeciationEvents: 0
    };
  }

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const mean = (arr: number[]) => sum(arr) / arr.length;

  const aggregate: AggregateMetrics = {
    runs: runs.length,
    meanFinalPopulation: mean(runs.map(r => r.finalPopulation)),
    meanActiveClades: mean(runs.map(r => r.finalActiveClades)),
    meanActiveSpecies: mean(runs.map(r => r.finalActiveSpecies)),
    meanCumulativeExtinctClades: mean(runs.map(r => r.finalCumulativeExtinctClades)),
    meanCumulativeExtinctSpecies: mean(runs.map(r => r.finalCumulativeExtinctSpecies)),
    meanCladogenesisEvents: mean(runs.map(r => r.finalActiveClades + r.finalCumulativeExtinctClades)),
    meanSpeciationEvents: mean(runs.map(r => r.finalActiveSpecies + r.finalCumulativeExtinctSpecies))
  };

  const hasGenomeV2Data = runs.every(r => r.meanLociCount !== undefined);
  if (hasGenomeV2Data) {
    aggregate.meanLociCount = mean(runs.map(r => r.meanLociCount!));
    aggregate.meanExtendedTraitAgentFraction = mean(runs.map(r => r.extendedTraitAgentFraction!));

    const runsWithExtendedTraits = runs.filter(r => r.extendedTraitsPresent && r.extendedTraitsPresent.length > 0);
    aggregate.extendedTraitEmergenceRate = runsWithExtendedTraits.length / runs.length;

    const runsWithPersistentExtended = runs.filter(r => r.extendedTraitAgentFraction && r.extendedTraitAgentFraction > 0.01);
    aggregate.extendedTraitPersistenceRate = runsWithPersistentExtended.length / runs.length;
  }

  return aggregate;
}

function runCanonicalComparison(
  steps = 4000,
  seeds = [12345, 23456, 34567, 45678]
): CanonicalComparisonArtifact {
  const founderGraceConfig = {
    newCladeSettlementCrowdingGraceTicks: 80,
    newCladeEncounterRestraintGraceBoost: 0.6,
    cladogenesisThreshold: 1.0
  };

  console.log(`Running GenomeV2 canonical comparison (${steps} steps, ${seeds.length} seeds)...`);

  const genomeV2Runs: RunSummary[] = [];
  for (const seed of seeds) {
    console.log(`  GenomeV2 seed ${seed}...`);
    const run = runGenomeV2Simulation(seed, steps, founderGraceConfig);
    genomeV2Runs.push(run);
  }

  const fixedGenomeRuns: RunSummary[] = [];
  for (const seed of seeds) {
    console.log(`  Fixed genome seed ${seed}...`);
    const run = runFixedGenomeSimulation(seed, steps, founderGraceConfig);
    fixedGenomeRuns.push(run);
  }

  const genomeV2Aggregate = aggregateRuns(genomeV2Runs);
  const fixedGenomeAggregate = aggregateRuns(fixedGenomeRuns);

  const diversificationAdvantage =
    ((genomeV2Aggregate.meanCladogenesisEvents + genomeV2Aggregate.meanSpeciationEvents) -
     (fixedGenomeAggregate.meanCladogenesisEvents + fixedGenomeAggregate.meanSpeciationEvents)) /
    (fixedGenomeAggregate.meanCladogenesisEvents + fixedGenomeAggregate.meanSpeciationEvents);

  const noveltyAdvantage = genomeV2Aggregate.extendedTraitPersistenceRate ?? 0;

  let ecologicalNoveltyEvidence: string;
  if (genomeV2Aggregate.extendedTraitEmergenceRate === 0) {
    ecologicalNoveltyEvidence = 'none: extended traits did not emerge';
  } else if (genomeV2Aggregate.extendedTraitPersistenceRate === 0) {
    ecologicalNoveltyEvidence = 'weak: extended traits emerged but did not persist (>1% prevalence)';
  } else if (diversificationAdvantage < 0.05 && noveltyAdvantage > 0) {
    ecologicalNoveltyEvidence = 'moderate: extended traits persisted but diversification gain is within noise';
  } else if (diversificationAdvantage >= 0.05 && noveltyAdvantage > 0) {
    ecologicalNoveltyEvidence = 'strong: extended traits persisted and diversification increased beyond baseline';
  } else {
    ecologicalNoveltyEvidence = 'ambiguous: unexpected pattern';
  }

  return {
    generatedAt: new Date().toISOString(),
    config: {
      steps,
      seeds,
      founderGrace: true,
      ...founderGraceConfig
    },
    genomeV2Runs,
    fixedGenomeRuns,
    comparison: {
      genomeV2Aggregate,
      fixedGenomeAggregate,
      interpretation: {
        extendedLociEmergenceRate: genomeV2Aggregate.extendedTraitEmergenceRate ?? 0,
        extendedLociPersistenceRate: genomeV2Aggregate.extendedTraitPersistenceRate ?? 0,
        diversificationAdvantage,
        noveltyAdvantage,
        ecologicalNoveltyEvidence
      }
    }
  };
}

if (require.main === module) {
  const dateString = process.argv[2] ?? new Date().toISOString().split('T')[0];
  const steps = process.argv[3] ? parseInt(process.argv[3], 10) : 4000;
  const seedsArg = process.argv[4];
  const seeds = seedsArg
    ? seedsArg.split(',').map(s => parseInt(s.trim(), 10))
    : [12345, 23456, 34567, 45678];

  const artifact = runCanonicalComparison(steps, seeds);

  const outputPath = `docs/genome_v2_canonical_comparison_${dateString}.json`;
  writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + '\n');

  console.log(`\nResults written to ${outputPath}`);
  console.log(`\n=== GenomeV2 Aggregate ===`);
  console.log(`Mean population: ${artifact.comparison.genomeV2Aggregate.meanFinalPopulation.toFixed(1)}`);
  console.log(`Mean active clades: ${artifact.comparison.genomeV2Aggregate.meanActiveClades.toFixed(1)}`);
  console.log(`Mean active species: ${artifact.comparison.genomeV2Aggregate.meanActiveSpecies.toFixed(1)}`);
  console.log(`Mean cladogenesis events: ${artifact.comparison.genomeV2Aggregate.meanCladogenesisEvents.toFixed(1)}`);
  console.log(`Mean speciation events: ${artifact.comparison.genomeV2Aggregate.meanSpeciationEvents.toFixed(1)}`);
  console.log(`Mean loci count: ${artifact.comparison.genomeV2Aggregate.meanLociCount?.toFixed(2)}`);
  console.log(`Extended trait emergence rate: ${(artifact.comparison.interpretation.extendedLociEmergenceRate * 100).toFixed(0)}%`);
  console.log(`Extended trait persistence rate: ${(artifact.comparison.interpretation.extendedLociPersistenceRate * 100).toFixed(0)}%`);

  console.log(`\n=== Fixed Genome Aggregate ===`);
  console.log(`Mean population: ${artifact.comparison.fixedGenomeAggregate.meanFinalPopulation.toFixed(1)}`);
  console.log(`Mean active clades: ${artifact.comparison.fixedGenomeAggregate.meanActiveClades.toFixed(1)}`);
  console.log(`Mean active species: ${artifact.comparison.fixedGenomeAggregate.meanActiveSpecies.toFixed(1)}`);
  console.log(`Mean cladogenesis events: ${artifact.comparison.fixedGenomeAggregate.meanCladogenesisEvents.toFixed(1)}`);
  console.log(`Mean speciation events: ${artifact.comparison.fixedGenomeAggregate.meanSpeciationEvents.toFixed(1)}`);

  console.log(`\n=== Comparison ===`);
  console.log(`Diversification advantage: ${(artifact.comparison.interpretation.diversificationAdvantage * 100).toFixed(1)}%`);
  console.log(`Novelty advantage: ${(artifact.comparison.interpretation.noveltyAdvantage * 100).toFixed(0)}%`);
  console.log(`Ecological novelty evidence: ${artifact.comparison.interpretation.ecologicalNoveltyEvidence}`);
}

export { runCanonicalComparison };
