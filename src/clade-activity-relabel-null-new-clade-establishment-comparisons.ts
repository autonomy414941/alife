import { compareCladeActivityRelabelNullStudies } from './clade-activity-relabel-null-best-short-stack-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport
} from './types';

export interface CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  staticHabitatBirthScheduleMatchedAllSeeds: boolean;
  founderGraceBirthScheduleMatchedAllSeeds: boolean;
  staticHabitatPersistentWindowFractionDeltaVsNullMean: number;
  founderGracePersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsStaticHabitat: number;
  staticHabitatPersistentActivityMeanDeltaVsNullMean: number;
  founderGracePersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsStaticHabitat: number;
  staticHabitatDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  founderGraceDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  currentNullStaticHabitatBirthScheduleMatchedAllSeeds: boolean;
  currentNullFounderGraceBirthScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullStaticHabitatBirthScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullFounderGraceBirthScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullStaticHabitatFounderHabitatScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullFounderGraceFounderHabitatScheduleMatchedAllSeeds: boolean;
  currentNullStaticHabitatActiveCladeDeltaVsNullMean: number;
  currentNullFounderGraceActiveCladeDeltaVsNullMean: number;
  currentNullFounderGraceImprovementVsStaticHabitat: number;
  habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean: number;
  habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean: number;
  habitatMatchedNullFounderGraceImprovementVsStaticHabitat: number;
  activeCladeImprovementShiftVsCurrentNull: number;
  founderGraceStillImprovesVsStaticHabitatUnderCurrentNull: boolean;
  founderGraceStillImprovesVsStaticHabitatUnderHabitatMatchedNull: boolean;
}

export interface CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  habitatMatchedNullStaticHabitatBirthScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullFounderGraceBirthScheduleMatchedAllSeeds: boolean;
  habitatAndCrowdingMatchedNullStaticHabitatBirthScheduleMatchedAllSeeds: boolean;
  habitatAndCrowdingMatchedNullFounderGraceBirthScheduleMatchedAllSeeds: boolean;
  habitatAndCrowdingMatchedNullStaticHabitatFounderHabitatCrowdingScheduleMatchedAllSeeds: boolean;
  habitatAndCrowdingMatchedNullFounderGraceFounderHabitatCrowdingScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean: number;
  habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean: number;
  habitatMatchedNullFounderGraceImprovementVsStaticHabitat: number;
  habitatAndCrowdingMatchedNullStaticHabitatActiveCladeDeltaVsNullMean: number;
  habitatAndCrowdingMatchedNullFounderGraceActiveCladeDeltaVsNullMean: number;
  habitatAndCrowdingMatchedNullFounderGraceImprovementVsStaticHabitat: number;
  activeCladeImprovementShiftVsHabitatMatchedNull: number;
  founderGraceStillImprovesVsStaticHabitatUnderHabitatMatchedNull: boolean;
  founderGraceStillImprovesVsStaticHabitatUnderHabitatAndCrowdingMatchedNull: boolean;
}

interface NewCladeEstablishmentHorizonStudyComparisonView {
  comparison: CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison[];
}

