import { describe, expect, it } from 'vitest';
import {
  loadChecklist,
  saveChecklist,
  resetChecklist,
  removeStoredValue,
  readChecklist,
} from '../../src/lib/storage';
const memory = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
};
const empty = { version: 1, checkedIds: [], locations: {} };
describe('private resilient checklist storage', () => {
  it('explains corrupt or unsupported saved checklist fallback', () => {
    const s = memory();
    s.setItem('duobump:checklist:v1', '{"version":2,"checkedIds":["id"],"locations":{}}');
    expect(readChecklist(s, ['id']).notice).toBe('unsupported');
    s.setItem('duobump:checklist:v1', 'corrupt');
    expect(readChecklist(s, ['id']).notice).toBe('corrupt');
  });
  it('persists checklist and locations', () => {
    const s = memory();
    expect(
      saveChecklist(s, { version: 1, checkedIds: ['id'], locations: { id: '蓝色袋子' } }),
    ).toEqual({ persisted: true });
    expect(loadChecklist(s, ['id'])).toEqual({
      version: 1,
      checkedIds: ['id'],
      locations: { id: '蓝色袋子' },
    });
  });
  it('rejects corrupt, obsolete and malformed state', () => {
    const s = memory();
    for (const value of [
      'broken',
      'null',
      '[]',
      '{"version":2,"checkedIds":[]}',
      '{"version":1,"checkedIds":"bad"}',
    ]) {
      s.setItem('duobump:checklist:v1', value);
      expect(loadChecklist(s, ['id'])).toEqual(empty);
    }
  });
  it('ignores unknown ids and duplicates', () => {
    const s = memory();
    s.setItem(
      'duobump:checklist:v1',
      JSON.stringify({
        version: 1,
        checkedIds: ['id', 'id', 'bad'],
        locations: { id: '袋子', bad: 'not valid' },
      }),
    );
    expect(loadChecklist(s, ['id'])).toEqual({
      version: 1,
      checkedIds: ['id'],
      locations: { id: '袋子' },
    });
  });
  it('survives blocked storage and quota errors', () => {
    const broken = {
      getItem: () => {
        throw Error();
      },
      setItem: () => {
        throw Error();
      },
      removeItem: () => {
        throw Error();
      },
    };
    expect(loadChecklist(broken, ['id'])).toEqual(empty);
    expect(saveChecklist(broken, empty as any)).toEqual({ persisted: false });
    expect(() => resetChecklist(broken)).not.toThrow();
    expect(loadChecklist(null, ['id'])).toEqual(empty);
  });
  it('resets only the checklist', () => {
    const s = memory();
    s.setItem('duobump:pregnancy:v1', 'private-date');
    saveChecklist(s, { version: 1, checkedIds: ['id'], locations: {} });
    resetChecklist(s);
    expect(s.getItem('duobump:pregnancy:v1')).toBe('private-date');
    expect(loadChecklist(s, ['id'])).toEqual(empty);
  });
  it('reports failed deletion instead of claiming private data was cleared', () => {
    const broken = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw Error('blocked');
      },
    };
    expect(removeStoredValue(broken, 'duobump:pregnancy:v1')).toBe(false);
    expect(removeStoredValue(memory(), 'duobump:pregnancy:v1')).toBe(true);
  });
});
