import { RunCladeActivityRelabelNullStudyInput } from './activity';
import {
  FounderGraceFollowupComparison,
  compareFounderGraceFollowupStudies
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import {
  FOUNDER_GRACE_BASELINE_HORIZON_ARTIFACT,
  FOUNDER_GRACE_FOLLOWUP_HORIZON_DEFINITIONS,
  runConfiguredFounderGraceFollowupHorizonStudy
} from './clade-activity-relabel-null-founder-grace-followup-horizon-helpers';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT as STATIC_HABITAT_BASELINE_ARTIFACT
} from './clade-activity-relabel-null-new-clade-establishment-horizon-study';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
} from './clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const HORIZON_DEFINITION = FOUNDER_GRACE_FOLLOWUP_HORIZON_DEFINITIONS.founderGraceEcologyGate;

export const BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT =
  FOUNDER_GRACE_BASELINE_HORIZON_ARTIFACT;
export const FOUNDER_GRACE_ECOLOGY_GATE_HORIZON_ARTIFACT = HORIZON_DEFINITION.artifact;
export const HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD =
  HORIZON_DEFINITION.baselineValue;
export const HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD =
  HORIZON_DEFINITION.currentValue;

export interface CladeActivityRelabelNullFounderGraceEcologyGateHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  founderGraceBirthScheduleMatchedAllSeeds: boolean;
  ecologyGateBirthScheduleMatchedAllSeeds: boolean;
  founderGracePersistentWindowFractionDeltaVsNullMean: number;
  ecologyGatePersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsFounderGrace: number;
  founderGracePersistentActivityMeanDeltaVsNullMean: number;
  ecologyGatePersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsFounderGrace: number;
  founderGraceActiveCladeDeltaVsNullMean: number;
  ecologyGateActiveCladeDeltaVsNullMean: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
  founderGraceDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  ecologyGateDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullFounderGraceEcologyGateHorizonStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    baselineArtifact: string;
    staticHabitatBaselineArtifact: string;
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
    baselineCladogenesisEcologyAdvantageThreshold: number;
    ecologyGateCladogenesisEcologyAdvantageThreshold: number;
    founderGraceSimulationConfig: Partial<SimulationConfig>;
    ecologyGateSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullFounderGraceEcologyGateHorizonComparison[];
  ecologyGateStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  ecologyGateStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy(
  input: RunCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudyInput = {}
): CladeActivityRelabelNullFounderGraceEcologyGateHorizonStudyExport {
  const study = runConfiguredFounderGraceFollowupHorizonStudy(HORIZON_DEFINITION, {
    generatedAt: input.generatedAt,
    studyInput: input.studyInput,
    baselineStudy: input.baselineStudy,
    currentStudy: input.ecologyGateStudy
  });

  return {
    generatedAt: study.generatedAt,
    question: study.question,
    prediction: study.prediction,
    config: {
      baselineArtifact: BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
      staticHabitatBaselineArtifact: STATIC_HABITAT_BASELINE_ARTIFACT,
      steps: study.resolvedStudyConfig.steps,
      windowSize: study.resolvedStudyConfig.windowSize,
      burnIn: study.resolvedStudyConfig.burnIn,
      seeds: study.resolvedStudyConfig.seeds,
      stopWhenExtinct: study.resolvedStudyConfig.stopWhenExtinct,
      minSurvivalTicks: study.resolvedStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: study.resolvedStudyConfig.cladogenesisThresholds,
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      baselineCladogenesisEcologyAdvantageThreshold:
        HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      ecologyGateCladogenesisEcologyAdvantageThreshold:
        HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      founderGraceSimulationConfig: study.baselineStudyInput.simulation?.config ?? {},
      ecologyGateSimulationConfig: study.currentStudyInput.simulation?.config ?? {}
    },
    comparison: mapFounderGraceEcologyGateHorizonComparisons(study.comparison),
    ecologyGateStudy: study.currentStudy
  };
}

export function compareFounderGraceEcologyGateHorizonStudies(
  ecologyGateStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullFounderGraceEcologyGateHorizonComparison[] {
  return mapFounderGraceEcologyGateHorizonComparisons(
    compareFounderGraceFollowupStudies(
      ecologyGateStudy,
      baselineStudy,
      HORIZON_DEFINITION.comparisonLabel
    )
  );
}

function mapFounderGraceEcologyGateHorizonComparisons(
  comparisons: FounderGraceFollowupComparison[]
): CladeActivityRelabelNullFounderGraceEcologyGateHorizonComparison[] {
  return comparisons.map((comparison) => ({
    cladogenesisThreshold: comparison.cladogenesisThreshold,
    minSurvivalTicks: comparison.minSurvivalTicks,
    founderGraceBirthScheduleMatchedAllSeeds: comparison.founderGraceBirthScheduleMatchedAllSeeds,
    ecologyGateBirthScheduleMatchedAllSeeds: comparison.currentBirthScheduleMatchedAllSeeds,
    founderGracePersistentWindowFractionDeltaVsNullMean:
      comparison.founderGracePersistentWindowFractionDeltaVsNullMean,
    ecologyGatePersistentWindowFractionDeltaVsNullMean:
      comparison.currentPersistentWindowFractionDeltaVsNullMean,
    persistentWindowFractionDeltaImprovementVsFounderGrace:
      comparison.persistentWindowFractionDeltaImprovementVsFounderGrace,
    founderGracePersistentActivityMeanDeltaVsNullMean:
      comparison.founderGracePersistentActivityMeanDeltaVsNullMean,
    ecologyGatePersistentActivityMeanDeltaVsNullMean:
      comparison.currentPersistentActivityMeanDeltaVsNullMean,
    persistentActivityMeanImprovementVsFounderGrace:
      comparison.persistentActivityMeanImprovementVsFounderGrace,
    founderGraceActiveCladeDeltaVsNullMean: comparison.founderGraceActiveCladeDeltaVsNullMean,
    ecologyGateActiveCladeDeltaVsNullMean: comparison.currentActiveCladeDeltaVsNullMean,
    activeCladeDeltaImprovementVsFounderGrace:
      comparison.activeCladeDeltaImprovementVsFounderGrace,
    founderGraceDiagnostics: comparison.founderGraceDiagnostics,
    ecologyGateDiagnostics: comparison.currentDiagnostics
  }));
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