export function compareNewCladeEstablishmentHorizonStudies(
  founderGraceStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison[] {
  return compareCladeActivityRelabelNullStudies(founderGraceStudy, baselineStudy).map((comparison) => {
    const baselineThresholdResult = baselineStudy.thresholdResults.find(
      (thresholdResult) => thresholdResult.cladogenesisThreshold === comparison.cladogenesisThreshold
    );
    if (!baselineThresholdResult) {
      throw new Error(
        `Baseline study is missing cladogenesis threshold ${comparison.cladogenesisThreshold}`
      );
    }

    return {
      cladogenesisThreshold: comparison.cladogenesisThreshold,
      minSurvivalTicks: comparison.minSurvivalTicks,
      staticHabitatBirthScheduleMatchedAllSeeds: baselineThresholdResult.seedResults.every(
        (seedResult) => seedResult.birthScheduleMatched
      ),
      founderGraceBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      staticHabitatPersistentWindowFractionDeltaVsNullMean:
        comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      founderGracePersistentWindowFractionDeltaVsNullMean:
        comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsStaticHabitat:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      staticHabitatPersistentActivityMeanDeltaVsNullMean: comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      founderGracePersistentActivityMeanDeltaVsNullMean:
        comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsStaticHabitat:
        comparison.persistentActivityMeanImprovementVsBaseline,
      staticHabitatDiagnostics: comparison.baselineDiagnostics,
      founderGraceDiagnostics: comparison.currentDiagnostics
    };
  });
}

export function compareNewCladeEstablishmentFounderHabitatValidation(
  currentNullStudy: NewCladeEstablishmentHorizonStudyComparisonView,
  habitatMatchedNullStudy: NewCladeEstablishmentHorizonStudyComparisonView,
  habitatMatchedNullBaselineStudy: CladeActivityRelabelNullStudyExport,
  habitatMatchedNullFounderGraceStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationComparison[] {
  return currentNullStudy.comparison.map((currentComparison) => {
    const habitatMatchedComparison = habitatMatchedNullStudy.comparison.find(
      (candidate) =>
        candidate.cladogenesisThreshold === currentComparison.cladogenesisThreshold &&
        candidate.minSurvivalTicks === currentComparison.minSurvivalTicks
    );
    if (!habitatMatchedComparison) {
      throw new Error(
        `Habitat-matched validation study is missing threshold ${currentComparison.cladogenesisThreshold} / minSurvivalTicks=${currentComparison.minSurvivalTicks}`
      );
    }

    const currentNullStaticHabitatActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Current-null static habitat diagnostics',
      currentComparison.staticHabitatDiagnostics
    );
    const currentNullFounderGraceActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Current-null founder-grace diagnostics',
      currentComparison.founderGraceDiagnostics
    );
    const habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Habitat-matched static habitat diagnostics',
      habitatMatchedComparison.staticHabitatDiagnostics
    );
    const habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Habitat-matched founder-grace diagnostics',
      habitatMatchedComparison.founderGraceDiagnostics
    );
    const currentNullFounderGraceImprovementVsStaticHabitat =
      currentNullFounderGraceActiveCladeDeltaVsNullMean - currentNullStaticHabitatActiveCladeDeltaVsNullMean;
    const habitatMatchedNullFounderGraceImprovementVsStaticHabitat =
      habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean -
      habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean;

    return {
      cladogenesisThreshold: currentComparison.cladogenesisThreshold,
      minSurvivalTicks: currentComparison.minSurvivalTicks,
      currentNullStaticHabitatBirthScheduleMatchedAllSeeds:
        currentComparison.staticHabitatBirthScheduleMatchedAllSeeds,
      currentNullFounderGraceBirthScheduleMatchedAllSeeds:
        currentComparison.founderGraceBirthScheduleMatchedAllSeeds,
      habitatMatchedNullStaticHabitatBirthScheduleMatchedAllSeeds:
        habitatMatchedComparison.staticHabitatBirthScheduleMatchedAllSeeds,
      habitatMatchedNullFounderGraceBirthScheduleMatchedAllSeeds:
        habitatMatchedComparison.founderGraceBirthScheduleMatchedAllSeeds,
      habitatMatchedNullStaticHabitatFounderHabitatScheduleMatchedAllSeeds:
        founderHabitatScheduleMatchedAllSeeds(
          habitatMatchedNullBaselineStudy,
          currentComparison.cladogenesisThreshold
        ),
      habitatMatchedNullFounderGraceFounderHabitatScheduleMatchedAllSeeds:
        founderHabitatScheduleMatchedAllSeeds(
          habitatMatchedNullFounderGraceStudy,
          currentComparison.cladogenesisThreshold
        ),
      currentNullStaticHabitatActiveCladeDeltaVsNullMean,
      currentNullFounderGraceActiveCladeDeltaVsNullMean,
      currentNullFounderGraceImprovementVsStaticHabitat,
      habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean,
      habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean,
      habitatMatchedNullFounderGraceImprovementVsStaticHabitat,
      activeCladeImprovementShiftVsCurrentNull:
        habitatMatchedNullFounderGraceImprovementVsStaticHabitat -
        currentNullFounderGraceImprovementVsStaticHabitat,
      founderGraceStillImprovesVsStaticHabitatUnderCurrentNull:
        currentNullFounderGraceImprovementVsStaticHabitat > 0,
      founderGraceStillImprovesVsStaticHabitatUnderHabitatMatchedNull:
        habitatMatchedNullFounderGraceImprovementVsStaticHabitat > 0
    };
  });
}

