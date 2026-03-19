import { writeFileSync } from 'node:fs';
import { createGenomeV2, fromGenome, getTrait, hasTrait, listTraits, traitCount, EXTENDED_TRAITS } from './genome-v2';
import { LifeSimulation } from './simulation';
import { AgentSeed, GenomeV2 } from './types';

interface LiveGenomeV2PilotArtifact {
  generatedAt: string;
  config: {
    steps: number;
    seed: number;
    addLociProbability: number;
    removeLociProbability: number;
    initialPopulationSize: number;
    founderGrace: boolean;
    newCladeSettlementCrowdingGraceTicks: number;
    newCladeEncounterRestraintGraceBoost: number;
    cladogenesisThreshold: number;
  };
  results: {
    finalTick: number;
    finalAgentCount: number;
    finalActiveCladeCount: number;
    finalActiveSpeciesCount: number;
    lociCountTimeSeries: Array<{ tick: number; mean: number; min: number; max: number }>;
    extendedTraitPrevalence: Array<{
      tick: number;
      habitat_preference: number;
      trophic_level: number;
      defense_level: number;
      metabolic_efficiency_primary: number;
      metabolic_efficiency_secondary: number;
    }>;
    finalLociCountDistribution: Record<number, number>;
    anyExtendedTraitAppeared: boolean;
    extendedTraitPersistence: {
      habitat_preference: { appeared: boolean; sustainedTicks: number };
      trophic_level: { appeared: boolean; sustainedTicks: number };
      defense_level: { appeared: boolean; sustainedTicks: number };
      metabolic_efficiency_primary: { appeared: boolean; sustainedTicks: number };
      metabolic_efficiency_secondary: { appeared: boolean; sustainedTicks: number };
    };
  };
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

function runLiveGenomeV2Pilot(seed = 54321): LiveGenomeV2PilotArtifact {
  const steps = 1000;
  const addLociProbability = 0.02;
  const removeLociProbability = 0.01;
  const initialPopulationSize = 40;

  const founderGraceConfig = {
    newCladeSettlementCrowdingGraceTicks: 80,
    newCladeEncounterRestraintGraceBoost: 0.6,
    cladogenesisThreshold: 1.0
  };

  let seedRng = seed;
  const rng = () => {
    seedRng = (seedRng * 9301 + 49297) % 233280;
    return seedRng / 233280;
  };

  const initialAgents = seedGenomeV2Agents(initialPopulationSize, rng);

  const sim = new LifeSimulation({
    seed,
    config: {
      ...founderGraceConfig,
      mutationAmount: 0.05
    },
    initialAgents
  });

  const sampleInterval = 50;
  const lociCountTimeSeries: Array<{ tick: number; mean: number; min: number; max: number }> = [];
  const extendedTraitPrevalence: Array<{
    tick: number;
    habitat_preference: number;
    trophic_level: number;
    defense_level: number;
    metabolic_efficiency_primary: number;
    metabolic_efficiency_secondary: number;
  }> = [];

  const traitAppearanceTicks = new Map<string, number>();
  const traitLastSeenTicks = new Map<string, number>();

  for (let i = 0; i < steps; i++) {
    sim.step();

    if (i % sampleInterval === 0 || i === steps - 1) {
      const snapshot = sim.snapshot();
      const agentsWithV2 = snapshot.agents.filter((a) => a.genomeV2 !== undefined);

      if (agentsWithV2.length > 0) {
        const lociCounts = agentsWithV2.map((a) => traitCount(a.genomeV2!));
        const meanLoci = lociCounts.reduce((sum, n) => sum + n, 0) / lociCounts.length;
        const minLoci = Math.min(...lociCounts);
        const maxLoci = Math.max(...lociCounts);

        lociCountTimeSeries.push({
          tick: snapshot.tick,
          mean: meanLoci,
          min: minLoci,
          max: maxLoci
        });

        const prevalence: Record<string, number> = {};
        for (const trait of EXTENDED_TRAITS) {
          const agentsWithTrait = agentsWithV2.filter((a) => hasTrait(a.genomeV2!, trait));
          const fraction = agentsWithTrait.length / agentsWithV2.length;
          prevalence[trait] = fraction;

          if (fraction > 0) {
            if (!traitAppearanceTicks.has(trait)) {
              traitAppearanceTicks.set(trait, snapshot.tick);
            }
            traitLastSeenTicks.set(trait, snapshot.tick);
          }
        }

        extendedTraitPrevalence.push({
          tick: snapshot.tick,
          habitat_preference: prevalence['habitat_preference'] ?? 0,
          trophic_level: prevalence['trophic_level'] ?? 0,
          defense_level: prevalence['defense_level'] ?? 0,
          metabolic_efficiency_primary: prevalence['metabolic_efficiency_primary'] ?? 0,
          metabolic_efficiency_secondary: prevalence['metabolic_efficiency_secondary'] ?? 0
        });
      }
    }
  }

  const finalSnapshot = sim.snapshot();
  const finalAgentsWithV2 = finalSnapshot.agents.filter((a) => a.genomeV2 !== undefined);

  const finalLociCounts = finalAgentsWithV2.map((a) => traitCount(a.genomeV2!));
  const finalLociCountDistribution: Record<number, number> = {};
  for (const count of finalLociCounts) {
    finalLociCountDistribution[count] = (finalLociCountDistribution[count] ?? 0) + 1;
  }

  const extendedTraitPersistence: Record<string, { appeared: boolean; sustainedTicks: number }> = {};
  for (const trait of EXTENDED_TRAITS) {
    const appeared = traitAppearanceTicks.has(trait);
    const sustainedTicks = appeared
      ? (traitLastSeenTicks.get(trait)! - traitAppearanceTicks.get(trait)!)
      : 0;
    extendedTraitPersistence[trait] = { appeared, sustainedTicks };
  }

  const anyExtendedTraitAppeared = Array.from(traitAppearanceTicks.keys()).length > 0;

  const history = sim.history();
  const activeClades = history.clades.filter((c) => c.extinctTick === null);
  const activeSpecies = history.species.filter((s) => s.extinctTick === null);

  const artifact: LiveGenomeV2PilotArtifact = {
    generatedAt: new Date().toISOString(),
    config: {
      steps,
      seed,
      addLociProbability,
      removeLociProbability,
      initialPopulationSize,
      founderGrace: true,
      ...founderGraceConfig
    },
    results: {
      finalTick: finalSnapshot.tick,
      finalAgentCount: finalSnapshot.agents.length,
      finalActiveCladeCount: activeClades.length,
      finalActiveSpeciesCount: activeSpecies.length,
      lociCountTimeSeries,
      extendedTraitPrevalence,
      finalLociCountDistribution,
      anyExtendedTraitAppeared,
      extendedTraitPersistence: {
        habitat_preference: extendedTraitPersistence['habitat_preference'] ?? { appeared: false, sustainedTicks: 0 },
        trophic_level: extendedTraitPersistence['trophic_level'] ?? { appeared: false, sustainedTicks: 0 },
        defense_level: extendedTraitPersistence['defense_level'] ?? { appeared: false, sustainedTicks: 0 },
        metabolic_efficiency_primary: extendedTraitPersistence['metabolic_efficiency_primary'] ?? { appeared: false, sustainedTicks: 0 },
        metabolic_efficiency_secondary: extendedTraitPersistence['metabolic_efficiency_secondary'] ?? { appeared: false, sustainedTicks: 0 }
      }
    }
  };

  return artifact;
}

if (require.main === module) {
  const dateString = process.argv[2] ?? new Date().toISOString().split('T')[0];
  const seed = process.argv[3] ? parseInt(process.argv[3], 10) : 54321;

  console.log(`Running live GenomeV2 pilot (high add-rate, ${dateString}, seed ${seed})...`);

  const artifact = runLiveGenomeV2Pilot(seed);

  const outputPath = `docs/genome_v2_live_pilot_${dateString}.json`;
  writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + '\n');

  console.log(`\nResults written to ${outputPath}`);
  console.log(`Final agents: ${artifact.results.finalAgentCount}`);
  console.log(`Active clades: ${artifact.results.finalActiveCladeCount}`);
  console.log(`Active species: ${artifact.results.finalActiveSpeciesCount}`);
  console.log(`Any extended trait appeared: ${artifact.results.anyExtendedTraitAppeared}`);
  console.log(`\nExtended trait persistence:`);
  for (const [trait, data] of Object.entries(artifact.results.extendedTraitPersistence)) {
    if (data.appeared) {
      console.log(`  ${trait}: appeared, sustained for ${data.sustainedTicks} ticks`);
    } else {
      console.log(`  ${trait}: never appeared`);
    }
  }
  console.log(`\nFinal loci count distribution:`, artifact.results.finalLociCountDistribution);
  console.log(`\nLoci count time series (last 5 samples):`);
  const lastSamples = artifact.results.lociCountTimeSeries.slice(-5);
  for (const sample of lastSamples) {
    console.log(`  tick ${sample.tick}: mean=${sample.mean.toFixed(2)}, min=${sample.min}, max=${sample.max}`);
  }
}

export { runLiveGenomeV2Pilot };
