import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'magizled.settings.v1';

export type Settings = {
  /** Host or full URL of the controller. The original app hard coded this. */
  address: string;
  /** Jump straight to the controller once the device answers. */
  autoConnect: boolean;
  /** Hold the screen on while the controller is open. */
  keepAwake: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  address: '192.168.2.2',
  autoConnect: true,
  keepAwake: true,
};

/** Accepts "192.168.2.2", "magiz.local", "http://host:8080/ui". */
export function toUrl(address: string): string {
  const trimmed = address.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export function isValidAddress(address: string): boolean {
  const url = toUrl(address);
  if (!url) return false;
  // No URL constructor guarantees in Hermes for every scheme, so match instead.
  return /^https?:\/\/[a-z0-9._~%-]+(:\d{1,5})?(\/\S*)?$/i.test(url);
}

let cache: Settings | null = null;
const listeners = new Set<(s: Settings) => void>();

async function read(): Promise<Settings> {
  if (cache) return cache;
  let next: Settings = { ...DEFAULT_SETTINGS };
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) next = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // A corrupt or unreadable record falls back to the defaults.
  }
  cache = next;
  return next;
}

async function write(next: Settings) {
  cache = next;
  listeners.forEach((l) => l(next));
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // A failed write only costs persistence, so keep the in-memory value.
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(cache ?? DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(cache !== null);

  useEffect(() => {
    let alive = true;
    read().then((s) => {
      if (!alive) return;
      setSettings(s);
      setLoaded(true);
    });
    listeners.add(setSettings);
    return () => {
      alive = false;
      listeners.delete(setSettings);
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...(cache ?? DEFAULT_SETTINGS), ...patch };
    await write(next);
  }, []);

  return { settings, update, loaded };
}
