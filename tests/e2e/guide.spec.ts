import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('an invalid replacement date clears earlier personalized tasks', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '设置我的孕周', exact: true }).click();
  const day = new Date();
  day.setDate(day.getDate() - 140);
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  await page.locator('#lmp-date').fill(date);
  await page.getByRole('button', { name: '查看我的孕周', exact: true }).click();
  await expect(page.locator('#personal-tasks a')).not.toHaveCount(0);
  await page.locator('#due-date').fill('2199-01-01');
  await page.getByRole('button', { name: '查看我的孕周', exact: true }).click();
  await expect(page.locator('#pregnancy-result')).toContainText('超出');
  await expect(page.locator('#header-week')).toHaveText('设置我的孕周');
  await expect(page.locator('#personal-tasks a')).toHaveCount(0);
});

test('remember opt-out warns if the browser refuses to delete the stored date', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: '设置我的孕周', exact: true }).click();
  const day = new Date();
  day.setDate(day.getDate() - 140);
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  await page.locator('#lmp-date').fill(date);
  await page.locator('#remember-pregnancy').check();
  await page.getByRole('button', { name: '查看我的孕周', exact: true }).click();
  await page.evaluate(() => {
    Storage.prototype.removeItem = () => {
      throw Error('refused');
    };
  });
  await page.locator('#remember-pregnancy').click();
  await expect(page.locator('#pregnancy-result')).toContainText('未能删除');
  await expect(page.locator('#remember-pregnancy')).toBeChecked();
});

test('printed emergency guide retains original source references', async ({ page }) => {
  await page.goto('./emergency/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.source-panel')).toBeVisible();
  await expect(page.locator('.source-panel a').first()).toHaveAttribute(
    'href',
    /^https:\/\/www.nhs.uk\//,
  );
});

