import { writeFileSync } from 'node:fs';
import { agentToV2 } from './genome-v2-adapter';
import { getTrait, listTraits, traitCount } from './genome-v2';
import { LifeSimulation } from './simulation';
import { Agent, GenomeV2 } from './types';

interface GenomeV2SmokeArtifact {
  generatedAt: string;
  config: {
    steps: number;
    seed: number;
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
    lociCountDistribution: Record<number, number>;
    traitSummaries: {
      habitat_preference: { mean: number; min: number; max: number };
      trophic_level: { mean: number; min: number; max: number };
      defense_level: { mean: number; min: number; max: number };
      metabolic_efficiency_primary: { mean: number; min: number; max: number };
      metabolic_efficiency_secondary: { mean: number; min: number; max: number };
    };
    genomeV2Agents: number;
    conversionSuccess: boolean;
  };
}

function summarizeNumericTrait(values: number[]): { mean: number; min: number; max: number } {
  if (values.length === 0) {
    return { mean: 0, min: 0, max: 0 };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    mean: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function runGenomeV2CanonicalSmoke(seed = 12345): GenomeV2SmokeArtifact {
  const steps = 500;
  const founderGraceConfig = {
    newCladeSettlementCrowdingGraceTicks: 80,
    newCladeEncounterRestraintGraceBoost: 0.6,
    cladogenesisThreshold: 1.0
  };

  const sim = new LifeSimulation({
    seed,
    config: founderGraceConfig
  });

  for (let i = 0; i < steps; i++) {
    sim.step();
  }

  const snapshot = sim.snapshot();
  const agents = snapshot.agents;

  let conversionSuccess = true;
  const genomeV2Agents: Array<{ genomeV2: GenomeV2 }> = [];

  try {
    for (const agent of agents) {
      const agentV2 = agentToV2(agent);
      genomeV2Agents.push(agentV2);
    }
  } catch (error) {
    conversionSuccess = false;
    console.error('Conversion error:', error);
  }

  const lociCounts = genomeV2Agents.map((a) => traitCount(a.genomeV2));
  const lociCountDistribution: Record<number, number> = {};
  for (const count of lociCounts) {
    lociCountDistribution[count] = (lociCountDistribution[count] ?? 0) + 1;
  }

  const habitatValues = genomeV2Agents.map((a) => getTrait(a.genomeV2, 'habitat_preference'));
  const trophicValues = genomeV2Agents.map((a) => getTrait(a.genomeV2, 'trophic_level'));
  const defenseValues = genomeV2Agents.map((a) => getTrait(a.genomeV2, 'defense_level'));
  const efficiencyPrimaryValues = genomeV2Agents.map((a) =>
    getTrait(a.genomeV2, 'metabolic_efficiency_primary')
  );
  const efficiencySecondaryValues = genomeV2Agents.map((a) =>
    getTrait(a.genomeV2, 'metabolic_efficiency_secondary')
  );

  const history = sim.history();
  const activeClades = history.clades.filter((c) => c.extinctTick === null);
  const activeSpecies = history.species.filter((s) => s.extinctTick === null);

  const artifact: GenomeV2SmokeArtifact = {
    generatedAt: new Date().toISOString(),
    config: {
      steps,
      seed,
      founderGrace: true,
      ...founderGraceConfig
    },
    results: {
      finalTick: snapshot.tick,
      finalAgentCount: agents.length,
      finalActiveCladeCount: activeClades.length,
      finalActiveSpeciesCount: activeSpecies.length,
      lociCountDistribution,
      traitSummaries: {
        habitat_preference: summarizeNumericTrait(habitatValues),
        trophic_level: summarizeNumericTrait(trophicValues),
        defense_level: summarizeNumericTrait(defenseValues),
        metabolic_efficiency_primary: summarizeNumericTrait(efficiencyPrimaryValues),
        metabolic_efficiency_secondary: summarizeNumericTrait(efficiencySecondaryValues)
      },
      genomeV2Agents: genomeV2Agents.length,
      conversionSuccess
    }
  };

  return artifact;
}

if (require.main === module) {
  const dateString = process.argv[2] ?? new Date().toISOString().split('T')[0];
  const seed = process.argv[3] ? parseInt(process.argv[3], 10) : 12345;

  console.log(`Running GenomeV2 canonical smoke test (${dateString}, seed ${seed})...`);

  const artifact = runGenomeV2CanonicalSmoke(seed);

  const outputPath = `docs/genome_v2_canonical_smoke_${dateString}.json`;
  writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + '\n');

  console.log(`\nResults written to ${outputPath}`);
  console.log(`Final agents: ${artifact.results.finalAgentCount}`);
  console.log(`Active clades: ${artifact.results.finalActiveCladeCount}`);
  console.log(`Active species: ${artifact.results.finalActiveSpeciesCount}`);
  console.log(`Conversion success: ${artifact.results.conversionSuccess}`);
  console.log(`\nLoci count distribution:`, artifact.results.lociCountDistribution);
  console.log(`\nTrait summaries:`);
  console.log(`  habitat_preference:`, artifact.results.traitSummaries.habitat_preference);
  console.log(`  trophic_level:`, artifact.results.traitSummaries.trophic_level);
  console.log(`  defense_level:`, artifact.results.traitSummaries.defense_level);
  console.log(
    `  metabolic_efficiency_primary:`,
    artifact.results.traitSummaries.metabolic_efficiency_primary
  );
  console.log(
    `  metabolic_efficiency_secondary:`,
    artifact.results.traitSummaries.metabolic_efficiency_secondary
  );
}

export { runGenomeV2CanonicalSmoke };
