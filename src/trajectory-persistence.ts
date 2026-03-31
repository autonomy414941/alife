export interface TrajectorySurvivalMetrics {
  innovationSurvivalCurve: InnovationSurvivalPoint[];
  activeDiversityAreaUnderCurve: number;
  meanTimeToExtinction: number;
  survivalRate50: number;
  survivalRate100: number;
  persistentLineageFraction: number;
}

export interface InnovationSurvivalPoint {
  ageInTicks: number;
  survivalFraction: number;
  activeTaxaCount: number;
}

export interface TaxonHistoryLike {
  firstSeenTick: number;
  extinctTick: number | null;
}

export interface PersistenceAnalysisInput {
  taxonHistory: TaxonHistoryLike[];
  finalTick: number;
  survivalThresholds?: number[];
}

const DEFAULT_SURVIVAL_THRESHOLDS = [50, 100];

export function analyzeTrajectoryPersistence(input: PersistenceAnalysisInput): TrajectorySurvivalMetrics {
  const { taxonHistory, finalTick, survivalThresholds = DEFAULT_SURVIVAL_THRESHOLDS } = input;

  const innovativeTaxa = taxonHistory.filter((taxon) => taxon.firstSeenTick > 0);

  if (innovativeTaxa.length === 0) {
    return {
      innovationSurvivalCurve: [],
      activeDiversityAreaUnderCurve: 0,
      meanTimeToExtinction: 0,
      survivalRate50: 0,
      survivalRate100: 0,
      persistentLineageFraction: 0
    };
  }

  const survivalCurve = buildInnovationSurvivalCurve(innovativeTaxa, finalTick);
  const auc = computeAreaUnderCurve(survivalCurve);
  const extinctTaxa = innovativeTaxa.filter((taxon) => taxon.extinctTick !== null);
  const meanTimeToExtinction =
    extinctTaxa.length > 0
      ? extinctTaxa.reduce(
          (sum, taxon) => sum + (taxon.extinctTick! - taxon.firstSeenTick),
          0
        ) / extinctTaxa.length
      : 0;

  const persistentLineageFraction = innovativeTaxa.filter(
    (taxon) => taxon.extinctTick === null
  ).length / innovativeTaxa.length;

  const survivalRates = survivalThresholds.map((threshold) =>
    computeSurvivalRate(innovativeTaxa, threshold)
  );

  return {
    innovationSurvivalCurve: survivalCurve,
    activeDiversityAreaUnderCurve: auc,
    meanTimeToExtinction,
    survivalRate50: survivalRates[0] ?? 0,
    survivalRate100: survivalRates[1] ?? 0,
    persistentLineageFraction
  };
}

function buildInnovationSurvivalCurve(
  taxa: TaxonHistoryLike[],
  finalTick: number
): InnovationSurvivalPoint[] {
  if (taxa.length === 0) {
    return [];
  }

  const earliestOrigin = Math.min(...taxa.map((taxon) => taxon.firstSeenTick));
  const maxAge = finalTick - earliestOrigin;

  const points: InnovationSurvivalPoint[] = [];
  for (let age = 0; age <= maxAge; age += 1) {
    const eligibleTaxa = taxa.filter((taxon) => {
      const taxonAge = age + taxon.firstSeenTick;
      return taxonAge <= finalTick;
    });

    if (eligibleTaxa.length === 0) {
      continue;
    }

    const activeTaxa = eligibleTaxa.filter((taxon) => {
      const taxonAge = age + taxon.firstSeenTick;
      return taxon.extinctTick === null || taxon.extinctTick >= taxonAge;
    });

    points.push({
      ageInTicks: age,
      survivalFraction: activeTaxa.length / eligibleTaxa.length,
      activeTaxaCount: activeTaxa.length
    });
  }

  return points;
}

function computeAreaUnderCurve(curve: InnovationSurvivalPoint[]): number {
  if (curve.length === 0) {
    return 0;
  }

  let area = 0;
  for (let i = 1; i < curve.length; i += 1) {
    const prev = curve[i - 1]!;
    const curr = curve[i]!;
    const width = curr.ageInTicks - prev.ageInTicks;
    const avgHeight = (prev.survivalFraction + curr.survivalFraction) / 2;
    area += width * avgHeight;
  }

  return area;
}

