import { describe, expect, it } from 'vitest';

import {
  buildDisturbanceCellSets,
  calculateDisturbanceAffectedCellCount,
  countDisturbanceEventsInWindow,
  createDisturbanceEvent,
  describeDisturbanceFootprint,
  disturbanceSettlementOpenUntilTickAt,
  latestDisturbanceEvent,
  markDisturbanceSettlementOpenings,
  resolveDisturbanceFootprintConfig,
  resolveDisturbanceSchedule,
  resolveDisturbanceSettlementOpeningConfig,
  shouldApplyDisturbance,
  updateDisturbanceEventState
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

describe('disturbance schedule helpers', () => {
  it('normalizes wrapped phase offsets and triggers aligned ticks', () => {
    const schedule = resolveDisturbanceSchedule({
      disturbanceInterval: 4,
      disturbancePhaseOffset: -0.5
    });

    expect(schedule).toEqual({
      interval: 4,
      phaseOffset: 0.5
    });
    expect(shouldApplyDisturbance(schedule, 1)).toBe(false);
    expect(shouldApplyDisturbance(schedule, 2)).toBe(true);
    expect(shouldApplyDisturbance(schedule, 6)).toBe(true);
  });
});

describe('disturbance state helpers', () => {
  it('builds localized cell sets and records settlement openings on affected cells', () => {
    const cellSets = buildDisturbanceCellSets({
      width: 5,
      height: 1,
      footprint: resolveDisturbanceFootprintConfig({
        disturbanceRadius: 1,
        disturbanceRefugiaFraction: 0.4
      }),
      pickRandomX: () => 2,
      pickRandomY: () => 0,
      shuffle: (values) => [...values].reverse()
    });
    const openings = [[0, 0, 0, 0, 0]];

    expect([...cellSets.targetedCellIndices].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect([...cellSets.affectedCellIndices]).toEqual([3]);

    markDisturbanceSettlementOpenings(
      openings,
      5,
      cellSets.affectedCellIndices,
      4,
      resolveDisturbanceSettlementOpeningConfig({
        disturbanceSettlementOpeningTicks: 2,
        disturbanceSettlementOpeningBonus: 1
      })
    );

    expect(disturbanceSettlementOpenUntilTickAt(openings, 3, 0)).toBe(5);
    expect(disturbanceSettlementOpenUntilTickAt(openings, -2, 0)).toBe(5);
    expect(disturbanceSettlementOpenUntilTickAt(openings, 2, 0)).toBe(0);
  });

  it('tracks recovery relapses and window counts across disturbance events', () => {
    const event = createDisturbanceEvent({
      tick: 2,
      populationBefore: 3,
      populationAfterShock: 3,
      activeSpeciesBefore: 2,
      activeSpeciesAfterShock: 2,
      totalResourcesBefore: 10,
      totalResourcesAfterShock: 8,
      targetedCells: 5,
      affectedCells: 3,
      totalCells: 10
    });
    const events = [event];

    updateDisturbanceEventState(events, 3, 2, 1);
    updateDisturbanceEventState(events, 4, 3, 1);

    expect(event.minPopulationSinceEvent).toBe(2);
    expect(event.minPopulationTickSinceEvent).toBe(3);
    expect(event.minActiveSpeciesSinceEvent).toBe(1);
    expect(event.recoveryRelapses).toBe(1);
    expect(event.recoveryTick).toBe(4);
    expect(
      countDisturbanceEventsInWindow(events, {
        startTick: 2,
        endTick: 4,
        size: 3
      })
    ).toBe(1);
    expect(latestDisturbanceEvent(events)).toBe(event);
  });
});
