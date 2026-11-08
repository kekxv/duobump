import { dayNumber } from './pregnancy';
type RecordItem = { id: string; [key: string]: any };
type Dataset = {
  sources: RecordItem[];
  articles: RecordItem[];
  foods?: RecordItem[];
  foodContexts?: RecordItem[];
  checklist?: RecordItem[];
  recipes?: RecordItem[];
  milestones?: RecordItem[];
  appointments?: RecordItem[];
  riskEvidence?: RecordItem[];
  warnings?: RecordItem[];
  stageSymptoms?: RecordItem[];
};
export type ValidationIssue = { file: string; id: string; message: string };
export function validateContent(
  data: Dataset,
  options: { release?: boolean } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (file: string, id: string, message: string) => issues.push({ file, id, message });
  const sources = new Set(data.sources.map((s) => s.id));
  for (const [file, items] of Object.entries(data)) {
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) add(file, item.id, '重复 ID');
      ids.add(item.id);
      if (item.reviewStatus === 'draft')
        add(file, item.id, '草稿不可进入可构建数据集；请移出发布目录后再构建');
      for (const field of ['checkedAt', 'updatedAt', 'reviewedAt', 'publishedAt'])
        if (item[field] && dayNumber(item[field]) === null) add(file, item.id, `${field} 日期无效`);
      if (
        file === 'sources' &&
        (!item.title ||
          !item.organization ||
          !item.region ||
          !item.checkedAt ||
          !/^https:\/\//.test(item.url || ''))
      )
        add(file, item.id, '来源字段不完整');
      const refs = [
        ...(item.sourceIds || []),
        ...(item.preparations || []).flatMap((p: any) => p.sourceIds || []),
      ];
      for (const id of refs) if (!sources.has(id)) add(file, item.id, `来源不存在: ${id}`);
      if (
        file === 'articles' &&
        (!item.sourceIds?.length ||
          !['draft', 'source-checked', 'clinician-reviewed'].includes(item.reviewStatus))
      )
        add(file, item.id, '正文缺少来源或审核状态');
      if (item.reviewStatus === 'clinician-reviewed' && (!item.reviewer || !item.reviewedAt))
        add(file, item.id, '专业审核缺少真实审核人或日期');
      if (
        options.release &&
        [
          'articles',
          'foods',
          'foodContexts',
          'recipes',
          'milestones',
          'appointments',
          'riskEvidence',
          'warnings',
          'stageSymptoms',
        ].includes(file) &&
        item.reviewStatus !== 'clinician-reviewed'
      )
        add(file, item.id, '公开发布前需要专业审核');
      if (
        file === 'appointments' &&
        (!item.sourceIds?.length ||
          !item.title ||
          !item.purpose ||
          !item.prepare?.length ||
          !item.questions?.length ||
          !['early', 'middle', 'late', 'all'].includes(item.stage))
      )
        add(file, item.id, '产检条目缺少阶段、目的、准备、问题或来源');
      if (
        file === 'appointments' &&
        (!item.kind || !item.how || !item.limitations || !item.followUp)
      )
        add(file, item.id, '检查科普缺少类别、原理、局限或后续路径');
      if (file === 'riskEvidence') {
        const required = [
          'title',
          'population',
          'design',
          'country',
          'dataPeriod',
          'timeframe',
          'outcome',
          'interpretation',
          'limitations',
          'sourceLocator',
        ];
        if (
          required.some((key) => typeof item[key] !== 'string' || !item[key].trim()) ||
          !item.sourceIds?.length ||
          !['natural', 'assisted', 'clinical'].includes(item.conception) ||
          !Number.isInteger(item.sampleSize) ||
          item.sampleSize <= 0
        )
          add(file, item.id, '概率条目缺少人群、样本量、观察窗口、局限或原文定位');
        if (!Array.isArray(item.results) || !item.results.length)
          add(file, item.id, '概率条目缺少结果和分母');
        for (const result of Array.isArray(item.results) ? item.results : []) {
          if (
            result.type !== 'fraction' ||
            !result.label ||
            !Number.isInteger(result.numerator) ||
            !Number.isInteger(result.denominator) ||
            result.denominator <= 0 ||
            result.numerator < 0 ||
            result.numerator > result.denominator ||
            result.denominator > item.sampleSize
          )
            add(file, item.id, '概率结果类型或分子分母无效');
        }
        if (!Array.isArray(item.effects)) add(file, item.id, '效应量列表缺失');
        for (const effect of Array.isArray(item.effects) ? item.effects : []) {
          if (
            !['OR', 'adjusted-OR', 'HR'].includes(effect.type) ||
            !effect.label ||
            ![effect.value, effect.low, effect.high].every((n) => Number.isFinite(n) && n > 0) ||
            effect.low > effect.value ||
            effect.value > effect.high
          )
            add(file, item.id, '效应量类型或置信区间无效；OR/HR 不能作为百分比');
        }
      }
      if (
        ['warnings', 'riskEvidence', 'stageSymptoms'].includes(file) &&
        !['source-checked', 'clinician-reviewed'].includes(item.reviewStatus)
      )
        add(file, item.id, '医学条目缺少来源核查或专业审核状态');
      if (file === 'stageSymptoms') {
        const strings = ['title', 'category', 'description', 'explanation', 'updatedAt'];
        const lists = ['stages', 'care', 'contact', 'sourceIds'];
        if (
          strings.some((key) => typeof item[key] !== 'string' || !item[key].trim()) ||
          lists.some(
            (key) =>
              !Array.isArray(item[key]) ||
              !item[key].length ||
              item[key].some((value: unknown) => typeof value !== 'string' || !value.trim()),
          ) ||
          ['aliases', 'warningIds'].some(
            (key) =>
              !Array.isArray(item[key]) ||
              item[key].some((value: unknown) => typeof value !== 'string' || !value.trim()),
          ) ||
          !['self-care', 'contact'].includes(item.careLevel) ||
          (item.stages || []).some((stage: string) => !['early', 'middle', 'late'].includes(stage))
        )
          add(file, item.id, '阶段状况缺少表现、照护、就医时机、有效阶段或来源');
        for (const id of Array.isArray(item.warningIds) ? item.warningIds : [])
          if (!data.warnings?.some((warning) => warning.id === id))
            add(file, item.id, `异常信号不存在: ${id}`);
      }
      if (
        file === 'warnings' &&
        (!item.sourceIds?.length ||
          !item.signals?.length ||
          !item.action ||
          !item.possibilities ||
          !item.uncertainty ||
          !['urgent', 'emergency'].includes(item.urgency))
      )
        add(file, item.id, '异常信号缺少症状、行动、可能原因、概率边界或来源');
      if (file === 'foodContexts') {
        if (
          !['nutrition', 'food-safety', 'tcm', 'identity'].includes(item.kind) ||
          !['food-specific', 'food-group', 'general-use'].includes(item.scope) ||
          ['title', 'note', 'limitation', 'sourceLocator'].some(
            (key) => typeof item[key] !== 'string' || !item[key].trim(),
          ) ||
          !item.sourceIds?.length ||
          !item.foodIds?.length ||
          !['source-checked', 'clinician-reviewed'].includes(item.reviewStatus)
        )
          add(file, item.id, '食物参考缺少类型、范围、说明、局限、原文定位、关联食物或审核状态');
        for (const id of item.foodIds || [])
          if (!data.foods?.some((food) => food.id === id)) add(file, item.id, `食物不存在: ${id}`);
        if ('risk' in item) add(file, item.id, '补充参考不能覆盖食物制备风险分级');
      }
      if (
        file === 'foods' &&
        (!item.preparations?.length ||
          item.preparations.some((p: any) => !p.conditions || !p.reason || !p.sourceIds?.length))
      )
        add(file, item.id, '食物缺少条件、原因或出处');
    }
  }
  return issues;
}
