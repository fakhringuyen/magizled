import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'magizled.animationNames.v1';

/** Index 0 is animation1. Missing or empty means show the number. */
export type Names = Record<number, string>;

let cache: Names | null = null;
const listeners = new Set<(n: Names) => void>();

async function read(): Promise<Names> {
  if (cache) return cache;
  let next: Names = {};
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) next = JSON.parse(raw) as Names;
  } catch {
    // A corrupt record just means the numbers come back.
  }
  cache = next;
  return next;
}

export function useAnimationNames() {
  const [names, setNames] = useState<Names>(cache ?? {});

  useEffect(() => {
    let alive = true;
    read().then((n) => alive && setNames(n));
    listeners.add(setNames);
    return () => {
      alive = false;
      listeners.delete(setNames);
    };
  }, []);

  const rename = useCallback(async (index: number, name: string) => {
    const next = { ...(cache ?? {}) };
    const clean = name.trim().slice(0, 18);
    if (clean) next[index] = clean;
    else delete next[index];
    cache = next;
    listeners.forEach((l) => l(next));
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // A failed write only costs persistence.
    }
  }, []);

  return { names, rename };
}

export function labelFor(names: Names, index: number): string {
  return names[index] || String(index + 1);
}
