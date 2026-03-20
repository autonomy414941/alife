import { writeFileSync } from 'node:fs';
import { createGenomeV2, fromGenome, getTrait, hasTrait, listTraits, traitCount, EXTENDED_TRAITS } from './genome-v2';
import { LifeSimulation } from './simulation';
import { AgentSeed, GenomeV2, Agent } from './types';

interface AgentContextSnapshot {
  hasExtendedTrait: boolean;
  extendedTraits: string[];
  fertilityBin: number;
  localCrowdingBin: number;
  energy: number;
}

interface EcologicalContextBinMetrics {
  agentCount: number;
  extendedTraitAgentCount: number;
  extendedTraitFraction: number;
  traitPrevalence: Record<string, number>;
}

interface TraitContextCorrelation {
  trait: string;
  overallPrevalence: number;
  byFertilityBin: Record<number, number>;
  byCrowdingBin: Record<number, number>;
  enrichmentScore: number;
  contextSpecific: boolean;
}

interface GenomeV2EcologicalContextPilotArtifact {
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
    fertilityBins: number;
    crowdingBins: number;
  };
  results: {
    finalTick: number;
    finalAgentCount: number;
    finalActiveCladeCount: number;
    finalActiveSpeciesCount: number;
    finalExtendedTraitAgentFraction: number;
    fertilityBinMetrics: Record<number, EcologicalContextBinMetrics>;
    crowdingBinMetrics: Record<number, EcologicalContextBinMetrics>;
    traitContextCorrelations: TraitContextCorrelation[];
    anyExtendedTraitAppeared: boolean;
    extendedTraitPersistence: {
      habitat_preference: { appeared: boolean; sustainedTicks: number };
      trophic_level: { appeared: boolean; sustainedTicks: number };
      defense_level: { appeared: boolean; sustainedTicks: number };
      metabolic_efficiency_primary: { appeared: boolean; sustainedTicks: number };
      metabolic_efficiency_secondary: { appeared: boolean; sustainedTicks: number };
    };
    contextInterpretation: {
      anyTraitShowsContextSpecificity: boolean;
      contextSpecificTraits: string[];
      uniformDistributionTraits: string[];
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

function binValue(value: number, binCount: number): number {
  const bin = Math.floor(value * binCount);
  return Math.min(bin, binCount - 1);
}

function computeLocalCrowding(agent: Agent, allAgents: Agent[], radius: number): number {
  let neighbors = 0;
  for (const other of allAgents) {
    if (other.id === agent.id) continue;
    const dx = Math.abs(other.x - agent.x);
    const dy = Math.abs(other.y - agent.y);
    if (dx <= radius && dy <= radius) {
      neighbors++;
    }
  }
  return neighbors;
}

function computeFertility(x: number, y: number, biomeBands: number, biomeContrast: number): number {
  const bandWidth = 20 / biomeBands;
  const bandIndex = Math.floor(y / bandWidth);
  const isHighFertility = bandIndex % 2 === 0;

  if (isHighFertility) {
    return 0.5 + biomeContrast / 2;
  } else {
    return 0.5 - biomeContrast / 2;
  }
}

function computeEnrichmentScore(byBin: Record<number, number>): number {
  const values = Object.values(byBin);
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return stdDev / (mean + 0.001);
}

function runGenomeV2EcologicalContextPilot(seed = 55555): GenomeV2EcologicalContextPilotArtifact {
  const steps = 1000;
  const addLociProbability = 0.02;
  const removeLociProbability = 0.01;
  const initialPopulationSize = 40;
  const fertilityBins = 4;
  const crowdingBins = 4;

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
      mutationAmount: 0.05,
      biomeBands: 4,
      biomeContrast: 0.45
    },
    initialAgents
  });

  const traitAppearanceTicks = new Map<string, number>();
  const traitLastSeenTicks = new Map<string, number>();

  for (let i = 0; i < steps; i++) {
    sim.step();

    if (i % 50 === 0 || i === steps - 1) {
      const snapshot = sim.snapshot();
      const agentsWithV2 = snapshot.agents.filter((a) => a.genomeV2 !== undefined);

      for (const trait of EXTENDED_TRAITS) {
        const agentsWithTrait = agentsWithV2.filter((a) => hasTrait(a.genomeV2!, trait));
        if (agentsWithTrait.length > 0) {
          if (!traitAppearanceTicks.has(trait)) {
            traitAppearanceTicks.set(trait, snapshot.tick);
          }
          traitLastSeenTicks.set(trait, snapshot.tick);
        }
      }
    }
  }

  const finalSnapshot = sim.snapshot();
  const agentsWithV2 = finalSnapshot.agents.filter((a) => a.genomeV2 !== undefined);

  const agentContexts: AgentContextSnapshot[] = agentsWithV2.map((agent) => {
    const extendedTraits = EXTENDED_TRAITS.filter(trait => hasTrait(agent.genomeV2!, trait));
    const fertility = computeFertility(agent.x, agent.y, 4, 0.45);
    const crowding = computeLocalCrowding(agent, agentsWithV2, 2);

    return {
      hasExtendedTrait: extendedTraits.length > 0,
      extendedTraits,
      fertilityBin: binValue(fertility, fertilityBins),
      localCrowdingBin: binValue(Math.min(crowding / 20, 1), crowdingBins),
      energy: agent.energy
    };
  });

  const fertilityBinMetrics: Record<number, EcologicalContextBinMetrics> = {};
  const crowdingBinMetrics: Record<number, EcologicalContextBinMetrics> = {};

  for (let bin = 0; bin < fertilityBins; bin++) {
    const agentsInBin = agentContexts.filter(ctx => ctx.fertilityBin === bin);
    const extendedTraitAgents = agentsInBin.filter(ctx => ctx.hasExtendedTrait);

    const traitPrevalence: Record<string, number> = {};
    for (const trait of EXTENDED_TRAITS) {
      const withTrait = agentsInBin.filter(ctx => ctx.extendedTraits.includes(trait)).length;
      traitPrevalence[trait] = agentsInBin.length > 0 ? withTrait / agentsInBin.length : 0;
    }

    fertilityBinMetrics[bin] = {
      agentCount: agentsInBin.length,
      extendedTraitAgentCount: extendedTraitAgents.length,
      extendedTraitFraction: agentsInBin.length > 0 ? extendedTraitAgents.length / agentsInBin.length : 0,
      traitPrevalence
    };
  }

  for (let bin = 0; bin < crowdingBins; bin++) {
    const agentsInBin = agentContexts.filter(ctx => ctx.localCrowdingBin === bin);
    const extendedTraitAgents = agentsInBin.filter(ctx => ctx.hasExtendedTrait);

    const traitPrevalence: Record<string, number> = {};
    for (const trait of EXTENDED_TRAITS) {
      const withTrait = agentsInBin.filter(ctx => ctx.extendedTraits.includes(trait)).length;
      traitPrevalence[trait] = agentsInBin.length > 0 ? withTrait / agentsInBin.length : 0;
    }

    crowdingBinMetrics[bin] = {
      agentCount: agentsInBin.length,
      extendedTraitAgentCount: extendedTraitAgents.length,
      extendedTraitFraction: agentsInBin.length > 0 ? extendedTraitAgents.length / agentsInBin.length : 0,
      traitPrevalence
    };
  }

  const traitContextCorrelations: TraitContextCorrelation[] = [];
  const ENRICHMENT_THRESHOLD = 0.5;

  for (const trait of EXTENDED_TRAITS) {
    const agentsWithTrait = agentContexts.filter(ctx => ctx.extendedTraits.includes(trait));
    const overallPrevalence = agentsWithTrait.length / agentContexts.length;

    const byFertilityBin: Record<number, number> = {};
    const byCrowdingBin: Record<number, number> = {};

    for (let bin = 0; bin < fertilityBins; bin++) {
      byFertilityBin[bin] = fertilityBinMetrics[bin].traitPrevalence[trait] ?? 0;
    }

    for (let bin = 0; bin < crowdingBins; bin++) {
      byCrowdingBin[bin] = crowdingBinMetrics[bin].traitPrevalence[trait] ?? 0;
    }

    const fertilityEnrichment = computeEnrichmentScore(byFertilityBin);
    const crowdingEnrichment = computeEnrichmentScore(byCrowdingBin);
    const enrichmentScore = Math.max(fertilityEnrichment, crowdingEnrichment);

    traitContextCorrelations.push({
      trait,
      overallPrevalence,
      byFertilityBin,
      byCrowdingBin,
      enrichmentScore,
      contextSpecific: enrichmentScore > ENRICHMENT_THRESHOLD
    });
  }

  const contextSpecificTraits = traitContextCorrelations
    .filter(tc => tc.contextSpecific)
    .map(tc => tc.trait);

  const uniformDistributionTraits = traitContextCorrelations
    .filter(tc => !tc.contextSpecific && tc.overallPrevalence > 0.01)
    .map(tc => tc.trait);

  const extendedTraitPersistence: Record<string, { appeared: boolean; sustainedTicks: number }> = {};
  for (const trait of EXTENDED_TRAITS) {
    const appeared = traitAppearanceTicks.has(trait);
    const sustainedTicks = appeared
      ? (traitLastSeenTicks.get(trait)! - traitAppearanceTicks.get(trait)!)
      : 0;
    extendedTraitPersistence[trait] = { appeared, sustainedTicks };
  }

  const anyExtendedTraitAppeared = Array.from(traitAppearanceTicks.keys()).length > 0;
  const extendedTraitAgents = agentContexts.filter(ctx => ctx.hasExtendedTrait);

  const history = sim.history();
  const activeClades = history.clades.filter((c) => c.extinctTick === null);
  const activeSpecies = history.species.filter((s) => s.extinctTick === null);

  const artifact: GenomeV2EcologicalContextPilotArtifact = {
    generatedAt: new Date().toISOString(),
    config: {
      steps,
      seed,
      addLociProbability,
      removeLociProbability,
      initialPopulationSize,
      founderGrace: true,
      ...founderGraceConfig,
      fertilityBins,
      crowdingBins
    },
    results: {
      finalTick: finalSnapshot.tick,
      finalAgentCount: finalSnapshot.agents.length,
      finalActiveCladeCount: activeClades.length,
      finalActiveSpeciesCount: activeSpecies.length,
      finalExtendedTraitAgentFraction: extendedTraitAgents.length / agentContexts.length,
      fertilityBinMetrics,
      crowdingBinMetrics,
      traitContextCorrelations,
      anyExtendedTraitAppeared,
      extendedTraitPersistence: {
        habitat_preference: extendedTraitPersistence['habitat_preference'] ?? { appeared: false, sustainedTicks: 0 },
        trophic_level: extendedTraitPersistence['trophic_level'] ?? { appeared: false, sustainedTicks: 0 },
        defense_level: extendedTraitPersistence['defense_level'] ?? { appeared: false, sustainedTicks: 0 },
        metabolic_efficiency_primary: extendedTraitPersistence['metabolic_efficiency_primary'] ?? { appeared: false, sustainedTicks: 0 },
        metabolic_efficiency_secondary: extendedTraitPersistence['metabolic_efficiency_secondary'] ?? { appeared: false, sustainedTicks: 0 }
      },
      contextInterpretation: {
        anyTraitShowsContextSpecificity: contextSpecificTraits.length > 0,
        contextSpecificTraits,
        uniformDistributionTraits
      }
    }
  };

  return artifact;
}

