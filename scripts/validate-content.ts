import { readFile, readdir } from 'node:fs/promises';
import { parse } from 'yaml';
import { validateContent } from '../src/lib/content-validation';
const root = new URL('../', import.meta.url);
const json = async (name: string) =>
  JSON.parse(await readFile(new URL(`src/data/${name}.json`, root), 'utf8'));
const guideDir = new URL('src/content/guides/', root);
const files = (await readdir(guideDir)).filter((f) => f.endsWith('.md'));
const articles = await Promise.all(
  files.map(async (file) => {
    const text = await readFile(new URL(file, guideDir), 'utf8');
    return { id: file.replace(/\.md$/, ''), ...parse(text.split('---')[1]) };
  }),
);
const data = {
  sources: await json('sources'),
  articles,
  foods: await json('foods'),
  foodContexts: await json('food-contexts'),
  checklist: await json('checklist'),
  recipes: await json('recipes'),
  milestones: await json('milestones'),
  appointments: await json('appointments'),
  riskEvidence: await json('risk-evidence'),
  warnings: await json('warning-signs'),
  stageSymptoms: await json('stage-symptoms'),
};
const release = process.argv.includes('--release') || process.env.PUBLIC_RELEASE === 'true';
const issues = validateContent(data, { release });
if (issues.length) {
  console.error(issues.map((x) => `${x.file}/${x.id}: ${x.message}`).join('\n'));
  process.exit(1);
}
console.log(
  `Content valid: ${articles.length} articles, ${data.foods.length} foods, ${data.checklist.length} checklist items, ${data.recipes.length} menus. ${process.argv.includes('--release') ? 'Release review passed.' : 'Preview only; public release requires clinician review.'}`,
);
