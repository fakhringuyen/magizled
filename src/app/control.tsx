import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimationSheet } from '@/components/animation-sheet';
import { BoardProvider, useBoard } from '@/components/board-provider';
import { Button } from '@/components/button';
import { Confirm } from '@/components/confirm';
import { RangeField, SelectField, SwitchField, TextField, TogglePill } from '@/components/field';
import { ChevronLeft, Gear, Power, Reload } from '@/components/icons';
import { Appear, SavedFlash, StatusDot, useBump } from '@/components/motion';
import { IconButton } from '@/components/icon-button';
import { warn } from '@/lib/haptics';
import { ANIMATION_COUNT, CONTROLS, TEXT_MAX, type Control } from '@/lib/magiz-api';
import { labelFor, useAnimationNames } from '@/lib/animation-names';
import { useSettings } from '@/lib/settings';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

const KEEP_AWAKE_TAG = 'magizled-control';

export default function ControlRoute() {
  return (
    <BoardProvider>
      <Panel />
    </BoardProvider>
  );
}

function Panel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const board = useBoard();
  const [askExit, setAskExit] = useState(false);
  const [pulling, setPulling] = useState(false);

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

  const sliders = CONTROLS.filter((c) => c.kind === 'range');
  const pickers = CONTROLS.filter((c) => c.kind === 'select');
  const vehicle = pickers.filter((c) => c.key === 'rem' || c.key === 'sein');
  const display = pickers.filter((c) => c.key === 'font' || c.key === 'jl');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <IconButton label="Back to connect" onPress={() => router.replace('/')}>
          <ChevronLeft />
        </IconButton>
        <View style={styles.barTitle}>
          <StatusDot
            busy={board.status === 'loading' || board.saving}
            color={
              board.status === 'ready'
                ? Palette.online
                : board.status === 'loading'
                  ? Palette.warn
                  : Palette.danger
            }
          />
          <Text style={styles.host} numberOfLines={1}>
            {board.state.statusboard || settings.address}
          </Text>
          <SavedFlash visible={board.saved} />
        </View>
        <IconButton label="Read the board again" onPress={board.refresh}>
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

      {board.status === 'loading' && (
        <View style={styles.centre}>
          <ActivityIndicator color={Palette.magenta} />
          <Text style={styles.centreText}>Reading the board</Text>
        </View>
      )}

      {board.status === 'error' && (
        <View style={styles.centre}>
          <Text style={styles.errorTitle}>Cannot reach the board</Text>
          <Text style={styles.centreText}>{board.error}</Text>
          <View style={styles.actions}>
            <Button label="Retry" onPress={board.refresh} full />
            <Button
              label="Change address"
              onPress={() => router.push('/settings')}
              variant="secondary"
              full
            />
          </View>
        </View>
      )}

      {board.status === 'ready' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={pulling}
              onRefresh={async () => {
                setPulling(true);
                await board.refresh();
                setPulling(false);
              }}
              tintColor={Palette.magenta}
              colors={[Palette.magenta]}
              progressBackgroundColor={Palette.surface}
            />
          }>
          {!!board.error && <Text style={styles.inlineError}>{board.error}</Text>}

          <Appear index={0}>
            <Card title="Light">
              {sliders.map((c) => (
                <ControlField key={c.key} control={c} />
              ))}
            </Card>
          </Appear>

          <Appear index={1}>
            <MessagesCard />
          </Appear>
          <Appear index={2}>
            <AnimationsCard />
          </Appear>

          <Appear index={3}>
            <Card title="Display">
              {display.map((c) => (
                <ControlField key={c.key} control={c} />
              ))}
            </Card>
          </Appear>

          <Appear index={4}>
            <Card title="Vehicle signals">
              {vehicle.map((c) => (
                <ControlField key={c.key} control={c} />
              ))}
            </Card>
          </Appear>

          <Appear index={5}>
            <WifiCard />
          </Appear>

          <Button
            label="Open the board's own page"
            onPress={() => router.push('/classic')}
            variant="ghost"
            full
          />
        </ScrollView>
      )}

      <Confirm
        visible={askExit}
        title="Close MagizLED?"
        body="The board keeps its current setting after the app closes."
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ControlField({ control }: { control: Control }) {
  const board = useBoard();
  const value = String(board.state[control.key] ?? '');

  if (control.kind === 'range') {
    return (
      <RangeField
        field={{
          name: control.field,
          type: 'range',
          value,
          label: control.label,
          min: String(control.min),
          max: String(control.max),
          step: String(control.step),
        }}
        onCommit={(v) => board.setControl(control, String(v))}
      />
    );
  }
  return (
    <SelectField
      field={{
        name: control.field,
        type: 'select-one',
        value,
        label: control.label,
        options: control.options,
      }}
      onCommit={(v) => board.setControl(control, String(v))}
    />
  );
}

