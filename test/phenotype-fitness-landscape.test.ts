import { describe, it, expect } from 'vitest';
import {
  enrichPolicyFitnessWithPhenotype,
  binPhenotypeValue,
  binPhenotype,
  binEnvironment,
  binPhenotypeEnvironment,
  createBinKey,
  parseBinKey,
  aggregatePhenotypeFitnessLandscape,
  findStableFitnessRegions,
  PhenotypeFitnessRecord,
  DEFAULT_TROPHIC_LEVEL_BINS,
  DEFAULT_DEFENSE_LEVEL_BINS,
  DEFAULT_METABOLIC_EFFICIENCY_BINS,
  DEFAULT_RESOURCE_PREFERENCE_BINS
} from '../src/phenotype-fitness-landscape';
import { PolicyFitnessRecord } from '../src/policy-fitness';
import { GenomeV2 } from '../src/types';

describe('phenotype-fitness-landscape', () => {
  describe('enrichPolicyFitnessWithPhenotype', () => {
    it('should extract phenotype traits from genomeV2', () => {
      const record: PolicyFitnessRecord = {
        tick: 100,
        agentId: 1,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 0,
        harvestIntake: 10,
        survived: true,
        offspringProduced: 1,
        movementPolicyGated: false,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: false,
        hasHarvestPolicy: false
      };

      const genome: GenomeV2 = {
        traits: new Map([
          ['trophic_level', 0.8],
          ['defense_level', 0.3],
          ['metabolic_efficiency_primary', 0.6]
        ]),
        roleMap: new Map()
      };

      const enriched = enrichPolicyFitnessWithPhenotype(record, { genomeV2: genome });

      expect(enriched.trophicLevel).toBe(0.8);
      expect(enriched.defenseLevel).toBe(0.3);
      expect(enriched.metabolicEfficiencyPrimary).toBe(0.6);
      expect(enriched.metabolicEfficiencySecondary).toBe(0.5);
      expect(enriched.harvestIntake).toBe(10);
    });

    it('should use policy state for policy traits', () => {
      const record: PolicyFitnessRecord = {
        tick: 100,
        agentId: 1,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 0,
        harvestIntake: 10,
        survived: true,
        offspringProduced: 1,
        movementPolicyGated: false,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: true,
        hasMovementPolicy: false,
        hasReproductionPolicy: false,
        hasHarvestPolicy: true
      };

      const policyState = new Map([
        ['harvest_secondary_preference', 0.7],
        ['spending_secondary_preference', 0.4]
      ]);

      const enriched = enrichPolicyFitnessWithPhenotype(record, { policyState });

      expect(enriched.harvestSecondaryPreference).toBe(0.7);
      expect(enriched.spendingSecondaryPreference).toBe(0.4);
    });
  });

  describe('binPhenotypeValue', () => {
    it('should bin values correctly', () => {
      expect(binPhenotypeValue(0.0, 3)).toBe(0);
      expect(binPhenotypeValue(0.3, 3)).toBe(0);
      expect(binPhenotypeValue(0.4, 3)).toBe(1);
      expect(binPhenotypeValue(0.7, 3)).toBe(2);
      expect(binPhenotypeValue(1.0, 3)).toBe(2);
    });

    it('should clamp values', () => {
      expect(binPhenotypeValue(-0.1, 3)).toBe(0);
      expect(binPhenotypeValue(1.5, 3)).toBe(2);
    });
  });

  describe('binPhenotype', () => {
    it('should bin all phenotype traits', () => {
      const record: PhenotypeFitnessRecord = {
        tick: 100,
        agentId: 1,
        fertilityBin: 0,
        crowdingBin: 0,
        ageBin: 0,
        disturbancePhase: 0,
        harvestIntake: 10,
        survived: true,
        offspringProduced: 1,
        movementPolicyGated: false,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        hasAnyPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: false,
        hasHarvestPolicy: false,
        trophicLevel: 0.8,
        defenseLevel: 0.3,
        metabolicEfficiencyPrimary: 0.6,
        metabolicEfficiencySecondary: 0.5,
        harvestSecondaryPreference: 0.4,
        spendingSecondaryPreference: 0.6
      };

      const bin = binPhenotype(record);

      expect(bin.trophicLevelBin).toBe(2);
      expect(bin.defenseLevelBin).toBe(0);
      expect(bin.metabolicEfficiencyPrimaryBin).toBe(1);
      expect(bin.resourcePreferenceBin).toBe(1);
    });
  });

  describe('createBinKey and parseBinKey', () => {
    it('should round-trip correctly', () => {
      const bin = {
        trophicLevelBin: 2,
        defenseLevelBin: 1,
        metabolicEfficiencyPrimaryBin: 0,
        resourcePreferenceBin: 2,
        fertilityBin: 3,
        crowdingBin: 1,
        ageBin: 2,
        disturbancePhase: 0
      };

      const key = createBinKey(bin);
      const parsed = parseBinKey(key);

      expect(parsed).toEqual(bin);
    });
  });

  describe('aggregatePhenotypeFitnessLandscape', () => {
    it('should aggregate records by phenotype-environment bin', () => {
      const records: PhenotypeFitnessRecord[] = [
        {
          tick: 100,
          agentId: 1,
          fertilityBin: 0,
          crowdingBin: 0,
          ageBin: 0,
          disturbancePhase: 0,
          harvestIntake: 10,
          survived: true,
          offspringProduced: 1,
          movementPolicyGated: false,
          reproductionPolicyGated: false,
          harvestPolicyGuided: false,
          hasAnyPolicy: false,
          hasMovementPolicy: false,
          hasReproductionPolicy: false,
          hasHarvestPolicy: false,
          trophicLevel: 0.5,
          defenseLevel: 0.5,
          metabolicEfficiencyPrimary: 0.5,
          metabolicEfficiencySecondary: 0.5,
          harvestSecondaryPreference: 0.5,
          spendingSecondaryPreference: 0.5
        },
        {
          tick: 100,
          agentId: 2,
          fertilityBin: 0,
          crowdingBin: 0,
          ageBin: 0,
          disturbancePhase: 0,
          harvestIntake: 20,
          survived: true,
          offspringProduced: 2,
          movementPolicyGated: false,
          reproductionPolicyGated: false,
          harvestPolicyGuided: false,
          hasAnyPolicy: true,
          hasMovementPolicy: false,
          hasReproductionPolicy: false,
          hasHarvestPolicy: true,
          trophicLevel: 0.5,
          defenseLevel: 0.5,
          metabolicEfficiencyPrimary: 0.5,
          metabolicEfficiencySecondary: 0.5,
          harvestSecondaryPreference: 0.5,
          spendingSecondaryPreference: 0.5
        },
        {
          tick: 100,
          agentId: 3,
          fertilityBin: 1,
          crowdingBin: 0,
          ageBin: 0,
          disturbancePhase: 0,
          harvestIntake: 5,
          survived: false,
          offspringProduced: 0,
          movementPolicyGated: false,
          reproductionPolicyGated: false,
          harvestPolicyGuided: false,
          hasAnyPolicy: false,
          hasMovementPolicy: false,
          hasReproductionPolicy: false,
          hasHarvestPolicy: false,
          trophicLevel: 0.8,
          defenseLevel: 0.5,
          metabolicEfficiencyPrimary: 0.5,
          metabolicEfficiencySecondary: 0.5,
          harvestSecondaryPreference: 0.5,
          spendingSecondaryPreference: 0.5
        }
      ];

      const landscape = aggregatePhenotypeFitnessLandscape(records);

      expect(landscape.records).toBe(3);
      expect(landscape.outcomes.length).toBe(2);

      const firstBin = landscape.outcomes.find(
        (o) => o.bin.fertilityBin === 0 && o.bin.trophicLevelBin === 1
      );
      expect(firstBin).toBeDefined();
      expect(firstBin!.exposures).toBe(2);
      expect(firstBin!.meanHarvestIntake).toBe(15);
      expect(firstBin!.survivalRate).toBe(1);
      expect(firstBin!.reproductionRate).toBe(1.5);
      expect(firstBin!.policyPositiveShare).toBe(0.5);

      const secondBin = landscape.outcomes.find(
        (o) => o.bin.fertilityBin === 1 && o.bin.trophicLevelBin === 2
      );
      expect(secondBin).toBeDefined();
      expect(secondBin!.exposures).toBe(1);
      expect(secondBin!.meanHarvestIntake).toBe(5);
      expect(secondBin!.survivalRate).toBe(0);
      expect(secondBin!.reproductionRate).toBe(0);
    });
  });

  describe('findStableFitnessRegions', () => {
    it('should filter by minimum exposures and fitness thresholds', () => {
      const landscape = {
        records: 3,
        outcomes: [
          {
            bin: {
              trophicLevelBin: 1,
              defenseLevelBin: 1,
              metabolicEfficiencyPrimaryBin: 1,
              resourcePreferenceBin: 1,
              fertilityBin: 0,
              crowdingBin: 0,
              ageBin: 0,
              disturbancePhase: 0
            },
            exposures: 10,
            meanHarvestIntake: 15,
            survivalRate: 0.8,
            reproductionRate: 0.5,
            policyPositiveShare: 0.3
          },
          {
            bin: {
              trophicLevelBin: 2,
              defenseLevelBin: 1,
              metabolicEfficiencyPrimaryBin: 1,
              resourcePreferenceBin: 1,
              fertilityBin: 0,
              crowdingBin: 0,
              ageBin: 0,
              disturbancePhase: 0
            },
            exposures: 3,
            meanHarvestIntake: 20,
            survivalRate: 0.9,
            reproductionRate: 0.6,
            policyPositiveShare: 0.5
          },
          {
            bin: {
              trophicLevelBin: 0,
              defenseLevelBin: 1,
              metabolicEfficiencyPrimaryBin: 1,
              resourcePreferenceBin: 1,
              fertilityBin: 0,
              crowdingBin: 0,
              ageBin: 0,
              disturbancePhase: 0
            },
            exposures: 15,
            meanHarvestIntake: 8,
            survivalRate: 0.6,
            reproductionRate: 0.3,
            policyPositiveShare: 0.2
          }
        ]
      };

      const stable = findStableFitnessRegions(landscape, 5, {
        harvestIntake: 10,
        survivalRate: 0.7
      });

      expect(stable.length).toBe(1);
      expect(stable[0].bin.trophicLevelBin).toBe(1);
      expect(stable[0].exposures).toBe(10);
    });
  });
});
