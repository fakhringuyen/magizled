import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Confirm } from '@/components/confirm';
import { DeviceProvider, useDevice } from '@/components/device-provider';
import { RangeField, SelectField, SwitchField, TextField, TogglePill } from '@/components/field';
import { ChevronLeft, Gear, Power, Reload } from '@/components/icons';
import { IconButton } from '@/components/icon-button';
import { warn } from '@/lib/haptics';
import type { FieldSchema, FormSchema } from '@/lib/device-bridge';
import { useSettings } from '@/lib/settings';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

const KEEP_AWAKE_TAG = 'magizled-control';
const ANIMATION = /^animation(\d+)$/i;
const MESSAGE = /^runningtext(\d+)$/i;
const SECRET = /(pass|pwd|password|secret|token|key|psk)/i;

export default function ControlRoute() {
  return (
    <DeviceProvider>
      <Panel />
    </DeviceProvider>
  );
}

function Panel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const device = useDevice();
  const [askExit, setAskExit] = useState(false);

  useEffect(() => {
    if (!settings.keepAwake) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [settings.keepAwake]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (askExit) {
          setAskExit(false);
          return true;
        }
        warn();
        setAskExit(true);
        return true;
      });
      return () => sub.remove();
    }, [askExit])
  );

  const saved = device.saved;

  // Nine cards each holding one nameless field read as noise, so the
  // single-field forms collapse into one list and keep their own form index.
  const simple = useMemo(
    () =>
      device.forms
        .filter((f) => f.fields.length === 1)
        .map((form) => ({ form, field: form.fields[0] })),
    [device.forms]
  );
  const rich = useMemo(() => device.forms.filter((f) => f.fields.length > 1), [device.forms]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <IconButton label="Back to connect" onPress={() => router.replace('/')}>
          <ChevronLeft />
        </IconButton>
        <View style={styles.barTitle}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  device.status === 'ready'
                    ? Palette.online
                    : device.status === 'loading'
                      ? Palette.warn
                      : Palette.danger,
              },
            ]}
          />
          <Text style={styles.host} numberOfLines={1}>
            {saved ? 'Saved' : device.title || settings.address}
          </Text>
        </View>
        <IconButton label="Reload from the board" onPress={device.reload}>
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

      {device.status === 'loading' && (
        <View style={styles.centre}>
          <ActivityIndicator color={Palette.magenta} />
          <Text style={styles.centreText}>Reading the board&apos;s controls</Text>
        </View>
      )}

      {device.status === 'error' && (
        <View style={styles.centre}>
          <Text style={styles.errorTitle}>Cannot reach the board</Text>
          <Text style={styles.centreText}>{device.error}</Text>
          <View style={styles.errorActions}>
            <Button label="Retry" onPress={device.reload} full />
            <Button
              label="Change address"
              onPress={() => router.push('/settings')}
              variant="secondary"
              full
            />
          </View>
        </View>
      )}

      {device.status === 'ready' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}
          showsVerticalScrollIndicator={false}>
          {device.error && <Text style={styles.inlineError}>{device.error}</Text>}

          {simple.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Board settings</Text>
              {simple.map(({ form, field }) => (
                <FieldRow
                  key={`${form.index}-${field.name}`}
                  field={field}
                  onCommit={(v) => device.apply(form.index, { [field.name]: v })}
                />
              ))}
            </View>
          )}

          {rich.map((form) => (
            <FormCard
              key={form.index}
              form={form}
              busy={device.savingForm === form.index}
              onApply={(values) => device.apply(form.index, values)}
            />
          ))}

          <View style={{ gap: Space.md }}>
            <Button
              label="Open the board's own page"
              onPress={() => router.push('/classic')}
              variant="ghost"
              accessibilityHint="Shows the original firmware page, in case a control is missing here"
              full
            />
            <Button
              label={
                device.inline
                  ? `Share page script (${device.inline.length} chars)`
                  : 'No page script captured'
              }
              onPress={() =>
                Share.share({ title: 'MagizLED page script', message: device.inline }).catch(
                  () => {}
                )
              }
              variant="ghost"
              disabled={!device.inline}
              full
            />
            <Button
              label={device.markup ? `Share form markup (${device.markup.length} chars)` : 'No markup captured'}
              onPress={() =>
                Share.share({ title: 'MagizLED form markup', message: device.markup }).catch(
                  () => {}
                )
              }
              variant="ghost"
              disabled={!device.markup}
              full
            />
          </View>
        </ScrollView>
      )}

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

