import { expect, test } from '@playwright/test';

test('food detail links domestic evidence and labels traditional material scope', async ({
  page,
}) => {
  await page.goto('./#/food-guide/eggs/');
  await expect(page.locator('.source-panel')).not.toContainText('流产风险翻倍');
  await expect(page.locator('[data-food-context-kind="food-safety"]')).toContainText('熟透');
  await expect(page.locator('[data-food-context-kind="food-safety"] a')).toHaveAttribute(
    'href',
    /4146690/,
  );
  const tcm = page.locator('[data-food-context-kind="tcm"]');
  await expect(tcm).toContainText('一般食养提醒');
  await expect(tcm).toContainText('不是针对某一种食物的研究');
  await page.goto('./#/food-guide/longan/');
  await expect(page.locator('[data-context-id="tcm-longan"]')).toContainText('不能用它判断');
  await expect(page.locator('[data-context-id="tcm-longan"] a')).toHaveAttribute('href', /4919991/);
});

test('domestic dietary source filter includes existing CDC nutrition guidance', async ({
  page,
}) => {
  await page.goto('./#/references/');
  await page.getByRole('button', { name: '中国大陆', exact: true }).click();
  await page.getByRole('button', { name: '饮食与安全', exact: true }).click();
  await page.locator('#reference-search').fill('疾控');
  await expect(page.locator('[data-reference]:visible')).toHaveCount(1);
  await expect(page.locator('[data-reference]:visible .reference-url')).toHaveAttribute(
    'href',
    /cdcp.gd.gov.cn/,
  );
});

test('reference type combines with region and keyword and can reset', async ({ page }) => {
  await page.goto('./#/references/');
  await page.getByRole('button', { name: '中医食养', exact: true }).click();
  await expect(page.locator('[data-reference]:visible')).toHaveCount(3);
  await page.getByRole('button', { name: '中国大陆', exact: true }).click();
  await page.locator('#reference-search').fill('东方医院');
  await expect(page.locator('[data-reference]:visible')).toHaveCount(1);
  await expect(page.locator('[data-reference]:visible')).toContainText('孕妇慎用');
  await page.getByRole('button', { name: '英国资料', exact: true }).click();
  await expect(page.locator('#reference-empty')).toBeVisible();
  await page.locator('#reference-search').fill('');
  await page.getByRole('button', { name: '全部资料', exact: true }).click();
  await page.getByRole('button', { name: '全部类型', exact: true }).click();
  await expect(page.locator('#reference-empty')).toBeHidden();
});

test('almond searches identify the edible nut and separate medicinal kernels on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./#/food-guide/');
  await page.locator('#food-search').fill('杏仁');
  await page.locator('[data-food-card]:visible a').click();
  await expect(page.locator('h1')).toHaveText('巴旦木（扁桃仁）');
  await expect(page.locator('[data-context-id="tcm-almond"]')).toContainText('苦杏仁');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
