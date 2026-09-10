import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { PageMap, RecordedCall } from '@/lib/api-recorder';

const KEY = 'magizled.apilog.v1';
const MAX = 200;

export type Log = { calls: RecordedCall[]; map: PageMap | null };

let log: Log = { calls: [], map: null };
let loaded = false;
const listeners = new Set<(l: Log) => void>();

function emit() {
  const snapshot = { calls: log.calls, map: log.map };
  listeners.forEach((l) => l(snapshot));
  AsyncStorage.setItem(KEY, JSON.stringify(snapshot)).catch(() => {});
}

const SECRET = /(pass|pwd|passwd|password|secret|token|key|psk)/i;

/** Strips credentials from a form-encoded body. */
export function scrub(body?: string): string | undefined {
  if (!body) return body;
  return body.replace(/([^&=?]+)=([^&]*)/g, (m, k: string) =>
    SECRET.test(k) ? `${k}=***redacted***` : m
  );
}

export async function loadLog(): Promise<Log> {
  if (loaded) return log;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) log = { calls: [], map: null, ...JSON.parse(raw) };
  } catch {
    // A corrupt record just starts the log empty.
  }
  // Earlier builds stored bodies unredacted, so clean them on the way in
  // and write the clean version straight back.
  const before = JSON.stringify(log.calls);
  log.calls = log.calls.map((c) => ({ ...c, body: scrub(c.body), url: scrub(c.url) as string }));
  if (JSON.stringify(log.calls) !== before) emit();
  loaded = true;
  return log;
}

export function addCall(call: RecordedCall) {
  // Collapse repeats of the same endpoint and body, so holding a slider
  // does not bury the interesting calls.
  const last = log.calls[0];
  if (last && last.url === call.url && last.body === call.body && last.method === call.method) {
    log.calls = [{ ...call }, ...log.calls.slice(1)];
  } else {
    log.calls = [call, ...log.calls].slice(0, MAX);
  }
  emit();
}

export function setMap(map: PageMap) {
  log.map = map;
  emit();
}

export function clearLog() {
  log = { calls: [], map: null };
  emit();
}

export function useApiLog() {
  const [state, setState] = useState<Log>(log);
  useEffect(() => {
    loadLog().then(setState);
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  const clear = useCallback(() => clearLog(), []);
  return { log: state, clear };
}

/** Compact text form, sized to be read from a screenshot. */
export function summarise(l: Log): string {
  const lines: string[] = [];
  if (l.map) {
    lines.push(`TITLE ${l.map.title}`);
    l.map.forms.forEach((f) => lines.push(`FORM ${f.method} ${f.action} [${f.fields.join(',')}]`));
    l.map.scripts.forEach((s) => lines.push(`SCRIPT ${s}`));
  }
  const seen = new Set<string>();
  l.calls.forEach((c) => {
    const k = `${c.method} ${c.url}`;
    if (seen.has(k)) return;
    seen.add(k);
    lines.push(`${c.method} ${c.url}${c.body ? ` <- ${c.body}` : ''}`);
  });
  return lines.join('\n');
}
