import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/lib/content-validation';
const source = {
  id: 'study',
  title: 'Primary study',
  organization: 'Authors / journal',
  region: '中国大陆',
  url: 'https://example.org/study',
  checkedAt: '2026-11-08',
};
const evidence = {
  id: 'risk',
  title: 'Bleeding',
  conception: 'assisted',
  population: 'HRT-FET positive pregnancy tests',
  design: 'prospective cohort',
  country: '丹麦',
  dataPeriod: '2020–2022',
  timeframe: '妊娠试验阳性至孕8周前',
  sampleSize: 320,
  outcome: '出血或点滴出血',
  results: [{ type: 'fraction', label: '出血', numerator: 149, denominator: 320 }],
  effects: [],
  interpretation: 'Observed frequency, not individual risk',
  limitations: 'Self-reported; excludes other protocols',
  sourceLocator: 'Abstract / Main results',
  sourceIds: ['study'],
  updatedAt: '2026-11-08',
  reviewStatus: 'source-checked',
};
const run = (item: object, release = false) =>
  validateContent(
    { sources: [source], articles: [], riskEvidence: [{ ...evidence, ...item }] },
    { release },
  );
describe('probability evidence publication guard', () => {
  it('rejects a fraction without a denominator', () =>
    expect(
      run({ results: [{ type: 'fraction', label: '出血', numerator: 149 }] }).some((x) =>
        x.message.includes('分母'),
      ),
    ).toBe(true));
  it('rejects impossible counts and zero denominators', () => {
    for (const [numerator, denominator] of [
      [321, 320],
      [1, 0],
      [-1, 320],
      [0.5, 320],
    ])
      expect(
        run({ results: [{ type: 'fraction', label: '出血', numerator, denominator }] }).length,
      ).toBeGreaterThan(0);
  });
  it('rejects unsupported percentage result types', () =>
    expect(run({ results: [{ type: 'HR', label: 'risk', percent: 89 }] }).length).toBeGreaterThan(
      0,
    ));
  it('requires population, time window and limitations to accompany numbers', () => {
    for (const field of ['population', 'dataPeriod', 'timeframe', 'limitations', 'sourceLocator'])
      expect(run({ [field]: '' }).length).toBeGreaterThan(0);
  });
  it('requires the metric type and ordered confidence interval for effects', () => {
    expect(
      run({ effects: [{ type: 'percent', value: 2.72, low: 2.1, high: 3.53, label: 'risk' }] })
        .length,
    ).toBeGreaterThan(0);
    expect(
      run({ effects: [{ type: 'HR', value: 2.72, low: 3.53, high: 2.1, label: 'risk' }] }).length,
    ).toBeGreaterThan(0);
  });
  it('retains source integrity and actual clinical review release gates', () => {
    expect(run({ sourceIds: ['absent'] }).some((x) => x.message.includes('absent'))).toBe(true);
    expect(run({})).toEqual([]);
    expect(run({}, true).some((x) => x.message.includes('审核'))).toBe(true);
  });
  it('rejects appointments lacking explanation or limits', () => {
    const issues = validateContent({
      sources: [source],
      articles: [],
      appointments: [
        {
          id: 'check',
          title: 'NT',
          stage: 'early',
          purpose: 'Screening',
          prepare: ['Report'],
          questions: ['Next?'],
          sourceIds: ['study'],
          reviewStatus: 'source-checked',
          updatedAt: '2026-11-08',
        },
      ],
    });
    expect(issues.some((x) => x.message.includes('科普'))).toBe(true);
  });
});
