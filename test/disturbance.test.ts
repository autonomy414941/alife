import { describe, expect, it } from 'vitest';

import {
  calculateDisturbanceAffectedCellCount,
  describeDisturbanceFootprint
} from '../src/disturbance';

describe('describeDisturbanceFootprint', () => {
  it('captures the radius-1 refugia thresholds on the default toroidal grid', () => {
    expect(
      describeDisturbanceFootprint({
        width: 20,
        height: 20,
        disturbanceRadius: 1,
        disturbanceRefugiaFraction: 0.1
      })
    ).toEqual({
      totalCells: 400,
      targetedCells: 5,
      affectedCells: 4
    });
    expect(
      describeDisturbanceFootprint({
        width: 20,
        height: 20,
        disturbanceRadius: 1,
        disturbanceRefugiaFraction: 0.3
      }).affectedCells
    ).toBe(3);
    expect(
      describeDisturbanceFootprint({
        width: 20,
        height: 20,
        disturbanceRadius: 1,
        disturbanceRefugiaFraction: 0.5
      }).affectedCells
    ).toBe(2);
    expect(
      describeDisturbanceFootprint({
        width: 20,
        height: 20,
        disturbanceRadius: 1,
        disturbanceRefugiaFraction: 0.7
      }).affectedCells
    ).toBe(1);
  });

  it('deduplicates wrapped local footprints on small toroidal grids', () => {
    expect(
      describeDisturbanceFootprint({
        width: 2,
        height: 2,
        disturbanceRadius: 2,
        disturbanceRefugiaFraction: 0.5
      })
    ).toEqual({
      totalCells: 4,
      targetedCells: 4,
      affectedCells: 2
    });
  });
});

describe('calculateDisturbanceAffectedCellCount', () => {
  it('clamps unit-interval edge cases without exceeding the targeted footprint', () => {
    expect(calculateDisturbanceAffectedCellCount(5, -1)).toBe(5);
    expect(calculateDisturbanceAffectedCellCount(5, 0.999)).toBe(0);
    expect(calculateDisturbanceAffectedCellCount(5, 2)).toBe(0);
    expect(calculateDisturbanceAffectedCellCount(0, 0.5)).toBe(0);
  });
});
