import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/lib/content-validation';

const source = {
  id: 'cn-food',
  title: '饮食科普',
  organization: '医院',
  region: '中国大陆',
  url: 'https://example.gov.cn/food',
  checkedAt: '2026-11-08',
};
const food = {
  id: 'longan',
  preparations: [{ conditions: '适量', reason: '搭配', sourceIds: ['cn-food'] }],
};
const context = {
  id: 'tcm-longan',
  kind: 'tcm',
  scope: 'food-specific',
  foodIds: ['longan'],
  title: '食养说明',
  note: '原文内容',
  limitation: '非孕期安全性研究',
  sourceLocator: '药性段落',
  sourceIds: ['cn-food'],
  reviewStatus: 'source-checked',
  updatedAt: '2026-11-08',
};
const check = (entry: { id: string; [key: string]: unknown }, release = false) =>
  validateContent(
    { sources: [source], articles: [], foods: [food], foodContexts: [entry] },
    { release },
  );

describe('food context evidence boundaries', () => {
  it('accepts a scoped source-checked context in preview', () =>
    expect(check(context)).toEqual([]));
  it.each(['kind', 'scope', 'note', 'limitation', 'sourceLocator', 'reviewStatus'])(
    'rejects missing %s',
    (field) => {
      expect(
        check({ ...context, [field]: '' }).some((issue) => issue.file === 'foodContexts'),
      ).toBe(true);
    },
  );
  it('rejects an unknown food instead of silently dropping its evidence', () => {
    expect(
      check({ ...context, foodIds: ['missing-food'] }).some((issue) =>
        issue.message.includes('missing-food'),
      ),
    ).toBe(true);
  });
  it('requires an actual source link', () => {
    expect(
      check({ ...context, sourceIds: [] }).some((issue) => issue.file === 'foodContexts'),
    ).toBe(true);
    expect(
      check({ ...context, sourceIds: ['missing-source'] }).some((issue) =>
        issue.message.includes('missing-source'),
      ),
    ).toBe(true);
  });
  it('rejects risk overrides in traditional food context', () => {
    expect(
      check({ ...context, risk: 'avoid' }).some((issue) => issue.file === 'foodContexts'),
    ).toBe(true);
  });
  it('requires clinical review of context before public release', () => {
    expect(
      check(context, true).some(
        (issue) => issue.file === 'foodContexts' && issue.message.includes('审核'),
      ),
    ).toBe(true);
  });
});
