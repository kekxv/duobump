export type Stage = 'early' | 'middle' | 'late';
type Result =
  | {
      ok: true;
      weeks: number;
      days: number;
      stage: Stage;
      dueDate: string;
      basis: 'lmp' | 'doctor';
    }
  | { ok: false; code: 'invalid-date' | 'future-lmp' | 'out-of-range' | 'missing-input' };
export function dayNumber(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2200) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.getTime() / 86400000;
}
export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function calculatePregnancy(
  input: { lmp?: string; dueDate?: string },
  today: string,
): Result {
  if (!input.lmp && !input.dueDate) return { ok: false, code: 'missing-input' };
  const now = dayNumber(today);
  const useDoctor = Boolean(input.dueDate);
  const selected = dayNumber((useDoctor ? input.dueDate : input.lmp)!);
  if (now === null || selected === null) return { ok: false, code: 'invalid-date' };
  const start = useDoctor ? selected - 280 : selected;
  if (!useDoctor && start > now) return { ok: false, code: 'future-lmp' };
  const elapsed = now - start;
  if (elapsed < 0 || elapsed > 294) return { ok: false, code: 'out-of-range' };
  return {
    ok: true,
    weeks: Math.floor(elapsed / 7),
    days: elapsed % 7,
    stage: elapsed < 98 ? 'early' : elapsed < 196 ? 'middle' : 'late',
    dueDate: new Date((start + 280) * 86400000).toISOString().slice(0, 10),
    basis: useDoctor ? 'doctor' : 'lmp',
  };
}
export type Milestone = {
  id: string;
  fromDay: number;
  toDay: number;
  role: string;
  title: string;
  href: string;
  sourceIds: string[];
};
export function getMilestones(day: number, items: Milestone[]) {
  return items.filter((item) => day >= item.fromDay && day <= item.toDay).slice(0, 3);
}
