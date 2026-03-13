import { SimulationConfig, TurnoverWindow } from './types';

export interface DisturbanceSchedule {
  interval: number;
  phaseOffset: number;
}

export interface DisturbanceFootprintConfig {
  radius: number;
  refugiaFraction: number;
}

export interface DisturbanceSettlementOpeningConfig {
  openingTicks: number;
  openingBonus: number;
  lineageAbsentOnly: boolean;
  enabled: boolean;
}

export interface DisturbanceEventState {
  tick: number;
  populationBefore: number;
  populationAfterShock: number;
  activeSpeciesBefore: number;
  activeSpeciesAfterShock: number;
  totalResourcesBefore: number;
  totalResourcesAfterShock: number;
  targetedCells: number;
  affectedCells: number;
  totalCells: number;
  minPopulationSinceEvent: number;
  minPopulationTickSinceEvent: number;
  minActiveSpeciesSinceEvent: number;
  recoveryTick: number | null;
  recoveryRelapses: number;
}

export interface DisturbanceFootprintMetadata {
  totalCells: number;
  targetedCells: number;
  affectedCells: number;
}

interface BuildDisturbanceCellSetsOptions {
  width: number;
  height: number;
  footprint: DisturbanceFootprintConfig;
  pickRandomX: (width: number) => number;
  pickRandomY: (height: number) => number;
  shuffle: <T>(values: T[]) => T[];
}

interface CreateDisturbanceEventOptions {
  tick: number;
  populationBefore: number;
  populationAfterShock: number;
  activeSpeciesBefore: number;
  activeSpeciesAfterShock: number;
  totalResourcesBefore: number;
  totalResourcesAfterShock: number;
  targetedCells: number;
  affectedCells: number;
  totalCells: number;
}

export function resolveDisturbanceSchedule(
  config: Pick<SimulationConfig, 'disturbanceInterval' | 'disturbancePhaseOffset'>
): DisturbanceSchedule {
  return {
    interval: Math.max(0, Math.floor(config.disturbanceInterval)),
    phaseOffset: normalizeWrappedUnitInterval(config.disturbancePhaseOffset)
  };
}

export function shouldApplyDisturbance(schedule: DisturbanceSchedule, stepTick: number): boolean {
  if (schedule.interval <= 0 || stepTick <= 0) {
    return false;
  }

  return stepTick % schedule.interval === disturbancePhaseOffsetTick(schedule);
}

export function resolveDisturbanceFootprintConfig(
  config: Pick<SimulationConfig, 'disturbanceRadius' | 'disturbanceRefugiaFraction'>
): DisturbanceFootprintConfig {
  return {
    radius: Math.max(-1, Math.floor(config.disturbanceRadius)),
    refugiaFraction: clampUnitInterval(config.disturbanceRefugiaFraction)
  };
}

export function resolveDisturbanceSettlementOpeningConfig(
  config: Pick<SimulationConfig, 'disturbanceSettlementOpeningTicks' | 'disturbanceSettlementOpeningBonus'> &
    Partial<Pick<SimulationConfig, 'disturbanceSettlementOpeningLineageAbsentOnly'>>
): DisturbanceSettlementOpeningConfig {
  const openingTicks = Math.max(0, Math.floor(config.disturbanceSettlementOpeningTicks));
  const openingBonus = Math.max(0, config.disturbanceSettlementOpeningBonus);
  return {
    openingTicks,
    openingBonus,
    lineageAbsentOnly: config.disturbanceSettlementOpeningLineageAbsentOnly === true,
    enabled: openingTicks > 0 && openingBonus > 0
  };
}

