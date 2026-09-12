import Slider from '@react-native-community/slider';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

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
  options?: { value: string; label: string }[];
};

type Commit = (value: string | boolean) => void;

/** Sliders and text fields save on a pause, not on a separate button. */
function useDebounced(commit: Commit, ms: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fn = useRef(commit);
  // Writing a ref during render is not allowed, so refresh it in an effect.
  useEffect(() => {
    fn.current = commit;
  });
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  return (v: string | boolean) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn.current(v), ms);
  };
}

export function RangeField({ field, onCommit }: { field: FieldSchema; onCommit: Commit }) {
  const min = Number(field.min ?? 0);
  const max = Number(field.max ?? 255);
  const step = Number(field.step ?? 1) || 1;
  const [value, setValue] = useState(Number(field.value) || min);
  const debounced = useDebounced(onCommit, 500);

  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <Text style={styles.label}>{field.label || field.name}</Text>
        {/* The original sliders showed no number at all. */}
        <Text style={styles.readout}>{value}</Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={setValue}
        onSlidingComplete={(v) => {
          tap();
          debounced(String(Math.round(v)));
        }}
        minimumTrackTintColor={Palette.magenta}
        maximumTrackTintColor={Palette.borderStrong}
        thumbTintColor={Palette.text}
        accessibilityLabel={field.label || field.name}
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
  secure = false,
}: {
  field: FieldSchema;
  onCommit: Commit;
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
      <View style={styles.chips}>
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
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={[styles.pill, on && styles.pillOn]}>
      <Text style={[styles.pillText, on && styles.pillTextOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
    borderColor: Palette.borderStrong,
    paddingHorizontal: Space.md,
    minHeight: HitSize,
  },
  reveal: { paddingHorizontal: Space.md, paddingVertical: Space.sm },
  revealText: { ...Type.caption, color: Palette.violet },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { flex: 1, marginRight: Space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Space.lg,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceHigh,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipOn: { backgroundColor: Palette.violet, borderColor: Palette.violet },
  chipText: { ...Type.label, color: Palette.textMuted },
  chipTextOn: { color: Palette.text },
  pill: {
    minWidth: 62,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceHigh,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  pillOn: { backgroundColor: Palette.magenta, borderColor: Palette.magenta },
  pillText: { ...Type.caption, color: Palette.textFaint },
  pillTextOn: { color: Palette.text, fontWeight: '700' },
});
