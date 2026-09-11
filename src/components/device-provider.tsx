import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import {
  BRIDGE_JS,
  applyCommand,
  refreshCommand,
  type BridgeMessage,
  type FormSchema,
} from '@/lib/device-bridge';
import { toUrl, useSettings } from '@/lib/settings';

type Status = 'loading' | 'ready' | 'error';

type DeviceApi = {
  status: Status;
  error: string | null;
  title: string;
  forms: FormSchema[];
  /** Raw body of the board's own /data poll, if it makes one. */
  data: string | null;
  /** Fills the named fields in that form and submits it. */
  apply: (formIndex: number, values: Record<string, string | boolean>) => void;
  /** True for a moment after a change lands, for the saved tick. */
  saved: boolean;
  savingForm: number | null;
  reload: () => void;
};

const Ctx = createContext<DeviceApi | null>(null);

export function useDevice(): DeviceApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDevice must sit under DeviceProvider');
  return v;
}

/**
 * Keeps the firmware page loaded off screen and exposes it as an API.
 * The page must stay rendered, not display:none, or Android suspends its JS.
 */
export function DeviceProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const url = useMemo(() => toUrl(settings.address), [settings.address]);
  const ref = useRef<WebView>(null);

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [data, setData] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingForm, setSavingForm] = useState<number | null>(null);

  const onMessage = useCallback((e: { nativeEvent: { data: string } }) => {
    let msg: BridgeMessage;
    try {
      msg = JSON.parse(e.nativeEvent.data) as BridgeMessage;
    } catch {
      return;
    }
    switch (msg.kind) {
      case 'schema':
        setTitle(msg.title);
        setForms(msg.forms);
        setStatus('ready');
        setError(null);
        break;
      case 'data':
        setData(msg.body);
        break;
      case 'ack':
        setSavingForm(null);
        if (msg.ok) {
          setSaved(true);
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaved(false), 2500);
        } else {
          setError(msg.error ?? 'The board rejected that change.');
        }
        break;
      case 'log':
        break;
    }
  }, []);

  const apply = useCallback(
    (formIndex: number, values: Record<string, string | boolean>) => {
      setSavingForm(formIndex);
      setError(null);
      ref.current?.injectJavaScript(applyCommand(formIndex, values));
      // The page navigates on submit, so re-read the schema once it settles.
      setTimeout(() => ref.current?.injectJavaScript(refreshCommand()), 1200);
    },
    []
  );

  const reload = useCallback(() => {
    setStatus('loading');
    setError(null);
    ref.current?.reload();
  }, []);

  const api = useMemo<DeviceApi>(
    () => ({ status, error, title, forms, data, apply, saved, savingForm, reload }),
    [status, error, title, forms, data, apply, saved, savingForm, reload]
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <View style={styles.hidden} pointerEvents="none" accessibilityElementsHidden>
        <WebView
          ref={ref}
          source={{ uri: url }}
          originWhitelist={['*']}
          mixedContentMode="always"
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          injectedJavaScriptBeforeContentLoaded={BRIDGE_JS}
          onMessage={onMessage}
          onError={({ nativeEvent }) => {
            setStatus('error');
            setError(nativeEvent.description || 'The board did not answer.');
          }}
          onHttpError={({ nativeEvent }) => {
            setStatus('error');
            setError(`The board answered with HTTP ${nativeEvent.statusCode}.`);
          }}
        />
      </View>
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  // Kept on screen at 1x1 so the WebView keeps running its JavaScript.
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, top: 0, left: 0 },
});
