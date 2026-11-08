import { describe, expect, it } from 'vitest';
import { filterFoods } from '../../src/lib/food-search';
import foods from '../../src/data/foods.json';
describe('food search', () => {
  it('matches names, aliases, whitespace and case', () => {
    expect(filterFoods(foods, { query: '咖啡' })[0]?.id).toBe('coffee');
    expect(filterFoods(foods, { query: ' COFFEE ' })[0]?.id).toBe('coffee');
  });
  it('combines filters and accounts for preparation risk', () => {
    expect(filterFoods(foods, { query: '三文鱼', risk: 'avoid' })[0]?.id).toBe('salmon');
    expect(filterFoods(foods, { query: '三文鱼', risk: 'usually-ok' })[0]?.id).toBe('salmon');
    expect(filterFoods(foods, { query: '咖啡', category: '水果' })).toEqual([]);
  });
  it('returns an empty state for an unknown food', () => {
    expect(filterFoods(foods, { query: '不存在的食物' })).toEqual([]);
    expect(filterFoods(foods, { query: '' }).length).toBe(foods.length);
  });
});

describe('suggested food filtering', () => {
  it('excludes foods that are not daily suggested choices', () => {
    expect(filterFoods(foods, { query: '咖啡', recommendedOnly: true })).toEqual([]);
    expect(filterFoods(foods, { query: '动物肝脏', recommendedOnly: true })).toEqual([]);
  });
  it('only matches the suggested preparation when combined with risk filters', () => {
    expect(filterFoods(foods, { query: '三文鱼', recommendedOnly: true, risk: 'avoid' })).toEqual(
      [],
    );
    expect(
      filterFoods(foods, { query: '三文鱼', recommendedOnly: true, risk: 'usually-ok' }).map(
        (food) => food.id,
      ),
    ).toEqual(['salmon']);
    expect(filterFoods(foods, { query: '三文鱼', risk: 'avoid' }).map((food) => food.id)).toEqual([
      'salmon',
    ]);
  });
  it('combines category and alias search and never suggests an unsafe preparation', () => {
    expect(
      filterFoods(foods, { query: '水煮蛋', category: '蛋奶豆类', recommendedOnly: true }).map(
        (food) => food.id,
      ),
    ).toEqual(['eggs']);
    const unsafe = foods
      .filter((food) => food.id === 'salmon')
      .map((food) => ({
        ...food,
        preparations: food.preparations.filter((preparation) => preparation.risk === 'avoid'),
      }));
    expect(filterFoods(unsafe, { query: '', recommendedOnly: true })).toEqual([]);
  });
});