function computeSurvivalRate(taxa: TaxonHistoryLike[], ageThreshold: number): number {
  const eligibleTaxa = taxa.filter(
    (taxon) => taxon.extinctTick === null || taxon.extinctTick - taxon.firstSeenTick >= ageThreshold
  );

  if (taxa.length === 0) {
    return 0;
  }

  const survivedTaxa = eligibleTaxa.filter(
    (taxon) => taxon.extinctTick === null || taxon.extinctTick - taxon.firstSeenTick >= ageThreshold
  );

  return survivedTaxa.length / taxa.length;
}

export interface DescendantPersistenceMetrics {
  descendantPersistenceTable: DescendantPersistenceEntry[];
  meanDescendantLifespan: number;
  meanOffspringProduced: number;
  extinctionHazardByAge: ExtinctionHazardPoint[];
}

export interface DescendantPersistenceEntry {
  offspringId: number;
  parentLineage: number;
  offspringLineage: number;
  parentSpecies: number;
  offspringSpecies: number;
  birthTick: number;
  deathTick: number | null;
  ageAtDeath: number | null;
  offspringProduced: number;
  persistenceInTicks: number | null;
}

export interface ExtinctionHazardPoint {
  age: number;
  extinctionCount: number;
  atRiskCount: number;
  hazardRate: number;
}

export interface DescendantPersistenceInput {
  descentEdges: ReadonlyArray<{
    tick: number;
    parentId: number;
    parentLineage: number;
    parentSpecies: number;
    offspringId: number;
    offspringLineage: number;
    offspringSpecies: number;
    offspringProduced: number;
    offspringDeathTick: number | null;
    offspringAgeAtDeath: number | null;
  }>;
  finalTick: number;
}

export function analyzeDescendantPersistence(
  input: DescendantPersistenceInput
): DescendantPersistenceMetrics {
  const { descentEdges, finalTick } = input;

  const table: DescendantPersistenceEntry[] = descentEdges.map((edge) => {
    const persistenceInTicks = edge.offspringDeathTick !== null
      ? edge.offspringDeathTick - edge.tick
      : null;

    return {
      offspringId: edge.offspringId,
      parentLineage: edge.parentLineage,
      offspringLineage: edge.offspringLineage,
      parentSpecies: edge.parentSpecies,
      offspringSpecies: edge.offspringSpecies,
      birthTick: edge.tick,
      deathTick: edge.offspringDeathTick,
      ageAtDeath: edge.offspringAgeAtDeath,
      offspringProduced: edge.offspringProduced,
      persistenceInTicks
    };
  });

  const extinctDescendants = table.filter((entry) => entry.deathTick !== null);
  const meanDescendantLifespan =
    extinctDescendants.length > 0
      ? extinctDescendants.reduce((sum, entry) => sum + entry.persistenceInTicks!, 0) /
        extinctDescendants.length
      : 0;

  const meanOffspringProduced =
    table.length > 0
      ? table.reduce((sum, entry) => sum + entry.offspringProduced, 0) / table.length
      : 0;

  const extinctionHazardByAge = buildExtinctionHazardCurve(table);

  return {
    descendantPersistenceTable: table,
    meanDescendantLifespan,
    meanOffspringProduced,
    extinctionHazardByAge
  };
}

function buildExtinctionHazardCurve(
  table: DescendantPersistenceEntry[]
): ExtinctionHazardPoint[] {
  if (table.length === 0) {
    return [];
  }

  const maxAge = Math.max(
    ...table.map((entry) => entry.ageAtDeath ?? 0)
  );

  const points: ExtinctionHazardPoint[] = [];
  for (let age = 0; age <= maxAge; age += 1) {
    const atRisk = table.filter(
      (entry) => entry.ageAtDeath === null || entry.ageAtDeath >= age
    );
    const extinctions = table.filter((entry) => entry.ageAtDeath === age);

    points.push({
      age,
      extinctionCount: extinctions.length,
      atRiskCount: atRisk.length,
      hazardRate: atRisk.length > 0 ? extinctions.length / atRisk.length : 0
    });
  }

  return points;
}