export function buildDisturbanceCellSets({
  width,
  height,
  footprint,
  pickRandomX,
  pickRandomY,
  shuffle
}: BuildDisturbanceCellSetsOptions): {
  targetedCellIndices: number[];
  affectedCellIndices: Set<number>;
} {
  const normalizedWidth = Math.max(0, Math.floor(width));
  const normalizedHeight = Math.max(0, Math.floor(height));
  const totalCells = normalizedWidth * normalizedHeight;
  if (totalCells <= 0) {
    return {
      targetedCellIndices: [],
      affectedCellIndices: new Set<number>()
    };
  }

  const targetedCellIndices =
    footprint.radius < 0
      ? Array.from({ length: totalCells }, (_, index) => index)
      : collectWrappedCellIndicesWithinRadius(
          normalizedWidth,
          normalizedHeight,
          pickRandomX(normalizedWidth),
          pickRandomY(normalizedHeight),
          footprint.radius
        );
  if (targetedCellIndices.length === 0) {
    return {
      targetedCellIndices,
      affectedCellIndices: new Set<number>()
    };
  }

  if (footprint.refugiaFraction <= 0) {
    return {
      targetedCellIndices,
      affectedCellIndices: new Set<number>(targetedCellIndices)
    };
  }

  const affectedCount = calculateDisturbanceAffectedCellCount(
    targetedCellIndices.length,
    footprint.refugiaFraction
  );
  if (affectedCount <= 0) {
    return {
      targetedCellIndices,
      affectedCellIndices: new Set<number>()
    };
  }
  if (affectedCount >= targetedCellIndices.length) {
    return {
      targetedCellIndices,
      affectedCellIndices: new Set<number>(targetedCellIndices)
    };
  }

  return {
    targetedCellIndices,
    affectedCellIndices: new Set<number>(shuffle([...targetedCellIndices]).slice(0, affectedCount))
  };
}

export function markDisturbanceSettlementOpenings(
  settlementOpenUntilTick: number[][],
  width: number,
  affectedCellIndices: ReadonlySet<number>,
  stepTick: number,
  opening: DisturbanceSettlementOpeningConfig
): void {
  if (!opening.enabled) {
    return;
  }

  const openUntilTick = stepTick + opening.openingTicks - 1;
  for (const index of affectedCellIndices) {
    const x = index % width;
    const y = Math.floor(index / width);
    settlementOpenUntilTick[y][x] = Math.max(settlementOpenUntilTick[y][x], openUntilTick);
  }
}

export function disturbanceSettlementOpenUntilTickAt(
  settlementOpenUntilTick: number[][],
  x: number,
  y: number
): number {
  const height = settlementOpenUntilTick.length;
  const width = settlementOpenUntilTick[0]?.length ?? 0;
  if (width <= 0 || height <= 0) {
    return 0;
  }

  return settlementOpenUntilTick[wrap(y, height)][wrap(x, width)];
}

export function createDisturbanceEvent({
  tick,
  populationBefore,
  populationAfterShock,
  activeSpeciesBefore,
  activeSpeciesAfterShock,
  totalResourcesBefore,
  totalResourcesAfterShock,
  targetedCells,
  affectedCells,
  totalCells
}: CreateDisturbanceEventOptions): DisturbanceEventState {
  return {
    tick,
    populationBefore,
    populationAfterShock,
    activeSpeciesBefore,
    activeSpeciesAfterShock,
    totalResourcesBefore,
    totalResourcesAfterShock,
    targetedCells,
    affectedCells,
    totalCells,
    minPopulationSinceEvent: populationAfterShock,
    minPopulationTickSinceEvent: tick,
    minActiveSpeciesSinceEvent: activeSpeciesAfterShock,
    recoveryTick:
      populationBefore <= 0 || populationAfterShock >= populationBefore ? tick : null,
    recoveryRelapses: 0
  };
}

export function updateDisturbanceEventState(
  events: DisturbanceEventState[],
  currentTick: number,
  currentPopulation: number,
  currentActiveSpecies: number
): void {
  for (const event of events) {
    if (event.tick > currentTick) {
      continue;
    }
    if (currentPopulation < event.minPopulationSinceEvent) {
      event.minPopulationSinceEvent = currentPopulation;
      event.minPopulationTickSinceEvent = currentTick;
    }
    event.minActiveSpeciesSinceEvent = Math.min(event.minActiveSpeciesSinceEvent, currentActiveSpecies);
    if (event.populationBefore <= 0) {
      continue;
    }
    if (currentPopulation < event.populationBefore) {
      if (event.recoveryTick !== null) {
        event.recoveryRelapses += 1;
      }
      event.recoveryTick = null;
    } else if (event.recoveryTick === null) {
      event.recoveryTick = currentTick;
    }
  }
}

