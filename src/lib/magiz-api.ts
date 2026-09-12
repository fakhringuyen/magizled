/**
 * The board's HTTP contract, read from the firmware's own form markup and
 * inline script (v7.0, "Full DC Product").
 *
 * Everything posts form-encoded to /message with a `mode` that selects the
 * command. GET /data returns the whole state as key=value pairs.
 */

export const ANIMATION_COUNT = 41;
export const TEXT_MAX = 60;

export type Option = { value: string; label: string };

export type Control =
  | {
      kind: 'select';
      key: 'rem' | 'sein' | 'font' | 'jl';
      mode: number;
      field: string;
      label: string;
      options: Option[];
    }
  | {
      kind: 'range';
      key: 'speed' | 'bright' | 'durasi';
      mode: number;
      field: string;
      label: string;
      unit: string;
      min: number;
      max: number;
      step: number;
    };

/** Ranges and options come straight from the firmware's inputs. */
export const CONTROLS: Control[] = [
  {
    kind: 'range',
    key: 'bright',
    mode: 11,
    field: 'parameter1',
    label: 'Brightness',
    unit: '',
    min: 1,
    max: 10,
    step: 1,
  },
  {
    kind: 'range',
    key: 'speed',
    mode: 10,
    field: 'parameter2',
    label: 'Speed',
    unit: '',
    min: 0,
    max: 30,
    step: 5,
  },
  {
    kind: 'range',
    key: 'durasi',
    mode: 12,
    field: 'parameter3',
    label: 'Interval',
    unit: 's',
    min: 5,
    max: 30,
    step: 5,
  },
  {
    kind: 'select',
    key: 'font',
    mode: 6,
    field: 'parameter8',
    label: 'Font',
    options: [
      { value: '1', label: 'Normal' },
      { value: '2', label: 'Bold' },
    ],
  },
  {
    kind: 'select',
    key: 'jl',
    mode: 9,
    field: 'parameter5',
    label: 'LED panels',
    options: ['3', '4', '5', '6', '7', '8'].map((v) => ({ value: v, label: v })),
  },
  {
    kind: 'select',
    key: 'rem',
    mode: 4,
    field: 'parameter6',
    label: 'Brake animation',
    options: [1, 2, 3, 4].map((n) => ({ value: String(n), label: `REM ${n}` })),
  },
  {
    kind: 'select',
    key: 'sein',
    mode: 5,
    field: 'parameter7',
    label: 'Indicator animation',
    options: [1, 2].map((n) => ({ value: String(n), label: `SEIN ${n}` })),
  },
];

export const MODE_RUNNING = 7;
export const MODE_WIFI = 8;

export type BoardState = {
  rem: string;
  sein: string;
  font: string;
  jl: string;
  speed: string;
  bright: string;
  durasi: string;
  text1: string;
  text2: string;
  text3: string;
  ssid: string;
  all: boolean;
  animations: boolean[];
  statusboard: string;
};

export const EMPTY_STATE: BoardState = {
  rem: '1',
  sein: '1',
  font: '1',
  jl: '8',
  speed: '0',
  bright: '5',
  durasi: '15',
  text1: '',
  text2: '',
  text3: '',
  ssid: '',
  all: false,
  animations: Array(ANIMATION_COUNT).fill(false),
  statusboard: '',
};

/**
 * Parses `key=value&key=value`.
 * The board also returns the Wi-Fi password here in clear text; it is dropped
 * on the way in so the app never holds it.
 */
export function parseData(body: string): BoardState {
  const s: BoardState = { ...EMPTY_STATE, animations: Array(ANIMATION_COUNT).fill(false) };
  for (const part of body.split('&')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i);
    const v = decodeURIComponent(part.slice(i + 1).replace(/\+/g, ' '));
    const anim = /^animation(\d+)$/.exec(k);
    if (anim) {
      const n = Number(anim[1]);
      if (n >= 1 && n <= ANIMATION_COUNT) s.animations[n - 1] = v === '1';
      continue;
    }
    switch (k) {
      case 'password':
        break;
      case 'all':
        s.all = v === '1';
        break;
      case 'rem':
      case 'sein':
      case 'font':
      case 'jl':
      case 'speed':
      case 'bright':
      case 'durasi':
      case 'text1':
      case 'text2':
      case 'text3':
      case 'ssid':
      case 'statusboard':
        s[k] = v;
        break;
    }
  }
  return s;
}

function encode(pairs: Record<string, string>): string {
  return Object.entries(pairs)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function post(base: string, pairs: Record<string, string>, timeoutMs = 6000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(pairs),
      signal: ac.signal,
    });
    if (!res.ok) throw new Error(`The board answered HTTP ${res.status}.`);
  } finally {
    clearTimeout(t);
  }
}

export async function readState(base: string, timeoutMs = 5000): Promise<BoardState> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/data`, { signal: ac.signal });
    return parseData(await res.text());
  } finally {
    clearTimeout(t);
  }
}

/** One value, one command. Used by every slider and dropdown. */
export function setControl(base: string, control: Control, value: string) {
  return post(base, { mode: String(control.mode), [control.field]: value });
}

/**
 * Mode 7 is one form holding the three messages, Auto, and all 41 animations.
 * An HTML form omits unchecked boxes, so the whole set must be sent every
 * time or the board would read the missing ones as off.
 */
export function setRunning(
  base: string,
  s: Pick<BoardState, 'text1' | 'text2' | 'text3' | 'all' | 'animations'>
) {
  const pairs: Record<string, string> = {
    mode: String(MODE_RUNNING),
    runningtext1: s.text1,
    runningtext2: s.text2,
    runningtext3: s.text3,
  };
  if (s.all) pairs.parameter4 = '1';
  s.animations.forEach((on, i) => {
    if (on) pairs[`animation${i + 1}`] = '1';
  });
  return post(base, pairs);
}

/** Changing this drops the board off the current network, so it never auto saves. */
export function setWifi(base: string, ssid: string, password: string) {
  return post(base, { mode: String(MODE_WIFI), ssid, password });
}
