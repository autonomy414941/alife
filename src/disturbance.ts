import { SimulationConfig } from './types';

export interface DisturbanceFootprintMetadata {
  totalCells: number;
  targetedCells: number;
  affectedCells: number;
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

  const radius = Math.max(-1, Math.floor(config.disturbanceRadius));
  const targetedCells =
    radius < 0
      ? totalCells
      : collectWrappedCellIndicesWithinRadius(width, height, 0, 0, radius).length;

  return {
    totalCells,
    targetedCells,
    affectedCells: calculateDisturbanceAffectedCellCount(
      targetedCells,
      config.disturbanceRefugiaFraction
    )
  };
}

function wrap(value: number, size: number): number {
  const wrapped = Math.trunc(value) % size;
  return wrapped < 0 ? wrapped + size : wrapped;
}

function clampUnitInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}
