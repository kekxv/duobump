import { describe, expect, it } from 'vitest';
import { calculatePregnancy, getMilestones } from '../../src/lib/pregnancy';

describe('calendar based pregnancy estimate', () => {
  it('calculates the approved example without timezone shifts', () => {
    expect(calculatePregnancy({ lmp: '2026-05-01' }, '2026-11-07')).toEqual({
      ok: true,
      weeks: 27,
      days: 1,
      stage: 'middle',
      dueDate: '2027-02-05',
      basis: 'lmp',
    });
  });
  it.each([
    ['2026-04-08', 13, 6, 'early'],
    ['2026-04-09', 14, 0, 'middle'],
    ['2026-07-15', 27, 6, 'middle'],
    ['2026-07-16', 28, 0, 'late'],
    ['2026-10-08', 40, 0, 'late'],
    ['2026-10-22', 42, 0, 'late'],
  ])('handles the stage boundary on %s', (today, weeks, days, stage) => {
    expect(calculatePregnancy({ lmp: '2026-01-01' }, today)).toMatchObject({
      ok: true,
      weeks,
      days,
      stage,
    });
  });
  it('gives the clinician date priority', () => {
    expect(
      calculatePregnancy({ lmp: '2026-01-01', dueDate: '2027-02-05' }, '2026-11-07'),
    ).toMatchObject({ ok: true, weeks: 27, days: 1, basis: 'doctor' });
  });
  it('handles leap days as calendar dates', () => {
    expect(calculatePregnancy({ lmp: '2024-02-29' }, '2024-03-07')).toMatchObject({
      ok: true,
      weeks: 1,
      days: 0,
    });
  });
  it.each(['2026-02-29', '2026-02-30', '2026-13-01', '2026-1-01', '2026-01-01junk'])(
    'rejects malformed date %s',
    (lmp) => {
      expect(calculatePregnancy({ lmp }, '2026-11-07')).toEqual({
        ok: false,
        code: 'invalid-date',
      });
    },
  );
  it('rejects future periods, negative estimates and unsupported dates', () => {
    expect(calculatePregnancy({ lmp: '2026-11-08' }, '2026-11-07')).toEqual({
      ok: false,
      code: 'future-lmp',
    });
    expect(calculatePregnancy({ dueDate: '2028-12-01' }, '2026-11-07')).toEqual({
      ok: false,
      code: 'out-of-range',
    });
    expect(calculatePregnancy({ lmp: '2026-01-01' }, '2026-10-23')).toEqual({
      ok: false,
      code: 'out-of-range',
    });
    expect(calculatePregnancy({}, '2026-11-07')).toEqual({ ok: false, code: 'missing-input' });
  });
  it('returns at most three relevant tasks in their existing order', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: `task-${i}`,
      fromDay: 100,
      toDay: 200,
      role: 'both' as const,
      title: `任务${i}`,
      href: '/overview/',
      sourceIds: ['nhs-appointments'],
    }));
    expect(getMilestones(190, items)).toHaveLength(3);
    expect(getMilestones(50, items)).toEqual([]);
  });
});
