export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type ChecklistState = {
  version: 1;
  checkedIds: string[];
  locations: Record<string, string>;
};
export const CHECKLIST_KEY = 'duobump:checklist:v1';
export const PREGNANCY_KEY = 'duobump:pregnancy:v1';
const empty = (): ChecklistState => ({ version: 1, checkedIds: [], locations: {} });
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
export type ChecklistReadResult = {
  state: ChecklistState;
  notice: 'unsupported' | 'corrupt' | 'unavailable' | null;
};
export function readChecklist(
  storage: StorageLike | null,
  validIds: string[],
): ChecklistReadResult {
  if (!storage) return { state: empty(), notice: 'unavailable' };
  let raw: string | null;
  try {
    raw = storage.getItem(CHECKLIST_KEY);
  } catch {
    return { state: empty(), notice: 'unavailable' };
  }
  if (raw === null) return { state: empty(), notice: null };
  try {
    const state = JSON.parse(raw);
    if (!state || typeof state !== 'object' || Array.isArray(state))
      return { state: empty(), notice: 'corrupt' };
    if (state.version !== 1) return { state: empty(), notice: 'unsupported' };
    if (
      !Array.isArray(state.checkedIds) ||
      !state.locations ||
      typeof state.locations !== 'object' ||
      Array.isArray(state.locations)
    )
      return { state: empty(), notice: 'corrupt' };
    const allowed = new Set(validIds);
    return {
      state: {
        version: 1,
        checkedIds: [
          ...new Set<string>(
            state.checkedIds.filter((id: unknown) => typeof id === 'string' && allowed.has(id)),
          ),
        ],
        locations: Object.fromEntries(
          Object.entries(state.locations)
            .filter(([k, v]) => allowed.has(k) && typeof v === 'string')
            .map(([k, v]) => [k, String(v).slice(0, 100)]),
        ),
      },
      notice: null,
    };
  } catch {
    return { state: empty(), notice: 'corrupt' };
  }
}
export function loadChecklist(storage: StorageLike | null, validIds: string[]): ChecklistState {
  return readChecklist(storage, validIds).state;
}
export function saveChecklist(storage: StorageLike | null, state: ChecklistState) {
  try {
    if (!storage) return { persisted: false };
    storage.setItem(CHECKLIST_KEY, JSON.stringify(state));
    return { persisted: true };
  } catch {
    return { persisted: false };
  }
}
export function removeStoredValue(storage: StorageLike | null, key: string): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
export function resetChecklist(storage: StorageLike | null): boolean {
  return removeStoredValue(storage, CHECKLIST_KEY);
}
