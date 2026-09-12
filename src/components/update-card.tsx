import * as Updates from 'expo-updates';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { success, warn } from '@/lib/haptics';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

type Phase = 'idle' | 'checking' | 'none' | 'downloading' | 'ready' | 'failed';

const MESSAGE: Record<Phase, string> = {
  idle: '',
  checking: 'Asking the update server…',
  none: 'This is the newest version.',
  downloading: 'Downloading…',
  ready: 'Downloaded. The restart prompt is waiting.',
  failed: '',
};

/**
 * The board's own Wi-Fi has no internet, so an automatic check on launch will
 * usually fail there. This gives a deliberate way to pull an update while the
 * phone is on a network that does reach the outside.
 */
export function UpdateCard() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const busy = phase === 'checking' || phase === 'downloading';

  async function check() {
    setError(null);
    setPhase('checking');
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setPhase('none');
        return;
      }
      setPhase('downloading');
      await Updates.fetchUpdateAsync();
      success();
      setPhase('ready');
    } catch (e) {
      warn();
      setPhase('failed');
      setError(
        (e as Error)?.message ||
          'Could not reach the update server. Join a Wi-Fi with internet and try again.'
      );
    }
  }

  if (!Updates.isEnabled) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Updates</Text>
        <Text style={styles.note}>
          Off in this build. A release APK checks the update server on every launch.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Updates</Text>

      <Row label="Channel" value={Updates.channel ?? 'none'} />
      <Row label="Runtime" value={Updates.runtimeVersion ?? 'unknown'} />
      <Row
        label="Running"
        value={Updates.isEmbeddedLaunch ? 'the build as installed' : 'a downloaded update'}
      />
      {!!Updates.createdAt && (
        <Row label="Published" value={Updates.createdAt.toISOString().slice(0, 16).replace('T', ' ')} />
      )}

      {(phase !== 'idle' || error) && (
        <View style={styles.status}>
          {busy && <ActivityIndicator size="small" color={Palette.magenta} />}
          <Text style={[styles.note, phase === 'failed' && { color: Palette.danger }]}>
            {error ?? MESSAGE[phase]}
          </Text>
        </View>
      )}

      <Button
        label={busy ? 'Checking' : 'Check for updates'}
        onPress={check}
        busy={busy}
        variant="secondary"
        disabled={phase === 'ready'}
        full
      />

      <Text style={styles.note}>
        Only the app&apos;s screens and logic arrive this way. A new Android package still needs a
        new APK.
      </Text>
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
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.lg,
    gap: Space.md,
  },
  title: { ...Type.label, color: Palette.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  note: { ...Type.caption, color: Palette.textFaint, flex: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Space.md },
  rowLabel: { ...Type.body, color: Palette.textMuted },
  rowValue: { ...Type.mono, color: Palette.text, flexShrink: 1 },
});
