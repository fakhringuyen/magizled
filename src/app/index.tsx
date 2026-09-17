import * as Network from 'expo-network';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/button';
import { Alert as AlertIcon, Wifi } from '@/components/icons';
import { Pulse } from '@/components/pulse';
import { success, warn } from '@/lib/haptics';
import { OFFLINE_COPY, probe, type Reachability } from '@/lib/reachability';
import { isValidAddress, toUrl, useSettings } from '@/lib/settings';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

const RETRY_MS = 5000;

/** Auto connect fires once per launch, so Back from the controller is not undone. */
let autoConnectUsed = false;

function networkLabel(state: Network.NetworkState | null): string {
  if (!state || state.isConnected === false) return 'No network';
  switch (state.type) {
    case Network.NetworkStateType.WIFI:
      return 'Wi-Fi';
    case Network.NetworkStateType.CELLULAR:
      return 'Mobile data';
    case Network.NetworkStateType.ETHERNET:
      return 'Ethernet';
    case Network.NetworkStateType.VPN:
      return 'VPN';
    default:
      return 'Connected';
  }
}

export default function ConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, loaded } = useSettings();
  const [reach, setReach] = useState<Reachability>({ state: 'checking' });
  const [net, setNet] = useState<Network.NetworkState | null>(null);

  const focused = useRef(false);
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The retry timer calls back into check, so route it through a ref.
  // A direct self reference would capture the first closure and go stale.
  const checkRef = useRef<() => void>(() => {});

  const url = toUrl(settings.address);
  const valid = isValidAddress(settings.address);

  const check = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setReach({ state: 'checking' });
    Network.getNetworkStateAsync().then(setNet).catch(() => {});

    const result = valid ? await probe(url) : ({ state: 'offline', reason: 'bad-address' } as const);
    running.current = false;
    if (!focused.current) return;
    setReach(result);

    if (result.state === 'online') {
      if (!autoConnectUsed && settings.autoConnect) {
        autoConnectUsed = true;
        success();
        router.replace('/control');
      }
      return;
    }

    timer.current = setTimeout(() => {
      if (focused.current) checkRef.current();
    }, RETRY_MS);
  }, [router, settings.autoConnect, url, valid]);

  useEffect(() => {
    checkRef.current = check;
  }, [check]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      if (loaded) check();
      return () => {
        focused.current = false;
        if (timer.current) clearTimeout(timer.current);
      };
    }, [check, loaded])
  );

  // Re-probe the moment the phone joins or leaves a network, and on foreground.
  useEffect(() => {
    const netSub = Network.addNetworkStateListener((state) => {
      setNet(state);
      if (focused.current) {
        if (timer.current) clearTimeout(timer.current);
        check();
      }
    });
    const appSub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' || !focused.current) return;
      // Without this the old handle is lost and its 5 second loop keeps
      // running, so the probe rate multiplies with every foreground.
      if (timer.current) clearTimeout(timer.current);
      check();
    });
    return () => {
      netSub.remove();
      appSub.remove();
    };
  }, [check]);

  const offline = reach.state === 'offline' ? OFFLINE_COPY[reach.reason] : null;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Space.xxl, paddingBottom: insets.bottom + Space.xl },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pulse active={reach.state === 'checking'} />
          <BrandMark size={140} />
        </View>

        <Text style={styles.wordmark}>MagizLED</Text>

        <View
          style={styles.statusCard}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={
            reach.state === 'online'
              ? `LED board online at ${settings.address}`
              : reach.state === 'checking'
                ? 'Looking for the board'
                : `${offline?.title}. ${offline?.body}`
          }>
          <View style={styles.statusHead}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    reach.state === 'online'
                      ? Palette.online
                      : reach.state === 'checking'
                        ? Palette.warn
                        : Palette.danger,
                },
              ]}
            />
            <Text style={styles.statusTitle}>
              {reach.state === 'online'
                ? 'Board found'
                : reach.state === 'checking'
                  ? 'Looking for the board'
                  : offline?.title}
            </Text>
          </View>

          <Text style={styles.statusBody}>
            {reach.state === 'online'
              ? `Answered in ${reach.ms} ms.`
              : reach.state === 'checking'
                ? `Asking ${settings.address} for a reply.`
                : offline?.body}
          </Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Wifi size={15} color={Palette.textFaint} />
              <Text style={styles.metaText}>{networkLabel(net)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaText} numberOfLines={1}>
                {settings.address || 'no address set'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={
              reach.state === 'online'
                ? 'Open board'
                : reach.state === 'checking'
                  ? 'Checking'
                  : 'Try again'
            }
            onPress={() => {
              if (reach.state === 'online') {
                autoConnectUsed = true;
                router.replace('/control');
              } else {
                warn();
                if (timer.current) clearTimeout(timer.current);
                check();
              }
            }}
            busy={reach.state === 'checking'}
            full
          />
          <Button
            label="Change address"
            onPress={() => router.push('/settings')}
            variant="secondary"
            full
          />
          {reach.state === 'offline' && (
            <Button
              label="Open anyway"
              onPress={() => {
                autoConnectUsed = true;
                router.replace('/control');
              }}
              variant="ghost"
              accessibilityHint="Loads the controller page even though it did not answer"
              full
            />
          )}
        </View>

        {reach.state === 'offline' && reach.reason === 'timeout' && (
          <View style={styles.tip}>
            <AlertIcon size={18} />
            <Text style={styles.tipText}>
              The board Wi-Fi has no internet, so Android quietly falls back to mobile data. Tap
              stay connected when it asks, or turn mobile data off while you use the lights.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.bg },
  content: {
    flexGrow: 1,
    paddingHorizontal: Space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { height: 200, width: 200, alignItems: 'center', justifyContent: 'center' },
  wordmark: {
    ...Type.display,
    color: Palette.text,
    letterSpacing: -0.5,
    marginTop: -Space.sm,
  },
  statusCard: {
    alignSelf: 'stretch',
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.lg,
    gap: Space.sm,
  },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  statusTitle: { ...Type.label, color: Palette.text, flexShrink: 1 },
  statusBody: { ...Type.body, color: Palette.textMuted },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.md,
    marginTop: Space.xs,
    paddingTop: Space.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, flexShrink: 1 },
  metaText: { ...Type.caption, color: Palette.textFaint },
  actions: { alignSelf: 'stretch', gap: Space.md, marginTop: Space.xs },
  tip: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: Space.md,
    backgroundColor: Palette.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.lg,
  },
  tipText: { ...Type.caption, color: Palette.textMuted, flex: 1 },
});
