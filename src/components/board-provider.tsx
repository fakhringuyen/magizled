import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  CONTROLS,
  EMPTY_STATE,
  readState,
  setControl as apiSetControl,
  setRunning as apiSetRunning,
  setWifi as apiSetWifi,
  type BoardState,
  type Control,
} from '@/lib/magiz-api';
import { toUrl, useSettings } from '@/lib/settings';

type Status = 'loading' | 'ready' | 'error';

type BoardApi = {
  status: Status;
  error: string | null;
  state: BoardState;
  saving: boolean;
  saved: boolean;
  refresh: () => void;
  setControl: (control: Control, value: string) => void;
  setRunning: (patch: Partial<BoardState>) => void;
  setWifi: (ssid: string, password: string) => Promise<void>;
};

const Ctx = createContext<BoardApi | null>(null);

export function useBoard(): BoardApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBoard must sit under BoardProvider');
  return v;
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const { settings, loaded } = useSettings();
  const base = useMemo(() => toUrl(settings.address), [settings.address]);

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<BoardState>(EMPTY_STATE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const stateRef = useRef(state);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A read against the old address can land after a newer one succeeded and
  // drag a working panel into an error state, so only the latest read counts.
  const reqId = useRef(0);
  useEffect(() => {
    stateRef.current = state;
  });
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    []
  );

  const flashSaved = useCallback(() => {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  // No setState runs before the first await, so mounting this is a plain
  // subscription to an external system rather than a cascading render.
  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    try {
      const next = await readState(base);
      if (id !== reqId.current) return;
      setState(next);
      setStatus('ready');
      setError(null);
    } catch (e) {
      if (id !== reqId.current) return;
      setStatus('error');
      setError((e as Error)?.message || 'The board did not answer.');
    }
  }, [base]);

  useEffect(() => {
    // Waiting for the stored address avoids firing one doomed read at the
    // default and showing the wrong host for five seconds.
    if (!loaded) return;
    // Reading the board on mount is the "subscribe to an external system" case
    // the rule's own docs allow. It cannot see through the async boundary, and
    // no state is set before the first await inside refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh, loaded]);

  const run = useCallback(
    async (send: () => Promise<void>, optimistic: Partial<BoardState>) => {
      setState((s) => ({ ...s, ...optimistic }));
      setSaving(true);
      setError(null);
      try {
        await send();
        flashSaved();
      } catch (e) {
        setError((e as Error)?.message || 'The board rejected that change.');
        // Put the board's real values back, so the UI never lies.
        refresh();
      } finally {
        setSaving(false);
      }
    },
    [flashSaved, refresh]
  );

  const setControl = useCallback(
    (control: Control, value: string) => {
      run(() => apiSetControl(base, control, value), { [control.key]: value } as Partial<BoardState>);
    },
    [base, run]
  );

  const setRunning = useCallback(
    (patch: Partial<BoardState>) => {
      const next = { ...stateRef.current, ...patch };
      run(() => apiSetRunning(base, next), patch);
    },
    [base, run]
  );

  const setWifi = useCallback(
    async (ssid: string, password: string) => {
      setSaving(true);
      setError(null);
      try {
        await apiSetWifi(base, ssid, password);
        setState((s) => ({ ...s, ssid }));
        flashSaved();
      } catch (e) {
        // A Wi-Fi change drops this phone off the board, so a failure here is
        // expected and does not mean the board refused it.
        setError((e as Error)?.message || 'No reply. The board may already have switched network.');
      } finally {
        setSaving(false);
      }
    },
    [base, flashSaved]
  );

  const api = useMemo<BoardApi>(
    () => ({ status, error, state, saving, saved, refresh, setControl, setRunning, setWifi }),
    [status, error, state, saving, saved, refresh, setControl, setRunning, setWifi]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export { CONTROLS };
