import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import foods from '../../src/data/foods.json';

it('represents the cited NHS liver advice as avoid rather than conditional', () => {
  const liver = foods.find((food) => food.id === 'liver')!;
  expect(liver.preparations[0].sourceIds).toContain('nhs-food');
  expect(liver.preparations[0].risk).toBe('avoid');
});

it('does not present an unsupported domestic ultrasound window as source-checked', () => {
  const body = readFileSync(new URL('../../src/content/guides/middle.md', import.meta.url), 'utf8');
  expect(body).not.toMatch(/国内医院常见系统超声预约窗口约在 20～24 周/);
});
