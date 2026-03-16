import { LineageOccupancyGrid, SettlementPosition } from './reproduction';
import { Agent } from './types';

export function buildOccupancyGrid(
  width: number,
  height: number,
  agents: ReadonlyArray<Pick<Agent, 'x' | 'y'>>
): number[][] {
  const occupancy = buildZeroGrid(width, height);
  for (const agent of agents) {
    occupancy[agent.y][agent.x] += 1;
  }
  return occupancy;
}

export function buildLineageOccupancyGrid(
  width: number,
  height: number,
  agents: ReadonlyArray<Pick<Agent, 'lineage' | 'x' | 'y'>>
): LineageOccupancyGrid {
  const grids: LineageOccupancyGrid = new Map();
  for (const agent of agents) {
    let grid = grids.get(agent.lineage);
    if (!grid) {
      grid = buildZeroGrid(width, height);
      grids.set(agent.lineage, grid);
    }
    grid[agent.y][agent.x] += 1;
  }
  return grids;
}

export function adjustLineageOccupancy({
  width,
  height,
  lineageOccupancy,
  lineage,
  x,
  y,
  delta
}: {
  width: number;
  height: number;
  lineageOccupancy: LineageOccupancyGrid;
  lineage: number;
  x: number;
  y: number;
  delta: number;
}): void {
  let grid = lineageOccupancy.get(lineage);
  if (!grid) {
    if (delta <= 0) {
      return;
    }
    grid = buildZeroGrid(width, height);
    lineageOccupancy.set(lineage, grid);
  }

  grid[y][x] = Math.max(0, grid[y][x] + delta);
}

export function neighborhoodCrowding({
  x,
  y,
  occupancy,
  dispersalRadius,
  wrapX,
  wrapY
}: {
  x: number;
  y: number;
  occupancy: number[][];
  dispersalRadius: number;
  wrapX: (x: number) => number;
  wrapY: (y: number) => number;
}): number {
  if (dispersalRadius === 0) {
    return occupancy[wrapY(y)][wrapX(x)];
  }

  let weightedCount = 0;
  let totalWeight = 0;
  for (let dy = -dispersalRadius; dy <= dispersalRadius; dy += 1) {
    for (let dx = -dispersalRadius; dx <= dispersalRadius; dx += 1) {
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance > dispersalRadius) {
        continue;
      }
      const weight = 1 / (distance + 1);
      const nx = wrapX(x + dx);
      const ny = wrapY(y + dy);
      weightedCount += occupancy[ny][nx] * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }
  return weightedCount / totalWeight;
}

export function sameLineageNeighborhoodCrowdingAt({
  width,
  lineage,
  x,
  y,
  lineageOccupancy,
  dispersalRadius,
  cellIndex,
  wrapX,
  wrapY,
  excludedPosition
}: {
  width: number;
  lineage: number;
  x: number;
  y: number;
  lineageOccupancy: LineageOccupancyGrid;
  dispersalRadius: number;
  cellIndex: (x: number, y: number) => number;
  wrapX: (x: number) => number;
  wrapY: (y: number) => number;
  excludedPosition?: SettlementPosition;
}): number {
  return sameLineageNeighborhoodStatsAt({
    width,
    lineage,
    x,
    y,
    lineageOccupancy,
    dispersalRadius,
    cellIndex,
    wrapX,
    wrapY,
    excludedPosition
  }).weightedCount;
}

function sameLineageNeighborhoodStatsAt({
  width,
  lineage,
  x,
  y,
  lineageOccupancy,
  dispersalRadius,
  cellIndex,
  wrapX,
  wrapY,
  excludedPosition
}: {
  width: number;
  lineage: number;
  x: number;
  y: number;
  lineageOccupancy: LineageOccupancyGrid;
  dispersalRadius: number;
  cellIndex: (x: number, y: number) => number;
  wrapX: (x: number) => number;
  wrapY: (y: number) => number;
  excludedPosition?: SettlementPosition;
}): { weightedCount: number; totalWeight: number } {
  const grid = lineageOccupancy.get(lineage);
  if (!grid) {
    return { weightedCount: 0, totalWeight: 0 };
  }

  const excludedIndex =
    excludedPosition === undefined ? -1 : cellIndex(excludedPosition.x, excludedPosition.y);

  let weightedCount = 0;
  let totalWeight = 0;
  for (const [index, distance] of neighborhoodCellDistances({
    x,
    y,
    dispersalRadius,
    cellIndex,
    wrapX,
    wrapY
  })) {
    const cellX = index % width;
    const cellY = Math.floor(index / width);
    const rawCount = grid[cellY][cellX];
    const count = index === excludedIndex ? Math.max(0, rawCount - 1) : rawCount;
    const weight = 1 / (distance + 1);
    if (count > 0) {
      weightedCount += count * weight;
    }
    totalWeight += weight;
  }

  return { weightedCount, totalWeight };
}

function neighborhoodCellDistances({
  x,
  y,
  dispersalRadius,
  cellIndex,
  wrapX,
  wrapY
}: {
  x: number;
  y: number;
  dispersalRadius: number;
  cellIndex: (x: number, y: number) => number;
  wrapX: (x: number) => number;
  wrapY: (y: number) => number;
}): Map<number, number> {
  const cellDistances = new Map<number, number>();
  const centerX = wrapX(x);
  const centerY = wrapY(y);

  for (let dy = -dispersalRadius; dy <= dispersalRadius; dy += 1) {
    for (let dx = -dispersalRadius; dx <= dispersalRadius; dx += 1) {
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance > dispersalRadius) {
        continue;
      }

      const index = cellIndex(centerX + dx, centerY + dy);
      const current = cellDistances.get(index);
      if (current === undefined || distance < current) {
        cellDistances.set(index, distance);
      }
    }
  }

  return cellDistances;
}

function buildZeroGrid(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
}