function FormCard({
  form,
  busy,
  onApply,
}: {
  form: FormSchema;
  busy: boolean;
  onApply: (values: Record<string, string | boolean>) => void;
}) {
  const animations = useMemo(() => form.fields.filter((f) => ANIMATION.test(f.name)), [form.fields]);
  const messages = useMemo(() => form.fields.filter((f) => MESSAGE.test(f.name)), [form.fields]);
  const rest = useMemo(
    () => form.fields.filter((f) => !ANIMATION.test(f.name) && !MESSAGE.test(f.name)),
    [form.fields]
  );

  const [anim, setAnim] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(animations.map((f) => [f.name, !!f.checked]))
  );

  const heading =
    form.submitLabel ||
    (animations.length ? 'Animations and messages' : rest[0]?.label || `Group ${form.index + 1}`);

  function setAll(on: boolean) {
    const next = Object.fromEntries(animations.map((f) => [f.name, on]));
    setAnim(next);
    onApply(next);
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {heading}
        </Text>
        {busy && <ActivityIndicator size="small" color={Palette.magenta} />}
      </View>

      {messages.map((f, i) => (
        <TextField
          key={f.name}
          field={{ ...f, label: f.label || `Message ${i + 1}` }}
          onCommit={(v) => onApply({ [f.name]: v })}
        />
      ))}

      {rest.map((f) => (
        <FieldRow key={f.name} field={f} onCommit={(v) => onApply({ [f.name]: v })} />
      ))}

      {animations.length > 0 && (
        <View style={styles.animBlock}>
          <View style={styles.animHead}>
            <Text style={styles.label}>
              {animations.length} animations
              <Text style={styles.countFaint}>
                {`  ${Object.values(anim).filter(Boolean).length} on`}
              </Text>
            </Text>
            <View style={styles.animActions}>
              <Button label="All" onPress={() => setAll(true)} variant="secondary" />
              <Button label="None" onPress={() => setAll(false)} variant="secondary" />
            </View>
          </View>
          <View style={styles.grid}>
            {animations.map((f) => {
              const n = f.name.match(ANIMATION)?.[1] ?? f.name;
              return (
                <TogglePill
                  key={f.name}
                  label={n}
                  on={!!anim[f.name]}
                  onPress={() => {
                    const next = { ...anim, [f.name]: !anim[f.name] };
                    setAnim(next);
                    onApply({ [f.name]: next[f.name] });
                  }}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function FieldRow({
  field,
  onCommit,
}: {
  field: FieldSchema;
  onCommit: (v: string | boolean) => void;
}) {
  if (field.options?.length) return <SelectField field={field} onCommit={onCommit} />;
  if (field.type === 'range') return <RangeField field={field} onCommit={onCommit} />;
  if (field.type === 'checkbox' || field.type === 'radio')
    return <SwitchField field={field} onCommit={onCommit} />;
  const secure = field.type === 'password' || SECRET.test(field.name);
  return <TextField field={field} onCommit={onCommit} secure={secure} />;
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
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl, gap: Space.md },
  centreText: { ...Type.body, color: Palette.textMuted, textAlign: 'center' },
  errorTitle: { ...Type.title, color: Palette.text, textAlign: 'center' },
  errorActions: { alignSelf: 'stretch', gap: Space.md, marginTop: Space.md },
  inlineError: { ...Type.caption, color: Palette.danger },
  content: {
    padding: Space.lg,
    gap: Space.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Space.lg,
    gap: Space.lg,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...Type.label, color: Palette.textFaint, textTransform: 'uppercase', letterSpacing: 1, flexShrink: 1 },
  label: { ...Type.body, color: Palette.text },
  countFaint: { ...Type.caption, color: Palette.textFaint },
  animBlock: { gap: Space.md },
  animHead: { gap: Space.sm },
  animActions: { flexDirection: 'row', gap: Space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
});
