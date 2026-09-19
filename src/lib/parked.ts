import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'magizled.parked.v1';

/**
 * The firmware has no display mode. Showing one message alone means sending
 * the other two as empty, and showing text without animations means sending
 * all 41 as off. The board then holds nothing to restore from, so whatever is
 * cleared is kept here until it is put back.
 */
export type Parked = {
  texts: { text1: string; text2: string; text3: string } | null;
  animations: boolean[] | null;
};

const EMPTY: Parked = { texts: null, animations: null };

let cache: Parked | null = null;
const listeners = new Set<(p: Parked) => void>();

async function read(): Promise<Parked> {
  if (cache) return cache;
  let next: Parked = EMPTY;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) next = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // A corrupt record just means nothing is held.
  }
  cache = next;
  return next;
}

export function useParked() {
  const [parked, setParked] = useState<Parked>(cache ?? EMPTY);

  useEffect(() => {
    let alive = true;
    read().then((p) => alive && setParked(p));
    listeners.add(setParked);
    return () => {
      alive = false;
      listeners.delete(setParked);
    };
  }, []);

  const write = useCallback(async (patch: Partial<Parked>) => {
    const next = { ...(cache ?? EMPTY), ...patch };
    cache = next;
    listeners.forEach((l) => l(next));
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // A failed write only costs persistence across a restart.
    }
  }, []);

  return { parked, write };
}
