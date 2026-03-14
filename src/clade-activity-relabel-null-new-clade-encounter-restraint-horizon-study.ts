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
  BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT as STATIC_HABITAT_BASELINE_ARTIFACT,
  HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE
} from './clade-activity-relabel-null-new-clade-establishment-horizon-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const HORIZON_DEFINITION = FOUNDER_GRACE_FOLLOWUP_HORIZON_DEFINITIONS.newCladeEncounterRestraint;

export const BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT =
  FOUNDER_GRACE_BASELINE_HORIZON_ARTIFACT;
export const NEW_CLADE_ENCOUNTER_RESTRAINT_HORIZON_ARTIFACT = HORIZON_DEFINITION.artifact;
export const HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST =
  HORIZON_DEFINITION.baselineValue;
export const HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST = HORIZON_DEFINITION.currentValue;

export interface CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  founderGraceBirthScheduleMatchedAllSeeds: boolean;
  encounterRestraintBirthScheduleMatchedAllSeeds: boolean;
  founderGracePersistentWindowFractionDeltaVsNullMean: number;
  encounterRestraintPersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsFounderGrace: number;
  founderGracePersistentActivityMeanDeltaVsNullMean: number;
  encounterRestraintPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsFounderGrace: number;
  founderGraceActiveCladeDeltaVsNullMean: number;
  encounterRestraintActiveCladeDeltaVsNullMean: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
  founderGraceDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  encounterRestraintDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport {
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
    baselineNewCladeEncounterRestraintGraceBoost: number;
    encounterRestraintNewCladeEncounterRestraintGraceBoost: number;
    founderGraceSimulationConfig: Partial<SimulationConfig>;
    encounterRestraintSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison[];
  encounterRestraintStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  encounterRestraintStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudy(
  input: RunCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyInput = {}
): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport {
  const study = runConfiguredFounderGraceFollowupHorizonStudy(HORIZON_DEFINITION, {
    generatedAt: input.generatedAt,
    studyInput: input.studyInput,
    baselineStudy: input.baselineStudy,
    currentStudy: input.encounterRestraintStudy
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
      cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
      baselineNewCladeEncounterRestraintGraceBoost:
        HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
      encounterRestraintNewCladeEncounterRestraintGraceBoost:
        HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
      founderGraceSimulationConfig: study.baselineStudyInput.simulation?.config ?? {},
      encounterRestraintSimulationConfig: study.currentStudyInput.simulation?.config ?? {}
    },
    comparison: mapNewCladeEncounterRestraintHorizonComparisons(study.comparison),
    encounterRestraintStudy: study.currentStudy
  };
}

export function compareNewCladeEncounterRestraintHorizonStudies(
  encounterRestraintStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison[] {
  return mapNewCladeEncounterRestraintHorizonComparisons(
    compareFounderGraceFollowupStudies(
      encounterRestraintStudy,
      baselineStudy,
      HORIZON_DEFINITION.comparisonLabel
    )
  );
}

function mapNewCladeEncounterRestraintHorizonComparisons(
  comparisons: FounderGraceFollowupComparison[]
): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison[] {
  return comparisons.map((comparison) => ({
    cladogenesisThreshold: comparison.cladogenesisThreshold,
    minSurvivalTicks: comparison.minSurvivalTicks,
    founderGraceBirthScheduleMatchedAllSeeds: comparison.founderGraceBirthScheduleMatchedAllSeeds,
    encounterRestraintBirthScheduleMatchedAllSeeds: comparison.currentBirthScheduleMatchedAllSeeds,
    founderGracePersistentWindowFractionDeltaVsNullMean:
      comparison.founderGracePersistentWindowFractionDeltaVsNullMean,
    encounterRestraintPersistentWindowFractionDeltaVsNullMean:
      comparison.currentPersistentWindowFractionDeltaVsNullMean,
    persistentWindowFractionDeltaImprovementVsFounderGrace:
      comparison.persistentWindowFractionDeltaImprovementVsFounderGrace,
    founderGracePersistentActivityMeanDeltaVsNullMean:
      comparison.founderGracePersistentActivityMeanDeltaVsNullMean,
    encounterRestraintPersistentActivityMeanDeltaVsNullMean:
      comparison.currentPersistentActivityMeanDeltaVsNullMean,
    persistentActivityMeanImprovementVsFounderGrace:
      comparison.persistentActivityMeanImprovementVsFounderGrace,
    founderGraceActiveCladeDeltaVsNullMean: comparison.founderGraceActiveCladeDeltaVsNullMean,
    encounterRestraintActiveCladeDeltaVsNullMean: comparison.currentActiveCladeDeltaVsNullMean,
    activeCladeDeltaImprovementVsFounderGrace:
      comparison.activeCladeDeltaImprovementVsFounderGrace,
    founderGraceDiagnostics: comparison.founderGraceDiagnostics,
    encounterRestraintDiagnostics: comparison.currentDiagnostics
  }));
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
