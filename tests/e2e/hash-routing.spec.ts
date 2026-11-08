import { test, expect } from '@playwright/test';
import sources from '../../src/data/sources.json' with { type: 'json' };

test('hash routes survive refresh, back/forward and preserve page tools', async ({ page }) => {
  await page.goto('./#/food-guide/');
  await expect(page.locator('h1')).toContainText('每一口');
  await page.locator('#food-search').fill('咖啡');
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('h1')).toContainText('每一口');
  await page.locator('.main-nav').getByRole('link', { name: '待产清单' }).click();
  await expect(page).toHaveURL(/#\/checklist\//);
  await expect(page.locator('h1')).toHaveText('见面之前，一起准备好。');
  await page.goBack({ waitUntil: 'commit' });
  await expect(page.locator('h1')).toContainText('每一口');
  await page.goForward({ waitUntil: 'commit' });
  await expect(page.locator('h1')).toHaveText('见面之前，一起准备好。');
});

test('inspection guide and reference library expose actionable information and original URLs', async ({
  page,
}) => {
  await page.goto('./#/appointments/');
  await expect(page.locator('h1')).toContainText('产检');
  await expect(page.locator('main')).toContainText('NT');
  await expect(page.locator('main')).toContainText('空腹');
  await page.locator('.main-nav').getByRole('link', { name: '参考资料' }).click();
  await expect(page).toHaveURL(/#\/references\//);
  await expect(page.locator('h1')).toContainText('参考资料');
  const first = page.locator('.reference-url').first();
  await expect(first).toHaveText(/^https:\/\//);
  await expect(first).toHaveAttribute('href', /^https:\/\//);
});

test('in-page anchors preserve hash route and missing routes recover', async ({ page }) => {
  await page.goto('./#/overview/early/');
  await page.locator('.toc-link').first().click();
  await expect(page).toHaveURL(/#\/overview\/early\/#/);
  await page.reload();
  await expect(page.locator('h1')).toContainText('小小的开始');
  await page.goto('./#/this-page-does-not-exist/');
  await expect(page.locator('h1')).toContainText('没有找到这个页面');
  await page.locator('main a').first().click();
  await expect(page.locator('h1')).toContainText('一起');
});

test('hash navigation restores checklist storage and search links stay in the static entry', async ({
  page,
}) => {
  await page.goto('./#/checklist/');
  await page.locator('[data-check-id="id-card"]').check();
  await page.locator('[data-location="id-card"]').fill('绿色资料袋');
  await page.locator('[data-location="id-card"]').blur();
  await page.locator('.main-nav').getByRole('link', { name: '一起开始', exact: true }).click();
  await expect(page.locator('h1')).toContainText('一起');
  await page.getByRole('button', { name: '搜索指南' }).click();
  await page.locator('#site-search-input').fill('胎动');
  const result = page.locator('#search-results a').first();
  await expect(result).toHaveAttribute('href', /#\//);
  await result.click();
  await expect(page.locator('.page-content')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(process.env.BASE_PATH || '/');
  await page.locator('.main-nav').getByRole('link', { name: '待产清单' }).click();
  await expect(page.locator('[data-check-id="id-card"]')).toBeChecked();
  await expect(page.locator('[data-location="id-card"]')).toHaveValue('绿色资料袋');
});

test('reference library filters names and topics without hiding source URLs', async ({ page }) => {
  await page.goto('./#/references/');
  await page.getByRole('button', { name: '英国资料', exact: true }).click();
  await page.locator('#reference-search').fill('OGTT');
  await expect(page.locator('[data-reference]:visible')).toHaveCount(1);
  await expect(page.locator('[data-reference]:visible .reference-url')).toHaveText(
    /gestational-diabetes/,
  );
  await page.locator('#reference-search').fill('没有这个资料');
  await expect(page.locator('#reference-empty')).toBeVisible();
  await page.locator('#reference-search').fill('');
  await page.getByRole('button', { name: '全部资料', exact: true }).click();
  await expect(page.locator('[data-reference]:visible')).toHaveCount(sources.length);
  await page.getByRole('button', { name: '中国大陆', exact: true }).click();
  await expect(page.locator('[data-reference]:visible')).toHaveCount(
    sources.filter((s) => s.regionCode === 'CN').length,
  );
  await expect(page.getByRole('button', { name: '中国大陆', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('#reference-search').fill('广东省疾病预防控制中心');
  await expect(page.locator('[data-reference]:visible')).toHaveCount(1);
  await expect(page.locator('[data-reference]:visible .reference-url')).toHaveAttribute(
    'href',
    /cdcp.gov|cdcp.gd.gov.cn/,
  );
  await page.getByRole('button', { name: '英国资料', exact: true }).click();
  await expect(page.locator('#reference-empty')).toBeVisible();
  await page.locator('#reference-search').fill('');
  await expect(page.locator('[data-reference]:visible')).toHaveCount(
    sources.filter((s) => s.regionCode === 'GB').length,
  );
});

test('failed static content loading offers retry and an emergency phone link', async ({ page }) => {
  await page.route('**/appointments/', (route) => route.abort());
  await page.goto('./#/appointments/');
  await expect(page.locator('h1')).toHaveText('页面暂时无法加载');
  await expect(page.getByRole('link', { name: '拨打 120' })).toHaveAttribute('href', 'tel:120');
  await page.unroute('**/appointments/');
  await page.getByRole('button', { name: '重新加载' }).click();
  await expect(page.locator('h1')).toContainText('产检');
});

test('skip link moves keyboard focus into the hash-routed main content', async ({ page }) => {
  await page.goto('./#/appointments/');
  await expect(page.locator('.page-content')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.appointment-jumps a').first()).toBeFocused();
});

test('Markdown preparation links keep the repository base path', async ({ page }) => {
  await page.goto('./#/overview/early/');
  const link = page
    .locator('.article-body')
    .getByRole('link', { name: '打开产检与检查前准备清单' });
  await expect(link).toHaveAttribute('href', `${process.env.BASE_PATH || '/'}#/appointments/`);
  await link.click();
  await expect(page.locator('h1')).toContainText('产检');
  expect(new URL(page.url()).pathname).toBe(process.env.BASE_PATH || '/');
});
