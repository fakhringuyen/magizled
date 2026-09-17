import Slider from '@react-native-community/slider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

import { PRESS_SPRING } from '@/components/motion';
import { tap } from '@/lib/haptics';
import { HitSize, Palette, Radius, Space, Type } from '@/theme/tokens';

/** Shape a field renderer needs, independent of where it came from. */
export type FieldSchema = {
  name: string;
  type: string;
  value: string;
  label: string;
  checked?: boolean;
  min?: string;
  max?: string;
  step?: string;
  maxLength?: number;
  unit?: string;
  options?: { value: string; label: string }[];
};

type Commit = (value: string | boolean) => void;

/** Sliders and text fields save on a pause, not on a separate button. */
function useDebounced(commit: Commit, ms: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | boolean | null>(null);
  const fn = useRef(commit);
  // Writing a ref during render is not allowed, so refresh it in an effect.
  useEffect(() => {
    fn.current = commit;
  });
  useEffect(
    () => () => {
      // Leaving the screen inside the debounce window used to throw the edit
      // away in silence. Send it instead.
      if (timer.current) {
        clearTimeout(timer.current);
        if (pending.current !== null) fn.current(pending.current);
      }
    },
    []
  );
  return (v: string | boolean) => {
    pending.current = v;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pending.current = null;
      fn.current(v);
    }, ms);
  };
}

export function RangeField({ field, onCommit }: { field: FieldSchema; onCommit: Commit }) {
  const min = Number(field.min ?? 0);
  const max = Number(field.max ?? 255);
  const step = Number(field.step ?? 1) || 1;
  const parsed = Number(field.value);
  const [value, setValue] = useState(Number.isFinite(parsed) ? parsed : min);
  const debounced = useDebounced(onCommit, 500);

  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <Text style={styles.label}>{field.label || field.name}</Text>
        {/* The original sliders showed no number at all. */}
        <Text style={styles.readout} importantForAccessibility="no">
          {value}
        </Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={setValue}
        tapToSeek
        onSlidingComplete={(v) => {
          tap();
          debounced(String(Math.round(v)));
        }}
        minimumTrackTintColor={Palette.magenta}
        maximumTrackTintColor={Palette.borderStrong}
        thumbTintColor={Palette.text}
        accessibilityLabel={field.label || field.name}
        accessibilityUnits={field.unit ?? ''}
        accessibilityIncrements={[]}
        style={styles.slider}
      />
      <View style={styles.scale}>
        <Text style={styles.scaleText}>{min}</Text>
        <Text style={styles.scaleText}>{max}</Text>
      </View>
    </View>
  );
}

