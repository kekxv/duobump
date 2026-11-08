import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/lib/content-validation';
const source = {
  id: 'nhs-food',
  title: 'Foods to avoid',
  organization: 'NHS',
  url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/',
  region: '英国',
  checkedAt: '2026-11-07',
};
const article = {
  id: 'emergency',
  title: '紧急就医',
  sourceIds: ['nhs-food'],
  updatedAt: '2026-11-07',
  reviewStatus: 'source-checked',
};
describe('content publication gates', () => {
  it('blocks a draft in the rendered dataset instead of silently indexing it', () => {
    expect(
      validateContent({
        sources: [source],
        articles: [{ ...article, reviewStatus: 'draft' }],
      }).some((issue) => issue.message.includes('草稿')),
    ).toBe(true);
  });
  it('rejects missing source references', () =>
    expect(
      validateContent({
        sources: [source],
        articles: [{ ...article, sourceIds: ['missing'] }],
      }).some((x) => x.message.includes('missing')),
    ).toBe(true));
  it('rejects duplicate ids', () =>
    expect(validateContent({ sources: [source, source], articles: [] }).length).toBeGreaterThan(0));
  it('rejects malformed dates', () =>
    expect(
      validateContent({ sources: [{ ...source, checkedAt: '2026-02-30' }], articles: [] }).length,
    ).toBeGreaterThan(0));
  it('permits source-checked local preview but blocks public release', () => {
    expect(validateContent({ sources: [source], articles: [article] })).toEqual([]);
    expect(
      validateContent({ sources: [source], articles: [article] }, { release: true }).some((x) =>
        x.message.includes('审核'),
      ),
    ).toBe(true);
  });
  it('rejects an invented clinician review with missing metadata', () =>
    expect(
      validateContent(
        { sources: [source], articles: [{ ...article, reviewStatus: 'clinician-reviewed' }] },
        { release: true },
      ).length,
    ).toBeGreaterThan(0));
  it('also blocks unreviewed food and recipe publication', () => {
    const reviewed = {
      ...article,
      reviewStatus: 'clinician-reviewed',
      reviewer: 'Actual clinician supplied by owner',
      reviewedAt: '2026-11-07',
    };
    const issues = validateContent(
      {
        sources: [source],
        articles: [reviewed],
        recipes: [{ id: 'menu', sourceIds: ['nhs-food'], reviewStatus: 'source-checked' }],
      },
      { release: true },
    );
    expect(issues.some((x) => x.file === 'recipes' && x.message.includes('审核'))).toBe(true);
  });
});

describe('appointment content', () => {
  const appointment = {
    id: 'visit',
    stage: 'early',
    title: '首次就诊',
    purpose: '建立计划',
    kind: '临床评估',
    how: '病史与检查',
    limitations: '不替代后续随访',
    followUp: '按计划复诊',
    prepare: ['带报告'],
    questions: ['何时复查？'],
    sourceIds: ['nhs-food'],
    reviewStatus: 'source-checked',
    updatedAt: '2026-11-08',
  };
  it('rejects incomplete preparation guidance', () => {
    expect(
      validateContent({
        sources: [source],
        articles: [],
        appointments: [{ ...appointment, prepare: [] }],
      }).some((issue) => issue.file === 'appointments'),
    ).toBe(true);
  });
  it('permits preview and requires genuine review for release', () => {
    const data = { sources: [source], articles: [], appointments: [appointment] };
    expect(validateContent(data)).toEqual([]);
    expect(
      validateContent(data, { release: true }).some(
        (issue) => issue.file === 'appointments' && issue.message.includes('审核'),
      ),
    ).toBe(true);
  });
});
