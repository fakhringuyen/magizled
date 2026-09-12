import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { Close } from '@/components/icons';
import { IconButton } from '@/components/icon-button';
import { CHANGELOG } from '@/lib/changelog';
import { readInfo, type BoardInfo } from '@/lib/magiz-api';
import { toUrl, useSettings } from '@/lib/settings';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

const current = CHANGELOG[0];

/**
 * Take both numbers from one source. versionCode is missing on web, and
 * pairing a config version with a changelog build would show a version that
 * was never actually shipped.
 */
function appVersion() {
  const cfg = Constants.expoConfig;
  const build = cfg?.android?.versionCode;
  if (cfg?.version && typeof build === 'number') return { version: cfg.version, build };
  return { version: current.version, build: current.build };
}

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const [board, setBoard] = useState<BoardInfo | null>(null);
  const [boardError, setBoardError] = useState(false);
  const app = appVersion();

  useEffect(() => {
    let alive = true;
    readInfo(toUrl(settings.address))
      .then((i) => alive && setBoard(i))
      .catch(() => alive && setBoardError(true));
    return () => {
      alive = false;
    };
  }, [settings.address]);

  return (
    <View style={styles.screen}>
      <View style={[styles.bar, { paddingTop: insets.top + Space.sm }]}>
        <Text style={styles.barTitle}>About</Text>
        <IconButton label="Close" onPress={() => router.back()}>
          <Close />
        </IconButton>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}>
        <View style={styles.hero}>
          <BrandMark size={96} />
          <Text style={styles.name}>MagizLED</Text>
          <Text style={styles.version}>
            {app.version}
            <Text style={styles.versionFaint}>{`  build ${app.build}`}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>The board</Text>
          {board ? (
            <>
              <Row label="Firmware" value={board.title || 'unknown'} />
              <Row label="Version" value={board.version || 'not printed'} />
              <Row label="Vendor" value={board.vendor || 'not printed'} />
              <Row label="Address" value={settings.address} />
            </>
          ) : (
            <Text style={styles.note}>
              {boardError
                ? 'Not read. Join the board’s Wi-Fi and open this screen again.'
                : 'Reading the board…'}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What changed</Text>
          {CHANGELOG.map((r) => (
            <View key={r.version} style={styles.release}>
              <View style={styles.releaseHead}>
                <Text style={styles.releaseVersion}>{r.version}</Text>
                <Text style={styles.releaseMeta}>
                  build {r.build} · {r.date}
                </Text>
              </View>
              {r.changes.map((c) => (
                <View key={c} style={styles.bullet}>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.change}>{c}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Rebuilt from the original MagizLED app by zamzamy_ig. The board firmware is not part of
          this app.
        </Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingBottom: Space.sm,
    backgroundColor: Palette.bgElevated,
  },
  barTitle: { ...Type.title, color: Palette.text },
  content: {
    padding: Space.lg,
    gap: Space.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Space.sm, paddingVertical: Space.lg },
  name: { ...Type.display, color: Palette.text, fontSize: 24 },
  version: { ...Type.mono, color: Palette.magenta },
  versionFaint: { color: Palette.textFaint },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.lg,
    gap: Space.md,
  },
  cardTitle: {
    ...Type.label,
    color: Palette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  note: { ...Type.body, color: Palette.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Space.md },
  rowLabel: { ...Type.body, color: Palette.textMuted },
  rowValue: { ...Type.mono, color: Palette.text, flexShrink: 1 },
  release: { gap: Space.xs, paddingTop: Space.sm },
  releaseHead: { flexDirection: 'row', alignItems: 'baseline', gap: Space.sm },
  releaseVersion: { ...Type.body, color: Palette.text, fontWeight: '700' },
  releaseMeta: { ...Type.caption, color: Palette.textFaint },
  bullet: { flexDirection: 'row', gap: Space.sm },
  dot: { ...Type.caption, color: Palette.violet },
  change: { ...Type.caption, color: Palette.textMuted, flex: 1 },
  footer: { ...Type.caption, color: Palette.textFaint, textAlign: 'center' },
});
