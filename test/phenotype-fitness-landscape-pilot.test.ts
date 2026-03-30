import { describe, it, expect } from 'vitest';
import { runPhenotypeLandscapePilot, formatPhenotypeLandscapeResult } from '../src/phenotype-fitness-landscape-pilot';

describe('phenotype-fitness-landscape-pilot', () => {
  it('should generate a phenotype-fitness landscape from a short simulation run', () => {
    const result = runPhenotypeLandscapePilot({
      seed: 42,
      steps: 100,
      minExposuresForStability: 5,
      minFitnessThreshold: {
        harvestIntake: 5,
        survivalRate: 0.5
      }
    });

    expect(result.landscape.records).toBeGreaterThan(0);
    expect(result.landscape.outcomes.length).toBeGreaterThan(0);
    expect(result.topRegionsByHarvest.length).toBeGreaterThan(0);
    expect(result.topRegionsBySurvival.length).toBeGreaterThan(0);
    expect(result.topRegionsByReproduction.length).toBeGreaterThan(0);
  });

  it('should identify stable regions based on min exposures and fitness thresholds', () => {
    const result = runPhenotypeLandscapePilot({
      seed: 123,
      steps: 50,
      minExposuresForStability: 10,
      minFitnessThreshold: {
        survivalRate: 0.7
      }
    });

    for (const region of result.stableRegions) {
      expect(region.exposures).toBeGreaterThanOrEqual(10);
      expect(region.survivalRate).toBeGreaterThanOrEqual(0.7);
    }
  });

  it('should format results as markdown', () => {
    const result = runPhenotypeLandscapePilot({
      seed: 456,
      steps: 50,
      minExposuresForStability: 5,
      minFitnessThreshold: {}
    });

    const formatted = formatPhenotypeLandscapeResult(result);

    expect(formatted).toContain('# Phenotype-Fitness Landscape Analysis');
    expect(formatted).toContain('## Configuration');
    expect(formatted).toContain('## Summary');
    expect(formatted).toContain('## Top 10 Regions by Harvest Intake');
    expect(formatted).toContain('## Top 10 Regions by Survival Rate');
    expect(formatted).toContain('## Top 10 Regions by Reproduction Rate');
    expect(formatted).toContain('| Trophic | Defense | MetabEff |');
  });

  it('should rank regions correctly', () => {
    const result = runPhenotypeLandscapePilot({
      seed: 789,
      steps: 100,
      minExposuresForStability: 3,
      minFitnessThreshold: {}
    });

    for (let i = 1; i < result.topRegionsByHarvest.length; i++) {
      expect(result.topRegionsByHarvest[i - 1].meanHarvestIntake).toBeGreaterThanOrEqual(
        result.topRegionsByHarvest[i].meanHarvestIntake
      );
    }

    for (let i = 1; i < result.topRegionsBySurvival.length; i++) {
      expect(result.topRegionsBySurvival[i - 1].survivalRate).toBeGreaterThanOrEqual(
        result.topRegionsBySurvival[i].survivalRate
      );
    }

    for (let i = 1; i < result.topRegionsByReproduction.length; i++) {
      expect(result.topRegionsByReproduction[i - 1].reproductionRate).toBeGreaterThanOrEqual(
        result.topRegionsByReproduction[i].reproductionRate
      );
    }
  });
});