test('reopening a sleeping pregnancy tool recalculates the new local day', async ({ browser }) => {
  const context = await browser.newContext({
    timezoneId: 'Asia/Shanghai',
    baseURL: test.info().project.use.baseURL,
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-11-07T15:59:50Z') });
  await page.goto('./');
  await page.getByRole('button', { name: '设置我的孕周', exact: true }).click();
  await page.locator('#lmp-date').fill('2026-05-01');
  await page.getByRole('button', { name: '查看我的孕周', exact: true }).click();
  await expect(page.locator('#header-week')).toHaveText('27 周 + 1 天');
  await page.getByRole('button', { name: '关闭孕周工具' }).click();
  await page.clock.fastForward(20000);
  await page.locator('[data-open-pregnancy]').first().click();
  await expect(page.locator('#header-week')).toHaveText('27 周 + 2 天');
  await context.close();
});

test('homepage has working navigation and stage selection', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '一起，把期待变成安心。' })).toBeVisible();
  await page.getByRole('tab', { name: '孕晚期' }).click();
  await expect(page.locator('#stage-summary')).toContainText('28 周起');
  await page.getByRole('link', { name: '打开食物速查' }).click();
  await expect(page.getByRole('heading', { name: '每一口，都更安心。' })).toBeVisible();
});
test('six content modules are readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of [
    'overview/',
    'for-dad/',
    'for-mom/',
    'food-guide/',
    'recipes/',
    'emergency/',
  ]) {
    await page.goto(`${test.info().project.use.baseURL || 'http://127.0.0.1:4321/'}${path}`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: '紧急就医', exact: true }).first()).toBeVisible();
  }
  await context.close();
});
test('pregnancy calculator validates and only remembers when opted in', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '设置我的孕周', exact: true }).click();
  await page
    .locator('#lmp-date')
    .fill('2026-02-30')
    .catch(() => {});
  const now = new Date();
  now.setDate(now.getDate() - 140);
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  await page.locator('#lmp-date').fill(date);
  await page.getByRole('button', { name: '查看我的孕周', exact: true }).click();
  await expect(page.locator('#pregnancy-result')).toContainText('20 周');
  expect(await page.evaluate(() => localStorage.getItem('duobump:pregnancy:v1'))).toBeNull();
  await page.locator('#remember-pregnancy').check();
  await page.getByRole('button', { name: '查看我的孕周', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('duobump:pregnancy:v1'))).not.toBeNull();
  await page.reload();
  await expect(page.locator('#header-week')).toContainText('20 周');
  await page.locator('[data-open-pregnancy]').first().click();
  await page.getByRole('button', { name: '清除孕周设置' }).click();
  expect(await page.evaluate(() => localStorage.getItem('duobump:pregnancy:v1'))).toBeNull();
});
test('food search supports aliases, risk filters, details and no results', async ({ page }) => {
  await page.goto('./food-guide/');
  const input = page.getByRole('searchbox', { name: '搜索食物' });
  await input.fill('coffee');
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(1);
  await expect(page.locator('[data-food-card]:visible')).toContainText('咖啡');
  await input.fill('三文鱼');
  await page.getByRole('button', { name: '建议避免', exact: true }).click();
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(1);
  await page.locator('[data-food-card]:visible a').click();
  await expect(page.locator('main')).toContainText('充分熟制');
  await expect(page.locator('main')).toContainText('刺身');
  await page.goto('./food-guide/');
  await input.fill('不存在的食物');
  await expect(page.locator('#food-empty')).toBeVisible();
  await page.getByRole('button', { name: '清除筛选' }).click();
  await expect(page.locator('[data-food-card]:visible')).toHaveCount(60);
});
test('checklist restores status, locations and resets independently', async ({ page }) => {
  await page.goto('./checklist/');
  await page.locator('[data-check-id="id-card"]').check();
  await page.locator('[data-location="id-card"]').fill('蓝色文件袋');
  await page.locator('[data-location="id-card"]').blur();
  await page.reload();
  await expect(page.locator('[data-check-id="id-card"]')).toBeChecked();
  await expect(page.locator('[data-location="id-card"]')).toHaveValue('蓝色文件袋');
  await page.evaluate(() => localStorage.setItem('duobump:pregnancy:v1', 'other-setting'));
  await page.getByRole('button', { name: '重置清单' }).click();
  await page.getByRole('button', { name: '确认重置' }).click();
  await expect(page.locator('[data-check-id="id-card"]')).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('duobump:pregnancy:v1'))).toBe(
    'other-setting',
  );
});
test('blocked storage keeps checklist usable', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw Error('blocked');
      },
    }),
  );
  await page.goto('./checklist/');
  await page.locator('[data-check-id="id-card"]').check();
  await expect(page.locator('#checklist-status')).toContainText('本次会话');
  await expect(page.locator('[data-check-id="id-card"]')).toBeChecked();
});
test('site search loads its local index and restores focus', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '搜索指南' }).click();
  await page.locator('#site-search-input').fill('咖啡');
  await expect(page.locator('#search-results a').first()).toBeVisible({ timeout: 15000 });
  await page.locator('#site-search-input').fill('破水');
  await expect(page.locator('#search-results')).toContainText('就医', { timeout: 15000 });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '搜索指南' })).toBeFocused();
});
test('mobile navigation and layouts remain usable', async ({ page }) => {
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    await expect(page.locator('html[data-hash-route] .page-content')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width < 1024) {
      await page.getByRole('button', { name: '打开导航' }).click();
      await expect(page.locator('.sidebar')).toBeVisible();
      await page.getByRole('button', { name: '关闭导航' }).click();
    }
  }
});
test('closed mobile navigation is not keyboard focusable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page.locator('#sidebar')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: '打开导航' }).click();
  await expect(page.locator('#sidebar')).not.toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('#sidebar')).toHaveAttribute('inert', '');
});
test('homepage has no serious accessibility violations', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html[data-hash-route] .page-content')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => ['critical', 'serious'].includes(v.impact || '')),
  ).toEqual([]);
});
test('all navigation, detail refresh and 404 recovery keep base prefix', async ({ page }) => {
  await page.goto('./food-guide/coffee/');
  await page.reload();
  await expect(page.locator('h1')).toContainText('咖啡');
  const base = process.env.BASE_PATH || '/';
  const links = await page
    .locator('a[href^="/"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(links.every((href) => href?.startsWith(base))).toBe(true);
  await page.goto('./404.html');
  await expect(page.locator('h1')).toContainText('没有找到这个页面');
});

test('all page templates have no serious accessibility defects or layout overflow', async ({
  page,
}) => {
  for (const path of [
    'overview/',
    'overview/middle/',
    'for-mom/',
    'for-dad/',
    'food-guide/',
    'food-guide/salmon/',
    'checklist/',
    'recipes/',
    'emergency/',
    'about/',
    'appointments/',
    'references/',
    'risk-guide/',
  ]) {
    await page.goto(`./${path}`);
    await expect(page.locator('html[data-hash-route] .page-content')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations
        .filter((v) => ['critical', 'serious'].includes(v.impact || ''))
        .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      path,
    ).toEqual([]);
    await page.setViewportSize({ width: 360, height: 800 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      path,
    ).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
});

test('search index failure keeps emergency access and keyboard close usable', async ({ page }) => {
  await page.route('**/pagefind/**', (route) => route.abort());
  await page.goto('./');
  await page.getByRole('button', { name: '搜索指南' }).click();
  await page.locator('#site-search-input').fill('胎动');
  await expect(page.locator('#search-status')).toContainText('暂时无法加载');
  await expect(
    page.locator('#search-dialog').getByRole('link', { name: /紧急就医/ }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '搜索指南' })).toBeFocused();
});
