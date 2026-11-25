/**
 * Browser storage for what a visitor builds (decks, for now). There are no
 * accounts yet, so it lives in this browser only. Reading never throws:
 * storage can be missing, full, blocked or hold something old or malformed,
 * and the site then behaves as if nothing were saved.
 */
export interface Store<T> {
  read(): T;
  write(value: T): boolean;
}

export function browserStore<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
  storage: () => Storage | undefined = () =>
    typeof window === 'undefined' ? undefined : window.localStorage,
): Store<T> {
  return {
    read() {
      try {
        const raw = storage()?.getItem(key);
        if (!raw) return fallback;
        const parsed: unknown = JSON.parse(raw);
        return isValid(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    },
    write(value) {
      try {
        const target = storage();
        if (!target) return false;
        target.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
  };
}
