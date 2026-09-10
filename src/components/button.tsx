import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { tap } from '@/lib/haptics';
import { BrandGradient, HitSize, Palette, Radius, Space, Type } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  busy?: boolean;
  disabled?: boolean;
  full?: boolean;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  busy = false,
  disabled = false,
  full = false,
  accessibilityHint,
}: Props) {
  const inert = disabled || busy;
  const tint =
    variant === 'danger' ? Palette.danger : variant === 'ghost' ? Palette.textMuted : Palette.text;

  const body = (
    <View style={styles.row}>
      {busy && <ActivityIndicator size="small" color={tint} />}
      <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={() => {
        if (inert) return;
        tap();
        onPress();
      }}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inert, busy }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        full && styles.full,
        variant !== 'primary' && styles[variant],
        inert && styles.inert,
        pressed && styles.pressed,
      ]}>
      {variant === 'primary' && (
        <LinearGradient
          colors={[...BrandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: HitSize,
    paddingHorizontal: Space.xl,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  full: { alignSelf: 'stretch' },
  secondary: { backgroundColor: Palette.surfaceHigh, borderWidth: 1, borderColor: Palette.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Palette.danger },
  inert: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  label: { ...Type.label, fontSize: 15, letterSpacing: 0.2 },
});