function MessagesCard() {
  const board = useBoard();
  const slots = [
    { key: 'text1' as const, value: board.state.text1 },
    { key: 'text2' as const, value: board.state.text2 },
    { key: 'text3' as const, value: board.state.text3 },
  ];
  return (
    <Card title="Running text">
      {slots.map((s, i) => (
        <TextField
          key={s.key}
          field={{
            name: s.key,
            type: 'text',
            value: s.value,
            label: `Message ${i + 1}`,
            maxLength: TEXT_MAX,
          }}
          onCommit={(v) => board.setRunning({ [s.key]: String(v) })}
        />
      ))}
      <SwitchField
        field={{
          name: 'all',
          type: 'checkbox',
          value: '',
          checked: board.state.all,
          label: 'Auto cycle through the messages',
        }}
        onCommit={(v) => board.setRunning({ all: v === true })}
      />
    </Card>
  );
}

function AnimationsCard() {
  const board = useBoard();
  const { names, rename } = useAnimationNames();
  const [open, setOpen] = useState<number | null>(null);
  const on = board.state.animations.filter(Boolean).length;
  const bump = useBump(on);

  function setAll(value: boolean) {
    board.setRunning({ animations: Array(ANIMATION_COUNT).fill(value) });
  }

  function toggle(index: number) {
    const next = board.state.animations.slice();
    next[index] = !next[index];
    board.setRunning({ animations: next });
  }

  /**
   * The firmware names none of the 41 animations, so the only honest way to
   * learn one is to watch it alone on the board.
   */
  function solo(index: number) {
    const only = Array(ANIMATION_COUNT).fill(false);
    only[index] = true;
    board.setRunning({ animations: only, all: false });
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Animations</Text>
        <Animated.Text style={[styles.count, bump]}>
          {on} of {ANIMATION_COUNT} on
        </Animated.Text>
      </View>
      <View style={styles.actionsRow}>
        <Button label="All" onPress={() => setAll(true)} variant="secondary" />
        <Button label="None" onPress={() => setAll(false)} variant="secondary" />
      </View>
      <Text style={styles.hint}>
        Hold one to run it alone and give it a name.
      </Text>
      <View style={styles.grid}>
        {board.state.animations.map((isOn, i) => (
          <TogglePill
            key={i}
            label={labelFor(names, i)}
            on={isOn}
            onPress={() => toggle(i)}
            onLongPress={() => setOpen(i)}
          />
        ))}
      </View>

      <AnimationSheet
        key={open ?? 'closed'}
        index={open}
        currentName={open === null ? '' : (names[open] ?? '')}
        isOn={open === null ? false : board.state.animations[open]}
        onSolo={() => open !== null && solo(open)}
        onToggle={() => open !== null && toggle(open)}
        onRename={(n) => {
          if (open !== null) rename(open, n);
          setOpen(null);
        }}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

/**
 * Wi-Fi never auto saves. Committing a half typed SSID moves the board to a
 * network that does not exist, and the phone loses it immediately.
 */
function WifiCard() {
  const board = useBoard();
  const [ssid, setSsid] = useState(board.state.ssid);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(false);

  const dirty = ssid.trim() !== board.state.ssid || password.length > 0;
  const tooShort = password.length > 0 && password.length < 8;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Wi-Fi</Text>
      <Text style={styles.note}>
        Saving this moves the board to another network. This phone loses it until you join the same
        one.
      </Text>

      <TextField
        field={{ name: 'ssid-local', type: 'text', value: ssid, label: 'Network name' }}
        onCommit={(v) => setSsid(String(v))}
      />
      <TextField
        field={{ name: 'password-local', type: 'text', value: password, label: 'Password' }}
        onCommit={(v) => setPassword(String(v))}
        secure
      />
      {tooShort && <Text style={styles.inlineError}>The board needs at least 8 characters.</Text>}

      <Button
        label="Save Wi-Fi"
        onPress={() => setConfirm(true)}
        disabled={!dirty || tooShort || !ssid.trim()}
        full
      />

      <Confirm
        visible={confirm}
        title="Move the board to this network?"
        body={`The board will try to join "${ssid.trim()}". If the name or password is wrong, you will have to reach it another way.`}
        confirmLabel="Move it"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setConfirm(false);
          board.setWifi(ssid.trim(), password);
          setPassword('');
        }}
        onCancel={() => setConfirm(false)}
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
  host: { ...Type.mono, color: Palette.textMuted, flexShrink: 1 },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.xl,
    gap: Space.md,
  },
  centreText: { ...Type.body, color: Palette.textMuted, textAlign: 'center' },
  errorTitle: { ...Type.title, color: Palette.text, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: Space.md, marginTop: Space.md },
  actionsRow: { flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' },
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
  cardTitle: {
    ...Type.label,
    color: Palette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  count: { ...Type.caption, color: Palette.magenta },
  note: { ...Type.caption, color: Palette.textFaint },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  hint: { ...Type.caption, color: Palette.textFaint },
});
