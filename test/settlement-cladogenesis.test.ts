import { describe, expect, it } from 'vitest';
import {
  resolveNewCladeEncounterRestraintGraceBoost,
  resolveNewCladeSettlementCrowdingRelief,
  resolveOffspringSettlementContext,
  usesCladogenesisEcologyGate,
  usesNewCladeSettlementGrace,
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
  });
});