if (require.main === module) {
  const dateString = process.argv[2] ?? new Date().toISOString().split('T')[0];
  const seed = process.argv[3] ? parseInt(process.argv[3], 10) : 55555;

  console.log(`Running GenomeV2 ecological context pilot (${dateString}, seed ${seed})...`);

  const artifact = runGenomeV2EcologicalContextPilot(seed);

  const outputPath = `docs/genome_v2_ecological_context_pilot_${dateString}.json`;
  writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + '\n');

  console.log(`\nResults written to ${outputPath}`);
  console.log(`Final agents: ${artifact.results.finalAgentCount}`);
  console.log(`Active clades: ${artifact.results.finalActiveCladeCount}`);
  console.log(`Active species: ${artifact.results.finalActiveSpeciesCount}`);
  console.log(`Extended trait agent fraction: ${(artifact.results.finalExtendedTraitAgentFraction * 100).toFixed(1)}%`);
  console.log(`\nContext specificity:`);
  console.log(`  Context-specific traits: ${artifact.results.contextInterpretation.contextSpecificTraits.join(', ') || 'none'}`);
  console.log(`  Uniformly distributed traits: ${artifact.results.contextInterpretation.uniformDistributionTraits.join(', ') || 'none'}`);

  console.log(`\nTrait-context correlations:`);
  for (const tc of artifact.results.traitContextCorrelations) {
    if (tc.overallPrevalence > 0.01) {
      console.log(`\n  ${tc.trait}:`);
      console.log(`    Overall prevalence: ${(tc.overallPrevalence * 100).toFixed(1)}%`);
      console.log(`    Enrichment score: ${tc.enrichmentScore.toFixed(2)} ${tc.contextSpecific ? '(context-specific)' : '(uniform)'}`);
      console.log(`    By fertility bin: ${Object.entries(tc.byFertilityBin).map(([bin, prev]) => `${bin}=${(prev * 100).toFixed(1)}%`).join(', ')}`);
      console.log(`    By crowding bin: ${Object.entries(tc.byCrowdingBin).map(([bin, prev]) => `${bin}=${(prev * 100).toFixed(1)}%`).join(', ')}`);
    }
  }
}

export { runGenomeV2EcologicalContextPilot };
