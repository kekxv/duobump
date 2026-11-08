import { expect, it } from 'vitest';
import { withBase } from '../../src/lib/urls';
it('joins root and repository paths without double prefixes', () => {
  expect(withBase('/food-guide/coffee/', '/')).toBe('/food-guide/coffee/');
  expect(withBase('/food-guide/coffee/', '/duobump/')).toBe('/duobump/food-guide/coffee/');
  expect(withBase('/duobump/food-guide/', '/duobump/')).toBe('/duobump/food-guide/');
  expect(withBase('/', '/duobump/')).toBe('/duobump/');
});