export function countDisturbanceEventsInWindow(
  events: ReadonlyArray<DisturbanceEventState>,
  window: TurnoverWindow
): number {
  let count = 0;
  for (const event of events) {
    if (event.tick >= window.startTick && event.tick <= window.endTick) {
      count += 1;
    }
  }
  return count;
}

export function latestDisturbanceEvent(
  events: ReadonlyArray<DisturbanceEventState>
): DisturbanceEventState | null {
  if (events.length === 0) {
    return null;
  }
  return events[events.length - 1];
}

export function collectWrappedCellIndicesWithinRadius(
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number
): number[] {
  const normalizedWidth = Math.max(0, Math.floor(width));
  const normalizedHeight = Math.max(0, Math.floor(height));
  if (normalizedWidth <= 0 || normalizedHeight <= 0) {
    return [];
  }

  const visited = new Set<number>();
  const normalizedRadius = Math.max(0, Math.floor(radius));

  for (let dy = -normalizedRadius; dy <= normalizedRadius; dy += 1) {
    for (let dx = -normalizedRadius; dx <= normalizedRadius; dx += 1) {
      if (Math.abs(dx) + Math.abs(dy) > normalizedRadius) {
        continue;
      }
      const x = wrap(centerX + dx, normalizedWidth);
      const y = wrap(centerY + dy, normalizedHeight);
      visited.add(y * normalizedWidth + x);
    }
  }

  return [...visited];
}

export function calculateDisturbanceAffectedCellCount(
  targetedCells: number,
  refugiaFraction: number
): number {
  const normalizedTargetedCells = Math.max(0, Math.floor(targetedCells));
  if (normalizedTargetedCells === 0) {
    return 0;
  }

  const normalizedRefugiaFraction = clampUnitInterval(refugiaFraction);
  if (normalizedRefugiaFraction <= 0) {
    return normalizedTargetedCells;
  }

  const affectedCells = Math.max(
    0,
    Math.floor(normalizedTargetedCells * (1 - normalizedRefugiaFraction))
  );
  if (affectedCells >= normalizedTargetedCells) {
    return normalizedTargetedCells;
  }
  return affectedCells;
}

export function describeDisturbanceFootprint(
  config: Pick<
    SimulationConfig,
    'width' | 'height' | 'disturbanceRadius' | 'disturbanceRefugiaFraction'
  >
): DisturbanceFootprintMetadata {
  const width = Math.max(0, Math.floor(config.width));
  const height = Math.max(0, Math.floor(config.height));
  const totalCells = width * height;
  if (totalCells <= 0) {
    return {
      totalCells: 0,
      targetedCells: 0,
      affectedCells: 0
    };
  }

  const footprint = resolveDisturbanceFootprintConfig(config);
  const targetedCells =
    footprint.radius < 0
      ? totalCells
      : collectWrappedCellIndicesWithinRadius(width, height, 0, 0, footprint.radius).length;

  return {
    totalCells,
    targetedCells,
    affectedCells: calculateDisturbanceAffectedCellCount(targetedCells, footprint.refugiaFraction)
  };
}

function disturbancePhaseOffsetTick(schedule: DisturbanceSchedule): number {
  if (schedule.interval <= 0) {
    return 0;
  }
  return Math.floor(schedule.phaseOffset * schedule.interval);
}

function wrap(value: number, size: number): number {
  const wrapped = Math.trunc(value) % size;
  return wrapped < 0 ? wrapped + size : wrapped;
}

function normalizeWrappedUnitInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

function clampUnitInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}
