import { describe, expect, it } from 'vitest';
import {
  resolveEncounterLineageTransferMultiplier,
  resolveNewCladeEncounterRestraintGraceBoost,
  resolveNewCladeSettlementCrowdingRelief,
  resolveOffspringSettlementContext,
  resolveSettlementEcologyScore,
  usesCladogenesisEcologyGate,
  usesNewCladeSettlementGrace,
  usesOffspringSettlementContext,
  usesOffspringSettlementLineageOccupancy,
  usesOffspringSettlementScoring
} from '../src/settlement-cladogenesis';

describe('settlement/cladogenesis helpers', () => {
  it('detects when settlement scoring is active through founder grace alone', () => {
    expect(
      usesOffspringSettlementScoring({
        offspringSettlementEcologyScoring: false,
        lineageOffspringSettlementCrowdingPenalty: 0,
        newCladeSettlementCrowdingGraceTicks: 12
      })
    ).toBe(true);
    expect(
      usesOffspringSettlementScoring({
        offspringSettlementEcologyScoring: false,
        lineageOffspringSettlementCrowdingPenalty: 0,
        newCladeSettlementCrowdingGraceTicks: 0
      })
    ).toBe(false);
    expect(usesNewCladeSettlementGrace({ newCladeSettlementCrowdingGraceTicks: 12 })).toBe(true);
    expect(usesNewCladeSettlementGrace({ newCladeSettlementCrowdingGraceTicks: 0 })).toBe(false);
    expect(
      usesOffspringSettlementContext({
        offspringSettlementEcologyScoring: false,
        lineageOffspringSettlementCrowdingPenalty: 0,
        newCladeSettlementCrowdingGraceTicks: 0,
        disturbanceSettlementOpeningTicks: 3,
        disturbanceSettlementOpeningBonus: 1,
        disturbanceSettlementOpeningLineageAbsentOnly: true
      })
    ).toBe(true);
    expect(
      usesOffspringSettlementLineageOccupancy({
        lineageOffspringSettlementCrowdingPenalty: 0,
        newCladeSettlementCrowdingGraceTicks: 0,
        disturbanceSettlementOpeningTicks: 3,
        disturbanceSettlementOpeningBonus: 1,
        disturbanceSettlementOpeningLineageAbsentOnly: true
      })
    ).toBe(true);
    expect(usesCladogenesisEcologyGate({ cladogenesisEcologyAdvantageThreshold: 0.1 })).toBe(true);
    expect(usesCladogenesisEcologyGate({ cladogenesisEcologyAdvantageThreshold: -1 })).toBe(false);
  });

  it('builds offspring settlement context from living agents only', () => {
    const occupancyCalls: Array<Array<{ x: number; y: number }>> = [];
    const lineageOccupancyCalls: Array<Array<{ lineage: number; x: number; y: number }>> = [];

    const context = resolveOffspringSettlementContext({
      config: { lineageOffspringSettlementCrowdingPenalty: -2 },
      agents: [
        { energy: 5, lineage: 1, x: 0, y: 0 },
        { energy: 0, lineage: 2, x: 1, y: 0 },
        { energy: 3, lineage: 1, x: 0, y: 1 }
      ],
      usesLineageOccupancy: true,
      buildOccupancyGrid: (agents) => {
        occupancyCalls.push(agents.map(({ x, y }) => ({ x, y })));
        return [[agents.length]];
      },
      buildLineageOccupancyGrid: (agents) => {
        lineageOccupancyCalls.push(agents.map(({ lineage, x, y }) => ({ lineage, x, y })));
        return new Map([[1, [[agents.length]]]]);
      }
    });

    expect(context).toEqual({
      occupancy: [[2]],
      lineageOccupancy: new Map([[1, [[2]]]]),
      lineagePenalty: 0
    });
    expect(occupancyCalls).toEqual([[{ x: 0, y: 0 }, { x: 0, y: 1 }]]);
    expect(lineageOccupancyCalls).toEqual([[{ lineage: 1, x: 0, y: 0 }, { lineage: 1, x: 0, y: 1 }]]);
  });

  it('decays founder grace by clade age and uses it for encounter restraint boosts', () => {
    const cladeHistory = new Map([[4, { firstSeenTick: 6 }]]);

    expect(
      resolveNewCladeSettlementCrowdingRelief({
        config: { newCladeSettlementCrowdingGraceTicks: 4 },
        tickCount: 6,
        lineage: 4,
        cladeHistory
      })
    ).toBe(1);
    expect(
      resolveNewCladeSettlementCrowdingRelief({
        config: { newCladeSettlementCrowdingGraceTicks: 4 },
        tickCount: 8,
        lineage: 4,
        cladeHistory
      })
    ).toBe(0.5);
    expect(
      resolveNewCladeEncounterRestraintGraceBoost({
        config: {
          newCladeSettlementCrowdingGraceTicks: 4,
          newCladeEncounterRestraintGraceBoost: 2
        },
        tickCount: 8,
        lineage: 4,
        cladeHistory
      })
    ).toBe(1);
    expect(
      resolveEncounterLineageTransferMultiplier({
        config: {
          lineageEncounterRestraint: 1,
          newCladeSettlementCrowdingGraceTicks: 4,
          newCladeEncounterRestraintGraceBoost: 2
        },
        tickCount: 8,
        dominantLineage: 4,
        targetLineage: 4,
        cladeHistory
      })
    ).toBeCloseTo(1 / 3, 10);
    expect(
      resolveEncounterLineageTransferMultiplier({
        config: {
          lineageEncounterRestraint: 1,
          newCladeSettlementCrowdingGraceTicks: 4,
          newCladeEncounterRestraintGraceBoost: 2
        },
        tickCount: 8,
        dominantLineage: 4,
        targetLineage: 5,
        cladeHistory
      })
    ).toBe(1);
  });

  it('lets founder grace zero out settlement crowding penalties while active', () => {
    const cladeHistory = new Map([[4, { firstSeenTick: 6 }]]);

    expect(
      resolveSettlementEcologyScore({
        config: {
          dispersalPressure: 2,
          newCladeSettlementCrowdingGraceTicks: 4
        },
        tickCount: 6,
        cladeHistory,
        agent: {
          lineage: 4,
          species: 1,
          x: 1,
          y: 0,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        x: 1,
        y: 0,
        occupancy: [[2]],
        lineageOccupancy: new Map([[4, [[1]]]]),
        lineagePenalty: 3,
        excludedPosition: undefined,
        jitter: 0,
        resourceAt: () => 5,
        habitatMatchEfficiencyAt: () => 1,
        neighborhoodCrowdingAt: () => 2,
        sameLineageNeighborhoodCrowdingAt: () => 3
      })
    ).toBe(5);
    expect(
      resolveSettlementEcologyScore({
        config: {
          dispersalPressure: 2,
          newCladeSettlementCrowdingGraceTicks: 4
        },
        tickCount: 10,
        cladeHistory,
        agent: {
          lineage: 4,
          species: 1,
          x: 1,
          y: 0,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        },
        x: 1,
        y: 0,
        occupancy: [[2]],
        lineageOccupancy: new Map([[4, [[1]]]]),
        lineagePenalty: 3,
        excludedPosition: undefined,
        jitter: 0,
        resourceAt: () => 5,
        habitatMatchEfficiencyAt: () => 1,
        neighborhoodCrowdingAt: () => 2,
        sameLineageNeighborhoodCrowdingAt: () => 3
      })
    ).toBe(-8);
  });
});
