import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface PackageJsonShape {
  scripts?: Record<string, string>;
}

const ACTIVE_NEW_CLADE_ENCOUNTER_RESTRAINT_SCRIPTS = [
  'study:clade-activity-relabel-null-new-clade-encounter-restraint-smoke',
  'study:clade-activity-relabel-null-new-clade-encounter-restraint-horizon',
  'study:clade-activity-relabel-null-new-clade-encounter-restraint-review'
] as const;

const ARCHIVED_NEW_CLADE_ENCOUNTER_RESTRAINT_SCRIPTS = {
  'archive:clade-activity-relabel-null-new-clade-encounter-restraint-smoke':
    'tsx src/clade-activity-relabel-null-new-clade-encounter-restraint-smoke-study.ts',
  'archive:clade-activity-relabel-null-new-clade-encounter-restraint-horizon':
    'tsx src/clade-activity-relabel-null-new-clade-encounter-restraint-horizon-study.ts',
  'archive:clade-activity-relabel-null-new-clade-encounter-restraint-review':
    'tsx src/clade-activity-relabel-null-new-clade-encounter-restraint-review.ts'
} as const;

describe('package study surface', () => {
  it('archives pruned new-clade encounter-restraint scripts outside the active study surface', () => {
    const packageJsonPath = resolve(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonShape;
    const scripts = packageJson.scripts ?? {};

    for (const scriptName of ACTIVE_NEW_CLADE_ENCOUNTER_RESTRAINT_SCRIPTS) {
      expect(scripts).not.toHaveProperty(scriptName);
    }

    expect(
      Object.keys(scripts).filter(
        (scriptName) =>
          scriptName.startsWith('study:') && scriptName.includes('new-clade-encounter-restraint')
      )
    ).toEqual([]);

    for (const [scriptName, command] of Object.entries(
      ARCHIVED_NEW_CLADE_ENCOUNTER_RESTRAINT_SCRIPTS
    )) {
      expect(scripts[scriptName]).toBe(command);
    }
  });
});
