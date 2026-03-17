import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import {
  buildCladeActivityRelabelNullBestShortStackStudyInput,
  compareCladeActivityRelabelNullStudies
} from './clade-activity-relabel-null-best-short-stack-study';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
} from './clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';
import {
  BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
  HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
} from './clade-activity-relabel-null-founder-grace-ecology-gate-horizon-study';
import { dominantEncounterOperator, nonTransitiveEncounterOperator } from './encounter';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

export interface EncounterNontransitiveComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  dominantBirthScheduleMatchedAllSeeds: boolean;
  nontransitiveBirthScheduleMatchedAllSeeds: boolean;
  dominantPersistentWindowFractionDeltaVsNullMean: number;
  nontransitivePersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsDominant: number;
  dominantPersistentActivityMeanDeltaVsNullMean: number;
  nontransitivePersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsDominant: number;
  dominantActiveCladeDeltaVsNullMean: number;
  nontransitiveActiveCladeDeltaVsNullMean: number;
  activeCladeDeltaImprovementVsDominant: number;
  dominantDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  nontransitiveDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface EncounterNontransitiveComparativeStudyExport {
  generatedAt: string;
  question: string;
  hypothesis: string;
  config: {
    baselineArtifact: string;
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    cladeHabitatCoupling: number;
    adaptiveCladeHabitatMemoryRate: number;
    newCladeSettlementCrowdingGraceTicks: number;
    cladogenesisEcologyAdvantageThreshold: number;
    simulationConfig: Partial<SimulationConfig>;
  };
  comparison: EncounterNontransitiveComparison[];
  dominantStudy: CladeActivityRelabelNullStudyExport;
  nontransitiveStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunEncounterNontransitiveComparativeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  dominantStudy?: CladeActivityRelabelNullStudyExport;
  nontransitiveStudy?: CladeActivityRelabelNullStudyExport;
}

export function runEncounterNontransitiveComparativeStudy(
  input: RunEncounterNontransitiveComparativeStudyInput = {}
): EncounterNontransitiveComparativeStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  const baseStudyInput: RunCladeActivityRelabelNullStudyInput = input.studyInput ?? {
    steps: 6,
    windowSize: 1,
    burnIn: 2,
    seeds: [77],
    minSurvivalTicks: [1],
    cladogenesisThresholds: [0],
    stopWhenExtinct: true,
    simulation: {
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0.2,
        speciationThreshold: 0,
        maxAge: 100,
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
        {
          x: 0,
          y: 0,
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    }
  };

  const dominantStudy =
    input.dominantStudy ??
    runCladeActivityRelabelNullStudy(
      buildCladeActivityRelabelNullBestShortStackStudyInput(
        {
          ...baseStudyInput,
          simulation: {
            ...baseStudyInput.simulation,
            encounterOperator: dominantEncounterOperator
          }
        },
        generatedAt
      )
    );

  const nontransitiveStudy =
    input.nontransitiveStudy ??
    runCladeActivityRelabelNullStudy(
      buildCladeActivityRelabelNullBestShortStackStudyInput(
        {
          ...baseStudyInput,
          simulation: {
            ...baseStudyInput.simulation,
            encounterOperator: nonTransitiveEncounterOperator
          }
        },
        generatedAt
      )
    );

  const comparison = compareEncounterNontransitive(dominantStudy, nontransitiveStudy);

  return {
    generatedAt,
    question:
      'Does non-transitive encounter topology break dominance-hierarchy convergence under the canonical founder-grace configuration?',
    hypothesis:
      'Non-transitive rock-paper-scissors encounter dynamics enable archetype coexistence by preventing the formation of stable aggression hierarchies, improving absolute active-clade deltas versus null compared to dominant-only encounters.',
    config: {
      baselineArtifact: BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
      steps: baseStudyInput.steps ?? 6,
      windowSize: baseStudyInput.windowSize ?? 1,
      burnIn: baseStudyInput.burnIn ?? 2,
      seeds: baseStudyInput.seeds ?? [77],
      stopWhenExtinct: baseStudyInput.stopWhenExtinct ?? true,
      minSurvivalTicks: baseStudyInput.minSurvivalTicks ?? [1],
      cladogenesisThresholds: baseStudyInput.cladogenesisThresholds ?? [0],
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      cladogenesisEcologyAdvantageThreshold: HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      simulationConfig: baseStudyInput.simulation?.config ?? {}
    },
    comparison,
    dominantStudy,
    nontransitiveStudy
  };
}

function compareEncounterNontransitive(
  dominantStudy: CladeActivityRelabelNullStudyExport,
  nontransitiveStudy: CladeActivityRelabelNullStudyExport
): EncounterNontransitiveComparison[] {
  const baseComparisons = compareCladeActivityRelabelNullStudies(nontransitiveStudy, dominantStudy);

  return baseComparisons.map((comparison) => {
    const dominantActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Dominant operator',
      comparison.baselineDiagnostics
    );
    const nontransitiveActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Non-transitive operator',
      comparison.currentDiagnostics
    );

    return {
      cladogenesisThreshold: comparison.cladogenesisThreshold,
      minSurvivalTicks: comparison.minSurvivalTicks,
      dominantBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      nontransitiveBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      dominantPersistentWindowFractionDeltaVsNullMean: comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      nontransitivePersistentWindowFractionDeltaVsNullMean: comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsDominant:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      dominantPersistentActivityMeanDeltaVsNullMean: comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      nontransitivePersistentActivityMeanDeltaVsNullMean: comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsDominant: comparison.persistentActivityMeanImprovementVsBaseline,
      dominantActiveCladeDeltaVsNullMean,
      nontransitiveActiveCladeDeltaVsNullMean,
      activeCladeDeltaImprovementVsDominant:
        nontransitiveActiveCladeDeltaVsNullMean - dominantActiveCladeDeltaVsNullMean,
      dominantDiagnostics: comparison.baselineDiagnostics,
      nontransitiveDiagnostics: comparison.currentDiagnostics
    };
  });
}

function requireActiveCladeDeltaVsNullMean(
  label: string,
  diagnostics: CladeActivityRelabelNullDiagnosticSnapshot
): number {
  if (diagnostics.activeCladeDeltaVsNullMean === null) {
    throw new Error(`${label} is missing activeCladeDeltaVsNullMean diagnostics`);
  }
  return diagnostics.activeCladeDeltaVsNullMean;
}

export function emitEncounterNontransitiveComparativeStudy(
  artifact: string,
  study?: EncounterNontransitiveComparativeStudyExport
): void {
  const resolved = study ?? runEncounterNontransitiveComparativeStudy();
  const fs = require('fs');
  fs.writeFileSync(artifact, JSON.stringify(resolved, null, 2));
}
