import { describe, expect, it } from 'vitest';
import {
  adjustLineageOccupancy,
  buildLineageOccupancyGrid,
  buildOccupancyGrid,
  neighborhoodCrowding,
  sameLineageNeighborhoodCrowdingAt
} from '../src/settlement-spatial';

describe('settlement spatial helpers', () => {
  it('builds occupancy grids for total and lineage-scoped counts', () => {
    const agents = [
      { lineage: 1, x: 0, y: 0 },
      { lineage: 1, x: 1, y: 0 },
      { lineage: 2, x: 1, y: 0 }
    ];

    expect(buildOccupancyGrid(2, 1, agents)).toEqual([[1, 2]]);
    expect(buildLineageOccupancyGrid(2, 1, agents)).toEqual(
      new Map([
        [1, [[1, 1]]],
        [2, [[0, 1]]]
      ])
    );
  });

  it('adjusts lineage occupancy in place and creates missing lineage grids on demand', () => {
    const occupancy = buildLineageOccupancyGrid(2, 2, [{ lineage: 1, x: 0, y: 0 }]);

    adjustLineageOccupancy({
      width: 2,
      height: 2,
      lineageOccupancy: occupancy,
      lineage: 1,
      x: 0,
      y: 0,
      delta: -1
    });
    adjustLineageOccupancy({
      width: 2,
      height: 2,
      lineageOccupancy: occupancy,
      lineage: 2,
      x: 1,
      y: 1,
      delta: 1
    });

    expect(occupancy.get(1)).toEqual([
      [0, 0],
      [0, 0]
    ]);
    expect(occupancy.get(2)).toEqual([
      [0, 0],
      [0, 1]
    ]);
  });

  it('computes wrapped neighborhood crowding and excludes the focal occupant when requested', () => {
    expect(
      neighborhoodCrowding({
        x: 0,
        y: 0,
        occupancy: [[2, 0, 1]],
        dispersalRadius: 1,
        wrapX: (x) => ((x % 3) + 3) % 3,
        wrapY: () => 0
      })
    ).toBeCloseTo(1.5, 10);

    const lineageOccupancy = new Map<number, number[][]>([[3, [[2, 0, 1]]]]);
    expect(
      sameLineageNeighborhoodCrowdingAt({
        width: 3,
        lineage: 3,
        x: 0,
        y: 0,
        lineageOccupancy,
        dispersalRadius: 1,
        cellIndex: (x, y) => (((y % 1) + 1) % 1) * 3 + (((x % 3) + 3) % 3),
        wrapX: (x) => ((x % 3) + 3) % 3,
        wrapY: () => 0,
        excludedPosition: { x: 0, y: 0 }
      })
    ).toBeCloseTo(1.5, 10);
  });
});
