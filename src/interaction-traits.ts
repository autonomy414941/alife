import { getTrait } from './genome-v2';
import { Genome, GenomeV2 } from './types';

export const DEFAULT_TROPHIC_LEVEL = 0.5;
export const DEFAULT_DEFENSE_LEVEL = 0.5;

export function trophicLevelTraitWithFallback(genomeV2: GenomeV2 | undefined): number | undefined {
  if (genomeV2 === undefined) {
    return undefined;
  }
  return clamp(getTrait(genomeV2, 'trophic_level'), 0, 1);
}

export function defenseLevelTraitWithFallback(genomeV2: GenomeV2 | undefined): number | undefined {
  if (genomeV2 === undefined) {
    return undefined;
  }
  return clamp(getTrait(genomeV2, 'defense_level'), 0, 1);
}

export function trophicLevelTraitForGenome(genome: Genome | GenomeV2): number | undefined {
  return isGenomeV2(genome) ? trophicLevelTraitWithFallback(genome) : undefined;
}

export function defenseLevelTraitForGenome(genome: Genome | GenomeV2): number | undefined {
  return isGenomeV2(genome) ? defenseLevelTraitWithFallback(genome) : undefined;
}

function isGenomeV2(genome: Genome | GenomeV2): genome is GenomeV2 {
  return 'traits' in genome;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
