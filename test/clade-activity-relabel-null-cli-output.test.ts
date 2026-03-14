import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCladeActivityRelabelNullLineageCrowdingSmokeStudyCli } from '../src/clade-activity-relabel-null-lineage-crowding-smoke-study';
import { runCladeActivityRelabelNullRegressionDiagnosticsStudyCli } from '../src/clade-activity-relabel-null-regression-diagnostics-study';
import { runCladeActivityRelabelNullStudyCli } from '../src/clade-activity-relabel-null-study';
import {
  runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudyCli
} from '../src/clade-activity-relabel-null-adaptive-clade-habitat-memory-horizon-study';
import {
  runCladeActivityRelabelNullDisturbanceOpeningHorizonStudyCli
} from '../src/clade-activity-relabel-null-disturbance-opening-horizon-study';
import {
  runCladeActivityRelabelNullNewCladeEncounterRestraintReviewCli
} from '../src/clade-activity-relabel-null-new-clade-encounter-restraint-review';

describe('relabel-null CLI output', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes a smoke study output to --output', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const expected = {
      generatedAt,
      label: 'lineage-crowding-smoke'
    };

    expectCliOutputFile(generatedAt, expected, (outputPath, cliGeneratedAt) => {
      runCladeActivityRelabelNullLineageCrowdingSmokeStudyCli(
        ['--generated-at', cliGeneratedAt, '--output', outputPath],
        {
          runStudy: ({ generatedAt: stubGeneratedAt }) => ({
            generatedAt: stubGeneratedAt,
            label: 'lineage-crowding-smoke'
          })
        }
      );
    });
  });

  it('writes the base study output to --output', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const expected = {
      generatedAt,
      label: 'relabel-null-study'
    };

    expectCliOutputFile(generatedAt, expected, (outputPath, cliGeneratedAt) => {
      runCladeActivityRelabelNullStudyCli(['--generated-at', cliGeneratedAt, '--output', outputPath], {
        runStudy: ({ generatedAt: stubGeneratedAt }) => ({
          generatedAt: stubGeneratedAt,
          label: 'relabel-null-study'
        })
      });
    });
  });

  it('writes regression diagnostics output to --output', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const expected = {
      generatedAt,
      label: 'regression-diagnostics'
    };

    expectCliOutputFile(generatedAt, expected, (outputPath, cliGeneratedAt) => {
      runCladeActivityRelabelNullRegressionDiagnosticsStudyCli(
        ['--generated-at', cliGeneratedAt, '--output', outputPath],
        {
          runStudy: ({ generatedAt: stubGeneratedAt }) => ({
            generatedAt: stubGeneratedAt,
            label: 'regression-diagnostics'
          })
        }
      );
    });
  });

  it('writes adaptive clade habitat memory horizon output to --output', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const expected = {
      generatedAt,
      label: 'adaptive-clade-habitat-memory-horizon'
    };

    expectCliOutputFile(generatedAt, expected, (outputPath, cliGeneratedAt) => {
      runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudyCli(
        ['--generated-at', cliGeneratedAt, '--output', outputPath],
        {
          runStudy: ({ generatedAt: stubGeneratedAt }) => ({
            generatedAt: stubGeneratedAt,
            label: 'adaptive-clade-habitat-memory-horizon'
          })
        }
      );
    });
  });

  it('writes disturbance opening horizon output to --output', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const expected = {
      generatedAt,
      label: 'disturbance-opening-horizon'
    };

    expectCliOutputFile(generatedAt, expected, (outputPath, cliGeneratedAt) => {
      runCladeActivityRelabelNullDisturbanceOpeningHorizonStudyCli(
        ['--generated-at', cliGeneratedAt, '--output', outputPath],
        {
          runStudy: ({ generatedAt: stubGeneratedAt }) => ({
            generatedAt: stubGeneratedAt,
            label: 'disturbance-opening-horizon'
          })
        }
      );
    });
  });

  it('writes archived encounter-restraint review output to --output', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const expected = {
      generatedAt,
      label: 'new-clade-encounter-restraint-review'
    };

    expectCliOutputFile(generatedAt, expected, (outputPath, cliGeneratedAt) => {
      runCladeActivityRelabelNullNewCladeEncounterRestraintReviewCli(
        ['--generated-at', cliGeneratedAt, '--output', outputPath],
        {
          runReview: ({ generatedAt: stubGeneratedAt }) => ({
            generatedAt: stubGeneratedAt,
            label: 'new-clade-encounter-restraint-review'
          })
        }
      );
    });
  });
});

function expectCliOutputFile(
  generatedAt: string,
  expected: Record<string, unknown>,
  invoke: (outputPath: string, generatedAt: string) => void
): void {
  const tempDir = mkdtempSync(join(tmpdir(), 'alife-cli-output-'));
  const outputPath = join(tempDir, 'study.json');
  const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

  try {
    invoke(outputPath, generatedAt);

    expect(stdoutWrite).not.toHaveBeenCalled();
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toEqual(expected);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