export function TextField({
  field,
  onCommit,
  onChange,
  secure = false,
}: {
  field: FieldSchema;
  onCommit: Commit;
  /** Fires on every keystroke. Use it where a stale value would be unsafe. */
  onChange?: (value: string) => void;
  secure?: boolean;
}) {
  const [value, setValue] = useState(field.value);
  const [reveal, setReveal] = useState(false);
  const debounced = useDebounced(onCommit, 900);
  const limit = field.maxLength;

  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <Text style={styles.label}>{field.label || field.name}</Text>
        {/* LED boards truncate long text, so show the budget. */}
        {!!limit && (
          <Text style={[styles.readout, value.length > limit && { color: Palette.danger }]}>
            {value.length}/{limit}
          </Text>
        )}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={(t) => {
            setValue(t);
            onChange?.(t);
            debounced(t);
          }}
          secureTextEntry={secure && !reveal}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={limit}
          placeholderTextColor={Palette.textFaint}
          style={styles.input}
          accessibilityLabel={field.label || field.name}
        />
        {secure && (
          <Pressable
            onPress={() => setReveal((r) => !r)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={reveal ? 'Hide the password' : 'Show the password'}
            style={styles.reveal}>
            <Text style={styles.revealText}>{reveal ? 'Hide' : 'Show'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function SwitchField({ field, onCommit }: { field: FieldSchema; onCommit: Commit }) {
  const [on, setOn] = useState(!!field.checked);
  return (
    <View style={[styles.block, styles.switchRow]}>
      <Text style={[styles.label, styles.switchLabel]}>{field.label || field.name}</Text>
      <Switch
        value={on}
        onValueChange={(v) => {
          setOn(v);
          tap();
          onCommit(v);
        }}
        trackColor={{ false: Palette.borderStrong, true: Palette.violet }}
        thumbColor={Palette.text}
        ios_backgroundColor={Palette.surfaceHigh}
        accessibilityLabel={field.label || field.name}
      />
    </View>
  );
}

export function SelectField({ field, onCommit }: { field: FieldSchema; onCommit: Commit }) {
  const [value, setValue] = useState(field.value);
  const options = field.options ?? [];
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{field.label || field.name}</Text>
      <View
        style={styles.chips}
        accessibilityRole="radiogroup"
        accessibilityLabel={field.label || field.name}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                setValue(o.value);
                tap();
                onCommit(o.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={o.label}
              style={[styles.chip, active && styles.chipOn]}>
              <Text style={[styles.chipText, active && styles.chipTextOn]} numberOfLines={1}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Compact on/off pill, for the long run of animation toggles. */
export function TogglePill({
  label,
  a11yLabel,
  on,
  onPress,
  onLongPress,
}: {
  label: string;
  /** A bare number tells a screen reader nothing. */
  a11yLabel?: string;
  on: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const [held, setHeld] = useState(false);

  // No shared value is written here. The compiler forbids mutating a value
  // that was passed to a hook, and driving the spring from plain state inside
  // useAnimatedStyle does the same job without a mutation.
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(held ? 0.96 : 1, PRESS_SPRING) }],
    backgroundColor: withTiming(on ? Palette.magenta : Palette.surfaceHigh, { duration: 160 }),
    borderColor: withTiming(on ? Palette.magenta : Palette.outline, { duration: 160 }),
  }));

  const fireTap = useCallback(() => {
    tap();
    onPress();
  }, [onPress]);
  const fireHold = useCallback(() => {
    tap();
    onLongPress?.();
  }, [onLongPress]);

  /*
   * React Native's own Pressable cancels the long press timer once the finger
   * drifts 10 dp, but leaves the press alive, so a hold arrives as a tap. It
   * does not expose that distance. Gesture handler does, and it also
   * negotiates with the surrounding ScrollView instead of losing the touch.
   */
  const gesture = useMemo(() => {
    const single = Gesture.Tap()
      .runOnJS(true)
      .maxDistance(24)
      .onBegin(() => setHeld(true))
      .onFinalize(() => setHeld(false))
      .onEnd((_e, ok) => {
        if (ok) fireTap();
      });

    if (!onLongPress) return single;

    const hold = Gesture.LongPress()
      .runOnJS(true)
      .minDuration(300)
      .maxDistance(24)
      .onBegin(() => setHeld(true))
      .onFinalize(() => setHeld(false))
      .onStart(fireHold);

    return Gesture.Exclusive(hold, single);
  }, [onLongPress, fireTap, fireHold]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        accessibilityLabel={a11yLabel ?? label}
        accessibilityHint={onLongPress ? 'Hold to open this animation' : undefined}
        style={[styles.pill, style]}>
        <Text style={[styles.pillText, on && styles.pillTextOn]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  block: { gap: Space.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...Type.body, color: Palette.text, flexShrink: 1 },
  readout: { ...Type.mono, color: Palette.magenta },
  readoutFaint: { color: Palette.textFaint },
  slider: { width: '100%', height: 36 },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -Space.sm },
  scaleText: { ...Type.caption, color: Palette.textFaint },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  input: {
    ...Type.body,
    flex: 1,
    color: Palette.text,
    backgroundColor: Palette.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.outline,
    paddingHorizontal: Space.md,
    minHeight: HitSize,
  },
  reveal: { paddingHorizontal: Space.md, paddingVertical: Space.sm },
  revealText: { ...Type.caption, color: Palette.violet },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { flex: 1, marginRight: Space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  chip: {
    minHeight: HitSize,
    justifyContent: 'center',
    paddingHorizontal: Space.lg,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceHigh,
    borderWidth: 1,
    borderColor: Palette.outline,
  },
  chipOn: { backgroundColor: Palette.violet, borderColor: Palette.violet },
  chipText: { ...Type.label, color: Palette.textMuted },
  chipTextOn: { color: Palette.onBrand, fontWeight: '700' },
  pill: {
    minWidth: 62,
    minHeight: HitSize,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceHigh,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  pillOn: { backgroundColor: Palette.magenta, borderColor: Palette.magenta },
  pillText: { ...Type.caption, color: Palette.textMuted },
  pillTextOn: { color: Palette.onBrand, fontWeight: '700' },
});
