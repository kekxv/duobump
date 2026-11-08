import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import symptoms from '../../src/data/stage-symptoms.json' with { type: 'json' };

const countFor = (stage: string) => symptoms.filter((s) => s.stages.includes(stage)).length;

test('stage overview links to searchable changes and supports hash refresh', async ({ page }) => {
  await page.goto('./#/overview/');
  await page.getByRole('link', { name: '了解孕早期的身体变化' }).click();
  await expect(page).toHaveURL(/#\/overview\/early\/#stage-symptoms$/);
  await expect(page.locator('#stage-symptoms')).toBeInViewport();
  await expect(page.locator('[data-symptom]:visible')).toHaveCount(countFor('early'));
  await expect(page.locator('[data-symptom="first-movement"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#stage-symptoms')).toBeInViewport();
  await page.locator('[data-symptom-stage="late"]').click();
  await expect(page).toHaveURL(/#\/overview\/late\/#stage-symptoms$/);
  await expect(page.locator('[data-symptom]:visible')).toHaveCount(countFor('late'));
  await expect(page.locator('[data-symptom="colostrum"]')).toBeVisible();
});

test('symptom search combines aliases and category and keeps urgent help visible', async ({
  page,
}) => {
  await page.goto('./#/overview/middle/#stage-symptoms');
  const search = page.getByRole('searchbox', { name: '搜索本阶段状况' });
  await search.fill('反胃');
  await expect(page.locator('[data-symptom]:visible')).toHaveCount(1);
  await expect(page.locator('[data-symptom]:visible')).toContainText('恶心、孕吐');
  await page.getByRole('button', { name: '皮肤与口腔', exact: true }).click();
  await expect(page.locator('#symptom-empty')).toBeVisible();
  await expect(page.locator('#symptom-urgent')).toBeVisible();
  await expect(page.locator('#symptom-urgent a[href="tel:120"]')).toBeVisible();
  await search.fill('痘痘');
  await expect(page.locator('[data-symptom]:visible')).toHaveCount(1);
  await page.getByRole('button', { name: '清除状况筛选', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(page.locator('[data-symptom]:visible')).toHaveCount(countFor('middle'));
});

test('symptom details work by keyboard and show care, escalation and original sources', async ({
  page,
}) => {
  await page.goto('./#/overview/early/#stage-symptoms');
  await page.getByRole('searchbox', { name: '搜索本阶段状况' }).fill('鼻血');
  const card = page.locator('[data-symptom="nosebleed"]');
  await card.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('open', '');
  await expect(card).toContainText('可以怎样照顾自己');
  await expect(card).toContainText('什么时候联系医生');
  await expect(card).toContainText('不仰头');
  await expect(card.locator('.symptom-sources a[href*="wjw.beijing.gov.cn"]')).toBeVisible();
  await expect(card.locator('.symptom-sources a').first()).toHaveAttribute('rel', /noopener/);
  await page.getByRole('searchbox', { name: '搜索本阶段状况' }).fill('流血');
  const bleeding = page.locator('[data-symptom="bleeding"]');
  await bleeding.locator('summary').click();
  await bleeding.getByRole('link', { name: '阴道出血或血性分泌物', exact: true }).click();
  await expect(page).toHaveURL(/#\/emergency\/#warning-bleeding$/);
  await expect(page.locator('#warning-bleeding')).toBeInViewport();
});

test('stage changes remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: test.info().project.use.baseURL,
  });
  const page = await context.newPage();
  await page.goto('./overview/late/');
  await expect(page.locator('[data-symptom]')).toHaveCount(countFor('late'));
  const card = page.locator('[data-symptom="waters"]');
  await card.locator('summary').click();
  await expect(card).toContainText('立即联系产科');
  await expect(card.locator('.symptom-contact')).toBeVisible();
  await expect(page.locator('#symptom-urgent')).toBeVisible();
  await context.close();
});

test('stage symptom controls fit narrow screens and have no serious accessibility defects', async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./#/overview/late/#stage-symptoms');
    await expect(page.locator('#stage-symptoms')).toBeVisible();
    await page.locator('[data-symptom="waters"] summary').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => ['critical', 'serious'].includes(v.impact || '')),
  ).toEqual([]);
});