export function compareNewCladeEstablishmentFounderCrowdingValidation(
  habitatMatchedNullStudy: NewCladeEstablishmentHorizonStudyComparisonView,
  habitatAndCrowdingMatchedNullStudy: NewCladeEstablishmentHorizonStudyComparisonView,
  habitatAndCrowdingMatchedNullBaselineStudy: CladeActivityRelabelNullStudyExport,
  habitatAndCrowdingMatchedNullFounderGraceStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationComparison[] {
  return habitatMatchedNullStudy.comparison.map((habitatMatchedComparison) => {
    const habitatAndCrowdingMatchedComparison = habitatAndCrowdingMatchedNullStudy.comparison.find(
      (candidate) =>
        candidate.cladogenesisThreshold === habitatMatchedComparison.cladogenesisThreshold &&
        candidate.minSurvivalTicks === habitatMatchedComparison.minSurvivalTicks
    );
    if (!habitatAndCrowdingMatchedComparison) {
      throw new Error(
        `Habitat-and-crowding-matched validation study is missing threshold ${habitatMatchedComparison.cladogenesisThreshold} / minSurvivalTicks=${habitatMatchedComparison.minSurvivalTicks}`
      );
    }

    const habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Habitat-matched static habitat diagnostics',
      habitatMatchedComparison.staticHabitatDiagnostics
    );
    const habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Habitat-matched founder-grace diagnostics',
      habitatMatchedComparison.founderGraceDiagnostics
    );
    const habitatAndCrowdingMatchedNullStaticHabitatActiveCladeDeltaVsNullMean =
      requireActiveCladeDeltaVsNullMean(
        'Habitat-and-crowding-matched static habitat diagnostics',
        habitatAndCrowdingMatchedComparison.staticHabitatDiagnostics
      );
    const habitatAndCrowdingMatchedNullFounderGraceActiveCladeDeltaVsNullMean =
      requireActiveCladeDeltaVsNullMean(
        'Habitat-and-crowding-matched founder-grace diagnostics',
        habitatAndCrowdingMatchedComparison.founderGraceDiagnostics
      );
    const habitatMatchedNullFounderGraceImprovementVsStaticHabitat =
      habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean - habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean;
    const habitatAndCrowdingMatchedNullFounderGraceImprovementVsStaticHabitat =
      habitatAndCrowdingMatchedNullFounderGraceActiveCladeDeltaVsNullMean -
      habitatAndCrowdingMatchedNullStaticHabitatActiveCladeDeltaVsNullMean;

    return {
      cladogenesisThreshold: habitatMatchedComparison.cladogenesisThreshold,
      minSurvivalTicks: habitatMatchedComparison.minSurvivalTicks,
      habitatMatchedNullStaticHabitatBirthScheduleMatchedAllSeeds:
        habitatMatchedComparison.staticHabitatBirthScheduleMatchedAllSeeds,
      habitatMatchedNullFounderGraceBirthScheduleMatchedAllSeeds:
        habitatMatchedComparison.founderGraceBirthScheduleMatchedAllSeeds,
      habitatAndCrowdingMatchedNullStaticHabitatBirthScheduleMatchedAllSeeds:
        habitatAndCrowdingMatchedComparison.staticHabitatBirthScheduleMatchedAllSeeds,
      habitatAndCrowdingMatchedNullFounderGraceBirthScheduleMatchedAllSeeds:
        habitatAndCrowdingMatchedComparison.founderGraceBirthScheduleMatchedAllSeeds,
      habitatAndCrowdingMatchedNullStaticHabitatFounderHabitatCrowdingScheduleMatchedAllSeeds:
        founderHabitatCrowdingScheduleMatchedAllSeeds(
          habitatAndCrowdingMatchedNullBaselineStudy,
          habitatMatchedComparison.cladogenesisThreshold
        ),
      habitatAndCrowdingMatchedNullFounderGraceFounderHabitatCrowdingScheduleMatchedAllSeeds:
        founderHabitatCrowdingScheduleMatchedAllSeeds(
          habitatAndCrowdingMatchedNullFounderGraceStudy,
          habitatMatchedComparison.cladogenesisThreshold
        ),
      habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean,
      habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean,
      habitatMatchedNullFounderGraceImprovementVsStaticHabitat,
      habitatAndCrowdingMatchedNullStaticHabitatActiveCladeDeltaVsNullMean,
      habitatAndCrowdingMatchedNullFounderGraceActiveCladeDeltaVsNullMean,
      habitatAndCrowdingMatchedNullFounderGraceImprovementVsStaticHabitat,
      activeCladeImprovementShiftVsHabitatMatchedNull:
        habitatAndCrowdingMatchedNullFounderGraceImprovementVsStaticHabitat -
        habitatMatchedNullFounderGraceImprovementVsStaticHabitat,
      founderGraceStillImprovesVsStaticHabitatUnderHabitatMatchedNull:
        habitatMatchedNullFounderGraceImprovementVsStaticHabitat > 0,
      founderGraceStillImprovesVsStaticHabitatUnderHabitatAndCrowdingMatchedNull:
        habitatAndCrowdingMatchedNullFounderGraceImprovementVsStaticHabitat > 0
    };
  });
}

function founderHabitatScheduleMatchedAllSeeds(
  study: CladeActivityRelabelNullStudyExport,
  cladogenesisThreshold: number
): boolean {
  const thresholdResult = study.thresholdResults.find(
    (candidate) => candidate.cladogenesisThreshold === cladogenesisThreshold
  );
  if (!thresholdResult) {
    throw new Error(`Study is missing cladogenesis threshold ${cladogenesisThreshold}`);
  }

  return thresholdResult.seedResults.every((seedResult) => seedResult.founderHabitatScheduleMatched === true);
}

function founderHabitatCrowdingScheduleMatchedAllSeeds(
  study: CladeActivityRelabelNullStudyExport,
  cladogenesisThreshold: number
): boolean {
  const thresholdResult = study.thresholdResults.find(
    (candidate) => candidate.cladogenesisThreshold === cladogenesisThreshold
  );
  if (!thresholdResult) {
    throw new Error(`Study is missing cladogenesis threshold ${cladogenesisThreshold}`);
  }

  return thresholdResult.seedResults.every((seedResult) => seedResult.founderHabitatCrowdingScheduleMatched === true);
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
