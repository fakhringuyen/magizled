import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { Button } from '@/components/button';
import { Confirm } from '@/components/confirm';
import { ChevronLeft, Gear, Power, Reload } from '@/components/icons';
import { IconButton } from '@/components/icon-button';
import { warn } from '@/lib/haptics';
import { toUrl, useSettings } from '@/lib/settings';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

/**
 * Controller firmware pages are often built for a desktop window and ship no
 * viewport tag, so they render zoomed out. Add one only when it is missing and
 * kill the 300 ms tap delay. Everything is guarded so a failure cannot block
 * the page.
 */
const FIT_TO_SCREEN = `
(function () {
  try {
    if (!document.querySelector('meta[name="viewport"]')) {
      var m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      (document.head || document.documentElement).appendChild(m);
    }
    var s = document.createElement('style');
    s.textContent = 'html{-webkit-text-size-adjust:100%}' +
      '*{-webkit-tap-highlight-color:transparent;touch-action:manipulation}';
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
})();
true;
`;

const KEEP_AWAKE_TAG = 'magizled-control';

function hostOf(url: string): string {
  return url.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
}

export default function ClassicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const webRef = useRef<WebView>(null);

  const url = useMemo(() => toUrl(settings.address), [settings.address]);
  const host = useMemo(() => hostOf(url), [url]);

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askExit, setAskExit] = useState(false);

  // The original app let the screen sleep while you were adjusting the lights.
  // useKeepAwake cannot be called conditionally, and passing undefined would
  // still hold the default lock, so drive the lock by hand.
  useEffect(() => {
    if (!settings.keepAwake) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [settings.keepAwake]);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    webRef.current?.reload();
  }, []);

  const goBackInPage = useCallback(() => {
    webRef.current?.goBack();
  }, []);

  // Hardware back walks the page history first. The original always jumped
  // straight to the exit dialog, so you could never leave a sub page.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (askExit) {
          setAskExit(false);
          return true;
        }
        if (canGoBack && !error) {
          goBackInPage();
          return true;
        }
        warn();
        setAskExit(true);
        return true;
      });
      return () => sub.remove();
    }, [askExit, canGoBack, error, goBackInPage])
  );

  const onNav = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  }, []);


  // Keep off-device links out of the WebView; there is no address bar to escape with.
  const shouldLoad = useCallback(
    (req: { url: string }) => {
      if (!/^https?:/i.test(req.url)) return true;
      if (hostOf(req.url) === host) return true;
      WebBrowser.openBrowserAsync(req.url).catch(() => {});
      return false;
    },
    [host]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <IconButton
          label="Back within the page"
          onPress={goBackInPage}
          disabled={!canGoBack || !!error}>
          <ChevronLeft color={canGoBack && !error ? Palette.text : Palette.textFaint} />
        </IconButton>

        <View style={styles.barTitle}>
          <View
            style={[styles.dot, { backgroundColor: error ? Palette.danger : Palette.online }]}
          />
          <Text style={styles.host} numberOfLines={1}>
            {host} · classic
          </Text>
        </View>

        <IconButton label="Reload the page" onPress={reload}>
          <Reload />
        </IconButton>
        <IconButton label="Settings" onPress={() => router.push('/settings')}>
          <Gear />
        </IconButton>
        {Platform.OS === 'android' && (
          <IconButton
            label="Close the app"
            onPress={() => {
              warn();
              setAskExit(true);
            }}>
            <Power color={Palette.danger} />
          </IconButton>
        )}
      </View>

      <View style={styles.track}>
        {loading && !error && (
          <View style={[styles.fill, { width: `${Math.max(6, progress * 100)}%` }]} />
        )}
      </View>

      <View style={styles.body}>
        <WebView
          ref={webRef}
          source={{ uri: url }}
          originWhitelist={['*']}
          // The controller serves plain HTTP on the local network.
          mixedContentMode="always"
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
          // Hardware layers keep colour pickers and sliders smooth on Android.
          androidLayerType="hardware"
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          overScrollMode="never"
          injectedJavaScript={FIT_TO_SCREEN}
          onNavigationStateChange={onNav}
          onShouldStartLoadWithRequest={shouldLoad}
          onLoadStart={() => {
            setLoading(true);
            setProgress(0);
          }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onLoadEnd={() => setLoading(false)}
          onLoad={() => setError(null)}
          onError={({ nativeEvent }) => {
            setLoading(false);
            setError(nativeEvent.description || 'The page could not be loaded.');
          }}
          onHttpError={({ nativeEvent }) => {
            setLoading(false);
            setError(`The controller answered with HTTP ${nativeEvent.statusCode}.`);
          }}
          style={styles.web}
          containerStyle={styles.web}
        />

        {error && (
          <View style={styles.errorPane}>
            <Text style={styles.errorTitle}>Cannot reach the controller</Text>
            <Text style={styles.errorBody}>
              Check that the phone is on the Magiz Wi-Fi and that {host} is the right address.
            </Text>
            <Text style={styles.errorDetail} selectable>
              {error}
            </Text>
            <View style={styles.errorActions}>
              <Button label="Retry" onPress={reload} full />
              <Button
                label="Change address"
                onPress={() => router.push('/settings')}
                variant="secondary"
                full
              />
              <Button
                label="Back to the panel"
                onPress={() => router.replace('/control')}
                variant="ghost"
                full
              />
            </View>
          </View>
        )}
      </View>

      <View style={{ height: insets.bottom, backgroundColor: Palette.bg }} />

      <Confirm
        visible={askExit}
        title="Close MagizLED?"
        body="The lights keep their current setting after the app closes."
        confirmLabel="Close"
        cancelLabel="Stay"
        destructive
        onConfirm={() => {
          setAskExit(false);
          BackHandler.exitApp();
        }}
        onCancel={() => setAskExit(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.sm,
    gap: Space.xs,
    backgroundColor: Palette.bgElevated,
  },
  barTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingHorizontal: Space.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  host: { ...Type.mono, color: Palette.textMuted, flexShrink: 1 },
  track: { height: 2, backgroundColor: Palette.bgElevated },
  fill: { height: 2, backgroundColor: Palette.magenta },
  body: { flex: 1, backgroundColor: Palette.bg },
  web: { flex: 1, backgroundColor: Palette.bg },
  errorPane: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.bg,
    padding: Space.xl,
    justifyContent: 'center',
    gap: Space.md,
  },
  errorTitle: { ...Type.title, color: Palette.text },
  errorBody: { ...Type.body, color: Palette.textMuted },
  errorDetail: {
    ...Type.caption,
    color: Palette.textFaint,
    backgroundColor: Palette.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.md,
  },
  errorActions: { gap: Space.md, marginTop: Space.sm },
});
