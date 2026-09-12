import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Close } from '@/components/icons';
import { IconButton } from '@/components/icon-button';
import { success } from '@/lib/haptics';
import { probe } from '@/lib/reachability';
import { DEFAULT_SETTINGS, isValidAddress, toUrl, useSettings } from '@/lib/settings';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

type TestState = 'idle' | 'testing' | 'ok' | 'fail';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, update, loaded } = useSettings();

  const [address, setAddress] = useState(settings.address);
  const [test, setTest] = useState<TestState>('idle');
  const [testNote, setTestNote] = useState('');
  const [seeded, setSeeded] = useState(loaded);

  // Seed the field from storage once it arrives. Adjusting state during render
  // is the supported pattern here; an effect would cascade a second render.
  if (loaded && !seeded) {
    setSeeded(true);
    setAddress(settings.address);
  }

  const valid = isValidAddress(address);
  const dirty = address.trim() !== settings.address;

  async function runTest() {
    if (!valid) return;
    setTest('testing');
    setTestNote('');
    const result = await probe(toUrl(address), 4000);
    if (result.state === 'online') {
      setTest('ok');
      setTestNote(`Answered in ${result.ms} ms.`);
    } else {
      setTest('fail');
      setTestNote('No reply. Save it anyway if you know the address is right.');
    }
  }

  async function save() {
    if (!valid) return;
    await update({ address: address.trim() });
    success();
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.bar, { paddingTop: insets.top + Space.sm }]}>
        <Text style={styles.barTitle}>Settings</Text>
        <IconButton label="Close settings" onPress={() => router.back()}>
          <Close />
        </IconButton>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Controller address</Text>
          <TextInput
            value={address}
            onChangeText={(t) => {
              setAddress(t);
              setTest('idle');
              setTestNote('');
            }}
            placeholder="192.168.2.2"
            placeholderTextColor={Palette.textFaint}
            style={[styles.input, !valid && address.length > 0 && styles.inputBad]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
            inputMode="url"
            returnKeyType="done"
            onSubmitEditing={runTest}
            accessibilityLabel="Controller address"
          />
          <Text style={styles.help}>
            An IP address, a host name, or a full URL. The old app could only ever use
            192.168.2.2.
          </Text>

          <View style={styles.testRow}>
            <Button
              label={test === 'testing' ? 'Testing' : 'Test connection'}
              onPress={runTest}
              variant="secondary"
              busy={test === 'testing'}
              disabled={!valid}
            />
            {test !== 'idle' && test !== 'testing' && (
              <View style={styles.testResult}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: test === 'ok' ? Palette.online : Palette.danger },
                  ]}
                />
                <Text style={styles.testText}>{testNote}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Behaviour</Text>

          <Row
            title="Open the controller automatically"
            body="Skip the connect screen once the controller answers."
            value={settings.autoConnect}
            onChange={(v) => update({ autoConnect: v })}
          />
          <Row
            title="Keep the screen on"
            body="Hold the display awake while the controller is open."
            value={settings.keepAwake}
            onChange={(v) => update({ keepAwake: v })}
          />
        </View>

        <Button
          label="About and what changed"
          onPress={() => router.push('/about')}
          variant="secondary"
          full
        />

        <View style={styles.footer}>
          <Button label="Save address" onPress={save} disabled={!valid || !dirty} full />
          <Pressable
            onPress={() => {
              setAddress(DEFAULT_SETTINGS.address);
              setTest('idle');
              setTestNote('');
            }}
            accessibilityRole="button"
            accessibilityLabel={`Reset the address to ${DEFAULT_SETTINGS.address}`}
            hitSlop={10}
            style={styles.reset}>
            <Text style={styles.resetText}>Reset to {DEFAULT_SETTINGS.address}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({
  title,
  body,
  value,
  onChange,
}: {
  title: string;
  body: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBody}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Palette.borderStrong, true: Palette.violet }}
        thumbColor={Palette.text}
        accessibilityLabel={title}
      />
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
    gap: Space.xl,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  group: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.lg,
    gap: Space.md,
  },
  groupLabel: { ...Type.label, color: Palette.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    ...Type.mono,
    color: Palette.text,
    backgroundColor: Palette.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    paddingHorizontal: Space.lg,
    height: 52,
  },
  inputBad: { borderColor: Palette.danger },
  help: { ...Type.caption, color: Palette.textFaint },
  testRow: { gap: Space.md, alignItems: 'flex-start' },
  testResult: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  testText: { ...Type.caption, color: Palette.textMuted, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.lg },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...Type.body, color: Palette.text },
  rowBody: { ...Type.caption, color: Palette.textFaint },
  footer: { gap: Space.lg, alignItems: 'center' },
  reset: { paddingVertical: Space.sm },
  resetText: { ...Type.caption, color: Palette.textFaint, textDecorationLine: 'underline' },
});
