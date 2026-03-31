import { describe, it, expect } from 'vitest';
import {
  analyzeDescendantPersistence,
  analyzeTrajectoryPersistence,
  TaxonHistoryLike
} from '../src/trajectory-persistence';

describe('trajectory-persistence', () => {
  describe('analyzeTrajectoryPersistence', () => {
    it('returns empty metrics for empty history', () => {
      const result = analyzeTrajectoryPersistence({
        taxonHistory: [],
        finalTick: 100
      });

      expect(result.innovationSurvivalCurve).toEqual([]);
      expect(result.activeDiversityAreaUnderCurve).toBe(0);
      expect(result.meanTimeToExtinction).toBe(0);
      expect(result.survivalRate50).toBe(0);
      expect(result.survivalRate100).toBe(0);
      expect(result.persistentLineageFraction).toBe(0);
    });

    it('tracks survival curve for single innovation', () => {
      const taxonHistory: TaxonHistoryState[] = [
        buildTaxonHistory(1, 10, 50)
      ];

      const result = analyzeTrajectoryPersistence({
        taxonHistory,
        finalTick: 100
      });

      expect(result.innovationSurvivalCurve.length).toBeGreaterThan(0);
      expect(result.innovationSurvivalCurve[0]?.ageInTicks).toBe(0);
      expect(result.innovationSurvivalCurve[0]?.survivalFraction).toBe(1);
      expect(result.meanTimeToExtinction).toBe(40);
      expect(result.persistentLineageFraction).toBe(0);
    });

    it('tracks survival curve for persistent innovation', () => {
      const taxonHistory: TaxonHistoryState[] = [
        buildTaxonHistory(1, 10, null)
      ];

      const result = analyzeTrajectoryPersistence({
        taxonHistory,
        finalTick: 100
      });

      expect(result.innovationSurvivalCurve.length).toBeGreaterThan(0);
      const lastPoint = result.innovationSurvivalCurve[result.innovationSurvivalCurve.length - 1];
      expect(lastPoint?.survivalFraction).toBe(1);
      expect(result.meanTimeToExtinction).toBe(0);
      expect(result.persistentLineageFraction).toBe(1);
    });

    it('computes area under curve correctly', () => {
      const taxonHistory: TaxonHistoryState[] = [
        buildTaxonHistory(1, 10, 60),
        buildTaxonHistory(2, 10, 30),
        buildTaxonHistory(3, 10, null)
      ];

      const result = analyzeTrajectoryPersistence({
        taxonHistory,
        finalTick: 100
      });

      expect(result.activeDiversityAreaUnderCurve).toBeGreaterThan(0);
      expect(result.persistentLineageFraction).toBeCloseTo(1 / 3);
    });

    it('computes survival rates at thresholds', () => {
      const taxonHistory: TaxonHistoryState[] = [
        buildTaxonHistory(1, 10, 40),
        buildTaxonHistory(2, 10, 70),
        buildTaxonHistory(3, 10, 120),
        buildTaxonHistory(4, 10, null)
      ];

      const result = analyzeTrajectoryPersistence({
        taxonHistory,
        finalTick: 150
      });

      expect(result.survivalRate50).toBeCloseTo(0.75);
      expect(result.survivalRate100).toBeCloseTo(0.5);
    });

    it('ignores founder taxa (firstSeenTick = 0)', () => {
      const taxonHistory: TaxonHistoryState[] = [
        buildTaxonHistory(0, 0, null),
        buildTaxonHistory(1, 10, 50)
      ];

      const result = analyzeTrajectoryPersistence({
        taxonHistory,
        finalTick: 100
      });

      expect(result.innovationSurvivalCurve.length).toBeGreaterThan(0);
      expect(result.meanTimeToExtinction).toBe(40);
      expect(result.persistentLineageFraction).toBe(0);
    });
  });

  describe('analyzeDescendantPersistence', () => {
    it('returns empty metrics for no descent edges', () => {
      const result = analyzeDescendantPersistence({
        descentEdges: [],
        finalTick: 100
      });

      expect(result.descendantPersistenceTable).toEqual([]);
      expect(result.meanDescendantLifespan).toBe(0);
      expect(result.meanOffspringProduced).toBe(0);
      expect(result.extinctionHazardByAge).toEqual([]);
    });

    it('tracks descendant lifespan and offspring', () => {
      const descentEdges = [
        buildDescentEdge(1, 10, 1, 1, 101, 1, 1, 3, 50, 40),
        buildDescentEdge(2, 20, 1, 1, 102, 1, 1, 1, 80, 50),
        buildDescentEdge(3, 30, 1, 1, 103, 2, 2, 5, null, null)
      ];

      const result = analyzeDescendantPersistence({
        descentEdges,
        finalTick: 100
      });

      expect(result.descendantPersistenceTable.length).toBe(3);
      expect(result.descendantPersistenceTable[0]?.persistenceInTicks).toBe(50 - 1);
      expect(result.descendantPersistenceTable[1]?.persistenceInTicks).toBe(80 - 2);
      expect(result.descendantPersistenceTable[2]?.persistenceInTicks).toBe(null);
      expect(result.meanDescendantLifespan).toBeCloseTo(((50 - 1) + (80 - 2)) / 2);
      expect(result.meanOffspringProduced).toBeCloseTo((3 + 1 + 5) / 3);
    });

    it('computes extinction hazard by age', () => {
      const descentEdges = [
        buildDescentEdge(1, 10, 1, 1, 101, 1, 1, 0, 20, 10),
        buildDescentEdge(2, 10, 1, 1, 102, 1, 1, 0, 30, 20),
        buildDescentEdge(3, 10, 1, 1, 103, 1, 1, 0, null, null)
      ];

      const result = analyzeDescendantPersistence({
        descentEdges,
        finalTick: 100
      });

      expect(result.extinctionHazardByAge.length).toBeGreaterThan(0);
      const age10Hazard = result.extinctionHazardByAge.find((p) => p.age === 10);
      expect(age10Hazard?.extinctionCount).toBe(1);
      expect(age10Hazard?.atRiskCount).toBeGreaterThan(0);
    });

    it('handles lineage transitions correctly', () => {
      const descentEdges = [
        buildDescentEdge(1, 10, 1, 1, 101, 2, 1, 0, 50, 40),
        buildDescentEdge(2, 10, 1, 1, 102, 1, 2, 0, 50, 40)
      ];

      const result = analyzeDescendantPersistence({
        descentEdges,
        finalTick: 100
      });

      expect(result.descendantPersistenceTable[0]?.offspringLineage).toBe(2);
      expect(result.descendantPersistenceTable[1]?.offspringSpecies).toBe(2);
    });
  });
});

function buildTaxonHistory(
  id: number,
  firstSeenTick: number,
  extinctTick: number | null
): TaxonHistoryLike {
  return {
    firstSeenTick,
    extinctTick
  };
}

function buildDescentEdge(
  tick: number,
  parentId: number,
  parentLineage: number,
  parentSpecies: number,
  offspringId: number,
  offspringLineage: number,
  offspringSpecies: number,
  offspringProduced: number,
  offspringDeathTick: number | null,
  offspringAgeAtDeath: number | null
) {
  return {
    tick,
    parentId,
    parentLineage,
    parentSpecies,
    offspringId,
    offspringLineage,
    offspringSpecies,
    offspringProduced,
    offspringDeathTick,
    offspringAgeAtDeath
  };
}
