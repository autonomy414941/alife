import { parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  emitEncounterNontransitiveComparativeStudy,
  runEncounterNontransitiveComparativeStudy
} from './clade-activity-relabel-null-encounter-nontransitive-comparative-study';
import { RunCladeActivityRelabelNullStudyInput } from './activity';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
} from './clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';
import { HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD } from './clade-activity-relabel-null-founder-grace-ecology-gate-horizon-study';

export const ENCOUNTER_NONTRANSITIVE_COMPARATIVE_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_encounter_nontransitive_comparative_horizon_2026-03-17.json';

const HORIZON_STUDY_INPUT: RunCladeActivityRelabelNullStudyInput = {
  steps: 4000,
  windowSize: 100,
  burnIn: 200,
  seeds: [20260307, 20260308, 20260309, 20260310],
  minSurvivalTicks: [50, 100],
  cladogenesisThresholds: [1.0, 1.2],
  stopWhenExtinct: false,
  simulation: {
    config: {
      width: 20,
      height: 20,
      maxResource: 100,
      resourceRegen: 1,
      metabolismCostBase: 0.5,
      moveCost: 0.1,
      harvestCap: 10,
      reproduceThreshold: 50,
      reproduceProbability: 0.8,
      offspringEnergyFraction: 0.5,
      mutationAmount: 0.1,
      speciationThreshold: 0.3,
      maxAge: 1000,
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      cladogenesisEcologyAdvantageThreshold: HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true
    },
    initialAgents: [
      { x: 10, y: 10, energy: 100, genome: { metabolism: 1, harvest: 1, aggression: 0.5 } }
    ]
  }
};

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  console.log('Running encounter non-transitive comparative horizon study...');
  console.log(`  Generated at: ${generatedAt}`);
  console.log(`  Steps: ${HORIZON_STUDY_INPUT.steps}`);
  console.log(`  Seeds: ${HORIZON_STUDY_INPUT.seeds}`);
  console.log(`  Cladogenesis thresholds: ${HORIZON_STUDY_INPUT.cladogenesisThresholds}`);
  console.log(`  Min survival ticks: ${HORIZON_STUDY_INPUT.minSurvivalTicks}`);

  const study = runEncounterNontransitiveComparativeStudy({
    generatedAt,
    studyInput: HORIZON_STUDY_INPUT
  });

  const outputPath = options.output ?? ENCOUNTER_NONTRANSITIVE_COMPARATIVE_HORIZON_ARTIFACT;
  emitEncounterNontransitiveComparativeStudy(outputPath, study);

  console.log(`\nStudy complete. Artifact written to ${outputPath}`);
  console.log('\nSummary:');
  for (const comparison of study.comparison) {
    console.log(
      `  Threshold ${comparison.cladogenesisThreshold}, survival ${comparison.minSurvivalTicks}:`
    );
    console.log(
      `    Dominant active clade delta vs null: ${comparison.dominantActiveCladeDeltaVsNullMean.toFixed(2)}`
    );
    console.log(
      `    Non-transitive active clade delta vs null: ${comparison.nontransitiveActiveCladeDeltaVsNullMean.toFixed(2)}`
    );
    console.log(
      `    Improvement (non-transitive - dominant): ${comparison.activeCladeDeltaImprovementVsDominant.toFixed(2)}`
    );
  }
}
