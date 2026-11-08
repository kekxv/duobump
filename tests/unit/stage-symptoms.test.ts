import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/lib/content-validation';
import { filterStageSymptoms } from '../../src/lib/stage-symptoms';

const symptom = {
  id: 'nausea',
  title: '恶心、孕吐',
  aliases: ['反胃'],
  stages: ['early', 'middle'],
  category: '饮食与消化',
  description: '可能早晚都恶心。',
  explanation: '每个人的反应不同。',
  care: ['少量多餐'],
  contact: ['无法饮水时及时联系产科'],
  sourceIds: ['source'],
  warningIds: ['vomiting'],
  careLevel: 'self-care',
  reviewStatus: 'source-checked',
  updatedAt: '2026-11-08',
};
const rows = [
  symptom,
  {
    ...symptom,
    id: 'skin',
    title: '皮肤变化',
    aliases: ['痘痘'],
    stages: ['middle', 'late'],
    category: '皮肤与口腔',
  },
  {
    ...symptom,
    id: 'labour',
    title: '规律宫缩',
    aliases: ['肚子发紧'],
    stages: ['late'],
    category: '胎动与临产',
    careLevel: 'contact',
  },
];
const data = (entry: { id: string; [key: string]: unknown }) => ({
  sources: [
    {
      id: 'source',
      title: '原文',
      organization: 'NHS',
      region: '英国',
      url: 'https://www.nhs.uk/',
      checkedAt: '2026-11-08',
    },
  ],
  articles: [],
  warnings: [
    {
      id: 'vomiting',
      sourceIds: ['source'],
      signals: ['呕吐'],
      action: '联系产科',
      possibilities: '需评估',
      uncertainty: '不自行诊断',
      urgency: 'urgent',
      reviewStatus: 'source-checked',
    },
  ],
  stageSymptoms: [entry],
});

describe('stage symptom discovery', () => {
  it('only shows symptoms assigned to the selected stage', () => {
    expect(filterStageSymptoms(rows, { stage: 'early' }).map((x) => x.id)).toEqual(['nausea']);
    expect(filterStageSymptoms(rows, { stage: 'late' }).map((x) => x.id)).toEqual([
      'skin',
      'labour',
    ]);
  });
  it('combines aliases, category and stage without treating other stages as matches', () => {
    expect(
      filterStageSymptoms(rows, { stage: 'middle', query: ' 痘痘 ', category: '皮肤与口腔' }).map(
        (x) => x.id,
      ),
    ).toEqual(['skin']);
    expect(filterStageSymptoms(rows, { stage: 'early', query: '痘痘' })).toEqual([]);
    expect(
      filterStageSymptoms(rows, { stage: 'middle', query: '反胃', category: '皮肤与口腔' }),
    ).toEqual([]);
  });
  it('rejects unknown stages rather than returning every symptom', () => {
    expect(filterStageSymptoms(rows, { stage: 'unknown' })).toEqual([]);
  });
});

describe('stage symptom medical content gate', () => {
  it('permits complete source-checked preview content', () =>
    expect(validateContent(data(symptom))).toEqual([]));
  it.each(['stages', 'care', 'contact', 'sourceIds'])('rejects empty %s', (field) => {
    expect(
      validateContent(data({ ...symptom, [field]: [] })).some((x) => x.file === 'stageSymptoms'),
    ).toBe(true);
  });
  it('rejects an invalid stage, missing description and invalid care level', () => {
    for (const change of [{ stages: ['first'] }, { description: '' }, { careLevel: 'safe' }])
      expect(
        validateContent(data({ ...symptom, ...change })).some((x) => x.file === 'stageSymptoms'),
      ).toBe(true);
  });
  it('rejects dangling warning links and source links', () => {
    expect(
      validateContent(data({ ...symptom, warningIds: ['missing-warning'] })).some((x) =>
        x.message.includes('missing-warning'),
      ),
    ).toBe(true);
    expect(
      validateContent(data({ ...symptom, sourceIds: ['missing-source'] })).some((x) =>
        x.message.includes('missing-source'),
      ),
    ).toBe(true);
  });
  it('keeps unreviewed symptoms out of public release', () => {
    expect(
      validateContent(data(symptom), { release: true }).some(
        (x) => x.file === 'stageSymptoms' && x.message.includes('审核'),
      ),
    ).toBe(true);
  });
});

// Invalid structured data must produce actionable issues rather than crash validation.
it.each([{ stages: 'early' }, { aliases: ['ok', 3] }, { warningIds: 'vomiting' }])(
  'rejects malformed symptom lists: %j',
  (change) => {
    expect(
      validateContent(data({ ...symptom, ...change })).some(
        (issue) => issue.file === 'stageSymptoms',
      ),
    ).toBe(true);
  },
);
