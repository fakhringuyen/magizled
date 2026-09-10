import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Close } from '@/components/icons';
import { IconButton } from '@/components/icon-button';
import { summarise, useApiLog } from '@/lib/recorder-store';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

export default function ApiLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { log, clear } = useApiLog();

  const text = summarise(log);
  const unique = new Set(log.calls.map((c) => `${c.method} ${c.url}`)).size;

  return (
    <View style={styles.screen}>
      <View style={[styles.bar, { paddingTop: insets.top + Space.sm }]}>
        <Text style={styles.barTitle}>Device API</Text>
        <IconButton label="Close" onPress={() => router.back()}>
          <Close />
        </IconButton>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}>
        <Text style={styles.lede}>
          {log.calls.length === 0 && !log.map
            ? 'Nothing recorded yet. Turn on Record device API in Settings, open the board, then press the controls you want mapped.'
            : `${unique} unique endpoints from ${log.calls.length} calls. Screenshot this and send it over.`}
        </Text>

        {!!text && (
          <View style={styles.block}>
            <Text style={styles.mono} selectable>
              {text}
            </Text>
          </View>
        )}

        {log.calls.length > 0 && (
          <>
            <Text style={styles.section}>Recent calls</Text>
            {log.calls.slice(0, 40).map((c) => (
              <View key={c.id + c.at} style={styles.row}>
                <Text style={styles.rowHead}>
                  <Text style={{ color: Palette.magenta }}>{c.method}</Text>{' '}
                  <Text style={{ color: Palette.textFaint }}>{c.kind}</Text>{' '}
                  {c.status ? `${c.status}` : ''}
                </Text>
                <Text style={styles.mono} selectable>
                  {c.url}
                </Text>
                {!!c.body && (
                  <Text style={[styles.mono, { color: Palette.textFaint }]} selectable>
                    {c.body}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        <Button label="Clear log" onPress={clear} variant="secondary" full />
      </ScrollView>
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
  content: { padding: Space.lg, gap: Space.md },
  lede: { ...Type.body, color: Palette.textMuted },
  section: { ...Type.label, color: Palette.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginTop: Space.md },
  block: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.md,
  },
  row: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.md,
    gap: 2,
  },
  rowHead: { ...Type.caption, color: Palette.text },
  mono: { fontFamily: 'monospace', fontSize: 11, lineHeight: 16, color: Palette.text },
});
